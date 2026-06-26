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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import {
  CreateSeoMediaItemDto,
  CreateSeoMediaSlotDto,
  GetSeoMediaBucketMediaListDto,
  GetSeoMediaItemListDto,
  GetSeoMediaSlotListDto,
  GetSeoMediaSlotDetailQueryDto,
  ReorderSeoMediaItemsDto,
  SeoMediaBucketMediaListResponseDto,
  SeoMediaItemListResponseDto,
  SeoMediaItemResponseDto,
  SeoMediaSlotListResponseDto,
  SeoMediaSlotResponseDto,
  SeoMediaUploadResponseDto,
  UpdateSeoMediaItemDto,
  UpdateSeoMediaSlotDto,
  UploadSeoMediaDto,
} from 'src/application/dtos/seo-media'
import {
  CreateSeoMediaItemUseCase,
  CreateSeoMediaSlotUseCase,
  DeleteSeoMediaItemUseCase,
  DeleteSeoMediaSlotUseCase,
  GetPublicSeoMediaItemsBySlotCodeUseCase,
  GetSeoMediaItemsBySlotUseCase,
  GetSeoMediaSlotByCodeUseCase,
  GetSeoMediaSlotByIdUseCase,
  GetSeoMediaBucketMediaUseCase,
  GetSeoMediaSlotListUseCase,
  ReorderSeoMediaItemsUseCase,
  UploadSeoMediaUseCase,
  UpdateSeoMediaItemUseCase,
  UpdateSeoMediaSlotUseCase,
} from 'src/application/use-cases/seo-media'
import { FileInterceptor } from '@nestjs/platform-express'
import { PERMISSION_CODES } from 'src/shared/constants/permissions/permission.codes'
import { CurrentUser } from 'src/shared/decorators'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { FileSizeByRoleInterceptor } from 'src/shared/interceptors/file-size-by-role.interceptor'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'

@Injectable()
@Controller('seo-media')
export class SeoMediaController {
  constructor(
    private readonly createSeoMediaSlotUseCase: CreateSeoMediaSlotUseCase,
    private readonly getSeoMediaSlotListUseCase: GetSeoMediaSlotListUseCase,
    private readonly getSeoMediaSlotByIdUseCase: GetSeoMediaSlotByIdUseCase,
    private readonly getSeoMediaSlotByCodeUseCase: GetSeoMediaSlotByCodeUseCase,
    private readonly updateSeoMediaSlotUseCase: UpdateSeoMediaSlotUseCase,
    private readonly deleteSeoMediaSlotUseCase: DeleteSeoMediaSlotUseCase,
    private readonly getPublicSeoMediaItemsBySlotCodeUseCase: GetPublicSeoMediaItemsBySlotCodeUseCase,
    private readonly createSeoMediaItemUseCase: CreateSeoMediaItemUseCase,
    private readonly getSeoMediaItemsBySlotUseCase: GetSeoMediaItemsBySlotUseCase,
    private readonly updateSeoMediaItemUseCase: UpdateSeoMediaItemUseCase,
    private readonly deleteSeoMediaItemUseCase: DeleteSeoMediaItemUseCase,
    private readonly reorderSeoMediaItemsUseCase: ReorderSeoMediaItemsUseCase,
    private readonly uploadSeoMediaUseCase: UploadSeoMediaUseCase,
    private readonly getSeoMediaBucketMediaUseCase: GetSeoMediaBucketMediaUseCase,
  ) {}

  /**
   * Public SEO frontend API.
   * Returns active media items by slot code without auth/permission requirements.
   */
  @Get('public/slots/:code/items')
  @HttpCode(HttpStatus.OK)
  async getPublicItemsBySlotCode(
    @Param('code') code: string,
    @Query() query: GetSeoMediaItemListDto,
  ): Promise<SeoMediaItemListResponseDto> {
    return ExceptionHandler.execute(() => this.getPublicSeoMediaItemsBySlotCodeUseCase.execute(code, query))
  }

  /**
   * Upload anh hoac video SEO len public MinIO bucket.
   *
   * Endpoint:
   * - Method: POST
   * - Full path: /api/seo-media/upload-media
   * - Controller path: /seo-media/upload-media
   * - Content-Type: multipart/form-data
   *
   * Authentication/permission:
   * - Yeu cau Bearer token hop le.
   * - Yeu cau mot trong hai permission:
   *   - SEO_MEDIA.UPLOAD_MEDIA (`seo-media:upload-media`).
   *   - SEO_MEDIA.UPLOAD_IMAGE (`seo-media:upload-image`) de tuong thich role cu.
   *
   * Request:
   * - Form-data field `file`: binary, required.
   * - Chap nhan file co MIME type `image/*` hoac `video/*`.
   * - Gioi han dung luong: admin 50 MB; student/role khac 5 MB.
   * - UploadSeoMediaDto hien khong co them body field.
   *
   * Processing:
   * - JPEG/PNG co the duoc resize toi da 2560x2560 va chuyen sang WebP neu file nho hon.
   * - GIF va cac dinh dang anh khac duoc giu nguyen dinh dang.
   * - Video co the duoc resize chieu rong toi da 1280px va chuyen sang MP4 H.264/AAC neu file nho hon.
   * - File duoc upload vao bucket cau hinh `seoMedia`.
   * - Object key bat dau bang `images/` voi anh hoac `videos/` voi video.
   *
   * Response (HTTP 201 Created, BaseResponseDto<SeoMediaUploadResponseDto>):
   * - success: boolean
   * - message: string
   * - data.bucketName: string - Ten bucket MinIO.
   * - data.objectKey: string - Duong dan object trong bucket.
   * - data.publicUrl: string - URL public cua anh.
   * - data.originalName: string - Ten file da duoc sanitize; extension co the thay doi sau toi uu.
   * - data.mediaType: IMAGE | VIDEO - Loai media da upload.
   * - data.mimeType: string - MIME type thuc te cua file sau toi uu.
   * - data.fileSize: number - Dung luong file sau toi uu, tinh bang byte.
   * - data.width: number | null - Chieu rong anh sau toi uu.
   * - data.height: number | null - Chieu cao anh sau toi uu.
   * - data.duration: number | null - Thoi luong video tinh bang giay; null voi anh/khong doc duoc metadata.
   *
   * Errors:
   * - 400 Bad Request neu thieu file, file vuot qua gioi han hoac file khong phai anh/video.
   *
   * @example
   * POST /api/seo-media/upload-media
   * Authorization: Bearer <access-token>
   * Content-Type: multipart/form-data
   * form-data: file=<binary image or video>
   */
  @UseInterceptors(FileInterceptor('file'), FileSizeByRoleInterceptor)
  @Post('upload-media')
  @RequirePermission(PERMISSION_CODES.SEO_MEDIA.UPLOAD_MEDIA, PERMISSION_CODES.SEO_MEDIA.UPLOAD_IMAGE)
  @HttpCode(HttpStatus.CREATED)
  async uploadSeoMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadSeoMediaDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<SeoMediaUploadResponseDto>> {
    return ExceptionHandler.execute(() => this.uploadSeoMediaUseCase.execute(file, userId, dto))
  }

  /**
   * Lay danh sach anh/video dang co trong MinIO bucket SEO media.
   *
   * Endpoint:
   * - Method: GET
   * - Full path: /api/seo-media/bucket/media
   * - Controller path: /seo-media/bucket/media
   *
   * Authentication/permission:
   * - Yeu cau Bearer token hop le.
   * - Yeu cau permission SEO_MEDIA.BUCKET_MEDIA_VIEW (`seo-media:bucket-media:view`).
   *
   * Request:
   * - Query `page`: number, optional, default 1.
   * - Query `limit`: number, optional, default 10, max 1000.
   * - Query `mediaType`: IMAGE | VIDEO, optional. Neu khong truyen se tra ca anh va video.
   * - Query `prefix`: string, optional. Neu truyen `2026/06` kem `mediaType=VIDEO` se thanh `videos/2026/06/`.
   * - Query `search`: string, optional, tim theo objectKey/file name.
   * - Query `sortBy`: string, optional. Ho tro `lastModified`, `objectKey`, `fileName`, `fileSize`.
   * - Query `sortOrder`: asc | desc, optional, default desc.
   *
   * Response (HTTP 200 OK, SeoMediaBucketMediaListResponseDto):
   * - success: boolean
   * - message: string
   * - data[].bucketName: string - Ten bucket MinIO.
   * - data[].objectKey: string - Duong dan object trong bucket.
   * - data[].fileName: string - Ten file lay tu objectKey.
   * - data[].originalName: string - Ten file co the dung de goi API tao SEO media item.
   * - data[].publicUrl: string - URL public de render media truc tiep.
   * - data[].mediaType: IMAGE | VIDEO - Loai media.
   * - data[].mimeType: string - MIME type suy ra tu extension.
   * - data[].fileSize: number - Dung luong file tinh bang byte.
   * - data[].duration: number | null - Luon null khi chi list bucket; lay duration tu upload response neu can.
   * - data[].etag: string | undefined - ETag cua object tren MinIO.
   * - data[].lastModified: Date | undefined - Thoi diem object duoc cap nhat lan cuoi.
   * - meta.page/meta.limit/meta.total/meta.totalPages/meta.hasPrevious/meta.hasNext: thong tin phan trang.
   *
   * @example
   * GET /api/seo-media/bucket/media?page=1&limit=20&mediaType=VIDEO&prefix=2026/06&sortBy=lastModified&sortOrder=desc
   * Authorization: Bearer <access-token>
   */
  @Get('bucket/media')
  @RequirePermission(PERMISSION_CODES.SEO_MEDIA.BUCKET_MEDIA_VIEW)
  @HttpCode(HttpStatus.OK)
  async getSeoMediaBucketMedia(
    @Query() query: GetSeoMediaBucketMediaListDto,
  ): Promise<SeoMediaBucketMediaListResponseDto> {
    return ExceptionHandler.execute(() => this.getSeoMediaBucketMediaUseCase.execute(query))
  }

  @Post('slots')
  @RequirePermission(PERMISSION_CODES.SEO_MEDIA.SLOT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createSlot(@Body() dto: CreateSeoMediaSlotDto): Promise<BaseResponseDto<SeoMediaSlotResponseDto>> {
    return ExceptionHandler.execute(() => this.createSeoMediaSlotUseCase.execute(dto))
  }

  @Get('slots')
  @RequirePermission(PERMISSION_CODES.SEO_MEDIA.SLOT_VIEW)
  @HttpCode(HttpStatus.OK)
  async getSlots(@Query() dto: GetSeoMediaSlotListDto): Promise<SeoMediaSlotListResponseDto> {
    return ExceptionHandler.execute(() => this.getSeoMediaSlotListUseCase.execute(dto))
  }

  @Get('slots/code/:code')
  @RequirePermission(PERMISSION_CODES.SEO_MEDIA.SLOT_VIEW)
  @HttpCode(HttpStatus.OK)
  async getSlotByCode(
    @Param('code') code: string,
    @Query() query: GetSeoMediaSlotDetailQueryDto,
  ): Promise<SeoMediaSlotListResponseDto> {
    return ExceptionHandler.execute(() => this.getSeoMediaSlotByCodeUseCase.execute(code, query))
  }

  @Get('slots/:slotId')
  @RequirePermission(PERMISSION_CODES.SEO_MEDIA.SLOT_VIEW)
  @HttpCode(HttpStatus.OK)
  async getSlotById(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Query() query: GetSeoMediaSlotDetailQueryDto,
  ): Promise<BaseResponseDto<SeoMediaSlotResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getSeoMediaSlotByIdUseCase.execute(slotId, {
        includeItems: query.includeItems,
      }),
    )
  }

  @Put('slots/:slotId')
  @RequirePermission(PERMISSION_CODES.SEO_MEDIA.SLOT_UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body() dto: UpdateSeoMediaSlotDto,
  ): Promise<BaseResponseDto<SeoMediaSlotResponseDto>> {
    return ExceptionHandler.execute(() => this.updateSeoMediaSlotUseCase.execute(slotId, dto))
  }

  @Delete('slots/:slotId')
  @RequirePermission(PERMISSION_CODES.SEO_MEDIA.SLOT_DELETE)
  @HttpCode(HttpStatus.OK)
  async deleteSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    return ExceptionHandler.execute(() => this.deleteSeoMediaSlotUseCase.execute(slotId))
  }

  @Post('items')
  @RequirePermission(PERMISSION_CODES.SEO_MEDIA.ITEM_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createItem(@Body() dto: CreateSeoMediaItemDto): Promise<BaseResponseDto<SeoMediaItemResponseDto>> {
    return ExceptionHandler.execute(() => this.createSeoMediaItemUseCase.execute(dto))
  }

  @Get('slots/:slotId/items')
  @RequirePermission(PERMISSION_CODES.SEO_MEDIA.ITEM_VIEW)
  @HttpCode(HttpStatus.OK)
  async getItemsBySlot(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Query() query: GetSeoMediaItemListDto,
  ): Promise<SeoMediaItemListResponseDto> {
    return ExceptionHandler.execute(() => this.getSeoMediaItemsBySlotUseCase.execute(slotId, query))
  }

  @Put('items/:itemId')
  @RequirePermission(PERMISSION_CODES.SEO_MEDIA.ITEM_UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateSeoMediaItemDto,
  ): Promise<BaseResponseDto<SeoMediaItemResponseDto>> {
    return ExceptionHandler.execute(() => this.updateSeoMediaItemUseCase.execute(itemId, dto))
  }

  @Put('slots/:slotId/items/reorder')
  @RequirePermission(PERMISSION_CODES.SEO_MEDIA.ITEM_REORDER)
  @HttpCode(HttpStatus.OK)
  async reorderSlotItems(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body() dto: ReorderSeoMediaItemsDto,
  ): Promise<BaseResponseDto<{ data: SeoMediaItemResponseDto[]; total: number }>> {
    return ExceptionHandler.execute(() => this.reorderSeoMediaItemsUseCase.execute(slotId, dto))
  }

  @Delete('items/:itemId')
  @RequirePermission(PERMISSION_CODES.SEO_MEDIA.ITEM_DELETE)
  @HttpCode(HttpStatus.OK)
  async deleteItem(
    @Param('itemId', ParseIntPipe) itemId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    return ExceptionHandler.execute(() => this.deleteSeoMediaItemUseCase.execute(itemId))
  }
}

/*
SEO MEDIA API DOCUMENTATION

1) Create SEO media slot
- Purpose: create a slot for SEO page media.
- Endpoint: POST /seo-media/slots
- Request body:
{
  "code": "home_hero",
  "name": "Home Hero",
  "description": "Top banner",
  "isActive": true
}
- Response:
{
  "success": true,
  "message": "SEO media slot created successfully",
  "data": {
    "slotId": 1,
    "code": "home_hero",
    "name": "Home Hero",
    "description": "Top banner",
    "isActive": true,
    "createdAt": "2026-05-06T10:00:00.000Z",
    "updatedAt": "2026-05-06T10:00:00.000Z"
  }
}

2) Get SEO media slot list (pagination)
- Purpose: list slots with filter and pagination.
- Endpoint: GET /seo-media/slots?page=1&limit=10&isActive=true&includeItems=false
- Request: query params (`page`, `limit`, `isActive`, `includeItems`)
- Response:
{
  "success": true,
  "message": "Lay danh sach SEO media slots thanh cong",
  "data": [
    {
      "slotId": 1,
      "code": "home_hero",
      "name": "Home Hero",
      "description": "Top banner",
      "isActive": true,
      "createdAt": "2026-05-06T10:00:00.000Z",
      "updatedAt": "2026-05-06T10:00:00.000Z"
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

3) Get SEO media slot by code (pagination)
- Purpose: search slot by code and return paginated list format.
- Endpoint: GET /seo-media/slots/code/:code?page=1&limit=10&includeItems=true
- Request:
  - Path param: `code`
  - Query params: `page`, `limit`, `includeItems`
- Response:
{
  "success": true,
  "message": "Lay danh sach SEO media slots thanh cong",
  "data": [
    {
      "slotId": 1,
      "code": "home_hero",
      "name": "Home Hero",
      "description": "Top banner",
      "isActive": true,
      "createdAt": "2026-05-06T10:00:00.000Z",
      "updatedAt": "2026-05-06T10:00:00.000Z",
      "items": []
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

4) Get SEO media slot by id (no pagination)
- Purpose: get one slot detail by id.
- Endpoint: GET /seo-media/slots/:slotId?includeItems=true
- Request:
  - Path param: `slotId`
  - Query params: `includeItems`
- Response:
{
  "success": true,
  "message": "SEO media slot retrieved successfully",
  "data": {
    "slotId": 1,
    "code": "home_hero",
    "name": "Home Hero",
    "description": "Top banner",
    "isActive": true,
    "createdAt": "2026-05-06T10:00:00.000Z",
    "updatedAt": "2026-05-06T10:00:00.000Z",
    "items": []
  }
}

5) Update SEO media slot
- Purpose: update slot information.
- Endpoint: PUT /seo-media/slots/:slotId
- Request body:
{
  "name": "Home Hero Updated",
  "description": "New description",
  "isActive": true
}
- Response:
{
  "success": true,
  "message": "SEO media slot updated successfully",
  "data": {
    "slotId": 1,
    "code": "home_hero",
    "name": "Home Hero Updated",
    "description": "New description",
    "isActive": true,
    "createdAt": "2026-05-06T10:00:00.000Z",
    "updatedAt": "2026-05-06T10:30:00.000Z"
  }
}

6) Delete SEO media slot
- Purpose: delete slot (items are removed by cascade relation).
- Endpoint: DELETE /seo-media/slots/:slotId
- Request: path param `slotId`
- Response:
{
  "success": true,
  "message": "SEO media slot deleted successfully",
  "data": {
    "deleted": true,
    "message": "SEO media slot deleted successfully"
  }
}

7) Create SEO media item (independent from media table)
- Purpose: add one image item into slot using upload metadata.
- Endpoint: POST /seo-media/items
- Request body:
{
  "slotId": 1,
  "bucketName": "seo-media",
  "objectKey": "seo-media/2026/05/uuid.jpg",
  "publicUrl": "/seo-media/2026/05/uuid.jpg",
  "originalName": "banner_home.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 345678,
  "width": 1920,
  "height": 1080,
  "sortOrder": 0,
  "alt": "Hero image",
  "linkUrl": "https://example.com"
}
- Response:
{
  "success": true,
  "message": "SEO media item created successfully",
  "data": {
    "itemId": 1,
    "slotId": 1,
    "bucketName": "seo-media",
    "objectKey": "seo-media/2026/05/uuid.jpg",
    "publicUrl": "/seo-media/2026/05/uuid.jpg",
    "originalName": "banner_home.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 345678,
    "width": 1920,
    "height": 1080,
    "sortOrder": 0,
    "alt": "Hero image",
    "linkUrl": "https://example.com",
    "createdAt": "2026-05-06T10:00:00.000Z",
    "updatedAt": "2026-05-06T10:00:00.000Z"
  }
}

8) Get SEO media items by slot (pagination)
- Purpose: list items in a slot.
- Endpoint: GET /seo-media/slots/:slotId/items?page=1&limit=10&includeSlot=false
- Request:
  - Path param: `slotId`
  - Query params: `page`, `limit`, `includeSlot`
- Response:
{
  "success": true,
  "message": "Lay danh sach SEO media items thanh cong",
  "data": [
    {
      "itemId": 1,
      "slotId": 1,
      "bucketName": "seo-media",
      "objectKey": "seo-media/2026/05/uuid.jpg",
      "publicUrl": "/seo-media/2026/05/uuid.jpg",
      "originalName": "banner_home.jpg",
      "mimeType": "image/jpeg",
      "fileSize": 345678,
      "width": 1920,
      "height": 1080,
      "sortOrder": 0,
      "alt": "Hero image",
      "linkUrl": "https://example.com",
      "createdAt": "2026-05-06T10:00:00.000Z",
      "updatedAt": "2026-05-06T10:00:00.000Z"
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

9) Update SEO media item
- Purpose: update slot/image metadata/order/alt/link for one item.
- Endpoint: PUT /seo-media/items/:itemId
- Request body:
{
  "sortOrder": 2,
  "alt": "New alt",
  "linkUrl": "https://example.com/new-link"
}
- Response:
{
  "success": true,
  "message": "SEO media item updated successfully",
  "data": {
    "itemId": 1,
    "slotId": 1,
    "bucketName": "seo-media",
    "objectKey": "seo-media/2026/05/uuid.jpg",
    "publicUrl": "/seo-media/2026/05/uuid.jpg",
    "originalName": "banner_home.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 345678,
    "width": 1920,
    "height": 1080,
    "sortOrder": 2,
    "alt": "New alt",
    "linkUrl": "https://example.com/new-link",
    "createdAt": "2026-05-06T10:00:00.000Z",
    "updatedAt": "2026-05-06T10:40:00.000Z"
  }
}

10) Reorder SEO media items in slot
- Purpose: batch update item sort order inside one slot.
- Endpoint: PUT /seo-media/slots/:slotId/items/reorder
- Request body:
{
  "items": [
    { "itemId": 10, "sortOrder": 0 },
    { "itemId": 11, "sortOrder": 1 }
  ]
}
- Response:
{
  "success": true,
  "message": "SEO media items reordered successfully",
  "data": {
    "data": [
      {
        "itemId": 10,
        "slotId": 1,
        "bucketName": "seo-media",
        "objectKey": "seo-media/2026/05/uuid-10.jpg",
        "publicUrl": "/seo-media/2026/05/uuid-10.jpg",
        "originalName": "banner_1.jpg",
        "mimeType": "image/jpeg",
        "fileSize": 320000,
        "width": 1920,
        "height": 1080,
        "sortOrder": 0,
        "alt": null,
        "linkUrl": null,
        "createdAt": "2026-05-06T10:00:00.000Z",
        "updatedAt": "2026-05-06T10:45:00.000Z"
      }
    ],
    "total": 2
  }
}

11) Delete SEO media item
- Purpose: remove one item from slot.
- Endpoint: DELETE /seo-media/items/:itemId
- Request: path param `itemId`
- Response:
{
  "success": true,
  "message": "SEO media item deleted successfully",
  "data": {
    "deleted": true,
    "message": "SEO media item deleted successfully"
  }
}

12) Upload SEO image/video to public MinIO bucket
- Purpose: upload image or video to public `seo-media` bucket and return metadata for API #7.
- Endpoint: POST /seo-media/upload-media
- Content-Type: multipart/form-data
- Request:
  - file: binary (required, image or video)
- Response:
{
  "success": true,
  "message": "SEO media uploaded successfully",
  "data": {
    "bucketName": "seo-media",
    "objectKey": "videos/2026/05/uuid.mp4",
    "publicUrl": "/seo-media/videos/2026/05/uuid.mp4",
    "originalName": "home_intro.mp4",
    "mediaType": "VIDEO",
    "mimeType": "video/mp4",
    "fileSize": 3456780,
    "width": 1280,
    "height": 720,
    "duration": 32.5
  }
}

13) Public get SEO media items by slot code
- Purpose: frontend SEO pages load active media items by slot code without auth/permission.
- Endpoint: GET /seo-media/public/slots/:code/items?page=1&limit=10
- Request:
  - Path param: `code` (example: `home_hero`, `home_gallery`, `footer_banner`)
  - Query params: `page`, `limit`, `includeSlot`
- Response:
{
  "success": true,
  "message": "Lay danh sach SEO media items thanh cong",
  "data": [
    {
      "itemId": 1,
      "slotId": 1,
      "bucketName": "seo-media",
      "objectKey": "2026/05/uuid.jpg",
      "publicUrl": "http://localhost:9000/seo-media/2026/05/uuid.jpg",
      "originalName": "banner_home.jpg",
      "mimeType": "image/jpeg",
      "fileSize": 345678,
      "width": 1920,
      "height": 1080,
      "sortOrder": 0,
      "alt": "Home hero",
      "linkUrl": null,
      "createdAt": "2026-05-06T10:00:00.000Z",
      "updatedAt": "2026-05-06T10:00:00.000Z"
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

14) Get SEO media bucket media
- Purpose: list image/video objects directly from public `seo-media` MinIO bucket for admin selection UI.
- Endpoint: GET /seo-media/bucket/media?page=1&limit=20&mediaType=IMAGE&prefix=2026/06&search=home&sortBy=lastModified&sortOrder=desc
- Request:
  - Query params:
    - page: number, optional, default 1
    - limit: number, optional, default 10
    - mediaType: `IMAGE` | `VIDEO`, optional. If omitted, returns both images and videos.
    - prefix: string, optional. With `mediaType=IMAGE`, `2026/06` is normalized to `images/2026/06/`; with `mediaType=VIDEO`, it is normalized to `videos/2026/06/`.
    - search: string, optional, filters by objectKey/file name
    - sortBy: `lastModified` | `objectKey` | `fileName` | `fileSize`, optional
    - sortOrder: `asc` | `desc`, optional
- Response:
{
  "success": true,
  "message": "SEO media bucket media retrieved successfully",
  "data": [
    {
      "bucketName": "seo-media",
      "objectKey": "images/2026/05/uuid.webp",
      "fileName": "uuid.webp",
      "originalName": "uuid.webp",
      "publicUrl": "http://localhost:9000/seo-media/images/2026/05/uuid.webp",
      "mediaType": "IMAGE",
      "mimeType": "image/webp",
      "fileSize": 123456,
      "duration": null,
      "etag": "9b2cf535f27731c974343645a3985328",
      "lastModified": "2026-05-06T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
*/
