import { TuitionPaymentStatusLabels } from 'src/shared/enums'
import { formatVnDate } from 'src/shared/utils/vietnam-date.util'

interface TuitionPaymentParentMessageData {
    studentId: number
    month: number
    year: number
    amount?: number | null
    status: string
    paidAt?: Date | null
    notes?: string | null
    course?: {
        title?: string | null
    } | null
    student?: {
        user?: {
            firstName?: string | null
            lastName?: string | null
        } | null
    } | null
}

export class TuitionPaymentParentMessageTemplate {
    static render(data: TuitionPaymentParentMessageData): string {
        const studentName = data.student?.user
            ? `${data.student.user.lastName || ''} ${data.student.user.firstName || ''}`.trim()
            : `#${data.studentId}`

        const amountText = typeof data.amount === 'number'
            ? `${data.amount.toLocaleString('vi-VN')}đ`
            : 'Chưa xác định'

        const statusLabel = TuitionPaymentStatusLabels[data.status] || data.status
        const period = `${String(data.month).padStart(2, '0')}/${data.year}`

        const messageLines = [
            'Thông báo học phí:',
            `Học sinh: ${studentName}`,
            data.course?.title ? `Khóa học: ${data.course.title}` : '',
            `Kỳ học phí: ${period}`,
            `Số tiền: ${amountText}`,
            `Trạng thái: ${statusLabel}`,
            data.paidAt ? `Ngày thanh toán: ${formatVnDate(data.paidAt)}` : '',
            data.notes ? `Ghi chú: ${data.notes}` : '',
            'Lưu ý: Nếu phụ huynh đã đóng học phí thì có thể bỏ qua thông báo này do dữ liệu có thể chưa cập nhật kịp. Khi hệ thống cập nhật đầy đủ, sẽ gửi lại thông báo đã đóng thêm một lần nữa.',
        ].filter(Boolean)

        return messageLines.join('\n')
    }
}
