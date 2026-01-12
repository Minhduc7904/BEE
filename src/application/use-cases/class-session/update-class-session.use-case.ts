import { Inject, Injectable } from '@nestjs/common';
import type { IClassSessionRepository } from 'src/domain/repositories/class-session.repository';
import { ClassSessionResponseDto } from '../../dtos/class-session/class-session.dto';
import { UpdateClassSessionDto } from 'src/application/dtos/class-session/update-class-session.dto';
import { UpdateClassSessionData } from 'src/domain/interface/class-session/class-session.interface';
import { NotFoundException, ConflictException } from 'src/shared/exceptions/custom-exceptions';
import { BaseResponseDto } from '../../dtos/common/base-response.dto';

@Injectable()
export class UpdateClassSessionUseCase {
  constructor(
    @Inject('IClassSessionRepository')
    private readonly classSessionRepository: IClassSessionRepository,
  ) { }

  async execute(
    sessionId: number,
    dto: UpdateClassSessionDto,
  ): Promise<BaseResponseDto<ClassSessionResponseDto>> {
    // Check if class session exists
    const existingSession = await this.classSessionRepository.findById(sessionId);
    if (!existingSession) {
      throw new NotFoundException(`Buổi học với ID ${sessionId} không tồn tại`);
    }

    // Validate time logic
    const startTime = dto.startTime ? new Date(dto.startTime) : existingSession.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : existingSession.endTime;

    if (endTime <= startTime) {
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

    const classSession = await this.classSessionRepository.update(sessionId, data);

    return BaseResponseDto.success(
      'Cập nhật buổi học thành công',
      new ClassSessionResponseDto(classSession),
    );
  }
}
