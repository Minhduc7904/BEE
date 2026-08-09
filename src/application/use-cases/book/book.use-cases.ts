import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  BaseResponseDto,
  BookListQueryDto,
  BookResponseDto,
  CreateBookDto,
  PaginationResponseDto,
  UpdateBookDto,
} from 'src/application/dtos'
import { MinioService } from 'src/application/interfaces'
import type { IUnitOfWork, UnitOfWorkRepos } from 'src/domain/repositories'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus, MediaStatus, Visibility } from 'src/shared/enums'
import { ConflictException, BusinessLogicException } from 'src/shared/exceptions/custom-exceptions'
import { slugifyBook } from './book.util'
import { attachBookMedia, attachBookMediaToResponses, syncBookMedia } from './book-media.helper'

@Injectable()
export class CreateBookUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(dto: CreateBookDto, adminId: number): Promise<BaseResponseDto<BookResponseDto>> {
    const created = await this.unitOfWork.executeInTransaction(async (repos) => {
      await validateBookInput(repos, dto, undefined)
      const {
        coverMediaId: _coverMediaId,
        ogImageMediaId: _ogImageMediaId,
        galleryMediaIds: _galleryMediaIds,
        ...bookData
      } = dto
      const book = await repos.bookRepository.create({
        ...bookData,
        slug: await resolveBookSlug(repos, dto.slug, dto.title),
      })
      await syncBookMedia(repos, book.bookId, dto, adminId)
      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.BOOK.CREATE,
        resourceType: RESOURCE_TYPES.BOOK,
        resourceId: String(book.bookId),
        status: AuditStatus.SUCCESS,
        afterData: { sku: book.sku, title: book.title },
      })
      return book
    })
    const response = BookResponseDto.fromEntity(created)
    await attachBookMedia(this.unitOfWork, this.minioService, response)
    return BaseResponseDto.success('Tạo sách thành công', response)
  }
}

@Injectable()
export class UpdateBookUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(bookId: number, dto: UpdateBookDto, adminId: number): Promise<BaseResponseDto<BookResponseDto>> {
    const updated = await this.unitOfWork.executeInTransaction(async (repos) => {
      const current = await repos.bookRepository.findById(bookId, { includeCategories: true })
      if (!current) throw new NotFoundException('Không tìm thấy sách')
      await validateBookInput(
        repos,
        dto,
        bookId,
        current.visibility,
        current.categories?.map((category) => category.bookCategoryId),
      )
      const {
        coverMediaId: _coverMediaId,
        ogImageMediaId: _ogImageMediaId,
        galleryMediaIds: _galleryMediaIds,
        ...bookData
      } = dto
      const data = {
        ...bookData,
        ...(dto.slug === undefined ? {} : { slug: await resolveBookSlug(repos, dto.slug, dto.slug, bookId) }),
      }
      const book = await repos.bookRepository.update(bookId, data)
      await syncBookMedia(repos, bookId, dto, adminId)
      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.BOOK.UPDATE,
        resourceType: RESOURCE_TYPES.BOOK,
        resourceId: String(bookId),
        status: AuditStatus.SUCCESS,
        beforeData: { sku: current.sku, title: current.title },
        afterData: { sku: book.sku, title: book.title },
      })
      return book
    })
    const response = BookResponseDto.fromEntity(updated)
    await attachBookMedia(this.unitOfWork, this.minioService, response)
    return BaseResponseDto.success('Cập nhật sách thành công', response)
  }
}

@Injectable()
export class DeleteBookUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(bookId: number, adminId: number): Promise<BaseResponseDto<{ deleted: true }>> {
    await this.unitOfWork.executeInTransaction(async (repos) => {
      const current = await repos.bookRepository.findById(bookId)
      if (!current) throw new NotFoundException('Không tìm thấy sách')
      if (current.visibility !== Visibility.DRAFT)
        throw new BusinessLogicException('Chỉ được xóa sách ở trạng thái nháp')
      await repos.mediaUsageRepository.detachByEntity(EntityType.BOOK, bookId)
      await repos.bookRepository.delete(bookId)
      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.BOOK.DELETE,
        resourceType: RESOURCE_TYPES.BOOK,
        resourceId: String(bookId),
        status: AuditStatus.SUCCESS,
        beforeData: { sku: current.sku, title: current.title },
      })
    })
    return BaseResponseDto.success('Xóa sách thành công', { deleted: true })
  }
}

@Injectable()
export class GetBooksUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(query: BookListQueryDto): Promise<PaginationResponseDto<BookResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const pagination = query.toBookPaginationOptions()
      const { data, total } = await repos.bookRepository.findAllWithPagination({
        ...pagination,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        search: query.search,
        visibility: query.visibility,
        isFeatured: query.isFeatured,
        categorySlug: query.categorySlug,
        includeCategories: true,
      })
      return { data, total, pagination }
    })
    const response = result.data.map((book) => BookResponseDto.fromListEntity(book))
    await attachBookMediaToResponses(this.unitOfWork, this.minioService, response)
    return PaginationResponseDto.success(
      'Lấy danh sách sách thành công',
      response,
      result.pagination.page,
      result.pagination.limit,
      result.total,
    )
  }
}

@Injectable()
export class GetBookByIdUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(bookId: number): Promise<BaseResponseDto<BookResponseDto>> {
    const book = await this.unitOfWork.executeInTransaction((repos) =>
      repos.bookRepository.findById(bookId, { includeCategories: true }),
    )
    if (!book) throw new NotFoundException('Không tìm thấy sách')
    const response = BookResponseDto.fromEntity(book)
    await attachBookMedia(this.unitOfWork, this.minioService, response)
    return BaseResponseDto.success('Lấy chi tiết sách thành công', response)
  }
}

@Injectable()
export class GetPublicSeoBookBySlugUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(slug: string): Promise<BaseResponseDto<BookResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const book = await repos.bookRepository.findBySlug(slug, { includeCategories: true })
      const contact = await repos.bookSalesContactConfigurationRepository.findCurrent()
      if (!book || !book.isPublished() || !contact) throw new NotFoundException('Không tìm thấy sách công khai')
      return { book, contact }
    })
    const response = BookResponseDto.fromEntity(result.book)
    response.contact = { phone: result.contact.phone, facebookUrl: result.contact.facebookUrl }
    await attachBookMedia(this.unitOfWork, this.minioService, response)
    return BaseResponseDto.success('Lấy sách công khai thành công', response)
  }
}

@Injectable()
export class IncrementPublicBookViewCountUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(slug: string): Promise<BaseResponseDto<{ viewCount: number }>> {
    const book = await this.unitOfWork.executeInTransaction(async (repos) => {
      const found = await repos.bookRepository.findBySlug(slug)
      if (!found || !found.isPublished()) throw new NotFoundException('Không tìm thấy sách công khai')
      return repos.bookRepository.incrementViewCount(found.bookId)
    })
    return BaseResponseDto.success('Tăng lượt xem sách thành công', { viewCount: book.viewCount })
  }
}

async function validateBookInput(
  repos: UnitOfWorkRepos,
  dto: CreateBookDto | UpdateBookDto,
  bookId?: number,
  currentVisibility?: Visibility,
  currentCategoryIds?: number[],
): Promise<void> {
  const targetSku = dto.sku
  if (targetSku) {
    const found = await repos.bookRepository.findBySku(targetSku)
    if (found && found.bookId !== bookId) throw new ConflictException('SKU sách đã tồn tại')
  }
  if (dto.isbn) {
    const found = await repos.bookRepository.findByIsbn(dto.isbn)
    if (found && found.bookId !== bookId) throw new ConflictException('ISBN sách đã tồn tại')
  }
  const categoryIds = dto.categoryIds ?? currentCategoryIds ?? []
  if (new Set(categoryIds).size !== categoryIds.length || !categoryIds.length)
    throw new BusinessLogicException('Sách phải có ít nhất một loại sách hợp lệ')
  for (const categoryId of categoryIds) {
    const category = await repos.bookCategoryRepository.findById(categoryId)
    if (!category || !category.isActive)
      throw new BusinessLogicException('Loại sách không tồn tại hoặc đã ngừng hoạt động')
  }
  const targetVisibility = dto.visibility ?? currentVisibility
  if (
    targetVisibility === Visibility.PUBLISHED &&
    !(await repos.bookSalesContactConfigurationRepository.findCurrent())
  ) {
    throw new BusinessLogicException('Cần cấu hình hotline và Facebook trước khi xuất bản sách')
  }
}

async function resolveBookSlug(
  repos: UnitOfWorkRepos,
  requestedSlug: string | undefined,
  title: string,
  excludeBookId?: number,
): Promise<string> {
  if (requestedSlug) {
    const slug = slugifyBook(requestedSlug)
    const existing = await repos.bookRepository.findBySlug(slug)
    if (existing && existing.bookId !== excludeBookId) throw new ConflictException('Slug sách đã tồn tại')
    return slug
  }

  const base = slugifyBook(title)
  let slug = base
  let suffix = 2
  while (true) {
    const existing = await repos.bookRepository.findBySlug(slug)
    if (!existing || existing.bookId === excludeBookId) return slug
    slug = `${base}-${suffix++}`
  }
}
