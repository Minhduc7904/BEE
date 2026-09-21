import { IsOptionalInt } from '../../../shared/decorators/validate'

export class ParentStudentResultListQueryDto {
  @IsOptionalInt('Số trang', 1, 1000)
  page?: number = 1

  @IsOptionalInt('Kích thước trang', 1, 100)
  limit?: number = 10

  toPagination() {
    return {
      page: Math.max(1, this.page ?? 1),
      limit: Math.min(100, Math.max(1, this.limit ?? 10)),
    }
  }
}
