// src/infrastructure/mappers/pagination.mapper.ts

export class PaginationMapper {
  static toDomainDataWithPagination(data: any[], pagination: any): object {
    return {
      data,
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    }
  }
}
