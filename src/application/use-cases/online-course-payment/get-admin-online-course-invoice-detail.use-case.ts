import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { AdminOnlineCourseInvoiceResponseDto } from 'src/application/dtos/online-course-payment'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import type { IOnlineCourseInvoiceRepository } from 'src/domain/repositories'
import { toAdminOnlineCourseInvoiceResponse } from './admin-online-course-invoice-response.mapper'

@Injectable()
export class GetAdminOnlineCourseInvoiceDetailUseCase {
  constructor(
    @Inject('IOnlineCourseInvoiceRepository')
    private readonly onlineCourseInvoiceRepository: IOnlineCourseInvoiceRepository,
  ) {}

  async execute(invoiceId: number): Promise<BaseResponseDto<AdminOnlineCourseInvoiceResponseDto>> {
    const invoice = await this.onlineCourseInvoiceRepository.findById(invoiceId)
    if (!invoice) {
      throw new NotFoundException('Khong tim thay hoa don mua khoa hoc online')
    }

    return BaseResponseDto.success(
      'Lay chi tiet hoa don mua khoa hoc online thanh cong',
      toAdminOnlineCourseInvoiceResponse(invoice),
    )
  }
}
