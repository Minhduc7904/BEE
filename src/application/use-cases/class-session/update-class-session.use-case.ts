import { Inject, Injectable } from '@nestjs/common';
import type { IUnitOfWork } from 'src/domain/repositories';
import { ClassSessionResponseDto } from '../../dtos/class-session/class-session.dto';
import { UpdateClassSessionDto } from 'src/application/dtos/class-session/update-class-session.dto';
import { UpdateClassSessionData } from 'src/domain/interface/class-session/class-session.interface';
import { NotFoundException, ConflictException } from 'src/shared/exceptions/custom-exceptions';
import { BaseResponseDto } from '../../dtos/common/base-response.dto';
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants';
import { AuditStatus } from 'src/shared/enums/audit-status.enum';
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants';
import { SessionMakeupRegistrationSyncService } from 'src/application/services/session-makeup-registration-sync.service';
import { getSessionNotificationMoments } from './class-session-time.helper';

@Injectable()
export class UpdateClassSessionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly sessionMakeupRegistrationSync: SessionMakeupRegistrationSyncService,
  ) { }

  async execute(
    sessionId: number,
    dto: UpdateClassSessionDto,
    adminId?: number,
  ): Promise<BaseResponseDto<ClassSessionResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const classSessionRepository = repos.classSessionRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Check if class session exists
      const existingSession = await classSessionRepository.findById(sessionId);
      if (!existingSession) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.CLASS_SESSION.UPDATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.CLASS_SESSION,
            resourceId: sessionId.toString(),
            errorMessage: `Buổi học với ID ${sessionId} không tồn tại`,
          })
        }
        throw new NotFoundException(`Buổi học với ID ${sessionId} không tồn tại`);
      }

      // Validate time logic
      const startTime = dto.startTime ? new Date(dto.startTime) : existingSession.startTime;
      const endTime = dto.endTime ? new Date(dto.endTime) : existingSession.endTime;

      if (endTime <= startTime) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.CLASS_SESSION.UPDATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.CLASS_SESSION,
            resourceId: sessionId.toString(),
            errorMessage: 'Giờ kết thúc phải sau giờ bắt đầu',
          })
        }
        throw new ConflictException(
          'Giờ kết thúc phải sau giờ bắt đầu',
        );
      }

      const data: UpdateClassSessionData = {
        sessionDate: dto.sessionDate ? new Date(dto.sessionDate) : undefined,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        homeworkId: dto.homeworkId,
        name: dto.name,
        makeupNote: dto.makeupNote,
      };

      // Đổi ngày/giờ: xóa dấu đã gửi của các mốc thông báo điểm danh mà theo giờ mới vẫn chưa tới để job tính lại
      const sessionDate = data.sessionDate ?? existingSession.sessionDate;
      const timeChanged =
        sessionDate.getTime() !== existingSession.sessionDate.getTime() ||
        startTime.getTime() !== existingSession.startTime.getTime() ||
        endTime.getTime() !== existingSession.endTime.getTime();
      if (timeChanged) {
        const now = new Date();
        const moments = getSessionNotificationMoments({ sessionDate, startTime, endTime });
        if (moments.reminderAt > now) data.absentReminderNotifiedAt = null;
        if (moments.summaryAt > now) data.absenceSummaryNotifiedAt = null;
      }

      const classSession = await classSessionRepository.update(sessionId, data);

      // Đồng bộ cặp buổi học bù cho cả tuần cũ và tuần mới của buổi (chỉ khi ngày học thay đổi)
      const oldDate = existingSession.sessionDate.getTime();
      const newDate = classSession.sessionDate.getTime();
      if (oldDate !== newDate) {
        await this.sessionMakeupRegistrationSync.syncForClasses(repos, {
          classIds: [classSession.classId],
          range: { from: new Date(Math.min(oldDate, newDate)), to: new Date(Math.max(oldDate, newDate)) },
        });
      }

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.CLASS_SESSION.UPDATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.CLASS_SESSION,
          resourceId: classSession.sessionId.toString(),
          beforeData: {
            sessionDate: existingSession.sessionDate,
            name: existingSession.name,
          },
          afterData: {
            sessionDate: classSession.sessionDate,
            name: classSession.name,
          },
        })
      }

      return new ClassSessionResponseDto(classSession)
    })

    return BaseResponseDto.success('Cập nhật buổi học thành công', result)
  }
}
