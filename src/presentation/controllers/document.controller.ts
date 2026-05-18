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
  Res,
} from '@nestjs/common'
import type { Response } from 'express'
import {
  BaseResponseDto,
  CreateDocumentDto,
  DocumentListQueryDto,
  DocumentResponseDto,
  DocumentSeoLevelResponseDto,
  PaginationResponseDto,
  UpdateDocumentDto,
} from 'src/application/dtos'
import {
  CreateDocumentUseCase,
  DeleteDocumentUseCase,
  DownloadPublicDocumentUseCase,
  GetDocumentByIdUseCase,
  GetDocumentBySlugUseCase,
  GetDocumentsUseCase,
  GetPublicSeoDocumentsByLevelUseCase,
  GetPublicSeoDocumentsByTagSlugUseCase,
  GetPublicSeoLatestDocumentsUseCase,
  GetPublicSeoDocumentBySlugUseCase,
  GetPublicSeoRelatedDocumentsBySlugUseCase,
  IncrementPublicDocumentDownloadCountUseCase,
  IncrementPublicDocumentViewCountUseCase,
  UpdateDocumentUseCase,
} from 'src/application/use-cases/document'
import { CurrentUser } from 'src/shared/decorators'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { Visibility } from 'src/shared/enums'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'

@Controller('documents')
export class DocumentController {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly getDocumentsUseCase: GetDocumentsUseCase,
    private readonly downloadPublicDocumentUseCase: DownloadPublicDocumentUseCase,
    private readonly getDocumentByIdUseCase: GetDocumentByIdUseCase,
    private readonly getDocumentBySlugUseCase: GetDocumentBySlugUseCase,
    private readonly getPublicSeoDocumentsByLevelUseCase: GetPublicSeoDocumentsByLevelUseCase,
    private readonly getPublicSeoDocumentsByTagSlugUseCase: GetPublicSeoDocumentsByTagSlugUseCase,
    private readonly getPublicSeoLatestDocumentsUseCase: GetPublicSeoLatestDocumentsUseCase,
    private readonly getPublicSeoDocumentBySlugUseCase: GetPublicSeoDocumentBySlugUseCase,
    private readonly getPublicSeoRelatedDocumentsBySlugUseCase: GetPublicSeoRelatedDocumentsBySlugUseCase,
    private readonly incrementPublicDocumentViewCountUseCase: IncrementPublicDocumentViewCountUseCase,
    private readonly incrementPublicDocumentDownloadCountUseCase: IncrementPublicDocumentDownloadCountUseCase,
    private readonly updateDocumentUseCase: UpdateDocumentUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
  ) {}

  @Post()
  @RequirePermission()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<DocumentResponseDto>> {
    return ExceptionHandler.execute(() => this.createDocumentUseCase.execute(dto, userId))
  }

  @Get()
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getList(@Query() query: DocumentListQueryDto): Promise<PaginationResponseDto<DocumentResponseDto>> {
    return ExceptionHandler.execute(() => this.getDocumentsUseCase.execute(query))
  }

  @Get('public/seo')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoList(
    @Query() query: DocumentListQueryDto,
  ): Promise<PaginationResponseDto<DocumentResponseDto>> {
    query.visibility = Visibility.PUBLISHED
    return ExceptionHandler.execute(() => this.getDocumentsUseCase.execute(query))
  }

  @Get('public/seo/latest')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoLatestDocuments(): Promise<PaginationResponseDto<DocumentResponseDto>> {
    return ExceptionHandler.execute(() => this.getPublicSeoLatestDocumentsUseCase.execute(4))
  }

  @Get('public/seo/tag/:slug')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoDocumentsByTagSlug(
    @Param('slug') slug: string,
    @Query() query: DocumentListQueryDto,
  ): Promise<PaginationResponseDto<DocumentResponseDto>> {
    return ExceptionHandler.execute(() => this.getPublicSeoDocumentsByTagSlugUseCase.execute(slug, query))
  }

  @Get('public/seo/level/thpt')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoThptDocuments(): Promise<BaseResponseDto<DocumentSeoLevelResponseDto>> {
    return ExceptionHandler.execute(() => this.getPublicSeoDocumentsByLevelUseCase.execute('thpt'))
  }

  @Get('public/seo/level/thcs')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoThcsDocuments(): Promise<BaseResponseDto<DocumentSeoLevelResponseDto>> {
    return ExceptionHandler.execute(() => this.getPublicSeoDocumentsByLevelUseCase.execute('thcs'))
  }

  @Post('public/seo/:slug/view')
  @HttpCode(HttpStatus.OK)
  async incrementPublicSeoViewCount(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<{ viewCount: number }>> {
    return ExceptionHandler.execute(() => this.incrementPublicDocumentViewCountUseCase.execute(slug))
  }

  @Post('public/seo/:slug/download-count')
  @HttpCode(HttpStatus.OK)
  async incrementPublicSeoDownloadCount(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<{ downloadCount: number }>> {
    return ExceptionHandler.execute(() => this.incrementPublicDocumentDownloadCountUseCase.execute(slug))
  }

  @Get('public/seo/:slug/download')
  async downloadPublicSeoDocument(
    @Param('slug') slug: string,
    @Res() res: Response,
  ): Promise<void> {
    return ExceptionHandler.execute(async () => {
      const result = await this.downloadPublicDocumentUseCase.execute(slug)
      res.redirect(HttpStatus.FOUND, result.downloadUrl)
    })
  }

  @Get('public/seo/:slug/related')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoRelatedDocumentsBySlug(
    @Param('slug') slug: string,
  ): Promise<PaginationResponseDto<DocumentResponseDto>> {
    return ExceptionHandler.execute(() => this.getPublicSeoRelatedDocumentsBySlugUseCase.execute(slug, 10))
  }

  @Get('public/seo/:slug')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoBySlug(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<DocumentResponseDto>> {
    return ExceptionHandler.execute(() => this.getPublicSeoDocumentBySlugUseCase.execute(slug))
  }

  @Get('slug/:slug')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getBySlug(@Param('slug') slug: string): Promise<BaseResponseDto<DocumentResponseDto>> {
    return ExceptionHandler.execute(() => this.getDocumentBySlugUseCase.execute(slug))
  }

  @Get(':documentId')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getById(@Param('documentId', ParseIntPipe) documentId: number): Promise<BaseResponseDto<DocumentResponseDto>> {
    return ExceptionHandler.execute(() => this.getDocumentByIdUseCase.execute(documentId))
  }

  @Put(':documentId')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<DocumentResponseDto>> {
    return ExceptionHandler.execute(() => this.updateDocumentUseCase.execute(documentId, dto, userId))
  }

  @Delete(':documentId')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('documentId', ParseIntPipe) documentId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    return ExceptionHandler.execute(() => this.deleteDocumentUseCase.execute(documentId))
  }
}

/*
DOCUMENT API DOCUMENTATION

Base path: /api/documents
Auth/permission: cac endpoint dang dung @RequirePermission().

Visibility values:
- DRAFT
- PRIVATE
- PUBLISHED

1. Create document
URL: POST /api/documents
Notes:
- mediaId la bat buoc va phai tro toi media PDF.
- Neu khong truyen thumbnailMediaId, he thong tu lay trang dau PDF de tao thumbnail.
- Neu truyen contentStartPage + contentEndPage, he thong cat doan PDF do, OCR, sua markdown roi luu vao content.
- Neu khong truyen khoang trang nhung co content, he thong luu content va attach media trong markdown.
- Neu bo trong cac truong SEO, he thong tu sinh SEO tieng Viet tu title + content.
Request body:
{
  "title": "Tai lieu tich phan lop 12",
  "mediaId": 123,
  "thumbnailMediaId": 456,
  "contentStartPage": 1,
  "contentEndPage": 3,
  "shortDescription": "Tong hop ly thuyet va bai tap tich phan",
  "content": "# Tich phan\nNoi dung chi tiet...",
  "sourceName": "BEE",
  "sourceUrl": "https://example.com/source.pdf",
  "targetKeyword": "tai lieu tich phan lop 12",
  "keywordText": "tich phan, bai tap tich phan, on thi thpt",
  "metaTitle": "Tai lieu tich phan lop 12",
  "metaDescription": "Tai lieu tich phan lop 12 co dap an va loi giai.",
  "ogTitle": "Tai lieu tich phan lop 12",
  "ogDescription": "Tai lieu on tap tich phan.",
  "searchIntent": "download",
  "seoScore": 85,
  "visibility": "DRAFT",
  "isFeatured": false,
  "readingTime": 12,
  "tagIds": [1, 2, 3]
}

Response 201:
{
  "success": true,
  "message": "Tao tai lieu thanh cong",
  "data": {
    "documentId": 1,
    "title": "Tai lieu tich phan lop 12",
    "slug": "tai-lieu-tich-phan-lop-12",
    "shortDescription": "Tong hop ly thuyet va bai tap tich phan",
    "content": "# Tich phan\nNoi dung chi tiet...",
    "sourceName": "BEE",
    "sourceUrl": "https://example.com/source.pdf",
    "targetKeyword": "tai lieu tich phan lop 12",
    "keywordText": "tich phan, bai tap tich phan, on thi thpt",
    "metaTitle": "Tai lieu tich phan lop 12",
    "metaDescription": "Tai lieu tich phan lop 12 co dap an va loi giai.",
    "ogTitle": "Tai lieu tich phan lop 12",
    "ogDescription": "Tai lieu on tap tich phan.",
    "searchIntent": "download",
    "seoScore": 85,
    "visibility": "DRAFT",
    "isFeatured": false,
    "viewCount": 0,
    "downloadCount": 0,
    "readingTime": 12,
    "createdBy": 10,
    "updatedBy": null,
    "createdAt": "2026-05-13T02:00:00.000Z",
    "updatedAt": "2026-05-13T02:00:00.000Z",
    "tags": [
      {
        "tagId": 1,
        "name": "Toan 12",
        "slug": "toan-12",
        "type": "GRADE",
        "description": "Tai lieu va bai tap lop 12"
      }
    ]
  }
}

2. Get document list
URL: GET /api/documents?page=1&limit=10&search=tich%20phan&visibility=PUBLISHED&isFeatured=false&tagId=1&tagIds=1&tagIds=2&includeTags=true&sortBy=createdAt&sortOrder=desc
Notes:
- Moi item tra ve thumbnailUrl neu document co thumbnail san sang.
Query params:
- page: number
- limit: number
- search: string
- visibility: DRAFT | PRIVATE | PUBLISHED
- isFeatured: boolean
- tagId: number
- tagIds: number[] (loc document co it nhat 1 tag nam trong danh sach)
- includeTags: boolean
- sortBy: documentId | title | slug | visibility | isFeatured | viewCount | downloadCount | createdAt | updatedAt
- sortOrder: asc | desc

Response 200:
{
  "success": true,
  "message": "Lay danh sach tai lieu thanh cong",
  "data": [
    {
      "documentId": 1,
      "title": "Tai lieu tich phan lop 12",
      "slug": "tai-lieu-tich-phan-lop-12",
      "shortDescription": "Tong hop ly thuyet va bai tap tich phan",
      "content": "# Tich phan\nNoi dung chi tiet...",
      "sourceName": "BEE",
      "sourceUrl": "https://example.com/source.pdf",
      "targetKeyword": "tai lieu tich phan lop 12",
      "keywordText": "tich phan, bai tap tich phan, on thi thpt",
      "metaTitle": "Tai lieu tich phan lop 12",
      "metaDescription": "Tai lieu tich phan lop 12 co dap an va loi giai.",
      "ogTitle": "Tai lieu tich phan lop 12",
      "ogDescription": "Tai lieu on tap tich phan.",
      "searchIntent": "download",
      "seoScore": 85,
      "visibility": "PUBLISHED",
      "isFeatured": false,
      "viewCount": 0,
      "downloadCount": 0,
      "readingTime": 12,
      "createdBy": 10,
      "updatedBy": null,
      "createdAt": "2026-05-13T02:00:00.000Z",
      "updatedAt": "2026-05-13T02:00:00.000Z",
      "thumbnailUrl": "https://cdn.example.com/documents/thumbnails/tich-phan.webp",
      "tags": [
        {
          "tagId": 1,
          "name": "Toan 12",
          "slug": "toan-12",
          "type": "GRADE",
          "description": "Tai lieu va bai tap lop 12"
        }
      ]
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

3. Get public SEO document list
URL: GET /api/documents/public/seo?page=1&limit=10&search=tich%20phan&tagSlugs=tich-phan&tagSlugs=toan-12&includeTags=true&sortBy=createdAt&sortOrder=desc
Notes:
- Khong can auth/permission.
- Chi tra ve document co visibility = PUBLISHED.
- Search khong phan biet co dau/khong dau va hoa/thuong.
- Ho tro pagination day du va loc theo tag slug.
Request:
- Body: none
- Query params:
  - page: number
  - limit: number
  - search: string
  - isFeatured: boolean
  - tagSlugs: string[]
  - includeTags: boolean
  - sortBy: documentId | title | slug | visibility | isFeatured | viewCount | downloadCount | createdAt | updatedAt
  - sortOrder: asc | desc

Response 200:
{
  "success": true,
  "message": "Lay danh sach tai lieu thanh cong",
  "data": [
    {
      "documentId": 1,
      "title": "Tai lieu tich phan lop 12",
      "slug": "tai-lieu-tich-phan-lop-12",
      "shortDescription": "Tong hop ly thuyet va bai tap tich phan",
      "visibility": "PUBLISHED",
      "thumbnailUrl": "https://cdn.example.com/documents/thumbnails/tich-phan.webp",
      "tags": [
        {
          "tagId": 1,
          "name": "Toan 12",
          "slug": "toan-12",
          "type": "GRADE",
          "description": "Tai lieu va bai tap lop 12"
        }
      ]
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

4. Get public SEO document detail
URL: GET /api/documents/public/seo/tai-lieu-tich-phan-lop-12
Notes:
- Khong can auth/permission.
- Chi tra ve document co visibility = PUBLISHED.
- Tra ve thumbnailUrl, mediaUsages va processedContent dang HTML.
Request:
- Body: none
- Path params:
  - slug: string

Response 200:
{
  "success": true,
  "message": "Lay tai lieu thanh cong",
  "data": {
    "documentId": 1,
    "title": "Tai lieu tich phan lop 12",
    "slug": "tai-lieu-tich-phan-lop-12",
    "visibility": "PUBLISHED",
    "content": "# Tich phan\nNoi dung chi tiet...",
    "processedContent": "<h1>Tich phan</h1><p>Noi dung da render HTML...</p>",
    "thumbnailUrl": "https://cdn.example.com/documents/thumbnails/tich-phan.webp",
    "mediaUsages": [
      {
        "usageId": 10,
        "mediaId": 123,
        "fieldName": "documentFile",
        "url": "https://cdn.example.com/documents/tich-phan.pdf",
        "mimeType": "application/pdf",
        "originalFilename": "tai-lieu-tich-phan.pdf"
      },
      {
        "usageId": 11,
        "mediaId": 456,
        "fieldName": "documentThumbnail",
        "url": "https://cdn.example.com/documents/thumbnails/tich-phan.webp",
        "mimeType": "image/webp",
        "originalFilename": "tai-lieu-tich-phan-thumbnail.webp"
      }
    ],
    "tags": [
      {
        "tagId": 1,
        "name": "Toan 12",
        "slug": "toan-12",
        "type": "GRADE",
        "description": "Tai lieu va bai tap lop 12"
      }
    ]
  }
}

5. Get latest public SEO documents
URL: GET /api/documents/public/seo/latest
Notes:
- Khong can auth/permission.
- Tra ve 4 document PUBLISHED moi nhat, kem thumbnailUrl va tags.
Request:
- Body: none
- Query params: none

Response 200:
{
  "success": true,
  "message": "Lay danh sach tai lieu moi nhat thanh cong",
  "data": [
    {
      "documentId": 2,
      "title": "Tai lieu dao ham lop 12",
      "slug": "tai-lieu-dao-ham-lop-12",
      "visibility": "PUBLISHED",
      "thumbnailUrl": "https://cdn.example.com/documents/thumbnails/dao-ham.webp",
      "tags": [
        {
          "tagId": 1,
          "name": "Toan 12",
          "slug": "toan-12",
          "type": "GRADE",
          "description": "Tai lieu va bai tap lop 12"
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 4,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}

6. Get related public SEO documents
URL: GET /api/documents/public/seo/tai-lieu-tich-phan-lop-12/related
Notes:
- Khong can auth/permission.
- Chi tra ve document PUBLISHED.
- Uu tien tai lieu co chung tag voi tai lieu goc, loai bo chinh tai lieu hien tai.
Request:
- Body: none
- Path params:
  - slug: string

Response 200:
{
  "success": true,
  "message": "Lay danh sach tai lieu lien quan thanh cong",
  "data": [
    {
      "documentId": 3,
      "title": "Bai tap tich phan lop 12",
      "slug": "bai-tap-tich-phan-lop-12",
      "visibility": "PUBLISHED",
      "thumbnailUrl": "https://cdn.example.com/documents/thumbnails/bai-tap-tich-phan.webp",
      "tags": [
        {
          "tagId": 1,
          "name": "Toan 12",
          "slug": "toan-12",
          "type": "GRADE",
          "description": "Tai lieu va bai tap lop 12"
        }
      ]
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

7. Get public SEO documents by tag slug
URL: GET /api/documents/public/seo/tag/tai-lieu-toan-12?page=1&limit=10&includeTags=true
Notes:
- Khong can auth/permission.
- Chi tra ve document PUBLISHED co gan tag trung voi slug.
Request:
- Body: none
- Path params:
  - slug: string
- Query params:
  - page, limit, search, isFeatured, includeTags, sortBy, sortOrder

Response 200:
{
  "success": true,
  "message": "Lay danh sach tai lieu thanh cong",
  "data": [
    {
      "documentId": 1,
      "title": "Tai lieu toan 12",
      "slug": "tai-lieu-toan-12",
      "visibility": "PUBLISHED",
      "thumbnailUrl": "https://cdn.example.com/documents/thumbnails/toan-12.webp"
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

8. Get public SEO THPT level sections
URL: GET /api/documents/public/seo/level/thpt
Notes:
- Khong can auth/permission.
- Moi section tra toi da 5 document PUBLISHED co tag thpt.
- Cac section key co the co:
  - latest: Tai lieu moi nhat
  - thpt_math_review: Tai lieu on thi THPT mon toan
  - thpt_math_exams: De thi THPT mon toan
  - math_12: Tai lieu toan 12
  - math_11: Tai lieu toan 11
  - math_10: Tai lieu toan 10
Request: no body

Response 200:
{
  "success": true,
  "message": "Lay danh sach tai lieu theo cap hoc thanh cong",
  "data": {
    "level": {
      "tagId": 100,
      "name": "THPT",
      "slug": "thpt",
      "type": "LEVEL",
      "description": null
    },
    "sections": [
      {
        "key": "latest",
        "title": "Tai lieu moi nhat",
        "documents": []
      }
    ]
  }
}

9. Get public SEO THCS level sections
URL: GET /api/documents/public/seo/level/thcs
Notes:
- Khong can auth/permission.
- Moi section tra toi da 5 document PUBLISHED co tag thcs.
- Cac section key co the co:
  - latest: Tai lieu moi nhat
  - grade_10_exam_review: On thi vao lop 10 mon toan
  - math_9: Tai lieu toan 9
  - math_8: Tai lieu toan 8
  - math_7: Tai lieu toan 7
  - math_6: Tai lieu toan 6
Request: no body

Response 200:
{
  "success": true,
  "message": "Lay danh sach tai lieu theo cap hoc thanh cong",
  "data": {
    "level": {
      "tagId": 101,
      "name": "THCS",
      "slug": "thcs",
      "type": "LEVEL",
      "description": null
    },
    "sections": [
      {
        "key": "latest",
        "title": "Tai lieu moi nhat",
        "documents": []
      }
    ]
  }
}

10. Increment public SEO document view count
URL: POST /api/documents/public/seo/tai-lieu-tich-phan-lop-12/view
Notes:
- Khong can auth/permission.
- Chi tang count neu document dang PUBLISHED.
Request: no body

Response 200:
{
  "success": true,
  "message": "Tang luot xem tai lieu thanh cong",
  "data": {
    "viewCount": 101
  }
}

11. Increment public SEO document download count
URL: POST /api/documents/public/seo/tai-lieu-tich-phan-lop-12/download-count
Notes:
- Khong can auth/permission.
- Dung khi can ghi nhan su kien tai rieng.
- Neu nguoi dung bam endpoint download that su ben duoi thi endpoint do da tu tang downloadCount, khong goi them API nay cho cung mot lan bam.
Request: no body

Response 200:
{
  "success": true,
  "message": "Tang luot tai tai lieu thanh cong",
  "data": {
    "downloadCount": 26
  }
}

12. Download public SEO document file
URL: GET /api/documents/public/seo/tai-lieu-tich-phan-lop-12/download
Notes:
- Khong can auth/permission.
- Chi cho tai document PUBLISHED.
- Tu tang downloadCount, sau do redirect sang signed URL co Content-Disposition attachment de trinh duyet tu tai file PDF ve may.
Request: no body

Response:
- 302 Redirect toi signed URL download cua MinIO.

13. Get document by slug
URL: GET /api/documents/slug/tai-lieu-tich-phan-lop-12
Request: no body
Notes:
- Tra ve thumbnailUrl, mediaUsages cua tat ca media dang gan voi document va processedContent dang HTML.

Response 200:
{
  "success": true,
  "message": "Lay tai lieu thanh cong",
  "data": {
    "documentId": 1,
    "title": "Tai lieu tich phan lop 12",
    "slug": "tai-lieu-tich-phan-lop-12",
    "visibility": "PUBLISHED",
    "processedContent": "<h1>Tich phan</h1><p>Noi dung da render HTML...</p>",
    "thumbnailUrl": "https://cdn.example.com/documents/thumbnails/tich-phan.webp",
    "mediaUsages": [
      {
        "usageId": 10,
        "mediaId": 123,
        "fieldName": "documentFile",
        "url": "https://cdn.example.com/documents/tich-phan.pdf",
        "mimeType": "application/pdf",
        "originalFilename": "tai-lieu-tich-phan.pdf"
      },
      {
        "usageId": 11,
        "mediaId": 456,
        "fieldName": "documentThumbnail",
        "url": "https://cdn.example.com/documents/thumbnails/tich-phan.webp",
        "mimeType": "image/webp",
        "originalFilename": "tai-lieu-tich-phan-thumbnail.webp"
      },
      {
        "usageId": 12,
        "mediaId": 789,
        "fieldName": "content",
        "url": "https://cdn.example.com/documents/content/figure-1.png",
        "mimeType": "image/png",
        "originalFilename": "figure-1.png"
      }
    ],
    "tags": [
      {
        "tagId": 1,
        "name": "Toan 12",
        "slug": "toan-12",
        "type": "GRADE",
        "description": "Tai lieu va bai tap lop 12"
      }
    ]
  }
}

14. Get document by id
URL: GET /api/documents/1
Request: no body
Notes:
- Tra ve thumbnailUrl va mediaUsages cua tat ca media dang gan voi document.
- processedContent: HTML da render.
- processedMarkdownContent: markdown da thay media URL, chua render HTML.

Response 200:
{
  "success": true,
  "message": "Lay tai lieu thanh cong",
  "data": {
    "documentId": 1,
    "title": "Tai lieu tich phan lop 12",
    "slug": "tai-lieu-tich-phan-lop-12",
    "visibility": "PUBLISHED",
    "processedContent": "<h1>Tich phan</h1><p>Noi dung da render HTML...</p>",
    "processedMarkdownContent": "# Tich phan\n![Hinh minh hoa](https://cdn.example.com/documents/content/figure-1.png)",
    "thumbnailUrl": "https://cdn.example.com/documents/thumbnails/tich-phan.webp",
    "mediaUsages": [
      {
        "usageId": 10,
        "mediaId": 123,
        "fieldName": "documentFile",
        "url": "https://cdn.example.com/documents/tich-phan.pdf",
        "mimeType": "application/pdf",
        "originalFilename": "tai-lieu-tich-phan.pdf"
      },
      {
        "usageId": 11,
        "mediaId": 456,
        "fieldName": "documentThumbnail",
        "url": "https://cdn.example.com/documents/thumbnails/tich-phan.webp",
        "mimeType": "image/webp",
        "originalFilename": "tai-lieu-tich-phan-thumbnail.webp"
      },
      {
        "usageId": 12,
        "mediaId": 789,
        "fieldName": "content",
        "url": "https://cdn.example.com/documents/content/figure-1.png",
        "mimeType": "image/png",
        "originalFilename": "figure-1.png"
      }
    ],
    "tags": [
      {
        "tagId": 1,
        "name": "Toan 12",
        "slug": "toan-12",
        "type": "GRADE",
        "description": "Tai lieu va bai tap lop 12"
      }
    ]
  }
}

15. Update document
URL: PUT /api/documents/1
Notes:
- Neu sua title, he thong tu sinh lai slug.
- Neu truyen thumbnailMediaId moi, he thong go thumbnail cu va gan thumbnail moi.
- Neu truyen content, he thong normalize markdown va dong bo media usage giong UpdateQuestionUseCase.
Request body:
{
  "title": "Tai lieu tich phan lop 12 cap nhat",
  "thumbnailMediaId": 789,
  "content": "# Tich phan\nNoi dung cap nhat co media: ![](media:900)",
  "visibility": "PUBLISHED",
  "isFeatured": true,
  "tagIds": [1, 4]
}

Response 200:
{
  "success": true,
  "message": "Cap nhat tai lieu thanh cong",
  "data": {
    "documentId": 1,
    "title": "Tai lieu tich phan lop 12 cap nhat",
    "slug": "tai-lieu-tich-phan-lop-12-cap-nhat",
    "visibility": "PUBLISHED",
    "isFeatured": true,
    "updatedBy": 10,
    "updatedAt": "2026-05-13T03:00:00.000Z",
    "tags": [
      {
        "tagId": 1,
        "name": "Toan 12",
        "slug": "toan-12",
        "type": "GRADE",
        "description": "Tai lieu va bai tap lop 12"
      }
    ]
  }
}

16. Delete document
URL: DELETE /api/documents/1
Request: no body

Response 200:
{
  "success": true,
  "message": "Xoa tai lieu thanh cong",
  "data": {
    "deleted": true,
    "message": "Xoa tai lieu thanh cong"
  }
}
*/
