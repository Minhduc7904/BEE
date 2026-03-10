// src/application/use-cases/notification/send-notification.use-case.ts
import { Injectable, BadRequestException, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { SendNotificationDto } from '../../dtos/notification/send-notification.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ROLE_NAMES } from '../../../shared/constants/roles.constant'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { NotificationLevel, NotificationType } from 'src/shared/enums'
import { CreateAndNotifyOneUseCase } from './create-and-notify-one.use-case'
import { CreateAndNotifyManyUseCase } from './create-and-notify-many.use-case'

@Injectable()
export class SendNotificationUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
        private readonly createAndNotifyOne: CreateAndNotifyOneUseCase,
        private readonly createAndNotifyMany: CreateAndNotifyManyUseCase,
    ) { }

    async execute(
        dto: SendNotificationDto,
        adminId?: number,
    ): Promise<BaseResponseDto<{ count: number }>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const notificationRepository = repos.notificationRepository
            const roleRepository = repos.roleRepository
            const userRepository = repos.userRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            try {
                // Validate: chỉ được chọn đúng 1 trong 3 options
                const optionsCount = [dto.userIds, dto.role, dto.all].filter(Boolean).length
                if (optionsCount !== 1) {
                    if (adminId) {
                        await adminAuditLogRepository.create({
                            adminId,
                            actionKey: ACTION_KEYS.NOTIFICATION.SEND,
                            status: AuditStatus.FAIL,
                            resourceType: RESOURCE_TYPES.NOTIFICATION,
                            errorMessage:
                                'Vui lòng chỉ định duy nhất một trong các lựa chọn: userIds, role hoặc all',
                        })
                    }
                    throw new BadRequestException(
                        'Vui lòng chỉ định duy nhất một trong các lựa chọn: userIds, role hoặc all',
                    )
                }

                let targetUserIds: number[] = []
                let targetingMethod = ''

                // Ưu tiên 1: gửi theo danh sách userIds
                if (dto.userIds && dto.userIds.length > 0) {
                    // Chỉ gửi cho user active
                    targetUserIds = await userRepository.filterActiveUserIds(dto.userIds)
                    targetingMethod = `người dùng cụ thể (${targetUserIds.length}/${dto.userIds.length})`
                }
                // Ưu tiên 2: gửi theo role
                else if (dto.role) {
                    // Validate role có tồn tại trong hệ thống
                    if (!Object.values(ROLE_NAMES).includes(dto.role as any)) {
                        if (adminId) {
                            await adminAuditLogRepository.create({
                                adminId,
                                actionKey: ACTION_KEYS.NOTIFICATION.SEND,
                                status: AuditStatus.FAIL,
                                resourceType: RESOURCE_TYPES.NOTIFICATION,
                                errorMessage: `Role không hợp lệ: ${dto.role}`,
                            })
                        }
                        throw new BadRequestException(`Role không hợp lệ: ${dto.role}`)
                    }

                    // Lấy toàn bộ user theo role
                    targetUserIds = await roleRepository.getUserIdsByRoleName(dto.role)
                    targetingMethod = `role: ${dto.role}`
                }
                // Ưu tiên 3: gửi cho toàn bộ user
                else if (dto.all) {
                    targetUserIds = await userRepository.findAllActiveUserIds()
                    targetingMethod = 'toàn bộ người dùng đang hoạt động'
                }

                // Validate: phải có user để gửi
                if (targetUserIds.length === 0) {
                    if (adminId) {
                        await adminAuditLogRepository.create({
                            adminId,
                            actionKey: ACTION_KEYS.NOTIFICATION.SEND,
                            status: AuditStatus.FAIL,
                            resourceType: RESOURCE_TYPES.NOTIFICATION,
                            errorMessage: 'Không tìm thấy người dùng để gửi thông báo',
                            afterData: {
                                targetingMethod,
                                title: dto.title,
                            },
                        })
                    }
                    throw new BadRequestException(
                        'Không tìm thấy người dùng để gửi thông báo',
                    )
                }

                // Tạo notification + gửi realtime cho tất cả user mục tiêu
                const notificationDataList = targetUserIds.map((userId) => ({
                    userId,
                    title: dto.title,
                    message: dto.message,
                    type: dto.type,
                    level: dto.level,
                    data: dto.data,
                }))

                await this.createAndNotifyMany.execute(notificationDataList)

                // Ghi log gửi thành công
                if (adminId) {
                    await adminAuditLogRepository.create({
                        adminId,
                        actionKey: ACTION_KEYS.NOTIFICATION.SEND,
                        status: AuditStatus.SUCCESS,
                        resourceType: RESOURCE_TYPES.NOTIFICATION,
                        afterData: {
                            sốLượng: targetUserIds.length,
                            hìnhThứcGửi: targetingMethod,
                            tiêuĐề: dto.title,
                            loại: dto.type,
                            mứcĐộ: dto.level,
                        },
                    })

                    const reportTitle = 'Báo cáo gửi thông báo'
                    const reportMessage = `Đã gửi thành công ${targetUserIds.length} thông báo đến ${targetingMethod}.`

                    await this.createAndNotifyOne.execute({
                        userId: adminId,
                        title: reportTitle,
                        message: reportMessage,
                        type: NotificationType.SYSTEM,
                        level: NotificationLevel.INFO,
                    })
                }

                return { count: targetUserIds.length }
            } catch (error) {
                // Log lỗi không mong muốn
                if (adminId && !(error instanceof BadRequestException)) {
                    await adminAuditLogRepository.create({
                        adminId,
                        actionKey: ACTION_KEYS.NOTIFICATION.SEND,
                        status: AuditStatus.FAIL,
                        resourceType: RESOURCE_TYPES.NOTIFICATION,
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : 'Lỗi không xác định',
                    })
                }
                throw error
            }
        })

        return {
            success: true,
            message: `Gửi thành công ${result.count} thông báo`,
            data: result,
        }
    }
}
