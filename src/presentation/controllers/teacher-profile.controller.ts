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
  CreateTeacherProfileDto,
  PaginationResponseDto,
  TeacherProfileListQueryDto,
  TeacherProfileResponseDto,
  UpdateTeacherProfileDto,
  PublicSeoSitemapQueryDto,
  PublicSeoSitemapResponseDto,
} from 'src/application/dtos'
import {
  CreateTeacherProfileUseCase,
  DeleteTeacherProfileUseCase,
  GetPublicSeoTeacherProfileBySlugUseCase,
  GetTeacherProfileByIdUseCase,
  GetTeacherProfileBySlugUseCase,
  GetTeacherProfilesUseCase,
  IncrementPublicTeacherProfileViewCountUseCase,
  UpdateTeacherProfileUseCase,
  GetPublicSeoTeacherSitemapUseCase,
} from 'src/application/use-cases/teacher-profile'
import { CurrentUser } from 'src/shared/decorators'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { Visibility } from 'src/shared/enums'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'

@Controller('teacher-profiles')
export class TeacherProfileController {
  constructor(
    private readonly createTeacherProfileUseCase: CreateTeacherProfileUseCase,
    private readonly getTeacherProfilesUseCase: GetTeacherProfilesUseCase,
    private readonly getTeacherProfileByIdUseCase: GetTeacherProfileByIdUseCase,
    private readonly getTeacherProfileBySlugUseCase: GetTeacherProfileBySlugUseCase,
    private readonly getPublicSeoTeacherProfileBySlugUseCase: GetPublicSeoTeacherProfileBySlugUseCase,
    private readonly incrementPublicTeacherProfileViewCountUseCase: IncrementPublicTeacherProfileViewCountUseCase,
    private readonly updateTeacherProfileUseCase: UpdateTeacherProfileUseCase,
    private readonly deleteTeacherProfileUseCase: DeleteTeacherProfileUseCase,
    private readonly getPublicSeoTeacherSitemapUseCase: GetPublicSeoTeacherSitemapUseCase,
  ) {}

  @Post()
  @RequirePermission()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTeacherProfileDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<TeacherProfileResponseDto>> {
    return ExceptionHandler.execute(() => this.createTeacherProfileUseCase.execute(dto, userId))
  }

  @Get()
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getList(
    @Query() query: TeacherProfileListQueryDto,
  ): Promise<PaginationResponseDto<TeacherProfileResponseDto>> {
    return ExceptionHandler.execute(() => this.getTeacherProfilesUseCase.execute(query))
  }

  @Get('public/seo')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoList(
    @Query() query: TeacherProfileListQueryDto,
  ): Promise<PaginationResponseDto<TeacherProfileResponseDto>> {
    query.visibility = Visibility.PUBLISHED
    return ExceptionHandler.execute(() => this.getTeacherProfilesUseCase.execute(query))
  }

  @Get('public/seo/sitemap')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoSitemap(@Query() query: PublicSeoSitemapQueryDto): Promise<PublicSeoSitemapResponseDto> {
    return ExceptionHandler.execute(() => this.getPublicSeoTeacherSitemapUseCase.execute(query))
  }

  @Post('public/seo/:slug/view')
  @HttpCode(HttpStatus.OK)
  async incrementPublicSeoViewCount(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<{ viewCount: number }>> {
    return ExceptionHandler.execute(() => this.incrementPublicTeacherProfileViewCountUseCase.execute(slug))
  }

  @Get('public/seo/:slug')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoBySlug(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<TeacherProfileResponseDto>> {
    return ExceptionHandler.execute(() => this.getPublicSeoTeacherProfileBySlugUseCase.execute(slug))
  }

  @Get('slug/:slug')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getBySlug(@Param('slug') slug: string): Promise<BaseResponseDto<TeacherProfileResponseDto>> {
    return ExceptionHandler.execute(() => this.getTeacherProfileBySlugUseCase.execute(slug))
  }

  @Get(':teacherProfileId')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getById(
    @Param('teacherProfileId', ParseIntPipe) teacherProfileId: number,
  ): Promise<BaseResponseDto<TeacherProfileResponseDto>> {
    return ExceptionHandler.execute(() => this.getTeacherProfileByIdUseCase.execute(teacherProfileId))
  }

  @Put(':teacherProfileId')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('teacherProfileId', ParseIntPipe) teacherProfileId: number,
    @Body() dto: UpdateTeacherProfileDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<TeacherProfileResponseDto>> {
    return ExceptionHandler.execute(() => this.updateTeacherProfileUseCase.execute(teacherProfileId, dto, userId))
  }

  @Delete(':teacherProfileId')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('teacherProfileId', ParseIntPipe) teacherProfileId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    return ExceptionHandler.execute(() => this.deleteTeacherProfileUseCase.execute(teacherProfileId))
  }
}

/*
TEACHER PROFILE API DOCUMENTATION

Base path: /api/teacher-profiles
Auth/permission:
- Admin CMS endpoints use @RequirePermission().
- Public SEO endpoints do not require auth.

Visibility values:
- DRAFT
- PRIVATE
- PUBLISHED

Common response object: TeacherProfileResponseDto
{
  "teacherProfileId": 1,
  "displayName": "Thay Nguyen Van A",
  "slug": "thay-nguyen-van-a",
  "profileImageMediaId": 123,
  "profileImageUrl": "https://cdn.example.com/teachers/thay-nguyen-van-a.webp",
  "scheduleImageMediaIds": [201, 202],
  "scheduleImageUrls": [
    "https://cdn.example.com/teachers/thay-nguyen-van-a-schedule-1.webp",
    "https://cdn.example.com/teachers/thay-nguyen-van-a-schedule-2.webp"
  ],
  "classroomImageMediaIds": [301, 302],
  "classroomImageUrls": [
    "https://cdn.example.com/teachers/thay-nguyen-van-a-classroom-1.webp",
    "https://cdn.example.com/teachers/thay-nguyen-van-a-classroom-2.webp"
  ],
  "headline": "Giao vien Toan THPT 10 nam kinh nghiem",
  "shortDescription": "Chuyen on thi THPT va boi duong hoc sinh gioi.",
  "bio": "Tieu su va hanh trinh giang day...",
  "expertise": "Dai so, giai tich, hinh hoc",
  "teachingSubjects": "Toan 10, Toan 11, Toan 12, On thi THPT",
  "gradeLevels": "10, 11, 12",
  "teachingFormats": "online, offline, nhom nho",
  "teachingMethods": "Day tu nen tang, theo sat tien do tung hoc sinh.",
  "yearsExperience": 10,
  "education": "Cu nhan Su pham Toan",
  "certifications": "Chung chi nghiep vu su pham",
  "achievements": "Nhieu hoc sinh dat 9+ THPT",
  "teachingArea": "TP.HCM, Toan quoc online",
  "workplace": "BEE Education",
  "contactEmail": "teacher@example.com",
  "contactPhone": "0900000000",
  "contactZalo": "0900000000",
  "contactFacebook": "https://facebook.com/teacher",
  "contactWebsite": "https://example.com",
  "contactAddress": "Quan 1, TP.HCM",
  "bookingUrl": "https://example.com/booking",
  "ctaLabel": "Dang ky hoc thu",
  "ctaUrl": "https://example.com/register",
  "targetKeyword": "giao vien toan lop 12",
  "keywordText": "gia su toan, giao vien toan thpt, on thi thpt mon toan",
  "metaTitle": "Thay Nguyen Van A - Giao vien Toan THPT",
  "metaDescription": "Ho so giao vien Toan THPT chuyen on thi va day online.",
  "ogTitle": "Thay Nguyen Van A",
  "ogDescription": "Giao vien Toan THPT 10 nam kinh nghiem.",
  "searchIntent": "teacher profile",
  "seoScore": 85,
  "visibility": "PUBLISHED",
  "isFeatured": true,
  "viewCount": 100,
  "sortOrder": 1,
  "createdBy": 10,
  "updatedBy": 10,
  "createdAt": "2026-05-24T10:00:00.000Z",
  "updatedAt": "2026-05-24T10:30:00.000Z"
}

1. Create teacher profile
URL: POST /api/teacher-profiles
Notes:
- Auth/permission required.
- slug tu sinh tu displayName.
- Client khong can truyen slug.
- profileImageMediaId la media anh dai dien giao vien, phai tro toi media IMAGE da READY.
- scheduleImageMediaIds la danh sach media anh lich hoc giao vien, moi media phai la IMAGE da READY.
- classroomImageMediaIds la danh sach media hinh anh lop hoc cua giao vien, moi media phai la IMAGE da READY.
- Neu slug bi trung, he thong tu them hau to -2, -3.
- Neu bo trong mot trong cac truong SEO: targetKeyword, keywordText, metaTitle, metaDescription, ogTitle, ogDescription, searchIntent, he thong se goi AI de sinh tu context teacher profile.
Request body:
{
  "displayName": "Thay Nguyen Van A",
  "profileImageMediaId": 123,
  "scheduleImageMediaIds": [201, 202],
  "classroomImageMediaIds": [301, 302],
  "headline": "Giao vien Toan THPT 10 nam kinh nghiem",
  "shortDescription": "Chuyen on thi THPT va boi duong hoc sinh gioi.",
  "bio": "Tieu su va hanh trinh giang day...",
  "expertise": "Dai so, giai tich, hinh hoc",
  "teachingSubjects": "Toan 10, Toan 11, Toan 12, On thi THPT",
  "gradeLevels": "10, 11, 12",
  "teachingFormats": "online, offline, nhom nho",
  "teachingMethods": "Day tu nen tang, theo sat tien do tung hoc sinh.",
  "yearsExperience": 10,
  "education": "Cu nhan Su pham Toan",
  "certifications": "Chung chi nghiep vu su pham",
  "achievements": "Nhieu hoc sinh dat 9+ THPT",
  "teachingArea": "TP.HCM, Toan quoc online",
  "workplace": "BEE Education",
  "contactEmail": "teacher@example.com",
  "contactPhone": "0900000000",
  "contactZalo": "0900000000",
  "contactFacebook": "https://facebook.com/teacher",
  "contactWebsite": "https://example.com",
  "contactAddress": "Quan 1, TP.HCM",
  "bookingUrl": "https://example.com/booking",
  "ctaLabel": "Dang ky hoc thu",
  "ctaUrl": "https://example.com/register",
  "targetKeyword": "giao vien toan lop 12",
  "keywordText": "gia su toan, giao vien toan thpt, on thi thpt mon toan",
  "metaTitle": "Thay Nguyen Van A - Giao vien Toan THPT",
  "metaDescription": "Ho so giao vien Toan THPT chuyen on thi va day online.",
  "ogTitle": "Thay Nguyen Van A",
  "ogDescription": "Giao vien Toan THPT 10 nam kinh nghiem.",
  "searchIntent": "teacher profile",
  "seoScore": 85,
  "visibility": "DRAFT",
  "isFeatured": true,
  "sortOrder": 1
}

Response 201:
{
  "success": true,
  "message": "Tao ho so giao vien thanh cong",
  "data": {
    "teacherProfileId": 1,
    "displayName": "Thay Nguyen Van A",
    "slug": "thay-nguyen-van-a",
    "profileImageMediaId": 123,
    "profileImageUrl": "https://cdn.example.com/teachers/thay-nguyen-van-a.webp",
    "scheduleImageMediaIds": [201, 202],
    "scheduleImageUrls": [
      "https://cdn.example.com/teachers/thay-nguyen-van-a-schedule-1.webp",
      "https://cdn.example.com/teachers/thay-nguyen-van-a-schedule-2.webp"
    ],
    "classroomImageMediaIds": [301, 302],
    "classroomImageUrls": [
      "https://cdn.example.com/teachers/thay-nguyen-van-a-classroom-1.webp",
      "https://cdn.example.com/teachers/thay-nguyen-van-a-classroom-2.webp"
    ],
    "headline": "Giao vien Toan THPT 10 nam kinh nghiem",
    "shortDescription": "Chuyen on thi THPT va boi duong hoc sinh gioi.",
    "bio": "Tieu su va hanh trinh giang day...",
    "expertise": "Dai so, giai tich, hinh hoc",
    "teachingSubjects": "Toan 10, Toan 11, Toan 12, On thi THPT",
    "gradeLevels": "10, 11, 12",
    "teachingFormats": "online, offline, nhom nho",
    "teachingMethods": "Day tu nen tang, theo sat tien do tung hoc sinh.",
    "yearsExperience": 10,
    "education": "Cu nhan Su pham Toan",
    "certifications": "Chung chi nghiep vu su pham",
    "achievements": "Nhieu hoc sinh dat 9+ THPT",
    "teachingArea": "TP.HCM, Toan quoc online",
    "workplace": "BEE Education",
    "contactEmail": "teacher@example.com",
    "contactPhone": "0900000000",
    "contactZalo": "0900000000",
    "contactFacebook": "https://facebook.com/teacher",
    "contactWebsite": "https://example.com",
    "contactAddress": "Quan 1, TP.HCM",
    "bookingUrl": "https://example.com/booking",
    "ctaLabel": "Dang ky hoc thu",
    "ctaUrl": "https://example.com/register",
    "targetKeyword": "giao vien toan lop 12",
    "keywordText": "gia su toan, giao vien toan thpt, on thi thpt mon toan",
    "metaTitle": "Thay Nguyen Van A - Giao vien Toan THPT",
    "metaDescription": "Ho so giao vien Toan THPT chuyen on thi va day online.",
    "ogTitle": "Thay Nguyen Van A",
    "ogDescription": "Giao vien Toan THPT 10 nam kinh nghiem.",
    "searchIntent": "teacher profile",
    "seoScore": 85,
    "visibility": "DRAFT",
    "isFeatured": true,
    "viewCount": 0,
    "sortOrder": 1,
    "createdBy": 10,
    "updatedBy": 10,
    "createdAt": "2026-05-24T10:00:00.000Z",
    "updatedAt": "2026-05-24T10:00:00.000Z"
  }
}

2. Get admin list
URL: GET /api/teacher-profiles?page=1&limit=10&search=toan&visibility=PUBLISHED&isFeatured=true&sortBy=sortOrder&sortOrder=asc
Notes:
- Auth/permission required.
- Dung cho trang quan tri danh sach ho so giao vien.
- Moi item tra ve profileImageUrl neu ho so co anh dai dien san sang.
Query params:
- page: number, default 1
- limit: number, default 10
- search: string, tim theo displayName, slug, headline, bio, expertise, teachingSubjects, SEO fields
- visibility: DRAFT | PRIVATE | PUBLISHED
- isFeatured: boolean
- sortBy: teacherProfileId | displayName | slug | visibility | isFeatured | viewCount | sortOrder | createdAt | updatedAt
- sortOrder: asc | desc

Response 200:
{
  "success": true,
  "message": "Lay danh sach ho so giao vien thanh cong",
  "data": [
    {
      "teacherProfileId": 1,
      "displayName": "Thay Nguyen Van A",
      "slug": "thay-nguyen-van-a",
      "headline": "Giao vien Toan THPT 10 nam kinh nghiem",
      "shortDescription": "Chuyen on thi THPT va boi duong hoc sinh gioi.",
      "bio": "Tieu su va hanh trinh giang day...",
      "expertise": "Dai so, giai tich, hinh hoc",
      "teachingSubjects": "Toan 10, Toan 11, Toan 12, On thi THPT",
      "gradeLevels": "10, 11, 12",
      "teachingFormats": "online, offline, nhom nho",
      "teachingMethods": "Day tu nen tang, theo sat tien do tung hoc sinh.",
      "yearsExperience": 10,
      "education": "Cu nhan Su pham Toan",
      "certifications": "Chung chi nghiep vu su pham",
      "achievements": "Nhieu hoc sinh dat 9+ THPT",
      "teachingArea": "TP.HCM, Toan quoc online",
      "workplace": "BEE Education",
      "contactEmail": "teacher@example.com",
      "contactPhone": "0900000000",
      "contactZalo": "0900000000",
      "contactFacebook": "https://facebook.com/teacher",
      "contactWebsite": "https://example.com",
      "contactAddress": "Quan 1, TP.HCM",
      "bookingUrl": "https://example.com/booking",
      "ctaLabel": "Dang ky hoc thu",
      "ctaUrl": "https://example.com/register",
      "targetKeyword": "giao vien toan lop 12",
      "keywordText": "gia su toan, giao vien toan thpt, on thi thpt mon toan",
      "metaTitle": "Thay Nguyen Van A - Giao vien Toan THPT",
      "metaDescription": "Ho so giao vien Toan THPT chuyen on thi va day online.",
      "ogTitle": "Thay Nguyen Van A",
      "ogDescription": "Giao vien Toan THPT 10 nam kinh nghiem.",
      "searchIntent": "teacher profile",
      "seoScore": 85,
      "visibility": "PUBLISHED",
      "isFeatured": true,
      "viewCount": 100,
      "sortOrder": 1,
      "createdBy": 10,
      "updatedBy": 10,
      "createdAt": "2026-05-24T10:00:00.000Z",
      "updatedAt": "2026-05-24T10:30:00.000Z"
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

3. Get public SEO list
URL: GET /api/teacher-profiles/public/seo?page=1&limit=10&search=toan&isFeatured=true
Notes:
- No auth.
- Always visibility = PUBLISHED.
- Dung cho trang public SEO danh sach giao vien.
- Moi item tra ve profileImageUrl neu ho so co anh dai dien san sang.
Query params:
- page: number, default 1
- limit: number, default 10
- search: string
- isFeatured: boolean
- sortBy: teacherProfileId | displayName | slug | visibility | isFeatured | viewCount | sortOrder | createdAt | updatedAt
- sortOrder: asc | desc

Response 200:
{
  "success": true,
  "message": "Lay danh sach ho so giao vien thanh cong",
  "data": [
    {
      "teacherProfileId": 1,
      "displayName": "Thay Nguyen Van A",
      "slug": "thay-nguyen-van-a",
      "headline": "Giao vien Toan THPT 10 nam kinh nghiem",
      "shortDescription": "Chuyen on thi THPT va boi duong hoc sinh gioi.",
      "bio": "Tieu su va hanh trinh giang day...",
      "expertise": "Dai so, giai tich, hinh hoc",
      "teachingSubjects": "Toan 10, Toan 11, Toan 12, On thi THPT",
      "gradeLevels": "10, 11, 12",
      "teachingFormats": "online, offline, nhom nho",
      "teachingMethods": "Day tu nen tang, theo sat tien do tung hoc sinh.",
      "yearsExperience": 10,
      "education": "Cu nhan Su pham Toan",
      "certifications": "Chung chi nghiep vu su pham",
      "achievements": "Nhieu hoc sinh dat 9+ THPT",
      "teachingArea": "TP.HCM, Toan quoc online",
      "workplace": "BEE Education",
      "contactEmail": "teacher@example.com",
      "contactPhone": "0900000000",
      "contactZalo": "0900000000",
      "contactFacebook": "https://facebook.com/teacher",
      "contactWebsite": "https://example.com",
      "contactAddress": "Quan 1, TP.HCM",
      "bookingUrl": "https://example.com/booking",
      "ctaLabel": "Dang ky hoc thu",
      "ctaUrl": "https://example.com/register",
      "targetKeyword": "giao vien toan lop 12",
      "keywordText": "gia su toan, giao vien toan thpt, on thi thpt mon toan",
      "metaTitle": "Thay Nguyen Van A - Giao vien Toan THPT",
      "metaDescription": "Ho so giao vien Toan THPT chuyen on thi va day online.",
      "ogTitle": "Thay Nguyen Van A",
      "ogDescription": "Giao vien Toan THPT 10 nam kinh nghiem.",
      "searchIntent": "teacher profile",
      "seoScore": 85,
      "visibility": "PUBLISHED",
      "isFeatured": true,
      "viewCount": 100,
      "sortOrder": 1,
      "createdBy": 10,
      "updatedBy": 10,
      "createdAt": "2026-05-24T10:00:00.000Z",
      "updatedAt": "2026-05-24T10:30:00.000Z"
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

4. Get public SEO detail
URL: GET /api/teacher-profiles/public/seo/thay-nguyen-van-a
Notes:
- No auth.
- Only returns PUBLISHED profile.
- Tra ve profileImageUrl, scheduleImageUrls va classroomImageUrls neu ho so co media anh san sang.
Path params:
- slug: string

Response 200:
{
  "success": true,
  "message": "Lay ho so giao vien thanh cong",
  "data": {
    "teacherProfileId": 1,
    "displayName": "Thay Nguyen Van A",
    "slug": "thay-nguyen-van-a",
    "headline": "Giao vien Toan THPT 10 nam kinh nghiem",
    "shortDescription": "Chuyen on thi THPT va boi duong hoc sinh gioi.",
    "bio": "Tieu su va hanh trinh giang day...",
    "expertise": "Dai so, giai tich, hinh hoc",
    "teachingSubjects": "Toan 10, Toan 11, Toan 12, On thi THPT",
    "gradeLevels": "10, 11, 12",
    "teachingFormats": "online, offline, nhom nho",
    "teachingMethods": "Day tu nen tang, theo sat tien do tung hoc sinh.",
    "yearsExperience": 10,
    "education": "Cu nhan Su pham Toan",
    "certifications": "Chung chi nghiep vu su pham",
    "achievements": "Nhieu hoc sinh dat 9+ THPT",
    "teachingArea": "TP.HCM, Toan quoc online",
    "workplace": "BEE Education",
    "contactEmail": "teacher@example.com",
    "contactPhone": "0900000000",
    "contactZalo": "0900000000",
    "contactFacebook": "https://facebook.com/teacher",
    "contactWebsite": "https://example.com",
    "contactAddress": "Quan 1, TP.HCM",
    "bookingUrl": "https://example.com/booking",
    "ctaLabel": "Dang ky hoc thu",
    "ctaUrl": "https://example.com/register",
    "targetKeyword": "giao vien toan lop 12",
    "keywordText": "gia su toan, giao vien toan thpt, on thi thpt mon toan",
    "metaTitle": "Thay Nguyen Van A - Giao vien Toan THPT",
    "metaDescription": "Ho so giao vien Toan THPT chuyen on thi va day online.",
    "ogTitle": "Thay Nguyen Van A",
    "ogDescription": "Giao vien Toan THPT 10 nam kinh nghiem.",
    "searchIntent": "teacher profile",
    "seoScore": 85,
    "visibility": "PUBLISHED",
    "isFeatured": true,
    "viewCount": 100,
    "sortOrder": 1,
    "createdBy": 10,
    "updatedBy": 10,
    "createdAt": "2026-05-24T10:00:00.000Z",
    "updatedAt": "2026-05-24T10:30:00.000Z"
  }
}

5. Increment public view count
URL: POST /api/teacher-profiles/public/seo/thay-nguyen-van-a/view
Notes:
- No auth.
- Only increments if profile visibility = PUBLISHED.
Path params:
- slug: string
Request body: none

Response 200:
{
  "success": true,
  "message": "Tang luot xem ho so giao vien thanh cong",
  "data": {
    "viewCount": 101
  }
}

6. Get admin detail by slug
URL: GET /api/teacher-profiles/slug/thay-nguyen-van-a
Notes:
- Auth/permission required.
- Returns profile regardless of visibility.
- Tra ve profileImageUrl, scheduleImageUrls va classroomImageUrls neu ho so co media anh san sang.
Path params:
- slug: string

Response 200:
{
  "success": true,
  "message": "Lay ho so giao vien thanh cong",
  "data": {
    "teacherProfileId": 1,
    "displayName": "Thay Nguyen Van A",
    "slug": "thay-nguyen-van-a",
    "headline": "Giao vien Toan THPT 10 nam kinh nghiem",
    "shortDescription": "Chuyen on thi THPT va boi duong hoc sinh gioi.",
    "bio": "Tieu su va hanh trinh giang day...",
    "expertise": "Dai so, giai tich, hinh hoc",
    "teachingSubjects": "Toan 10, Toan 11, Toan 12, On thi THPT",
    "gradeLevels": "10, 11, 12",
    "teachingFormats": "online, offline, nhom nho",
    "teachingMethods": "Day tu nen tang, theo sat tien do tung hoc sinh.",
    "yearsExperience": 10,
    "education": "Cu nhan Su pham Toan",
    "certifications": "Chung chi nghiep vu su pham",
    "achievements": "Nhieu hoc sinh dat 9+ THPT",
    "teachingArea": "TP.HCM, Toan quoc online",
    "workplace": "BEE Education",
    "contactEmail": "teacher@example.com",
    "contactPhone": "0900000000",
    "contactZalo": "0900000000",
    "contactFacebook": "https://facebook.com/teacher",
    "contactWebsite": "https://example.com",
    "contactAddress": "Quan 1, TP.HCM",
    "bookingUrl": "https://example.com/booking",
    "ctaLabel": "Dang ky hoc thu",
    "ctaUrl": "https://example.com/register",
    "targetKeyword": "giao vien toan lop 12",
    "keywordText": "gia su toan, giao vien toan thpt, on thi thpt mon toan",
    "metaTitle": "Thay Nguyen Van A - Giao vien Toan THPT",
    "metaDescription": "Ho so giao vien Toan THPT chuyen on thi va day online.",
    "ogTitle": "Thay Nguyen Van A",
    "ogDescription": "Giao vien Toan THPT 10 nam kinh nghiem.",
    "searchIntent": "teacher profile",
    "seoScore": 85,
    "visibility": "PRIVATE",
    "isFeatured": true,
    "viewCount": 100,
    "sortOrder": 1,
    "createdBy": 10,
    "updatedBy": 10,
    "createdAt": "2026-05-24T10:00:00.000Z",
    "updatedAt": "2026-05-24T10:30:00.000Z"
  }
}

7. Get admin detail by id
URL: GET /api/teacher-profiles/1
Notes:
- Auth/permission required.
- Returns profile regardless of visibility.
- Tra ve profileImageUrl, scheduleImageUrls va classroomImageUrls neu ho so co media anh san sang.
Path params:
- teacherProfileId: number

Response 200:
{
  "success": true,
  "message": "Lay ho so giao vien thanh cong",
  "data": {
    "teacherProfileId": 1,
    "displayName": "Thay Nguyen Van A",
    "slug": "thay-nguyen-van-a",
    "headline": "Giao vien Toan THPT 10 nam kinh nghiem",
    "shortDescription": "Chuyen on thi THPT va boi duong hoc sinh gioi.",
    "bio": "Tieu su va hanh trinh giang day...",
    "expertise": "Dai so, giai tich, hinh hoc",
    "teachingSubjects": "Toan 10, Toan 11, Toan 12, On thi THPT",
    "gradeLevels": "10, 11, 12",
    "teachingFormats": "online, offline, nhom nho",
    "teachingMethods": "Day tu nen tang, theo sat tien do tung hoc sinh.",
    "yearsExperience": 10,
    "education": "Cu nhan Su pham Toan",
    "certifications": "Chung chi nghiep vu su pham",
    "achievements": "Nhieu hoc sinh dat 9+ THPT",
    "teachingArea": "TP.HCM, Toan quoc online",
    "workplace": "BEE Education",
    "contactEmail": "teacher@example.com",
    "contactPhone": "0900000000",
    "contactZalo": "0900000000",
    "contactFacebook": "https://facebook.com/teacher",
    "contactWebsite": "https://example.com",
    "contactAddress": "Quan 1, TP.HCM",
    "bookingUrl": "https://example.com/booking",
    "ctaLabel": "Dang ky hoc thu",
    "ctaUrl": "https://example.com/register",
    "targetKeyword": "giao vien toan lop 12",
    "keywordText": "gia su toan, giao vien toan thpt, on thi thpt mon toan",
    "metaTitle": "Thay Nguyen Van A - Giao vien Toan THPT",
    "metaDescription": "Ho so giao vien Toan THPT chuyen on thi va day online.",
    "ogTitle": "Thay Nguyen Van A",
    "ogDescription": "Giao vien Toan THPT 10 nam kinh nghiem.",
    "searchIntent": "teacher profile",
    "seoScore": 85,
    "visibility": "DRAFT",
    "isFeatured": true,
    "viewCount": 100,
    "sortOrder": 1,
    "createdBy": 10,
    "updatedBy": 10,
    "createdAt": "2026-05-24T10:00:00.000Z",
    "updatedAt": "2026-05-24T10:30:00.000Z"
  }
}

8. Update teacher profile
URL: PUT /api/teacher-profiles/1
Notes:
- Auth/permission required.
- Khong nhan slug tu client.
- Neu sua displayName, he thong tu sinh lai slug va tu xu ly trung lap.
- Neu truyen profileImageMediaId moi, he thong go anh dai dien cu va gan anh dai dien moi.
- Neu truyen scheduleImageMediaIds, he thong dong bo theo danh sach moi: media khong con trong list se bi go, list rong se go tat ca anh lich hoc.
- Neu truyen classroomImageMediaIds, he thong dong bo theo danh sach moi: media khong con trong list se bi go, list rong se go tat ca hinh anh lop hoc.
Path params:
- teacherProfileId: number
Request body:
{
  "displayName": "Thay Nguyen Van A Updated",
  "profileImageMediaId": 789,
  "scheduleImageMediaIds": [901, 902],
  "classroomImageMediaIds": [903, 904],
  "headline": "Giao vien Toan THPT va on thi THPT",
  "shortDescription": "Chuyen day Toan THPT theo lo trinh ca nhan hoa.",
  "bio": "Noi dung tieu su cap nhat...",
  "expertise": "Dai so, giai tich, on thi THPT",
  "teachingSubjects": "Toan 11, Toan 12, On thi THPT",
  "gradeLevels": "11, 12",
  "teachingFormats": "online, offline",
  "teachingMethods": "Kiem tra dau vao, lap lo trinh, theo sat bai tap hang tuan.",
  "yearsExperience": 11,
  "education": "Thac si Toan hoc",
  "certifications": "Chung chi nghiep vu su pham",
  "achievements": "Nhieu hoc sinh dat diem cao trong ky thi THPT",
  "teachingArea": "TP.HCM",
  "workplace": "BEE Education",
  "contactEmail": "teacher.updated@example.com",
  "contactPhone": "0911111111",
  "contactZalo": "0911111111",
  "contactFacebook": "https://facebook.com/teacher-updated",
  "contactWebsite": "https://teacher.example.com",
  "contactAddress": "Quan 3, TP.HCM",
  "bookingUrl": "https://example.com/booking-updated",
  "ctaLabel": "Dat lich tu van",
  "ctaUrl": "https://example.com/consulting",
  "targetKeyword": "giao vien on thi thpt mon toan",
  "keywordText": "giao vien toan thpt, luyen thi thpt mon toan, hoc toan online",
  "metaTitle": "Giao vien on thi THPT mon Toan",
  "metaDescription": "Ho so giao vien on thi THPT mon Toan, day online va offline theo lo trinh ca nhan hoa.",
  "ogTitle": "Giao vien on thi THPT mon Toan",
  "ogDescription": "Thong tin giao vien, kinh nghiem, thanh tich va cach lien he.",
  "searchIntent": "exam prep",
  "seoScore": 90,
  "visibility": "PUBLISHED",
  "isFeatured": true,
  "sortOrder": 2
}

Response 200:
{
  "success": true,
  "message": "Cap nhat ho so giao vien thanh cong",
  "data": {
    "teacherProfileId": 1,
    "displayName": "Thay Nguyen Van A Updated",
    "slug": "thay-nguyen-van-a-updated",
    "profileImageMediaId": 789,
    "profileImageUrl": "https://cdn.example.com/teachers/thay-nguyen-van-a-updated.webp",
    "headline": "Giao vien Toan THPT va on thi THPT",
    "shortDescription": "Chuyen day Toan THPT theo lo trinh ca nhan hoa.",
    "bio": "Noi dung tieu su cap nhat...",
    "expertise": "Dai so, giai tich, on thi THPT",
    "teachingSubjects": "Toan 11, Toan 12, On thi THPT",
    "gradeLevels": "11, 12",
    "teachingFormats": "online, offline",
    "teachingMethods": "Kiem tra dau vao, lap lo trinh, theo sat bai tap hang tuan.",
    "yearsExperience": 11,
    "education": "Thac si Toan hoc",
    "certifications": "Chung chi nghiep vu su pham",
    "achievements": "Nhieu hoc sinh dat diem cao trong ky thi THPT",
    "teachingArea": "TP.HCM",
    "workplace": "BEE Education",
    "contactEmail": "teacher.updated@example.com",
    "contactPhone": "0911111111",
    "contactZalo": "0911111111",
    "contactFacebook": "https://facebook.com/teacher-updated",
    "contactWebsite": "https://teacher.example.com",
    "contactAddress": "Quan 3, TP.HCM",
    "bookingUrl": "https://example.com/booking-updated",
    "ctaLabel": "Dat lich tu van",
    "ctaUrl": "https://example.com/consulting",
    "targetKeyword": "giao vien on thi thpt mon toan",
    "keywordText": "giao vien toan thpt, luyen thi thpt mon toan, hoc toan online",
    "metaTitle": "Giao vien on thi THPT mon Toan",
    "metaDescription": "Ho so giao vien on thi THPT mon Toan, day online va offline theo lo trinh ca nhan hoa.",
    "ogTitle": "Giao vien on thi THPT mon Toan",
    "ogDescription": "Thong tin giao vien, kinh nghiem, thanh tich va cach lien he.",
    "searchIntent": "exam prep",
    "seoScore": 90,
    "visibility": "PUBLISHED",
    "isFeatured": true,
    "viewCount": 100,
    "sortOrder": 2,
    "createdBy": 10,
    "updatedBy": 10,
    "createdAt": "2026-05-24T10:00:00.000Z",
    "updatedAt": "2026-05-24T11:00:00.000Z"
  }
}

9. Delete teacher profile
URL: DELETE /api/teacher-profiles/1
Notes:
- Auth/permission required.
Path params:
- teacherProfileId: number
Request body: none

Response 200:
{
  "success": true,
  "message": "Xoa ho so giao vien thanh cong",
  "data": {
    "deleted": true,
    "message": "Xoa ho so giao vien thanh cong"
  }
}
*/
