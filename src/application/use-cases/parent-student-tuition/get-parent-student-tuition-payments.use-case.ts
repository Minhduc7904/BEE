import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentTuitionReadService } from '../../interfaces'
import { ParentTuitionPaymentCursorQueryDto, ParentTuitionPaymentListItemDto } from '../../dtos/parent-student-tuition'
import { CursorPageResponseDto } from '../../dtos/pagination/cursor-page-response.dto'
import { assertParentManagesStudent } from './parent-student-tuition-access'

@Injectable()
export class GetParentStudentTuitionPaymentsUseCase {
  constructor(private readonly tuition: ParentStudentTuitionReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    query: ParentTuitionPaymentCursorQueryDto,
    now: Date = new Date(),
  ): Promise<CursorPageResponseDto<ParentTuitionPaymentListItemDto>> {
    await assertParentManagesStudent(identity, studentId, this.tuition)
    const listQuery = query.toQuery()
    const page = await this.tuition.listPayments(studentId, listQuery)
    return CursorPageResponseDto.success(
      'Lấy danh sách học phí thành công',
      page.data.map((record) => ParentTuitionPaymentListItemDto.fromRecord(record, now)),
      page.hasNext,
      page.nextCursor,
      listQuery.limit,
    )
  }
}
