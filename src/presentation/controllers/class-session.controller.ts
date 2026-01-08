// src/presentation/controllers/class-session.controller.ts
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
import { ClassSessionListQueryDto } from '../../application/dtos/class-session/class-session-list-query.dto'
import { CreateClassSessionDto } from '../../application/dtos/class-session/create-class-session.dto'
import { UpdateClassSessionDto } from '../../application/dtos/class-session/update-class-session.dto'
import {
    ClassSessionListResponseDto,
    ClassSessionResponseDto,
} from '../../application/dtos/class-session/class-session.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import {
    GetAllClassSessionUseCase,
    GetClassSessionByIdUseCase,
    CreateClassSessionUseCase,
    UpdateClassSessionUseCase,
    DeleteClassSessionUseCase,
} from '../../application/use-cases/class-session'
import { Injectable } from '@nestjs/common'

@Injectable()
@Controller('class-sessions')
export class ClassSessionController {
    constructor(
        private readonly getAllClassSessionUseCase: GetAllClassSessionUseCase,
        private readonly getClassSessionByIdUseCase: GetClassSessionByIdUseCase,
        private readonly createClassSessionUseCase: CreateClassSessionUseCase,
        private readonly updateClassSessionUseCase: UpdateClassSessionUseCase,
        private readonly deleteClassSessionUseCase: DeleteClassSessionUseCase,
    ) { }

    @Get()
    @RequirePermission('classSession.getAll')
    @HttpCode(HttpStatus.OK)
    async getAll(
        @Query() query: ClassSessionListQueryDto,
    ): Promise<ClassSessionListResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getAllClassSessionUseCase.execute(query)
        )
    }

    @Get(':id')
    @RequirePermission('classSession.getById')
    @HttpCode(HttpStatus.OK)
    async getById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseResponseDto<ClassSessionResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.getClassSessionByIdUseCase.execute(id)
        )
    }

    @Post()
    @RequirePermission('classSession.create')
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: CreateClassSessionDto,
    ): Promise<BaseResponseDto<ClassSessionResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.createClassSessionUseCase.execute(dto)
        )
    }

    @Put(':id')
    @RequirePermission('classSession.update')
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateClassSessionDto,
    ): Promise<BaseResponseDto<ClassSessionResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.updateClassSessionUseCase.execute(id, dto)
        )
    }

    @Delete(':id')
    @RequirePermission('classSession.delete')
    @HttpCode(HttpStatus.OK)
    async delete(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() =>
            this.deleteClassSessionUseCase.execute(id)
        )
    }
}
