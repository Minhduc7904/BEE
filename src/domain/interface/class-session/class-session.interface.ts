export interface CreateClassSessionData {
    classId: number;
    name: string;
    sessionDate: Date;
    startTime: Date;
    endTime: Date;
    makeupNote?: string;
}

export interface UpdateClassSessionData {
    name?: string;
    sessionDate?: Date;
    startTime?: Date;
    endTime?: Date;
    makeupNote?: string;
}

export interface ClassSessionFilterOptions {
    classId?: number;
    classIds?: number[];
    sessionDateFrom?: Date;
    sessionDateTo?: Date;
    isPast?: boolean;
    isToday?: boolean;
    isUpcoming?: boolean;
    search?: string;
    studentId?: number;
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
