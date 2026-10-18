import type { AuthenticatedUser, ParentStudentTuitionReadService } from '../../interfaces'
import { ForbiddenException } from '../../../shared/exceptions/custom-exceptions'

export async function assertParentManagesStudent(
  identity: AuthenticatedUser,
  studentId: number,
  tuition: ParentStudentTuitionReadService,
): Promise<void> {
  if (identity.userType !== 'parent' || !identity.parentId) {
    throw new ForbiddenException('Chỉ tài khoản phụ huynh mới có thể xem học phí của học sinh')
  }

  if (!(await tuition.isStudentLinked(identity.parentId, studentId))) {
    throw new ForbiddenException('Phụ huynh không có quyền quản lý học sinh này')
  }
}
