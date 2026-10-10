import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { CourseClassMakeupGroupResponseDto } from 'src/application/dtos/course-class/course-class-makeup-group-response.dto'
import { ReplaceCourseClassMakeupGroupDto } from 'src/application/dtos/course-class/replace-course-class-makeup-group.dto'
import { COURSE_CLASS_MAKEUP_GROUP_CONFLICT_CODE } from 'src/domain/interface/course-class/course-class-makeup-group.interface'
import type { MakeupGroup } from 'src/domain/interface/course-class/course-class-makeup-group.interface'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { BusinessLogicException, ConflictException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import {
  buildCourseClassMakeupGroupResponse,
  findGroupOfClass,
  getEffectiveGroups,
  isClassEnded,
} from './course-class-makeup-group.helper'

const sortAscending = (ids: number[]): number[] => [...ids].sort((a, b) => a - b)

@Injectable()
export class ReplaceCourseClassMakeupGroupUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    classId: number,
    dto: ReplaceCourseClassMakeupGroupDto,
    adminId: number,
  ): Promise<BaseResponseDto<CourseClassMakeupGroupResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(
      async (repos) => {
        const courseClassRepository = repos.courseClassRepository
        const groupRepository = repos.courseClassMakeupGroupRepository

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

        const classes = await groupRepository.findClassesByCourse(source.courseId)
        const groups = getEffectiveGroups(await groupRepository.findGroupsByCourse(source.courseId))
        const sourceGroup = findGroupOfClass(groups, source.classId)
        const currentPeerIds = sourceGroup
          ? sourceGroup.memberClassIds.filter((memberId) => memberId !== source.classId)
          : []
        const currentPeerSet = new Set(currentPeerIds)
        const now = new Date()

        // Một lớp chỉ thuộc một nhóm: không kéo lớp đang ở nhóm khác sang, để không làm vỡ nhóm đó.
        const targetsInOtherGroup = targets.filter((target) => {
          const targetGroup = findGroupOfClass(groups, target.classId)
          return targetGroup !== null && targetGroup.groupId !== sourceGroup?.groupId
        })

        if (targetsInOtherGroup.length > 0) {
          const names = targetsInOtherGroup.map((target) => target.className).join(', ')
          throw new ConflictException(
            `Lớp ${names} đã thuộc nhóm học bù khác. Hãy đưa lớp đó ra khỏi nhóm cũ trước khi thêm vào nhóm này.`,
            COURSE_CLASS_MAKEUP_GROUP_CONFLICT_CODE,
          )
        }

        // Lớp đã kết thúc chỉ được giữ hoặc bỏ khỏi nhóm, không được thêm mới.
        const expiredNewTarget = targets.find(
          (target) => !currentPeerSet.has(target.classId) && isClassEnded(target.endDate, now),
        )

        if (expiredNewTarget) {
          throw new BusinessLogicException(`Lớp học bù ${expiredNewTarget.classId} đã kết thúc nên không thể thêm mới`)
        }

        const unchanged =
          currentPeerIds.length === makeupClassIds.length && makeupClassIds.every((id) => currentPeerSet.has(id))

        if (unchanged) {
          return buildCourseClassMakeupGroupResponse({
            sourceClassId: source.classId,
            courseId: source.courseId,
            classes,
            groups,
            now,
          })
        }

        const newPeerSet = new Set(makeupClassIds)
        let savedGroupId: number | null = null
        let nextGroups: MakeupGroup[] = groups.filter((group) => group.groupId !== sourceGroup?.groupId)

        if (makeupClassIds.length === 0) {
          // Lớp nguồn rời nhóm và không còn lớp bạn nào: giải tán nhóm.
          await groupRepository.dissolveGroup((sourceGroup as MakeupGroup).groupId)
        } else {
          savedGroupId = await groupRepository.saveGroup({
            groupId: sourceGroup?.groupId ?? null,
            addClassIds: [
              ...(sourceGroup ? [] : [source.classId]),
              ...makeupClassIds.filter((id) => !currentPeerSet.has(id)),
            ],
            removeClassIds: currentPeerIds.filter((id) => !newPeerSet.has(id)),
          })
          nextGroups = [
            ...nextGroups,
            {
              groupId: savedGroupId,
              memberClassIds: sortAscending([source.classId, ...makeupClassIds]),
            },
          ]
        }

        await repos.adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.COURSE_CLASS.UPDATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.COURSE_CLASS,
          resourceId: source.classId.toString(),
          beforeData: {
            makeupGroupId: sourceGroup?.groupId ?? null,
            makeupGroupClassIds: sourceGroup ? sortAscending(sourceGroup.memberClassIds) : [],
          },
          afterData: {
            makeupGroupId: savedGroupId,
            makeupGroupClassIds: makeupClassIds.length > 0 ? sortAscending([source.classId, ...makeupClassIds]) : [],
          },
        })

        return buildCourseClassMakeupGroupResponse({
          sourceClassId: source.classId,
          courseId: source.courseId,
          classes,
          groups: nextGroups,
          now,
        })
      },
      // Mỗi câu lệnh đọc dữ liệu đã commit mới nhất và không giữ khóa khoảng, tránh deadlock giữa các lần lưu đồng thời.
      { isolationLevel: 'ReadCommitted' },
    )

    return BaseResponseDto.success('Cập nhật nhóm lớp học bù thành công', result)
  }
}
