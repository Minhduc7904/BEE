export class PhoneUtil {
  static normalizeVietnamesePhone(phone: string): string {
    return phone.trim()
  }

  static vietnamesePhoneVariants(phone: string): string[] {
    const normalized = this.normalizeVietnamesePhone(phone)
    const nationalNumber = normalized.startsWith('0') ? normalized.slice(1) : normalized

    return Array.from(new Set([normalized, `84${nationalNumber}`, `+84${nationalNumber}`]))
  }
}
