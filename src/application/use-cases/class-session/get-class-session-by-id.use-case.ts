import { Inject, Injectable } from '@nestjs/common';
import type { IClassSessionRepository } from 'src/domain/repositories/class-session.repository';
import { ClassSessionResponseDto } from 'src/application/dtos/class-session/class-session.dto';
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions';
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto';

@Injectable()
export class GetClassSessionByIdUseCase {
  constructor(
    @Inject('IClassSessionRepository')
    private readonly classSessionRepository: IClassSessionRepository,
  ) {}

  async execute(sessionId: number): Promise<BaseResponseDto<ClassSessionResponseDto>> {
    const classSession = await this.classSessionRepository.findById(sessionId);

    if (!classSession) {
      throw new NotFoundException(`Buổi học với ID ${sessionId} không tồn tại`);
    }

    return BaseResponseDto.success(
      'Lấy buổi học thành công',
      new ClassSessionResponseDto(classSession),
    );
  }
}
