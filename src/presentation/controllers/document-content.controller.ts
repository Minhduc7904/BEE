// src/presentation/controllers/document-content.controller.ts
import { Controller, Get, Post, Put, Delete, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { DocumentContentListQueryDto } from '../../application/dtos/documentContent/document-content-list-query.dto'
import { CreateDocumentContentDto } from '../../application/dtos/documentContent/create-document-content.dto'
import { UpdateDocumentContentDto } from '../../application/dtos/documentContent/update-document-content.dto'
import { DocumentContentListResponseDto, DocumentContentResponseDto } from '../../application/dtos/documentContent/document-content.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import {
    GetAllDocumentContentUseCase,
    GetDocumentContentByIdUseCase,
    CreateDocumentContentUseCase,
    UpdateDocumentContentUseCase,
    DeleteDocumentContentUseCase,
} from '../../application/use-cases/documentContent'
import { Injectable } from '@nestjs/common'
import { CurrentUser } from 'src/shared/decorators'

@Injectable()
@Controller('document-contents')
export class DocumentContentController {
    constructor(
        private readonly getAllDocumentContentUseCase: GetAllDocumentContentUseCase,
        private readonly getDocumentContentByIdUseCase: GetDocumentContentByIdUseCase,
        private readonly createDocumentContentUseCase: CreateDocumentContentUseCase,
        private readonly updateDocumentContentUseCase: UpdateDocumentContentUseCase,
        private readonly deleteDocumentContentUseCase: DeleteDocumentContentUseCase,
    ) { }

    @Get()
    @RequirePermission('documentContent.getAll')
    @HttpCode(HttpStatus.OK)
    async getAllDocumentContents(@Query() query: DocumentContentListQueryDto): Promise<DocumentContentListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllDocumentContentUseCase.execute(query))
    }

    @Get(':id')
    @RequirePermission('documentContent.getById')
    @HttpCode(HttpStatus.OK)
    async getDocumentContentById(
        @Param('id', ParseIntPipe) id: number
    ): Promise<BaseResponseDto<DocumentContentResponseDto>> {
        return ExceptionHandler.execute(() => this.getDocumentContentByIdUseCase.execute(id))
    }

    @Post()
    @RequirePermission('documentContent.create')
    @HttpCode(HttpStatus.CREATED)
    async createDocumentContent(
        @Body() dto: CreateDocumentContentDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<DocumentContentResponseDto>> {
        return ExceptionHandler.execute(() => this.createDocumentContentUseCase.execute(dto, adminId))
    }

    @Put(':id')
    @RequirePermission('documentContent.update')
    @HttpCode(HttpStatus.OK)
    async updateDocumentContent(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateDocumentContentDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<DocumentContentResponseDto>> {
        return ExceptionHandler.execute(() => this.updateDocumentContentUseCase.execute(id, dto, adminId))
    }

    @Delete(':id')
    @RequirePermission('documentContent.delete')
    @HttpCode(HttpStatus.OK)
    async deleteDocumentContent(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteDocumentContentUseCase.execute(id, adminId))
    }
}
