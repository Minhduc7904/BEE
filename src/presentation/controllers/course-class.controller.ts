// src/presentation/controllers/course-class.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Query,
    Param,
    Body,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
} from '@nestjs/common'
import { CourseClassListQueryDto } from '../../application/dtos/course-class/course-class-list-query.dto'
import { CreateCourseClassDto } from '../../application/dtos/course-class/create-course-class.dto'
import { UpdateCourseClassDto } from '../../application/dtos/course-class/update-course-class.dto'
import {
    CourseClassListResponseDto,
    CourseClassResponseDto,
} from '../../application/dtos/course-class/course-class.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import {
    GetAllCourseClassUseCase,
    GetCourseClassByIdUseCase,
    CreateCourseClassUseCase,
    UpdateCourseClassUseCase,
    DeleteCourseClassUseCase,
} from '../../application/use-cases/course-class'
import { Injectable } from '@nestjs/common'

@Injectable()
@Controller('course-classes')
export class CourseClassController {
    constructor(
        private readonly getAllCourseClassUseCase: GetAllCourseClassUseCase,
        private readonly getCourseClassByIdUseCase: GetCourseClassByIdUseCase,
        private readonly createCourseClassUseCase: CreateCourseClassUseCase,
        private readonly updateCourseClassUseCase: UpdateCourseClassUseCase,
        private readonly deleteCourseClassUseCase: DeleteCourseClassUseCase,
    ) { }

    @Get()
    @RequirePermission('courseClass.getAll')
    @HttpCode(HttpStatus.OK)
    async getAll(
        @Query() query: CourseClassListQueryDto,
    ): Promise<CourseClassListResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getAllCourseClassUseCase.execute(query)
        )
    }

    @Get('admin/my')
    @RequirePermission('courseClass.getMyClasses')
    @HttpCode(HttpStatus.OK)
    async getMyClasses(
        @CurrentUser('adminId') adminId: number,
        @Query() query: CourseClassListQueryDto,
    ): Promise<CourseClassListResponseDto> {
        return ExceptionHandler.execute(() => {
            query.teacherId = adminId
            query.instructorId = adminId
            return this.getAllCourseClassUseCase.execute(query)
        })
    }

    @Get(':id')
    @RequirePermission('courseClass.getById')
    @HttpCode(HttpStatus.OK)
    async getById(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('studentId') studentId?: number,
    ): Promise<BaseResponseDto<CourseClassResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.getCourseClassByIdUseCase.execute(id, studentId)
        )
    }

    @Post()
    @RequirePermission('courseClass.create')
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: CreateCourseClassDto,
        @CurrentUser('adminId') adminId?: number,
    ): Promise<BaseResponseDto<CourseClassResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.createCourseClassUseCase.execute(dto, adminId)
        )
    }

    @Put(':id')
    @RequirePermission('courseClass.update')
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCourseClassDto,
        @CurrentUser('adminId') adminId?: number,
    ): Promise<BaseResponseDto<CourseClassResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.updateCourseClassUseCase.execute(id, dto, adminId)
        )
    }

    @Delete(':id')
    @RequirePermission('courseClass.delete')
    @HttpCode(HttpStatus.OK)
    async delete(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('adminId') adminId?: number,
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() =>
            this.deleteCourseClassUseCase.execute(id, adminId)
        )
    }
}
