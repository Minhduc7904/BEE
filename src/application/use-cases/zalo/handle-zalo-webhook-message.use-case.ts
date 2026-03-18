import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ExportAttendanceImageOptionsDto } from 'src/application/dtos/attendance/export-attendance-image-options.dto'
import { GetAttendanceImageDataUseCase } from 'src/application/use-cases/attendance'
import { ZaloService } from 'src/infrastructure/services'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

interface ZaloWebhookPayload {
    app_id?: string
    event_name?: string
    sender?: {
        id?: string
    }
    message?: {
        text?: string
        msg_id?: string
    }
}

interface ZaloWebhookHandleResult {
    handled: boolean
    reason?: string
    event_name?: string
}

@Injectable()
export class HandleZaloWebhookMessageUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
        private readonly zaloService: ZaloService,
        private readonly getAttendanceImageDataUseCase: GetAttendanceImageDataUseCase,
    ) { }

    private normalizePhone(input: string): string {
        return input.replace(/[^0-9]/g, '')
    }

    private isPhoneLike(input: string): boolean {
        const normalized = this.normalizePhone(input)
        return /^0\d{9,10}$/.test(normalized)
    }

    async execute(payload: ZaloWebhookPayload): Promise<BaseResponseDto<ZaloWebhookHandleResult>> {
        const eventName = payload?.event_name
        const appId = payload?.app_id
        const userId = payload?.sender?.id
        const incomingText = payload?.message?.text?.trim() ?? ''
        console.log('[Zalo Webhook] B1 - Đã nhận webhook từ Zalo')
        console.log('[Zalo Webhook] B1.1 - Thông tin đầu vào:', {
            eventName,
            appId,
            userId,
            incomingText,
        })
        if (!appId || !eventName) {
            console.log('[Zalo Webhook] Dừng xử lý - Thiếu app_id hoặc event_name')
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'Missing app_id or event_name',
            })
        }

        if (!userId) {
            console.log('[Zalo Webhook] Dừng xử lý - Thiếu sender.id')
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'Missing sender id',
                event_name: eventName,
            })
        }

        if (eventName !== 'user_send_text') {
            console.log(`[Zalo Webhook] Bỏ qua event không hỗ trợ: ${eventName}`)
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'Event is not user_send_text',
                event_name: eventName,
            })
        }

        console.log('[Zalo Webhook] B2 - Đang lấy access token theo app_id trong DB')
        const tokenRecord = await this.unitOfWork.executeInTransaction(async (repos) => {
            return repos.zaloTokenRepository.findByAppId(appId)
        })

        if (!tokenRecord?.accessToken) {
            console.log('[Zalo Webhook] Dừng xử lý - Không tìm thấy access token theo app_id')
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'No access token found for app_id',
                event_name: eventName,
            })
        }

        console.log('[Zalo Webhook] B2.1 - Đã tìm thấy access token, tiếp tục xử lý nghiệp vụ')

        try {
            console.log('[Zalo Webhook] B3 - Kiểm tra user đã đăng ký parentZaloId chưa')
            const linkedParentStudent = await this.unitOfWork.executeInTransaction(async (repos) => {
                return repos.studentRepository.findByParentZaloId(userId)
            })

            if (linkedParentStudent) {
                const studentName = `${linkedParentStudent.user?.lastName || ''} ${linkedParentStudent.user?.firstName || ''}`.trim() || `#${linkedParentStudent.studentId}`

                if (this.zaloService.isLatestAttendanceIntent(incomingText)) {
                    console.log(`[Zalo Webhook] B3.1 - Phụ huynh yêu cầu xem điểm danh gần nhất cho học sinh #${linkedParentStudent.studentId}`)

                    const latestData = await this.unitOfWork.executeInTransaction(async (repos) => {
                        const latestAttendance = (await repos.attendanceRepository.findByStudent(linkedParentStudent.studentId))[0] || null
                        const latestHomeworkSubmit = (await repos.homeworkSubmitRepository.findByStudent(linkedParentStudent.studentId))[0] || null
                        return { latestAttendance, latestHomeworkSubmit }
                    })

                    if (!latestData.latestAttendance) {
                        await this.zaloService.sendMessage(tokenRecord.accessToken, {
                            recipient: { user_id: userId },
                            message: {
                                text: 'Chưa có dữ liệu điểm danh cho học sinh này.',
                            },
                        })

                        await this.zaloService.sendParentMenu(tokenRecord.accessToken, userId, studentName)

                        return BaseResponseDto.success('Chưa có dữ liệu điểm danh', {
                            handled: true,
                            event_name: eventName,
                        })
                    }

                    const options = new ExportAttendanceImageOptionsDto()
                    options.includeTuition = false
                    options.includeHomework = !!latestData.latestHomeworkSubmit
                    options.homeworkContentId = latestData.latestHomeworkSubmit?.homeworkContentId

                    const attendanceImageData = await this.getAttendanceImageDataUseCase.execute(
                        latestData.latestAttendance.attendanceId,
                        options,
                    )

                    const summaryText = this.zaloService.formatLatestAttendanceSummary(attendanceImageData.templateData)

                    await this.zaloService.sendMessage(tokenRecord.accessToken, {
                        recipient: { user_id: userId },
                        message: {
                            text: summaryText,
                        },
                    })

                    await this.zaloService.sendParentMenu(tokenRecord.accessToken, userId, studentName)

                    return BaseResponseDto.success('Đã gửi thông tin điểm danh gần nhất', {
                        handled: true,
                        event_name: eventName,
                    })
                }

                if (this.zaloService.isUnregisterIntent(incomingText)) {
                    console.log(`[Zalo Webhook] B3.1a - Phụ huynh yêu cầu gỡ đăng kí số điện thoại cho học sinh #${linkedParentStudent.studentId}`)

                    await this.unitOfWork.executeInTransaction(async (repos) => {
                        await repos.studentRepository.unlinkParentZaloId(linkedParentStudent.studentId)
                    })

                    await this.zaloService.sendMessage(tokenRecord.accessToken, {
                        recipient: { user_id: userId },
                        message: {
                            text: 'Đã gỡ đăng kí số điện thoại thành công. Nếu cần đăng ký lại, vui lòng chọn nút Đăng ký phụ huynh.',
                        },
                    })

                    await this.zaloService.sendUnregisteredParentMenu(tokenRecord.accessToken, userId)
                    console.log('[Zalo Webhook] B3.1b - Gỡ đăng kí thành công, đã gửi menu chưa đăng ký')

                    return BaseResponseDto.success('Đã gỡ đăng kí số điện thoại thành công', {
                        handled: true,
                        event_name: eventName,
                    })
                }

                console.log(`[Zalo Webhook] B3.2 - User đã đăng ký phụ huynh học sinh #${linkedParentStudent.studentId}, gửi menu phụ huynh`)
                await this.zaloService.sendParentMenu(tokenRecord.accessToken, userId, studentName)
                console.log('[Zalo Webhook] B3.3 - Gửi menu phụ huynh thành công')

                return BaseResponseDto.success('Đã gửi menu phụ huynh', {
                    handled: true,
                    event_name: eventName,
                })
            }

            if (this.isPhoneLike(incomingText)) {
                const phone = this.normalizePhone(incomingText)
                console.log(`[Zalo Webhook] B4 - Nhận số điện thoại: ${phone}. Đang tìm học sinh trong DB để tự động đăng ký`)

                const matchedStudent = await this.unitOfWork.executeInTransaction(async (repos) => {
                    return repos.studentRepository.findByStudentOrParentPhone(phone)
                })

                if (!matchedStudent) {
                    console.log('[Zalo Webhook] B4.1 - Không tìm thấy học sinh theo số điện thoại cung cấp')
                    await this.zaloService.sendMessage(tokenRecord.accessToken, {
                        recipient: { user_id: userId },
                        message: {
                            text: `Không tìm thấy học sinh với số điện thoại ${phone}. Vui lòng liên hệ 0333726202 để được hỗ trợ.`,
                        },
                    })

                    await this.zaloService.sendUnregisteredParentMenu(tokenRecord.accessToken, userId)

                    return BaseResponseDto.success('Không tìm thấy học sinh theo số điện thoại', {
                        handled: true,
                        event_name: eventName,
                    })
                }

                if (matchedStudent.parentZaloId) {
                    console.log(`[Zalo Webhook] B4.1b - Học sinh #${matchedStudent.studentId} đã có phụ huynh đăng ký trước đó`)
                    await this.zaloService.sendMessage(tokenRecord.accessToken, {
                        recipient: { user_id: userId },
                        message: {
                            text: 'Học sinh này đã được đăng kí phụ huynh rồi, vui lòng chọn lựa chọn khác.',
                        },
                    })

                    await this.zaloService.sendUnregisteredParentMenu(tokenRecord.accessToken, userId)

                    return BaseResponseDto.success('Học sinh đã được đăng kí phụ huynh trước đó', {
                        handled: true,
                        event_name: eventName,
                    })
                }

                console.log(`[Zalo Webhook] B4.2 - Tìm thấy học sinh #${matchedStudent.studentId}, cập nhật parentZaloId`)
                await this.unitOfWork.executeInTransaction(async (repos) => {
                    await repos.studentRepository.update(matchedStudent.studentId, {
                        parentZaloId: userId,
                    })
                })

                console.log('[Zalo Webhook] B4.3 - Cập nhật parentZaloId thành công')

                await this.zaloService.sendMessage(tokenRecord.accessToken, {
                    recipient: { user_id: userId },
                    message: {
                        text: 'Đăng ký nhận thông tin phụ huynh thành công. Từ bây giờ bạn sẽ nhận được thông báo học tập của học sinh.',
                    },
                })

                const studentName = `${matchedStudent.user?.lastName || ''} ${matchedStudent.user?.firstName || ''}`.trim() || `#${matchedStudent.studentId}`
                await this.zaloService.sendParentMenu(tokenRecord.accessToken, userId, studentName)
                console.log('[Zalo Webhook] B4.4 - Đăng ký thành công và đã gửi menu phụ huynh')

                return BaseResponseDto.success('Đã liên kết Zalo phụ huynh thành công', {
                    handled: true,
                    event_name: eventName,
                })
            }

            if (this.zaloService.isRegisterParentIntent(incomingText)) {
                console.log('[Zalo Webhook] B5 - User bấm nút đăng ký phụ huynh, gửi yêu cầu nhập số điện thoại')
                await this.zaloService.sendRegistrationPrompt(tokenRecord.accessToken, userId)

                return BaseResponseDto.success('Đã yêu cầu nhập số điện thoại để đăng ký phụ huynh', {
                    handled: true,
                    event_name: eventName,
                })
            }

            console.log('[Zalo Webhook] B6 - Tin nhắn thường khi chưa đăng ký, gửi menu đăng ký/hỗ trợ')
            await this.zaloService.sendUnregisteredParentMenu(tokenRecord.accessToken, userId)

            return BaseResponseDto.success('Đã gửi menu đăng ký phụ huynh', {
                handled: true,
                event_name: eventName,
            })
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.error_description ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to send message to Zalo user'

            console.error('[Zalo Webhook] Lỗi trong quá trình xử lý:', {
                errorMessage,
                eventName,
                appId,
                userId,
            })

            throw new InternalServerErrorException(errorMessage)
        }

        console.log('[Zalo Webhook] Hoàn tất xử lý webhook thành công')
        return BaseResponseDto.success('Zalo webhook handled successfully', {
            handled: true,
            event_name: eventName,
        })
    }
}
