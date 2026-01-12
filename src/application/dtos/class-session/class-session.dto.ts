import { ClassSession } from '../../../domain/entities/class-session/class-session.entity';
import { PaginationResponseDto } from '../pagination/pagination-response.dto';
import { CourseClassResponseDto } from '../course-class/course-class.dto';

export class ClassSessionResponseDto {
    sessionId: number;
    classId: number;
    name: string;
    className?: string;
    sessionDate: Date;
    startTime: Date;
    endTime: Date;
    durationInMinutes: number;
    durationInHours: number;
    status: 'past' | 'today' | 'upcoming';
    makeupNote?: string | null;
    courseClass?: CourseClassResponseDto;

    constructor(classSession: ClassSession) {
        this.sessionId = classSession.sessionId;
        this.classId = classSession.classId;
        this.name = classSession.name;
        this.sessionDate = classSession.sessionDate;
        this.startTime = classSession.startTime;
        this.endTime = classSession.endTime;
        this.durationInMinutes = classSession.getDurationInMinutes();
        this.durationInHours = classSession.getDurationInHours();
        this.status = classSession.getStatus();
        this.makeupNote = classSession.makeupNote;

        if (classSession.courseClass) {
            this.courseClass = new CourseClassResponseDto(classSession.courseClass);
        }
    }

    static fromEntity(classSession: ClassSession): ClassSessionResponseDto {
        return new ClassSessionResponseDto(classSession);
    }
}

export class ClassSessionListResponseDto extends PaginationResponseDto<ClassSessionResponseDto> {
    constructor(
        data: ClassSessionResponseDto[],
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
        super(true, 'Lấy danh sách khóa học thành công', data, meta)
    }
}
