// src/presentation/controllers/course.controller.ts
import { Controller, Get, Post, Put, Delete, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe, Res, StreamableFile } from '@nestjs/common'
import type { Response } from 'express'
import { CourseListQueryDto } from '../../application/dtos/course/course-list-query.dto'
import { CreateCourseDto } from '../../application/dtos/course/create-course.dto'
import { UpdateCourseDto } from '../../application/dtos/course/update-course.dto'
import { CourseListResponseDto, CourseResponseDto } from '../../application/dtos/course/course.dto'
import { CourseStudentsAttendanceQueryDto } from '../../application/dtos/course/course-students-attendance-query.dto'
import { ExportCourseStudentsAttendanceQueryDto } from '../../application/dtos/course/export-course-students-attendance-query.dto'
import { CourseStudentsAttendanceListResponseDto } from '../../application/dtos/course/course-student-attendance.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import {
    GetAllCourseUseCase,
    GetCourseByIdUseCase,
    CreateCourseUseCase,
    UpdateCourseUseCase,
    DeleteCourseUseCase,
    GetCourseStudentsAttendanceUseCase,
    ExportCourseStudentsAttendanceUseCase,
} from '../../application/use-cases/course'
import { Injectable } from '@nestjs/common'

@Injectable()
@Controller('courses')
export class CourseController {
    constructor(
        private readonly getAllCourseUseCase: GetAllCourseUseCase,
        private readonly getCourseByIdUseCase: GetCourseByIdUseCase,
        private readonly createCourseUseCase: CreateCourseUseCase,
        private readonly updateCourseUseCase: UpdateCourseUseCase,
        private readonly deleteCourseUseCase: DeleteCourseUseCase,
        private readonly getCourseStudentsAttendanceUseCase: GetCourseStudentsAttendanceUseCase,
        private readonly exportCourseStudentsAttendanceUseCase: ExportCourseStudentsAttendanceUseCase,
    ) { }

    @Get()
    @RequirePermission('course.getAll')
    @HttpCode(HttpStatus.OK)
    async getAllCourses(@Query() query: CourseListQueryDto): Promise<CourseListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllCourseUseCase.execute(query))
    }

    @Get(':id')
    @RequirePermission('course.getById')
    @HttpCode(HttpStatus.OK)
    async getCourseById(
        @Param('id', ParseIntPipe) id: number
    ): Promise<BaseResponseDto<CourseResponseDto>> {
        return ExceptionHandler.execute(() => this.getCourseByIdUseCase.execute(id))
    }

    @Post()
    @RequirePermission('course.create')
    @HttpCode(HttpStatus.CREATED)
    async createCourse(
        @Body() dto: CreateCourseDto
    ): Promise<BaseResponseDto<CourseResponseDto>> {
        return ExceptionHandler.execute(() => this.createCourseUseCase.execute(dto))
    }

    @Put(':id')
    @RequirePermission('course.update')
    @HttpCode(HttpStatus.OK)
    async updateCourse(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCourseDto
    ): Promise<BaseResponseDto<CourseResponseDto>> {
        return ExceptionHandler.execute(() => this.updateCourseUseCase.execute(id, dto))
    }

    @Delete(':id')
    @RequirePermission('course.delete')
    @HttpCode(HttpStatus.OK)
    async deleteCourse(
        @Param('id', ParseIntPipe) id: number
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteCourseUseCase.execute(id))
    }

    /**
     * Get students with attendance records for a course
     * 
     * @route GET /courses/:id/students-attendance
     * @param id - Course ID
     * @param query - Query parameters (fromDate, toDate, page, limit, search)
     * @returns Paginated list of students with their attendance records
     * 
     * @example
     * GET /courses/1/students-attendance?fromDate=2026-01-01&toDate=2026-01-31&page=1&limit=10
     */
    @Get(':id/students-attendance')
    @RequirePermission('course.getStudentsAttendance')
    @HttpCode(HttpStatus.OK)
    async getCourseStudentsAttendance(
        @Param('id', ParseIntPipe) id: number,
        @Query() query: CourseStudentsAttendanceQueryDto
    ): Promise<CourseStudentsAttendanceListResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getCourseStudentsAttendanceUseCase.execute(id, query)
        )
    }

    /**
     * Export course students attendance to Excel
     * GET /courses/:id/students-attendance/export
     * Query params (required):
     * - fromDate: string (ISO format YYYY-MM-DD) - Từ ngày
     * - toDate: string (ISO format YYYY-MM-DD) - Đến ngày
     * 
     * Query params (optional):
     * - status: AttendanceStatus - Filter by status (PRESENT, ABSENT, LATE, MAKEUP)
     * - search: string - Tìm kiếm theo tên, email, SĐT học sinh
     * - includeSchool: boolean (default: true)
     * - includeParentPhone: boolean (default: true)
     * - includeStudentPhone: boolean (default: false)
     * - includeGrade: boolean (default: true)
     * - includeEmail: boolean (default: true)
     * 
     * Response: Excel file download
     * 
     * @example
     * GET /courses/1/students-attendance/export?fromDate=2026-01-01&toDate=2026-01-31&includeSchool=true
     */
    @Get(':id/students-attendance/export')
    @RequirePermission('course.getStudentsAttendance')
    @HttpCode(HttpStatus.OK)
    async exportCourseStudentsAttendance(
        @Param('id', ParseIntPipe) id: number,
        @Query() query: ExportCourseStudentsAttendanceQueryDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        return ExceptionHandler.execute(async () => {
            const options = query.toExportOptions()
            const { buffer, filename } = await this.exportCourseStudentsAttendanceUseCase.execute(id, query, options)

            // Set response headers for file download
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            })

            return new StreamableFile(buffer)
        })
    }
}

