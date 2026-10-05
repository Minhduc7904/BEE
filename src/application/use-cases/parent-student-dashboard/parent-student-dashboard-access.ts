import type { AuthenticatedUser, ParentStudentDashboardReadService } from '../../interfaces'
import { ForbiddenException } from '../../../shared/exceptions/custom-exceptions'

export async function assertParentManagesStudent(
  identity: AuthenticatedUser,
  studentId: number,
  dashboard: ParentStudentDashboardReadService,
): Promise<void> {
  if (identity.userType !== 'parent' || !identity.parentId) {
    throw new ForbiddenException('Chỉ tài khoản phụ huynh mới có thể xem tổng quan của học sinh')
  }

  if (!(await dashboard.isStudentLinked(identity.parentId, studentId))) {
    throw new ForbiddenException('Phụ huynh không có quyền quản lý học sinh này')
  }
}
