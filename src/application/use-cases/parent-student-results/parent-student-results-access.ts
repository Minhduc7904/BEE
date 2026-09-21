import type { AuthenticatedUser, ParentStudentResultsReadService } from '../../interfaces'
import { ForbiddenException } from '../../../shared/exceptions/custom-exceptions'

export async function assertParentManagesStudent(
  identity: AuthenticatedUser,
  studentId: number,
  results: ParentStudentResultsReadService,
): Promise<void> {
  if (identity.userType !== 'parent' || !identity.parentId) {
    throw new ForbiddenException('Chỉ tài khoản phụ huynh mới có thể truy cập kết quả học tập')
  }

  if (!(await results.isStudentLinked(identity.parentId, studentId))) {
    throw new ForbiddenException('Phụ huynh không có quyền quản lý học sinh này')
  }
}
