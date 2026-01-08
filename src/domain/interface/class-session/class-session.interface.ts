export interface CreateClassSessionData {
    classId: number;
    sessionDate: Date;
    startTime: Date;
    endTime: Date;
}

export interface UpdateClassSessionData {
    sessionDate?: Date;
    startTime?: Date;
    endTime?: Date;
}

export interface ClassSessionFilterOptions {
    classId?: number;
    sessionDateFrom?: Date;
    sessionDateTo?: Date;
    isPast?: boolean;
    isToday?: boolean;
    isUpcoming?: boolean;
    search?: string;
}

export interface ClassSessionPaginationOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ClassSessionListResult {
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
