import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import type { IUnitOfWork } from 'src/domain/repositories'

@Injectable()
export class DeleteOnlineCourseInvoiceUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(invoiceId: number): Promise<BaseResponseDto<null>> {
    await this.unitOfWork.executeInTransaction(
      async (repos) => {
        const invoice = await repos.onlineCourseInvoiceRepository.findById(invoiceId)
        if (!invoice) {
          throw new NotFoundException('Khong tim thay hoa don mua khoa hoc online')
        }

        await repos.onlineCourseInvoiceRepository.delete(invoice.invoiceId)
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    return BaseResponseDto.success('Xoa hoa don mua khoa hoc online thanh cong', null)
  }
}
