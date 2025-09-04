// src/domain/entities/student.entity.ts
import { User } from './user.entity';

export class Student {
    studentId: number;
    userId: number;
    studentPhone?: string;
    parentPhone?: string;
    grade: number;
    school?: string;
    user?: User;

    constructor(
        studentId: number,
        userId: number,
        grade: number,
        studentPhone?: string,
        parentPhone?: string,
        school?: string,
        user?: User
    ) {
        this.studentId = studentId;
        this.userId = userId;
        this.grade = grade;
        this.studentPhone = studentPhone;
        this.parentPhone = parentPhone;
        this.school = school;
        this.user = user;
    }

    hasStudentPhone(): boolean {
        return !!this.studentPhone;
    }

    hasParentPhone(): boolean {
        return !!this.parentPhone;
    }

    getSchoolDisplay(): string {
        return this.school || 'Chưa xác định';
    }

    getGradeDisplay(): string {
        return `Lớp ${this.grade}`;
    }
}
