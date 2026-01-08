import { Inject, Injectable } from '@nestjs/common';
import type { IClassSessionRepository } from 'src/domain/repositories/class-session.repository';
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions';
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto';

@Injectable()
export class DeleteClassSessionUseCase {
    constructor(
        @Inject('IClassSessionRepository')
        private readonly classSessionRepository: IClassSessionRepository,
    ) { }

    async execute(sessionId: number): Promise<BaseResponseDto<null>> {
        // Check if class session exists
        const classSession = await this.classSessionRepository.findById(sessionId);
        if (!classSession) {
            throw new NotFoundException(`Buổi học với ID ${sessionId} không tồn tại`);
        }

        await this.classSessionRepository.delete(sessionId);

        return BaseResponseDto.success('Xóa buổi học thành công', null);
    }
}
