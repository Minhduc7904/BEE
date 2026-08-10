import { CreateBookDto, UpdateBookDto } from 'src/application/dtos'
import type { UnitOfWorkRepos } from 'src/domain/repositories'
import { Visibility } from 'src/shared/enums'
import { BusinessLogicException, ConflictException } from 'src/shared/exceptions/custom-exceptions'
import { slugifyBook } from './book.util'

export async function validateBookInput(
  repos: UnitOfWorkRepos,
  dto: CreateBookDto | UpdateBookDto,
  bookId?: number,
  currentVisibility?: Visibility,
  currentCategoryIds?: number[],
): Promise<void> {
  if (dto.sku) {
    const found = await repos.bookRepository.findBySku(dto.sku)
    if (found && found.bookId !== bookId) {
      throw new ConflictException('SKU sách đã tồn tại')
    }
  }
  if (dto.isbn) {
    const found = await repos.bookRepository.findByIsbn(dto.isbn)
    if (found && found.bookId !== bookId) {
      throw new ConflictException('ISBN sách đã tồn tại')
    }
  }
  const categoryIds = dto.categoryIds ?? currentCategoryIds ?? []
  if (new Set(categoryIds).size !== categoryIds.length || !categoryIds.length) {
    throw new BusinessLogicException('Sách phải có ít nhất một loại sách hợp lệ')
  }
  for (const categoryId of categoryIds) {
    const category = await repos.bookCategoryRepository.findById(categoryId)
    if (!category || !category.isActive) {
      throw new BusinessLogicException('Loại sách không tồn tại hoặc đã ngừng hoạt động')
    }
  }
  const targetVisibility = dto.visibility ?? currentVisibility
  if (
    targetVisibility === Visibility.PUBLISHED &&
    !(await repos.bookSalesContactConfigurationRepository.findCurrent())
  ) {
    throw new BusinessLogicException('Cần cấu hình hotline và Facebook trước khi xuất bản sách')
  }
}

export async function resolveBookSlug(
  repos: UnitOfWorkRepos,
  requestedSlug: string | undefined,
  title: string,
  excludeBookId?: number,
): Promise<string> {
  if (requestedSlug) {
    const slug = slugifyBook(requestedSlug)
    const existing = await repos.bookRepository.findBySlug(slug)
    if (existing && existing.bookId !== excludeBookId) {
      throw new ConflictException('Slug sách đã tồn tại')
    }
    return slug
  }

  const base = slugifyBook(title)
  let slug = base
  let suffix = 2
  while (true) {
    const existing = await repos.bookRepository.findBySlug(slug)
    if (!existing || existing.bookId === excludeBookId) {
      return slug
    }
    slug = `${base}-${suffix++}`
  }
}
