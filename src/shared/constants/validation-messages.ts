export const VALIDATION_MESSAGES = {
  FIELD_MIN: (field: string, min: number) => `${field} phải có ít nhất ${min} ký tự`,
  FIELD_MAX: (field: string, max: number) => `${field} phải có tối đa ${max} ký tự`,
  FIELD_MIN_VALUE: (field: string, min: number) => `${field} phải lớn hơn hoặc bằng ${min}`,
  FIELD_MAX_VALUE: (field: string, max: number) => `${field} phải nhỏ hơn hoặc bằng ${max}`,
  FIELD_REQUIRED: (field: string) => `${field} là bắt buộc`,
  FIELD_INVALID: (field: string, reason?: string) => `${field} không hợp lệ ${reason ? `(${reason})` : ''}`,
}

export const PHONE_VN_REGEX = /^(\+84|84|0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])[0-9]{7}$/
