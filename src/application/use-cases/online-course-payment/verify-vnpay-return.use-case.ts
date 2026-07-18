import { Injectable } from '@nestjs/common'
import { VnpayService } from 'src/application/interfaces'
import type { VnpayReturnResponseDto } from 'src/application/dtos/online-course-payment'

@Injectable()
export class VerifyVnpayReturnUseCase {
  constructor(private readonly vnpayService: VnpayService) {}

  execute(query: Record<string, any>): VnpayReturnResponseDto {
    const verify = this.vnpayService.verifyReturnUrl(query)

    return {
      isVerified: verify.isVerified,
      isSuccess: verify.isVerified && verify.isSuccess,
      txnRef: verify.txnRef,
      amount: verify.amount,
      responseCode: verify.responseCode,
      transactionStatus: verify.transactionStatus,
      message: verify.message,
    }
  }
}
