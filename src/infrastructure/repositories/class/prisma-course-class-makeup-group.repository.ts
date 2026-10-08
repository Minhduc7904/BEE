import { Prisma } from '@prisma/client'
import type { ICourseClassMakeupGroupRepository } from '../../../domain/repositories/course-class-makeup-group.repository'
import {
  COURSE_CLASS_MAKEUP_GROUP_CONFLICT_CODE,
  type CourseClassMakeupCandidate,
  type MakeupGroup,
  type SaveMakeupGroupParams,
} from '../../../domain/interface/course-class/course-class-makeup-group.interface'
import { ConflictException } from '../../../shared/exceptions/custom-exceptions'

/**
 * `PrismaService` kế thừa `PrismaClient` nên cũng thỏa `Prisma.TransactionClient`;
 * một kiểu duy nhất dùng được cho cả client thường và client trong Unit of Work.
 */
type MakeupGroupPrismaClient = Prisma.TransactionClient

const UNIQUE_VIOLATION = 'P2002'
const WRITE_CONFLICT_OR_DEADLOCK = 'P2034'

export class PrismaCourseClassMakeupGroupRepository implements ICourseClassMakeupGroupRepository {
  constructor(private readonly prisma: MakeupGroupPrismaClient) {}

  async lockCourse(courseId: number): Promise<void> {
    await this.prisma.$queryRaw`SELECT course_id FROM courses WHERE course_id = ${courseId} FOR UPDATE`
  }

  async findClassesByCourse(courseId: number): Promise<CourseClassMakeupCandidate[]> {
    const rows = await this.prisma.courseClass.findMany({
      where: { courseId },
      orderBy: [{ className: 'asc' }, { classId: 'asc' }],
      select: {
        classId: true,
        className: true,
        weeklySchedule: true,
        startDate: true,
        endDate: true,
        room: true,
        instructor: {
          select: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })

    return rows.map((row) => {
      const instructorUser = row.instructor?.user
      const instructorName = instructorUser ? `${instructorUser.lastName} ${instructorUser.firstName}`.trim() : ''

      return {
        classId: row.classId,
        className: row.className,
        weeklySchedule: row.weeklySchedule,
        startDate: row.startDate,
        endDate: row.endDate,
        room: row.room,
        instructorName: instructorName || null,
      }
    })
  }

  async findGroupsByCourse(courseId: number): Promise<MakeupGroup[]> {
    const rows = await this.prisma.courseClassMakeupGroup.findMany({
      where: { members: { some: { courseClass: { courseId } } } },
      orderBy: { makeupGroupId: 'asc' },
      select: {
        makeupGroupId: true,
        members: { select: { classId: true }, orderBy: { classId: 'asc' } },
      },
    })

    return rows.map((row) => ({
      groupId: row.makeupGroupId,
      memberClassIds: row.members.map((member) => member.classId),
    }))
  }

  async saveGroup(params: SaveMakeupGroupParams): Promise<number> {
    try {
      const groupId = params.groupId ?? (await this.prisma.courseClassMakeupGroup.create({ data: {} })).makeupGroupId

      // Xóa theo khóa chính cụ thể và ghi theo thứ tự tăng dần: các transaction đồng thời luôn lấy khóa cùng thứ tự.
      if (params.removeClassIds.length > 0) {
        await this.prisma.courseClassMakeupGroupMember.deleteMany({
          where: { makeupGroupId: groupId, classId: { in: [...params.removeClassIds].sort((a, b) => a - b) } },
        })
      }

      if (params.addClassIds.length > 0) {
        const addClassIds = [...params.addClassIds].sort((a, b) => a - b)

        // Lớp có thể còn nằm trong một nhóm mồ côi (dưới 2 lớp): cho rời nhóm đó trước khi vào nhóm mới.
        await this.prisma.courseClassMakeupGroupMember.deleteMany({
          where: { classId: { in: addClassIds }, makeupGroupId: { not: groupId } },
        })
        await this.prisma.courseClassMakeupGroupMember.createMany({
          data: addClassIds.map((classId) => ({ makeupGroupId: groupId, classId })),
          skipDuplicates: true,
        })
        await this.prisma.courseClassMakeupGroup.deleteMany({ where: { members: { none: {} } } })
      }

      return groupId
    } catch (error) {
      throw this.toConflictIfConcurrent(error)
    }
  }

  async dissolveGroup(groupId: number): Promise<void> {
    await this.prisma.courseClassMakeupGroup.deleteMany({ where: { makeupGroupId: groupId } })
  }

  private toConflictIfConcurrent(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === UNIQUE_VIOLATION || error.code === WRITE_CONFLICT_OR_DEADLOCK)
    ) {
      return new ConflictException(
        'Nhóm học bù vừa được thay đổi ở nơi khác. Vui lòng tải lại và thử lại.',
        COURSE_CLASS_MAKEUP_GROUP_CONFLICT_CODE,
      )
    }

    return error
  }
}
