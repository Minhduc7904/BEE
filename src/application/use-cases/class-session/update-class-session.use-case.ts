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

@Injectable()
export class UpdateClassSessionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
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
        name: dto.name,
        makeupNote: dto.makeupNote,
      };

      const classSession = await classSessionRepository.update(sessionId, data);

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
