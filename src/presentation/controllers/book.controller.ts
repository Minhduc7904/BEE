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
  BookCategoryDto,
  BookListQueryDto,
  BookResponseDto,
  BookSalesContactResponseDto,
  CreateBookCategoryDto,
  CreateBookDto,
  PaginationResponseDto,
  PublicSeoSitemapQueryDto,
  PublicSeoSitemapResponseDto,
  StudentBookListQueryDto,
  UpdateBookCategoryDto,
  UpdateBookDto,
  UpdateBookMediaDto,
  UpdateBookSalesContactDto,
} from 'src/application/dtos'
import {
  CreateBookCategoryUseCase,
  CreateBookUseCase,
  DeleteBookCategoryUseCase,
  DeleteBookUseCase,
  GetBookByIdUseCase,
  GetBookCategoriesUseCase,
  GetBooksUseCase,
  GetBookSalesContactConfigurationUseCase,
  GetStudentBookBySlugUseCase,
  GetStudentBookCategoriesUseCase,
  GetStudentBooksUseCase,
  GetPublicSeoBookBySlugUseCase,
  GetPublicSeoBookSitemapUseCase,
  IncrementStudentBookViewCountUseCase,
  IncrementPublicBookViewCountUseCase,
  UpdateBookCategoryUseCase,
  UpdateBookSalesContactConfigurationUseCase,
  UpdateBookMediaUseCase,
  UpdateBookUseCase,
} from 'src/application/use-cases/book'
import { PERMISSION_CODES } from 'src/shared/constants/permissions/permission.codes'
import { CurrentUser } from 'src/shared/decorators'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { StudentOnly } from 'src/shared/decorators/permission.decorator'
import { Visibility } from 'src/shared/enums'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'

@Controller('books')
export class BookController {
  constructor(
    private readonly createBookUseCase: CreateBookUseCase,
    private readonly updateBookUseCase: UpdateBookUseCase,
    private readonly updateBookMediaUseCase: UpdateBookMediaUseCase,
    private readonly deleteBookUseCase: DeleteBookUseCase,
    private readonly getBooksUseCase: GetBooksUseCase,
    private readonly getBookByIdUseCase: GetBookByIdUseCase,
    private readonly getStudentBooksUseCase: GetStudentBooksUseCase,
    private readonly getStudentBookBySlugUseCase: GetStudentBookBySlugUseCase,
    private readonly getStudentBookCategoriesUseCase: GetStudentBookCategoriesUseCase,
    private readonly getPublicSeoBookBySlugUseCase: GetPublicSeoBookBySlugUseCase,
    private readonly getPublicSeoBookSitemapUseCase: GetPublicSeoBookSitemapUseCase,
    private readonly incrementStudentBookViewCountUseCase: IncrementStudentBookViewCountUseCase,
    private readonly incrementPublicBookViewCountUseCase: IncrementPublicBookViewCountUseCase,
    private readonly createBookCategoryUseCase: CreateBookCategoryUseCase,
    private readonly updateBookCategoryUseCase: UpdateBookCategoryUseCase,
    private readonly deleteBookCategoryUseCase: DeleteBookCategoryUseCase,
    private readonly getBookCategoriesUseCase: GetBookCategoriesUseCase,
    private readonly getBookSalesContactConfigurationUseCase: GetBookSalesContactConfigurationUseCase,
    private readonly updateBookSalesContactConfigurationUseCase: UpdateBookSalesContactConfigurationUseCase,
  ) {}

  @Get('public/seo/sitemap')
  async sitemap(@Query() query: PublicSeoSitemapQueryDto): Promise<PublicSeoSitemapResponseDto> {
    return ExceptionHandler.execute(() => this.getPublicSeoBookSitemapUseCase.execute(query))
  }

  @Get('public/seo/categories')
  async publicCategories(): Promise<BaseResponseDto<BookCategoryDto[]>> {
    return ExceptionHandler.execute(() => this.getBookCategoriesUseCase.execute(true))
  }

  @Get('public/seo')
  async publicList(@Query() query: BookListQueryDto): Promise<PaginationResponseDto<BookResponseDto>> {
    query.visibility = Visibility.PUBLISHED
    return ExceptionHandler.execute(() => this.getBooksUseCase.execute(query))
  }

  @Post('public/seo/:slug/view')
  async view(@Param('slug') slug: string): Promise<BaseResponseDto<{ viewCount: number }>> {
    return ExceptionHandler.execute(() => this.incrementPublicBookViewCountUseCase.execute(slug))
  }

  @Get('public/seo/:slug')
  async publicDetail(@Param('slug') slug: string): Promise<BaseResponseDto<BookResponseDto>> {
    return ExceptionHandler.execute(() => this.getPublicSeoBookBySlugUseCase.execute(slug))
  }

  @Get('student/my/categories')
  @StudentOnly()
  @HttpCode(HttpStatus.OK)
  async studentCategories(@CurrentUser('studentId') studentId: number): Promise<BaseResponseDto<BookCategoryDto[]>> {
    return ExceptionHandler.execute(() => this.getStudentBookCategoriesUseCase.execute(studentId))
  }

  @Get('student/my')
  @StudentOnly()
  @HttpCode(HttpStatus.OK)
  async studentList(
    @CurrentUser('studentId') studentId: number,
    @Query() query: StudentBookListQueryDto,
  ): Promise<PaginationResponseDto<BookResponseDto>> {
    return ExceptionHandler.execute(() => this.getStudentBooksUseCase.execute(studentId, query))
  }

  @Post('student/my/:slug/view')
  @StudentOnly()
  @HttpCode(HttpStatus.OK)
  async studentView(
    @CurrentUser('studentId') studentId: number,
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<{ viewCount: number }>> {
    return ExceptionHandler.execute(() => this.incrementStudentBookViewCountUseCase.execute(studentId, slug))
  }

  @Get('student/my/:slug')
  @StudentOnly()
  @HttpCode(HttpStatus.OK)
  async studentDetail(
    @CurrentUser('studentId') studentId: number,
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<BookResponseDto>> {
    return ExceptionHandler.execute(() => this.getStudentBookBySlugUseCase.execute(studentId, slug))
  }

  @Post('categories')
  @RequirePermission(PERMISSION_CODES.BOOK_CATEGORY.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @Body() dto: CreateBookCategoryDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<BookCategoryDto>> {
    return ExceptionHandler.execute(() => this.createBookCategoryUseCase.execute(dto, adminId))
  }

  @Get('categories')
  @RequirePermission(PERMISSION_CODES.BOOK_CATEGORY.GET_ALL)
  async categories(): Promise<BaseResponseDto<BookCategoryDto[]>> {
    return ExceptionHandler.execute(() => this.getBookCategoriesUseCase.execute())
  }

  @Put('categories/:bookCategoryId')
  @RequirePermission(PERMISSION_CODES.BOOK_CATEGORY.UPDATE)
  async updateCategory(
    @Param('bookCategoryId', ParseIntPipe) id: number,
    @Body() dto: UpdateBookCategoryDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<BookCategoryDto>> {
    return ExceptionHandler.execute(() => this.updateBookCategoryUseCase.execute(id, dto, adminId))
  }

  @Delete('categories/:bookCategoryId')
  @RequirePermission(PERMISSION_CODES.BOOK_CATEGORY.DELETE)
  async deleteCategory(
    @Param('bookCategoryId', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<{ deleted: true }>> {
    return ExceptionHandler.execute(() => this.deleteBookCategoryUseCase.execute(id, adminId))
  }

  @Get('sales-contact-configuration')
  @RequirePermission(PERMISSION_CODES.BOOK_SALES_CONTACT_CONFIGURATION.GET)
  async contactConfiguration(): Promise<BaseResponseDto<BookSalesContactResponseDto>> {
    return ExceptionHandler.execute(() => this.getBookSalesContactConfigurationUseCase.execute())
  }

  @Put('sales-contact-configuration')
  @RequirePermission(PERMISSION_CODES.BOOK_SALES_CONTACT_CONFIGURATION.UPDATE)
  async updateContactConfiguration(
    @Body() dto: UpdateBookSalesContactDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<BookSalesContactResponseDto>> {
    return ExceptionHandler.execute(() => this.updateBookSalesContactConfigurationUseCase.execute(dto, adminId))
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.BOOK.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateBookDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<BookResponseDto>> {
    return ExceptionHandler.execute(() => this.createBookUseCase.execute(dto, adminId))
  }

  @Get()
  @RequirePermission(PERMISSION_CODES.BOOK.GET_ALL)
  async list(@Query() query: BookListQueryDto): Promise<PaginationResponseDto<BookResponseDto>> {
    return ExceptionHandler.execute(() => this.getBooksUseCase.execute(query))
  }

  @Get(':bookId')
  @RequirePermission(PERMISSION_CODES.BOOK.GET_BY_ID)
  async detail(@Param('bookId', ParseIntPipe) id: number): Promise<BaseResponseDto<BookResponseDto>> {
    return ExceptionHandler.execute(() => this.getBookByIdUseCase.execute(id))
  }

  @Put(':bookId')
  @RequirePermission(PERMISSION_CODES.BOOK.UPDATE)
  async update(
    @Param('bookId', ParseIntPipe) id: number,
    @Body() dto: UpdateBookDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<BookResponseDto>> {
    return ExceptionHandler.execute(() => this.updateBookUseCase.execute(id, dto, adminId))
  }

  @Put(':bookId/media')
  @RequirePermission(PERMISSION_CODES.BOOK.UPDATE)
  async updateMedia(
    @Param('bookId', ParseIntPipe) id: number,
    @Body() dto: UpdateBookMediaDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<BookResponseDto>> {
    return ExceptionHandler.execute(() => this.updateBookMediaUseCase.execute(id, dto, adminId))
  }

  @Delete(':bookId')
  @RequirePermission(PERMISSION_CODES.BOOK.DELETE)
  async delete(
    @Param('bookId', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<{ deleted: true }>> {
    return ExceptionHandler.execute(() => this.deleteBookUseCase.execute(id, adminId))
  }
}
