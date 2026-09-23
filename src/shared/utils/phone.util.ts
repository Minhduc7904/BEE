export class PhoneUtil {
  static normalizeVietnamesePhone(phone: string): string {
    return phone.trim()
  }

  /**
   * Sinh các biến thể 0/84/+84 để so khớp với dữ liệu có thể lưu ở nhiều định
   * dạng khác nhau (vd. Student.parentPhone).
   *
   * Chỉ hỗ trợ input đã ở định dạng nội địa (bắt đầu bằng "0") — mọi field
   * phone Parent hiện tại đều được validate bằng IsRequiredLocalPhoneVN nên
   * luôn đúng dạng này. Không hỗ trợ input đã ở dạng 84/+84: nếu input không
   * bắt đầu bằng "0", trả về nguyên trạng thay vì suy đoán và ghép sai tiền
   * tố (vd. "+84392923661" từng bị biến thành "84+84392923661").
   */
  static vietnamesePhoneVariants(phone: string): string[] {
    const normalized = this.normalizeVietnamesePhone(phone)
    if (!normalized.startsWith('0')) {
      return [normalized]
    }

    const nationalNumber = normalized.slice(1)
    return Array.from(new Set([normalized, `84${nationalNumber}`, `+84${nationalNumber}`]))
  }
}
