// src/presentation/controllers/course.controller.ts
import { Controller, Get, Post, Put, Delete, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { CourseListQueryDto } from '../../application/dtos/course/course-list-query.dto'
import { CreateCourseDto } from '../../application/dtos/course/create-course.dto'
import { UpdateCourseDto } from '../../application/dtos/course/update-course.dto'
import { CourseListResponseDto, CourseResponseDto } from '../../application/dtos/course/course.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import {
    GetAllCourseUseCase,
    GetCourseByIdUseCase,
    CreateCourseUseCase,
    UpdateCourseUseCase,
    DeleteCourseUseCase,
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
}
