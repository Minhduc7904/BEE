import { Inject, Injectable } from '@nestjs/common';
import type { IClassSessionRepository } from 'src/domain/repositories/class-session.repository';
import { ClassSessionResponseDto } from 'src/application/dtos/class-session/class-session.dto';
import { CreateClassSessionDto } from 'src/application/dtos/class-session/create-class-session.dto';
import { CreateClassSessionData } from 'src/domain/interface/class-session/class-session.interface';
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto';
import { ConflictException } from 'src/shared/exceptions/custom-exceptions';

@Injectable()
export class CreateClassSessionUseCase {
  constructor(
    @Inject('IClassSessionRepository')
    private readonly classSessionRepository: IClassSessionRepository,
  ) { }

  async execute(dto: CreateClassSessionDto): Promise<BaseResponseDto<ClassSessionResponseDto>> {
    // Validate time logic
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (endTime <= startTime) {
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

    const classSession = await this.classSessionRepository.create(data);

    return BaseResponseDto.success(
      'Tạo buổi học thành công',
      new ClassSessionResponseDto(classSession),
    );
  }
}
