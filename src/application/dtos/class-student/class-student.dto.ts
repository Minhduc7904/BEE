import { ClassStudent } from 'src/domain/entities/class-student/class-student.entity';
import { PaginationResponseDto } from '../pagination/pagination-response.dto';
import { StudentResponseDto } from '../student/student.dto';
import { CourseClassResponseDto } from '../course-class/course-class.dto';

export class ClassStudentResponseDto {
    classId: number;
    studentId: number;
    courseClass: CourseClassResponseDto | null;
    student: StudentResponseDto | null

    constructor(classStudent: ClassStudent) {
        this.classId = classStudent.classId;
        this.studentId = classStudent.studentId;
        if (classStudent.courseClass) {
            this.courseClass = new CourseClassResponseDto(classStudent.courseClass);
        }
        if (classStudent.student) {
            this.student = StudentResponseDto.fromStudentEntity(classStudent.student);
        }
    }
}

export class ClassStudentListResponseDto extends PaginationResponseDto<ClassStudentResponseDto> {
    constructor(
        data: ClassStudentResponseDto[],
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

        super(true, 'Lấy danh sách học sinh trong lớp thành công', data, meta);
    }
}
