import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { CourseClassMakeupOptionsResponseDto } from 'src/application/dtos/course-class/course-class-makeup-options-response.dto'
import { ReplaceCourseClassMakeupOptionsDto } from 'src/application/dtos/course-class/replace-course-class-makeup-options.dto'
import type { CourseClassMakeupEdge } from 'src/domain/interface/course-class/course-class-makeup-option.interface'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { BusinessLogicException, ConflictException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { buildCourseClassMakeupOptionsResponse, hasCycle, isClassEnded } from './course-class-makeup-options.helper'

export const COURSE_CLASS_MAKEUP_CYCLE_CODE = 'COURSE_CLASS_MAKEUP_CYCLE'

@Injectable()
export class ReplaceCourseClassMakeupOptionsUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    classId: number,
    dto: ReplaceCourseClassMakeupOptionsDto,
    adminId: number,
  ): Promise<BaseResponseDto<CourseClassMakeupOptionsResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const courseClassRepository = repos.courseClassRepository
      const makeupOptionRepository = repos.courseClassMakeupOptionRepository

      // Locking read đầu tiên: chưa đọc thường bất kỳ dữ liệu nào trước khi có đủ hai khóa, để snapshot
      // REPEATABLE-READ của transaction được tạo sau khi các request cạnh tranh đã commit.
      const lockedSource = await makeupOptionRepository.lockSourceClassForGraphUpdate(classId)

      if (!lockedSource) {
        throw new NotFoundException(`Lớp học với ID ${classId} không tồn tại`)
      }

      // Tuần tự hóa các lần đổi graph trong cùng course trước khi đọc graph để kiểm tra chu trình.
      await makeupOptionRepository.lockCourseForGraphUpdate(lockedSource.courseId)

      const source = await courseClassRepository.findById(classId)

      if (!source) {
        throw new NotFoundException(`Lớp học với ID ${classId} không tồn tại`)
      }

      const makeupClassIds = dto.makeupClassIds

      if (new Set(makeupClassIds).size !== makeupClassIds.length) {
        throw new BusinessLogicException('Danh sách lớp học bù không được chứa ID trùng lặp')
      }

      if (makeupClassIds.includes(source.classId)) {
        throw new BusinessLogicException('Lớp học không thể chọn chính nó làm lớp học bù')
      }

      const targets = makeupClassIds.length > 0 ? await courseClassRepository.findByIds(makeupClassIds) : []

      if (targets.length !== makeupClassIds.length) {
        const foundIds = new Set(targets.map((target) => target.classId))
        const missingIds = makeupClassIds.filter((id) => !foundIds.has(id))
        throw new NotFoundException(`Lớp học bù với ID ${missingIds.join(', ')} không tồn tại`)
      }

      const otherCourseTarget = targets.find((target) => target.courseId !== source.courseId)

      if (otherCourseTarget) {
        throw new BusinessLogicException(
          `Lớp học bù ${otherCourseTarget.classId} phải thuộc cùng khóa học với lớp nguồn`,
        )
      }

      const classes = await makeupOptionRepository.findClassesByCourse(source.courseId)
      const currentEdges = await makeupOptionRepository.findEdgesByCourse(source.courseId)
      const now = new Date()

      const currentIds = currentEdges
        .filter((edge) => edge.sourceClassId === source.classId)
        .map((edge) => edge.makeupClassId)
      const currentIdSet = new Set(currentIds)

      // Lớp đã kết thúc chỉ được giữ hoặc bỏ chọn, không được thêm mới.
      const expiredNewTarget = targets.find(
        (target) => !currentIdSet.has(target.classId) && isClassEnded(target.endDate, now),
      )

      if (expiredNewTarget) {
        throw new BusinessLogicException(`Lớp học bù ${expiredNewTarget.classId} đã kết thúc nên không thể thêm mới`)
      }

      const nextEdges: CourseClassMakeupEdge[] = [
        ...currentEdges.filter((edge) => edge.sourceClassId !== source.classId),
        ...makeupClassIds.map((makeupClassId) => ({ sourceClassId: source.classId, makeupClassId })),
      ]

      if (hasCycle(nextEdges)) {
        throw new ConflictException(
          'Cấu hình lớp học bù tạo ra vòng lặp trực tiếp hoặc gián tiếp giữa các lớp',
          COURSE_CLASS_MAKEUP_CYCLE_CODE,
        )
      }

      const unchanged =
        currentIds.length === makeupClassIds.length && makeupClassIds.every((id) => currentIdSet.has(id))

      if (unchanged) {
        return buildCourseClassMakeupOptionsResponse({
          sourceClassId: source.classId,
          courseId: source.courseId,
          classes,
          edges: currentEdges,
          now,
        })
      }

      await makeupOptionRepository.replaceForSource(source.classId, makeupClassIds)

      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.COURSE_CLASS.UPDATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.COURSE_CLASS,
        resourceId: source.classId.toString(),
        beforeData: { makeupClassIds: [...currentIds].sort((a, b) => a - b) },
        afterData: { makeupClassIds: [...makeupClassIds].sort((a, b) => a - b) },
      })

      return buildCourseClassMakeupOptionsResponse({
        sourceClassId: source.classId,
        courseId: source.courseId,
        classes,
        edges: nextEdges,
        now,
      })
    })

    return BaseResponseDto.success('Cập nhật cấu hình lớp học bù thành công', result)
  }
}
