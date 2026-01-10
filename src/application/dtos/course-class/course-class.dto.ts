import { CourseClass } from '../../../domain/entities/course-class/course-class.entity';
import { PaginationResponseDto } from '../pagination/pagination-response.dto';
import { CourseResponseDto } from '../course/course.dto';
import { AdminResponseDto } from '../admin/admin.dto';

export class CourseClassResponseDto {
    classId: number;
    courseId: number;
    className: string;
    startDate: Date | null;
    endDate: Date | null;
    room: string | null;
    instructorId: number | null;
    status: 'upcoming' | 'active' | 'completed' | 'unscheduled';
    durationInDays: number | null;
    isScheduled: boolean;
    createdAt?: Date;
    updatedAt?: Date;

    course?: CourseResponseDto;
    instructor?: AdminResponseDto;

    constructor(courseClass: CourseClass) {
        this.classId = courseClass.classId;
        this.courseId = courseClass.courseId;

        this.className = courseClass.className;
        this.startDate = courseClass.startDate || null;
        this.endDate = courseClass.endDate || null;
        this.room = courseClass.room || null;
        this.instructorId = courseClass.instructorId || null;
        this.status = courseClass.getStatus();
        this.durationInDays = courseClass.getDurationInDays();
        this.isScheduled = courseClass.isScheduled();
        this.createdAt = courseClass.createdAt;
        this.updatedAt = courseClass.updatedAt;
        if (courseClass.course) {
            this.course = CourseResponseDto.fromEntity(courseClass.course);
        }
        if (courseClass.instructor) {
            this.instructor = AdminResponseDto.fromUserWithAdmin(courseClass.instructor.user, courseClass.instructor);
        }
    }
}

export class CourseClassListResponseDto extends PaginationResponseDto<CourseClassResponseDto> {
    constructor(
        data: CourseClassResponseDto[],
        page: number,
        limit: number,
        total: number,
    ) {
        const meta = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasPrevious: page > 1,
            hasNext: page < Math.ceil(total / limit),
            previousPage: page > 1 ? page - 1 : undefined,
            nextPage: page < Math.ceil(total / limit) ? page + 1 : undefined,
        }

        super(true, 'Lấy danh sách lớp học thành công', data, meta);
    }
}
