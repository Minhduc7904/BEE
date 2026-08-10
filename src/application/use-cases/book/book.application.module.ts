import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import * as useCases from './'

const BOOK_USE_CASES = [
  useCases.CreateBookUseCase,
  useCases.UpdateBookUseCase,
  useCases.UpdateBookMediaUseCase,
  useCases.DeleteBookUseCase,
  useCases.GetBooksUseCase,
  useCases.GetBookByIdUseCase,
  useCases.GetPublicSeoBookBySlugUseCase,
  useCases.IncrementPublicBookViewCountUseCase,
  useCases.CreateBookCategoryUseCase,
  useCases.UpdateBookCategoryUseCase,
  useCases.DeleteBookCategoryUseCase,
  useCases.GetBookCategoriesUseCase,
  useCases.GetBookSalesContactConfigurationUseCase,
  useCases.UpdateBookSalesContactConfigurationUseCase,
  useCases.GetPublicSeoBookSitemapUseCase,
  useCases.GetStudentBooksUseCase,
  useCases.GetStudentBookBySlugUseCase,
  useCases.GetStudentBookCategoriesUseCase,
  useCases.IncrementStudentBookViewCountUseCase,
]

@Module({ imports: [InfrastructureModule], providers: BOOK_USE_CASES, exports: BOOK_USE_CASES })
export class BookApplicationModule {}
