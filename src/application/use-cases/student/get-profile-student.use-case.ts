// src/application/use-cases/student/get-profile-student.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import type { IStudentRepository } from 'src/domain/repositories'
import { StudentResponseDto, BaseResponseDto } from 'src/application/dtos';
import {
    NotFoundException
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetProfileStudentUseCase {
    constructor(
        @Inject('IStudentRepository') private readonly studentRepository: IStudentRepository
    ) { }

    async execute(id: number): Promise<BaseResponseDto<StudentResponseDto>> {
        const student = await this.studentRepository.findById(id);
        if (!student) {
            throw new NotFoundException('Student not found');
        }

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
        // Load avatar từ Media nếu có
        if (student.user && student.user.avatarId) {
            const avatar = await this.studentRepository.findMediaById(student.user.avatarId);
            if (avatar) {
                student.user.avatar = avatar;
            }
        }

        return BaseResponseDto.success(
            'Get profile student successfully',
            StudentResponseDto.fromStudentEntity(student)
        );
    }
}