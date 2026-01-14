import {
    Inject,
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import type { IClassStudentRepository, IStudentRepository, ICourseClassRepository, ICourseEnrollmentRepository } from 'src/domain/repositories';
import { CreateClassStudentDto } from '../../dtos/class-student/create-class-student.dto';
import { ClassStudentResponseDto } from '../../dtos/class-student/class-student.dto';
import { BaseResponseDto } from '../../dtos/common/base-response.dto';


@Injectable()
export class CreateClassStudentUseCase {
    constructor(
        @Inject('IClassStudentRepository')
        private readonly classStudentRepository: IClassStudentRepository,
        @Inject('ICourseClassRepository')
        private readonly courseClassRepository: ICourseClassRepository,
        @Inject('IStudentRepository')
        private readonly studentRepository: IStudentRepository,
        @Inject('ICourseEnrollmentRepository')
        private readonly enrollmentRepository: ICourseEnrollmentRepository,
    ) { }

    async execute(
        createDto: CreateClassStudentDto,
    ): Promise<BaseResponseDto<ClassStudentResponseDto>> {
        // Check if course class exists
        const courseClass = await this.courseClassRepository.findById(
            createDto.classId,
        );
        if (!courseClass) {
            throw new NotFoundException(
                `Không tìm thấy lớp học với ID ${createDto.classId}`,
            );
        }

        // Check if student exists
        const student = await this.studentRepository.findById(createDto.studentId);
        if (!student) {
            throw new NotFoundException(
                `Không tìm thấy học sinh với ID ${createDto.studentId}`,
            );
        }

        const enrollment = await this.enrollmentRepository.findByCourseAndStudent(
            courseClass.courseId,
            createDto.studentId,
        )

        if (!enrollment) {
            throw new ConflictException(
                `Học sinh chưa đăng ký khóa học của lớp học này`,
            );
        }

        // Check if class student already exists
        const existingClassStudent = await this.classStudentRepository.exists(
            createDto.classId,
            createDto.studentId,
        );
        if (existingClassStudent) {
            throw new ConflictException(
                `Học sinh đã được thêm vào lớp học này rồi`,
            );
        }

        const classStudent = await this.classStudentRepository.create({
            classId: createDto.classId,
            studentId: createDto.studentId,
        });

        const classStudentDto = new ClassStudentResponseDto(classStudent);

        return new BaseResponseDto(
            true,
            'Thêm học sinh vào lớp học thành công',
            classStudentDto,
        );
    }
}
