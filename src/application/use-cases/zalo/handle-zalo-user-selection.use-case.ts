import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ExportAttendanceImageOptionsDto } from 'src/application/dtos/attendance/export-attendance-image-options.dto'
import { GetAttendanceImageDataUseCase } from 'src/application/use-cases/attendance'
import { ZaloService } from 'src/application/interfaces'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

interface HandleZaloUserSelectionInput {
    appId: string
    eventName: string
    userId: string
    incomingText: string
    accessToken: string
    linkedParentStudent: any | null
}

interface ZaloUserSelectionResult {
    handled: boolean
    reason?: string
    event_name?: string
}

@Injectable()
export class HandleZaloUserSelectionUseCase {
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

    private extractErrorMessage(error: any): string {
        return (
            error?.response?.data?.error_description ||
            error?.response?.data?.message ||
            error?.message ||
            'Failed to send message to Zalo user'
        )
    }

    private async safeSendMessage(accessToken: string, body: any, context: Record<string, any>): Promise<boolean> {
        try {
            await this.zaloService.sendMessage(accessToken, body)
            return true
        } catch (error: any) {
            console.warn('[Zalo Webhook] Gửi tin nhắn thất bại, bỏ qua để không ảnh hưởng luồng chính:', {
                ...context,
                errorMessage: this.extractErrorMessage(error),
            })
            return false
        }
    }

    private async safeSendParentMenu(accessToken: string, userId: string, studentName: string, context: Record<string, any>): Promise<boolean> {
        try {
            await this.zaloService.sendParentMenu(accessToken, userId, studentName)
            return true
        } catch (error: any) {
            console.warn('[Zalo Webhook] Gửi menu phụ huynh thất bại, bỏ qua để không ảnh hưởng luồng chính:', {
                ...context,
                errorMessage: this.extractErrorMessage(error),
            })
            return false
        }
    }

    private async safeSendUnregisteredMenu(accessToken: string, userId: string, context: Record<string, any>): Promise<boolean> {
        try {
            await this.zaloService.sendUnregisteredParentMenu(accessToken, userId)
            return true
        } catch (error: any) {
            console.warn('[Zalo Webhook] Gửi menu chưa đăng ký thất bại, bỏ qua để không ảnh hưởng luồng chính:', {
                ...context,
                errorMessage: this.extractErrorMessage(error),
            })
            return false
        }
    }

    private async safeSendRegistrationPrompt(accessToken: string, userId: string, context: Record<string, any>): Promise<boolean> {
        try {
            await this.zaloService.sendRegistrationPrompt(accessToken, userId)
            return true
        } catch (error: any) {
            console.warn('[Zalo Webhook] Gửi prompt đăng ký phụ huynh thất bại, bỏ qua để không ảnh hưởng luồng chính:', {
                ...context,
                errorMessage: this.extractErrorMessage(error),
            })
            return false
        }
    }

    async execute(input: HandleZaloUserSelectionInput): Promise<BaseResponseDto<ZaloUserSelectionResult>> {
        const { appId, eventName, userId, incomingText, accessToken, linkedParentStudent } = input

        try {
            if (linkedParentStudent) {
                const studentName = `${linkedParentStudent.user?.lastName || ''} ${linkedParentStudent.user?.firstName || ''}`.trim() || `#${linkedParentStudent.studentId}`

                if (this.zaloService.isTuitionSummaryIntent(incomingText)) {
                    console.log(`[Zalo Webhook] B3.0 - Phụ huynh yêu cầu xem học phí của học sinh #${linkedParentStudent.studentId}`)

                    const tuitionPayments = await this.unitOfWork.executeInTransaction(async (repos) => {
                        return repos.tuitionPaymentRepository.findByStudent(linkedParentStudent.studentId)
                    })

                    const tuitionSummary = this.zaloService.formatTuitionSummary(tuitionPayments)

                    await this.safeSendMessage(accessToken, {
                        recipient: { user_id: userId },
                        message: {
                            text: tuitionSummary,
                        },
                    }, { userId, appId, eventName, step: 'tuition-summary' })

                    await this.safeSendParentMenu(accessToken, userId, studentName, {
                        userId,
                        appId,
                        eventName,
                        step: 'tuition-summary-parent-menu',
                    })

                    return BaseResponseDto.success('Đã gửi thông tin học phí', {
                        handled: true,
                        event_name: eventName,
                    })
                }

                if (this.zaloService.isLatestAttendanceIntent(incomingText)) {
                    console.log(`[Zalo Webhook] B3.1 - Phụ huynh yêu cầu xem điểm danh gần nhất cho học sinh #${linkedParentStudent.studentId}`)

                    const latestData = await this.unitOfWork.executeInTransaction(async (repos) => {
                        const latestAttendance = (await repos.attendanceRepository.findByStudent(linkedParentStudent.studentId))[0] || null
                        return { latestAttendance }
                    })

                    if (!latestData.latestAttendance) {
                        await this.safeSendMessage(accessToken, {
                            recipient: { user_id: userId },
                            message: {
                                text: 'Chưa có dữ liệu điểm danh cho học sinh này.',
                            },
                        }, { userId, appId, eventName, step: 'latest-attendance-empty' })

                        await this.safeSendParentMenu(accessToken, userId, studentName, {
                            userId,
                            appId,
                            eventName,
                            step: 'latest-attendance-empty-parent-menu',
                        })

                        return BaseResponseDto.success('Chưa có dữ liệu điểm danh', {
                            handled: true,
                            event_name: eventName,
                        })
                    }

                    const options = new ExportAttendanceImageOptionsDto()
                    options.includeTuition = false

                    const attendanceImageData = await this.getAttendanceImageDataUseCase.execute(
                        latestData.latestAttendance.attendanceId,
                        options,
                    )

                    const summaryText = this.zaloService.formatLatestAttendanceSummary(attendanceImageData.templateData)

                    await this.safeSendMessage(accessToken, {
                        recipient: { user_id: userId },
                        message: {
                            text: summaryText,
                        },
                    }, { userId, appId, eventName, step: 'latest-attendance-summary' })

                    await this.safeSendParentMenu(accessToken, userId, studentName, {
                        userId,
                        appId,
                        eventName,
                        step: 'latest-attendance-parent-menu',
                    })

                    return BaseResponseDto.success('Đã gửi thông tin điểm danh gần nhất', {
                        handled: true,
                        event_name: eventName,
                    })
                }

                if (this.zaloService.isViewScheduleIntent(incomingText)) {
                    console.log(`[Zalo Webhook] B3.1c - Phụ huynh yêu cầu xem lịch học cho học sinh #${linkedParentStudent.studentId}`)

                    const classStudents = await this.unitOfWork.executeInTransaction(async (repos) => {
                        return repos.classStudentRepository.findByStudent(linkedParentStudent.studentId)
                    })

                    const scheduleSummary = this.zaloService.formatParentClassScheduleSummary(classStudents)

                    await this.safeSendMessage(accessToken, {
                        recipient: { user_id: userId },
                        message: {
                            text: scheduleSummary,
                        },
                    }, { userId, appId, eventName, step: 'view-schedule' })

                    await this.safeSendParentMenu(accessToken, userId, studentName, {
                        userId,
                        appId,
                        eventName,
                        step: 'view-schedule-parent-menu',
                    })

                    return BaseResponseDto.success('Đã gửi lịch học của học sinh', {
                        handled: true,
                        event_name: eventName,
                    })
                }

                if (this.zaloService.isUnregisterIntent(incomingText)) {
                    console.log(`[Zalo Webhook] B3.1a - Phụ huynh yêu cầu gỡ đăng kí số điện thoại cho học sinh #${linkedParentStudent.studentId}`)

                    await this.unitOfWork.executeInTransaction(async (repos) => {
                        await repos.studentRepository.unlinkParentZaloId(linkedParentStudent.studentId)
                    })

                    await this.safeSendMessage(accessToken, {
                        recipient: { user_id: userId },
                        message: {
                            text: 'Đã gỡ đăng kí số điện thoại thành công. Nếu cần đăng ký lại, vui lòng chọn nút Đăng ký phụ huynh.',
                        },
                    }, { userId, appId, eventName, step: 'unregister-success' })

                    await this.safeSendUnregisteredMenu(accessToken, userId, {
                        userId,
                        appId,
                        eventName,
                        step: 'unregister-menu',
                    })
                    console.log('[Zalo Webhook] B3.1b - Gỡ đăng kí thành công, đã gửi menu chưa đăng ký')

                    return BaseResponseDto.success('Đã gỡ đăng kí số điện thoại thành công', {
                        handled: true,
                        event_name: eventName,
                    })
                }

                console.log(`[Zalo Webhook] B3.2 - User đã đăng ký phụ huynh học sinh #${linkedParentStudent.studentId}, gửi menu phụ huynh`)
                await this.safeSendParentMenu(accessToken, userId, studentName, {
                    userId,
                    appId,
                    eventName,
                    step: 'linked-parent-default-menu',
                })
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
                    await this.safeSendMessage(accessToken, {
                        recipient: { user_id: userId },
                        message: {
                            text: `Không tìm thấy học sinh với số điện thoại ${phone}. Vui lòng liên hệ 0399520768 để được hỗ trợ.`,
                        },
                    }, { userId, appId, eventName, step: 'phone-not-found' })

                    await this.safeSendUnregisteredMenu(accessToken, userId, {
                        userId,
                        appId,
                        eventName,
                        step: 'phone-not-found-menu',
                    })

                    return BaseResponseDto.success('Không tìm thấy học sinh theo số điện thoại', {
                        handled: true,
                        event_name: eventName,
                    })
                }

                if (matchedStudent.parentZaloId) {
                    console.log(`[Zalo Webhook] B4.1b - Học sinh #${matchedStudent.studentId} đã có phụ huynh đăng ký trước đó`)
                    await this.safeSendMessage(accessToken, {
                        recipient: { user_id: userId },
                        message: {
                            text: 'Học sinh này đã được đăng kí phụ huynh rồi, vui lòng chọn lựa chọn khác.',
                        },
                    }, { userId, appId, eventName, step: 'already-linked-student' })

                    await this.safeSendUnregisteredMenu(accessToken, userId, {
                        userId,
                        appId,
                        eventName,
                        step: 'already-linked-student-menu',
                    })

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

                await this.safeSendMessage(accessToken, {
                    recipient: { user_id: userId },
                    message: {
                        text: 'Đăng ký nhận thông tin phụ huynh thành công. Từ bây giờ bạn sẽ nhận được thông báo học tập của học sinh.',
                    },
                }, { userId, appId, eventName, step: 'register-parent-success' })

                const studentName = `${matchedStudent.user?.lastName || ''} ${matchedStudent.user?.firstName || ''}`.trim() || `#${matchedStudent.studentId}`
                await this.safeSendParentMenu(accessToken, userId, studentName, {
                    userId,
                    appId,
                    eventName,
                    step: 'register-parent-success-menu',
                })
                console.log('[Zalo Webhook] B4.4 - Đăng ký thành công và đã gửi menu phụ huynh')

                return BaseResponseDto.success('Đã liên kết Zalo phụ huynh thành công', {
                    handled: true,
                    event_name: eventName,
                })
            }

            if (this.zaloService.isRegisterParentIntent(incomingText)) {
                console.log('[Zalo Webhook] B5 - User bấm nút đăng ký phụ huynh, gửi yêu cầu nhập số điện thoại')
                await this.safeSendRegistrationPrompt(accessToken, userId, {
                    userId,
                    appId,
                    eventName,
                    step: 'register-parent-prompt',
                })

                return BaseResponseDto.success('Đã yêu cầu nhập số điện thoại để đăng ký phụ huynh', {
                    handled: true,
                    event_name: eventName,
                })
            }

            console.log('[Zalo Webhook] B6 - Tin nhắn thường khi chưa đăng ký, gửi menu đăng ký/hỗ trợ')
            await this.safeSendUnregisteredMenu(accessToken, userId, {
                userId,
                appId,
                eventName,
                step: 'unlinked-default-menu',
            })

            return BaseResponseDto.success('Đã gửi menu đăng ký phụ huynh', {
                handled: true,
                event_name: eventName,
            })
        } catch (error: any) {
            const errorMessage = this.extractErrorMessage(error)

            console.error('[Zalo Webhook] Lỗi trong quá trình xử lý:', {
                errorMessage,
                eventName,
                appId,
                userId,
            })

            throw new InternalServerErrorException(errorMessage)
        }
    }
}
