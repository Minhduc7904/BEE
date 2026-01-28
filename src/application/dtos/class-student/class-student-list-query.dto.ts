import { IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../pagination/list-query.dto';
import {
  ClassStudentFilterOptions,
  ClassStudentPaginationOptions,
} from 'src/domain/interface/class-student/class-student.interface';
import { ToNumber } from 'src/shared/decorators'

export class ClassStudentListQueryDto extends ListQueryDto {
  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'ID lớp học phải là số nguyên' })
  classId?: number;

  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'ID học sinh phải là số nguyên' })
  studentId?: number;

  toClassStudentFilterOptions(): ClassStudentFilterOptions {
    return {
      classId: this.classId,
      studentId: this.studentId,
      search: this.search,
    };
  }

  toClassStudentPaginationOptions(): ClassStudentPaginationOptions {
    const allowedSortFields = ['classId', 'studentId'];

    const sortBy = allowedSortFields.includes(this.sortBy || '')
      ? this.sortBy
      : 'classId';

    return {
      page: this.page || 1,
      limit: this.limit || 10,
      sortBy,
      sortOrder: this.sortOrder,
    };
  }
}
