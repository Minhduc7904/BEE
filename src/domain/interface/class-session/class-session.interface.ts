export interface CreateClassSessionData {
    classId: number;
    name: string;
    sessionDate: Date;
    startTime: Date;
    endTime: Date;
    homeworkId?: number | null;
    makeupNote?: string;
}

export interface UpdateClassSessionData {
    name?: string;
    sessionDate?: Date;
    startTime?: Date;
    endTime?: Date;
    homeworkId?: number | null;
    makeupNote?: string;
    /** Dấu đã gửi thông báo mốc start + 15 phút; `null` để đặt lại. */
    absentReminderNotifiedAt?: Date | null;
    /** Dấu đã gửi thông báo mốc hết giờ; `null` để đặt lại. */
    absenceSummaryNotifiedAt?: Date | null;
}

/** Hai mốc thông báo điểm danh theo buổi học. */
export type ClassSessionNotificationMoment = 'ABSENT_REMINDER' | 'ABSENCE_SUMMARY';

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
