// src/presentation/controllers/class-student.controller.ts
import {
    Controller,
    Get,
    Post,
    Delete,
    Query,
    Param,
    Body,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
} from '@nestjs/common'
import { ClassStudentListQueryDto } from '../../application/dtos/class-student/class-student-list-query.dto'
import { CreateClassStudentDto } from '../../application/dtos/class-student/create-class-student.dto'
import {
    ClassStudentListResponseDto,
    ClassStudentResponseDto,
} from '../../application/dtos/class-student/class-student.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import {
    GetAllClassStudentUseCase,
    CreateClassStudentUseCase,
    DeleteClassStudentUseCase,
} from '../../application/use-cases/class-student'
import { Injectable } from '@nestjs/common'

@Injectable()
@Controller('class-students')
export class ClassStudentController {
    constructor(
        private readonly getAllClassStudentUseCase: GetAllClassStudentUseCase,
        private readonly createClassStudentUseCase: CreateClassStudentUseCase,
        private readonly deleteClassStudentUseCase: DeleteClassStudentUseCase,
    ) { }

    @Get()
    @RequirePermission('classStudent.getAll')
    @HttpCode(HttpStatus.OK)
    async getAll(
        @Query() query: ClassStudentListQueryDto,
    ): Promise<ClassStudentListResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getAllClassStudentUseCase.execute(query)
        )
    }

    @Post()
    @RequirePermission('classStudent.create')
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: CreateClassStudentDto,
    ): Promise<BaseResponseDto<ClassStudentResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.createClassStudentUseCase.execute(dto)
        )
    }

    @Delete(':classId/:studentId')
    @RequirePermission('classStudent.delete')
    @HttpCode(HttpStatus.OK)
    async delete(
        @Param('classId', ParseIntPipe) classId: number,
        @Param('studentId', ParseIntPipe) studentId: number,
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() =>
            this.deleteClassStudentUseCase.execute(classId, studentId)
        )
    }
}
