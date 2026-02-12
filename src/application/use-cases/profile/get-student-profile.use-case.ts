// src/application/use-cases/profile/get-student-profile.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IStudentRepository } from '../../../domain/repositories'
import { StudentResponseDto, BaseResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetStudentProfileUseCase {
  constructor(
    @Inject('IStudentRepository') private readonly studentRepository: IStudentRepository,
  ) {}

  async execute(userId: number): Promise<BaseResponseDto<StudentResponseDto>> {
    // Tìm student theo userId với đầy đủ thông tin user, roles và permissions
    const student = await this.studentRepository.findByUserId(userId)
    
    if (!student) {
      throw new NotFoundException('Student profile not found')
    }

    // Mapper sẽ tự động xử lý việc lọc roles active và chưa expire
    // cũng như map permissions cho từng role
    const studentResponse = StudentResponseDto.fromUserWithStudent(student.user, student)

    return BaseResponseDto.success(
      'Get student profile successfully',
      studentResponse,
    )
  }
}
