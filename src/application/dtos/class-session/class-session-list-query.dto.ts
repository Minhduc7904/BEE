import { IsOptional, IsInt, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../pagination/list-query.dto';
import {
    ClassSessionFilterOptions,
    ClassSessionPaginationOptions,
} from '../../../domain/interface/class-session/class-session.interface';
import { ToNumber } from 'src/shared/decorators'

export class ClassSessionListQueryDto extends ListQueryDto {
    @IsOptional()
    @ToNumber()
    @IsInt({ message: 'ID lớp học phải là số nguyên' })
    classId?: number;

    @IsOptional()
    @IsDateString({}, { message: 'Ngày bắt đầu phải là định dạng ngày hợp lệ' })
    sessionDateFrom?: string;

    @IsOptional()
    @IsDateString({}, { message: 'Ngày kết thúc phải là định dạng ngày hợp lệ' })
    sessionDateTo?: string;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean({ message: 'isPast phải là boolean' })
    isPast?: boolean;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean({ message: 'isToday phải là boolean' })
    isToday?: boolean;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean({ message: 'isUpcoming phải là boolean' })
    isUpcoming?: boolean;

    toClassSessionFilterOptions(): ClassSessionFilterOptions {
        return {
            classId: this.classId,
            sessionDateFrom: this.sessionDateFrom ? new Date(this.sessionDateFrom) : undefined,
            sessionDateTo: this.sessionDateTo ? new Date(this.sessionDateTo) : undefined,
            isPast: this.isPast,
            isToday: this.isToday,
            isUpcoming: this.isUpcoming,
            search: this.search,
        };
    }

    toClassSessionPaginationOptions(): ClassSessionPaginationOptions {
        const sortField = this.sortBy || 'createdAt'
        const sortDirection = this.sortOrder || 'desc'

        // Validate sort field
        const allowedSortFields = [
            'sessionId',
            'sessionDate',
            'startTime',
            'endTime',
            'classId',
        ];

        const validatedSortField = allowedSortFields.includes(sortField) ? sortField : 'sessionDate'

        return {
            page: this.page || 1,
            limit: this.limit || 10,
            sortBy: validatedSortField,
            sortOrder: sortDirection as 'asc' | 'desc',
        }
    }
}
