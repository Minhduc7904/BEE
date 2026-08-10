import { UnauthorizedException } from 'src/shared/exceptions/custom-exceptions'

export function assertStudentBookAccess(studentId?: number): asserts studentId is number {
  if (!studentId) {
    throw new UnauthorizedException('Chỉ học sinh đã đăng nhập mới được truy cập catalog sách dành cho học sinh')
  }
}
