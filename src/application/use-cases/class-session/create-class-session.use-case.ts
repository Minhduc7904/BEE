import { Inject, Injectable } from '@nestjs/common';
import type { IUnitOfWork } from 'src/domain/repositories';
import { ClassSessionResponseDto } from 'src/application/dtos/class-session/class-session.dto';
import { CreateClassSessionDto } from 'src/application/dtos/class-session/create-class-session.dto';
import { CreateClassSessionData } from 'src/domain/interface/class-session/class-session.interface';
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto';
import { ConflictException } from 'src/shared/exceptions/custom-exceptions';
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants';
import { AuditStatus } from 'src/shared/enums/audit-status.enum';
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants';

@Injectable()
export class CreateClassSessionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) { }

  async execute(
    dto: CreateClassSessionDto,
    adminId?: number,
  ): Promise<BaseResponseDto<ClassSessionResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const classSessionRepository = repos.classSessionRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Validate time logic
      const startTime = new Date(dto.startTime);
      const endTime = new Date(dto.endTime);

      if (endTime <= startTime) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.CLASS_SESSION.CREATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.CLASS_SESSION,
            errorMessage: 'Giờ kết thúc phải sau giờ bắt đầu',
          })
        }
        throw new ConflictException(
          'Giờ kết thúc phải sau giờ bắt đầu',
        );
      }

      const data: CreateClassSessionData = {
        classId: dto.classId,
        sessionDate: new Date(dto.sessionDate),
        startTime,
        endTime,
        name: dto.name,
        makeupNote: dto.makeupNote,
      };

      const classSession = await classSessionRepository.create(data);

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.CLASS_SESSION.CREATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.CLASS_SESSION,
          resourceId: classSession.sessionId.toString(),
          afterData: {
            classId: classSession.classId,
            sessionDate: classSession.sessionDate,
            name: classSession.name,
          },
        })
      }

      return new ClassSessionResponseDto(classSession)
    })

    return BaseResponseDto.success('Tạo buổi học thành công', result)
  }
}
