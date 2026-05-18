import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import {
  BaseResponseDto,
  CreateTagDto,
  PaginationResponseDto,
  TagListQueryDto,
  TagResponseDto,
  UpdateTagDto,
} from 'src/application/dtos'
import {
  CreateTagUseCase,
  DeleteTagUseCase,
  GetTagByIdUseCase,
  GetTagsUseCase,
  SearchPublicSeoTagsUseCase,
  UpdateTagUseCase,
} from 'src/application/use-cases/tag'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'

@Controller('tags')
export class TagController {
  constructor(
    private readonly createTagUseCase: CreateTagUseCase,
    private readonly getTagsUseCase: GetTagsUseCase,
    private readonly searchPublicSeoTagsUseCase: SearchPublicSeoTagsUseCase,
    private readonly getTagByIdUseCase: GetTagByIdUseCase,
    private readonly updateTagUseCase: UpdateTagUseCase,
    private readonly deleteTagUseCase: DeleteTagUseCase,
  ) {}

  @Post()
  @RequirePermission()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTagDto): Promise<BaseResponseDto<TagResponseDto>> {
    return ExceptionHandler.execute(() => this.createTagUseCase.execute(dto))
  }

  @Get()
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getList(@Query() query: TagListQueryDto): Promise<PaginationResponseDto<TagResponseDto>> {
    return ExceptionHandler.execute(() => this.getTagsUseCase.execute(query))
  }

  @Get('public/seo/search')
  @HttpCode(HttpStatus.OK)
  async searchPublicSeo(
    @Query() query: TagListQueryDto,
  ): Promise<PaginationResponseDto<TagResponseDto>> {
    return ExceptionHandler.execute(() => this.searchPublicSeoTagsUseCase.execute(query))
  }

  @Get(':tagId')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getById(@Param('tagId', ParseIntPipe) tagId: number): Promise<BaseResponseDto<TagResponseDto>> {
    return ExceptionHandler.execute(() => this.getTagByIdUseCase.execute(tagId))
  }

  @Put(':tagId')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('tagId', ParseIntPipe) tagId: number,
    @Body() dto: UpdateTagDto,
  ): Promise<BaseResponseDto<TagResponseDto>> {
    return ExceptionHandler.execute(() => this.updateTagUseCase.execute(tagId, dto))
  }

  @Delete(':tagId')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('tagId', ParseIntPipe) tagId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    return ExceptionHandler.execute(() => this.deleteTagUseCase.execute(tagId))
  }
}

/*
TAG API DOCUMENTATION

Base path: /api/tags
Auth/permission: cac endpoint dang dung @RequirePermission().

TagType values:
- GRADE
- CHAPTER
- DOCUMENT_TYPE
- LEVEL
- SUBJECT
- TOPIC
- KEYWORD
- OTHER

1. Create tag
URL: POST /api/tags
Request body:
{
  "name": "Toan 12",
  "type": "GRADE",
  "description": "Tai lieu va bai tap lop 12",
  "isActive": true
}

Response 201:
{
  "success": true,
  "message": "Tao tag thanh cong",
  "data": {
    "tagId": 1,
    "name": "Toan 12",
    "slug": "toan-12",
    "type": "GRADE",
    "description": "Tai lieu va bai tap lop 12",
    "isActive": true,
    "createdAt": "2026-05-13T02:00:00.000Z",
    "updatedAt": "2026-05-13T02:00:00.000Z"
  }
}

2. Get tag list
URL: GET /api/tags?page=1&limit=10&search=toan&type=GRADE&isActive=true&sortBy=createdAt&sortOrder=desc
Query params:
- page: number
- limit: number
- search: string
- type: TagType
- isActive: boolean
- sortBy: tagId | name | slug | type | isActive | createdAt | updatedAt
- sortOrder: asc | desc

Response 200:
{
  "success": true,
  "message": "Lay danh sach tag thanh cong",
  "data": [
    {
      "tagId": 1,
      "name": "Toan 12",
      "slug": "toan-12",
      "type": "GRADE",
      "description": "Tai lieu va bai tap lop 12",
      "isActive": true,
      "createdAt": "2026-05-13T02:00:00.000Z",
      "updatedAt": "2026-05-13T02:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}

3. Search public SEO tags
URL: GET /api/tags/public/seo/search?page=1&limit=10&search=tai%20lieu&type=DOCUMENT_TYPE
Notes:
- Khong can auth/permission.
- Chi tra ve tag active.
- Search khong phan biet co dau/khong dau va hoa/thuong.
- Vi du: "toan", "TOAN", "toán", "ToÁn" deu co the tim thay tag "Toán".
Query params:
- page: number
- limit: number
- search: string
- type: TagType
- sortBy: tagId | name | slug | type | isActive | createdAt | updatedAt
- sortOrder: asc | desc

Response 200:
{
  "success": true,
  "message": "Tim kiem tag public thanh cong",
  "data": [
    {
      "tagId": 1,
      "name": "Toan 12",
      "slug": "toan-12",
      "type": "GRADE",
      "description": "Tai lieu va bai tap lop 12",
      "isActive": true,
      "createdAt": "2026-05-13T02:00:00.000Z",
      "updatedAt": "2026-05-13T02:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}

4. Get tag by id
URL: GET /api/tags/1
Request: no body

Response 200:
{
  "success": true,
  "message": "Lay tag thanh cong",
  "data": {
    "tagId": 1,
    "name": "Toan 12",
    "slug": "toan-12",
    "type": "GRADE",
    "description": "Tai lieu va bai tap lop 12",
    "isActive": true,
    "createdAt": "2026-05-13T02:00:00.000Z",
    "updatedAt": "2026-05-13T02:00:00.000Z"
  }
}

5. Update tag
URL: PUT /api/tags/1
Request body:
{
  "name": "Giai tich 12",
  "type": "CHAPTER",
  "description": "Chuong giai tich lop 12",
  "isActive": true
}

Response 200:
{
  "success": true,
  "message": "Cap nhat tag thanh cong",
  "data": {
    "tagId": 1,
    "name": "Giai tich 12",
    "slug": "giai-tich-12",
    "type": "CHAPTER",
    "description": "Chuong giai tich lop 12",
    "isActive": true,
    "createdAt": "2026-05-13T02:00:00.000Z",
    "updatedAt": "2026-05-13T03:00:00.000Z"
  }
}

6. Delete tag
URL: DELETE /api/tags/1
Request: no body

Response 200:
{
  "success": true,
  "message": "Xoa tag thanh cong",
  "data": {
    "deleted": true,
    "message": "Xoa tag thanh cong"
  }
}
*/
