import { Inject, Injectable } from '@nestjs/common'
import {
  AdminOnlineCourseInvoiceListQueryDto,
  AdminOnlineCourseInvoiceResponseDto,
} from 'src/application/dtos/online-course-payment'
import { PaginationResponseDto } from 'src/application/dtos/pagination/pagination-response.dto'
import type { IOnlineCourseInvoiceRepository } from 'src/domain/repositories'
import { toAdminOnlineCourseInvoiceResponse } from './admin-online-course-invoice-response.mapper'

@Injectable()
export class GetAdminOnlineCourseInvoicesUseCase {
  constructor(
    @Inject('IOnlineCourseInvoiceRepository')
    private readonly onlineCourseInvoiceRepository: IOnlineCourseInvoiceRepository,
  ) {}

  async execute(
    query: AdminOnlineCourseInvoiceListQueryDto,
  ): Promise<PaginationResponseDto<AdminOnlineCourseInvoiceResponseDto>> {
    const pagination = query.toPaginationOptions()
    const { data, total } = await this.onlineCourseInvoiceRepository.findAllWithPagination({
      skip: pagination.skip,
      take: pagination.take,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
      search: query.search?.trim() || undefined,
      status: query.status,
      paymentProvider: query.paymentProvider,
      studentId: query.studentId,
      buyerUserId: query.buyerUserId,
      invoiceCode: query.invoiceCode?.trim() || undefined,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
    })

    return PaginationResponseDto.success(
      'Lay danh sach hoa don mua khoa hoc online thanh cong',
      data.map(toAdminOnlineCourseInvoiceResponse),
      pagination.page,
      pagination.limit,
      total,
    )
  }
}
