import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { TuitionPaymentStatusLabels } from 'src/shared/enums'
import { formatVnDate } from 'src/shared/utils/vietnam-date.util'
import { ZaloService } from 'src/infrastructure/services'
import { GetValidZaloAccessTokenUseCase } from '../zalo/get-valid-zalo-access-token.use-case'

interface SendTuitionPaymentToParentInput {
  paymentId: number
  appId?: string
}

@Injectable()
export class SendTuitionPaymentToParentUseCase {
  private static readonly DEFAULT_APP_ID = '443601004373365149'

  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly zaloService: ZaloService,
    private readonly getValidZaloAccessTokenUseCase: GetValidZaloAccessTokenUseCase,
  ) {}

  async execute(input: SendTuitionPaymentToParentInput): Promise<boolean> {
    const appId = input.appId || process.env.ZALO_APP_ID || SendTuitionPaymentToParentUseCase.DEFAULT_APP_ID

    const payment = await this.unitOfWork.executeInTransaction(async (repos) => {
      return repos.tuitionPaymentRepository.findById(input.paymentId)
    })

    if (!payment) {
      return false
    }

    const parentZaloId = payment.student?.parentZaloId
    if (!parentZaloId) {
      return false
    }

    const accessToken = await this.getValidZaloAccessTokenUseCase.execute({ appId })

    if (!accessToken) {
      console.warn(`[Tuition->Parent] Không tìm thấy access token cho app_id=${appId}`)
      return false
    }

    const studentName = payment.student?.user
      ? `${payment.student.user.lastName || ''} ${payment.student.user.firstName || ''}`.trim()
      : `#${payment.studentId}`

    const amountText = typeof payment.amount === 'number'
      ? `${payment.amount.toLocaleString('vi-VN')}đ`
      : 'Chưa xác định'

    const statusLabel = TuitionPaymentStatusLabels[payment.status] || payment.status
    const period = `${String(payment.month).padStart(2, '0')}/${payment.year}`

    const messageLines = [
      'Thông báo học phí:',
      `Học sinh: ${studentName}`,
      payment.course?.title ? `Khóa học: ${payment.course.title}` : '',
      `Kỳ học phí: ${period}`,
      `Số tiền: ${amountText}`,
      `Trạng thái: ${statusLabel}`,
      payment.paidAt ? `Ngày thanh toán: ${formatVnDate(payment.paidAt)}` : '',
      payment.notes ? `Ghi chú: ${payment.notes}` : '',
    ].filter(Boolean)

    try {
      await this.zaloService.sendMessage(accessToken, {
        recipient: { user_id: parentZaloId },
        message: {
          text: messageLines.join('\n'),
        },
      })
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error_description ||
        error?.response?.data?.message ||
        error?.message ||
        'Unknown Zalo send error'

      console.warn('[Tuition->Parent] Gửi Zalo thất bại, bỏ qua để không ảnh hưởng luồng chính:', {
        paymentId: payment.paymentId,
        studentId: payment.studentId,
        parentZaloId,
        errorMessage,
      })

      return false
    }

    return true
  }
}
