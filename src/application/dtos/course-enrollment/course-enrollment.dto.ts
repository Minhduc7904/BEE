import { CourseEnrollment } from 'src/domain/entities/course-enrollment/course-enrollment.entity';
import { PaginationResponseDto } from '../pagination/pagination-response.dto';
import { CourseResponseDto } from '../course/course.dto';
import { StudentResponseDto } from '../student/student.dto';
import { CourseEnrollmentStatus } from 'src/shared/enums';

export class CourseEnrollmentResponseDto {
    enrollmentId: number;
    courseId: number;
    studentId: number;
    enrolledAt: Date;
    status: CourseEnrollmentStatus;
    statusDisplay: string;
    daysEnrolled: number;
    isActive: boolean;
    isCompleted: boolean;
    isCancelled: boolean;

    course?: CourseResponseDto;
    student?: StudentResponseDto;

    constructor(enrollment: CourseEnrollment) {
        this.enrollmentId = enrollment.enrollmentId;
        this.courseId = enrollment.courseId;
        this.studentId = enrollment.studentId;
        this.enrolledAt = enrollment.enrolledAt;
        this.status = enrollment.status;
        this.statusDisplay = enrollment.getStatusDisplay();
        this.daysEnrolled = enrollment.getDaysEnrolled();
        this.isActive = enrollment.isActive();
        this.isCompleted = enrollment.isCompleted();
        this.isCancelled = enrollment.isCancelled();
        if (enrollment.course) {
            this.course = CourseResponseDto.fromEntity(enrollment.course);
        }
        if (enrollment.student) {
            this.student = StudentResponseDto.fromStudentEntity(enrollment.student);
        }
    }
}

export class StudentCourseEnrollmentResponseDto extends CourseEnrollmentResponseDto {
    completionPercentage: number;

    constructor(enrollment: CourseEnrollment, completionPercentage: number) {
        super(enrollment);
        this.completionPercentage = completionPercentage;
    }
}

export class CourseEnrollmentListResponseDto extends PaginationResponseDto<CourseEnrollmentResponseDto> {
    constructor(
        data: CourseEnrollmentResponseDto[],
        page: number,
        limit: number,
        total: number,
    ) {
        const totalPages = Math.ceil(total / limit);
        const hasPrevious = page > 1;
        const hasNext = page < totalPages;
        const previousPage = hasPrevious ? page - 1 : undefined;
        const nextPage = hasNext ? page + 1 : undefined;

        const meta = {
            page,
            limit,
            total,
            totalPages,
            hasPrevious,
            hasNext,
            previousPage,
            nextPage,
        };

        super(true, 'Lấy danh sách đăng ký khóa học thành công', data, meta);
    }
}
