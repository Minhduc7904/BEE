// src/shared/exceptions/custom-exceptions.ts
import { HttpException, HttpStatus } from '@nestjs/common'

/**
 * =========================
 * DOMAIN LEVEL
 * =========================
 */

/**
 * Dùng trong DOMAIN (Entity / ValueObject)
 * - KHÔNG phụ thuộc HTTP
 * - Không trả trực tiếp ra client
 * - Thường được catch ở UseCase rồi map sang HttpException
 *
 * Ví dụ:
 * - Vi phạm invariant trong entity
 * - Trạng thái domain không hợp lệ
 */
export class DomainException extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainException'
  }
}

/**
 * =========================
 * CLIENT / REQUEST ERRORS
 * =========================
 */

/**
 * Dùng khi request từ client KHÔNG HỢP LỆ
 * - Sai format
 * - Thiếu field bắt buộc
 * - Validate DTO fail
 *
 * HTTP 400
 */
export class ValidationException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST)
    this.name = 'ValidationException'
  }
}

/**
 * Dùng khi request hợp lệ nhưng XUNG ĐỘT với dữ liệu hiện tại
 *
 * Ví dụ:
 * - Tạo học phí đã tồn tại (student + month + year)
 * - Tạo attendance trùng
 * - Đăng ký khoá học đã đăng ký
 *
 * HTTP 409
 */
export class ConflictException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT)
    this.name = 'ConflictException'
  }
}

/**
 * Dùng khi KHÔNG TÌM THẤY tài nguyên
 *
 * Ví dụ:
 * - Không tìm thấy tuition payment
 * - Không tìm thấy course / student
 *
 * HTTP 404
 */
export class NotFoundException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.NOT_FOUND)
    this.name = 'NotFoundException'
  }
}

/**
 * Dùng khi CHƯA XÁC THỰC
 *
 * Ví dụ:
 * - Chưa đăng nhập
 * - Token hết hạn
 * - Token không hợp lệ
 *
 * HTTP 401
 */
export class UnauthorizedException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.UNAUTHORIZED)
    this.name = 'UnauthorizedException'
  }
}

/**
 * Dùng khi ĐÃ XÁC THỰC nhưng KHÔNG ĐỦ QUYỀN
 *
 * Ví dụ:
 * - Student truy cập API của admin
 * - User truy cập tài nguyên không thuộc về mình
 *
 * HTTP 403
 */
export class ForbiddenException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.FORBIDDEN)
    this.name = 'ForbiddenException'
  }
}

/**
 * =========================
 * BUSINESS RULE ERRORS
 * =========================
 */

/**
 * Dùng cho VI PHẠM LUẬT NGHIỆP VỤ
 * - Request hợp lệ
 * - Dữ liệu tồn tại
 * - Nhưng nghiệp vụ không cho phép
 *
 * Ví dụ:
 * - Không thể xoá khoá học đã có học sinh
 * - Không thể tạo học phí khi khoá học bị khoá
 *
 * Mặc định HTTP 400, có thể override status
 */
export class BusinessLogicException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, statusCode)
    this.name = 'BusinessLogicException'
  }
}

/**
 * Dùng khi vi phạm TRẠNG THÁI (STATE MACHINE)
 * - Không phải dữ liệu sai
 * - Mà là trạng thái hiện tại không cho phép hành động
 *
 * Ví dụ:
 * - Học phí đã PAID nhưng vẫn cho sửa
 * - Attendance đã khoá nhưng vẫn cho update
 *
 * HTTP 422 (Unprocessable Entity)
 */
export class InvalidStateException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY)
    this.name = 'InvalidStateException'
  }
}

/**
 * =========================
 * AUTH / PERMISSION
 * =========================
 */

/**
 * Tương tự ForbiddenException nhưng dùng khi muốn
 * phân biệt rõ lỗi PHÂN QUYỀN trong business
 *
 * Ví dụ:
 * - Admin chỉ được thao tác course của mình
 * - Giáo viên không được sửa học phí
 *
 * HTTP 403
 */
export class PermissionDeniedException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.FORBIDDEN)
    this.name = 'PermissionDeniedException'
  }
}

/**
 * =========================
 * INFRASTRUCTURE / SYSTEM
 * =========================
 */

/**
 * Dùng khi lỗi HỆ THỐNG / HẠ TẦNG
 * - Database lỗi
 * - File system lỗi
 * - Unexpected crash
 *
 * HTTP 500 (hoặc custom)
 */
export class InfrastructureException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR) {
    super(message, statusCode)
    this.name = 'InfrastructureException'
  }
}

/**
 * Dùng khi gọi SERVICE BÊN NGOÀI bị lỗi
 *
 * Ví dụ:
 * - MinIO
 * - Email service
 * - Payment gateway
 * - Zalo / SMS
 *
 * HTTP 503
 */
export class ExternalServiceException extends HttpException {
  constructor(serviceName: string, message = 'External service error') {
    super(`${serviceName}: ${message}`, HttpStatus.SERVICE_UNAVAILABLE)
    this.name = 'ExternalServiceException'
  }
}

/**
 * =========================
 * RATE LIMIT / QUOTA
 * =========================
 */

/**
 * Dùng khi vượt quá giới hạn request
 *
 * Ví dụ:
 * - Spam API
 * - Gửi quá nhiều request trong thời gian ngắn
 *
 * HTTP 429
 */
export class RateLimitExceededException extends HttpException {
  constructor(message = 'Too many requests') {
    super(message, HttpStatus.TOO_MANY_REQUESTS)
    this.name = 'RateLimitExceededException'
  }
}
