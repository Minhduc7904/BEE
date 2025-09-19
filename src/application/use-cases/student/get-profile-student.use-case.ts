// src/application/use-cases/student/get-profile-student.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import type { IStudentRepository, IImageRepository } from 'src/domain/repositories'
import { StudentResponseDto, BaseResponseDto } from 'src/application/dtos';
import {
    NotFoundException
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetProfileStudentUseCase {
    constructor(
        @Inject('IImageRepository') private readonly imageRepository: IImageRepository,
        @Inject('IStudentRepository') private readonly studentRepository: IStudentRepository
    ) { }

    async execute(id: string): Promise<BaseResponseDto<StudentResponseDto>> {
        const student = await this.studentRepository.findById(id);
        if (!student) {
            throw new NotFoundException('Student not found');
        }
        if (student.user && student.user.avatarId) {
            const avatar = await this.imageRepository.findById(student.user.avatarId);
            student.user.avatar = avatar ?? undefined;
        };

        return BaseResponseDto.success(
            'Get profile student successfully',
            StudentResponseDto.fromStudentEntity(student)
        );
    }

    async executeByUserId(userId: number): Promise<BaseResponseDto<StudentResponseDto>> {
        const student = await this.studentRepository.findByUserId(userId);
        if (!student) {
            throw new NotFoundException('Student not found');
        }
        if (student.user && student.user.avatarId) {
            const avatar = await this.imageRepository.findById(student.user.avatarId);
            student.user.avatar = avatar ?? undefined;
        };

        return BaseResponseDto.success(
            'Get profile student successfully',
            StudentResponseDto.fromStudentEntity(student)
        );
    }
}