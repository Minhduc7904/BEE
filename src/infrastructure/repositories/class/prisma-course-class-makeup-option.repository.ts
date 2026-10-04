import type { Prisma } from '@prisma/client'
import type { ICourseClassMakeupOptionRepository } from '../../../domain/repositories/course-class-makeup-option.repository'
import type {
  CourseClassMakeupCandidate,
  CourseClassMakeupEdge,
  LockedMakeupSourceClass,
} from '../../../domain/interface/course-class/course-class-makeup-option.interface'

/**
 * `PrismaService` kế thừa `PrismaClient` nên cũng thỏa `Prisma.TransactionClient`;
 * một kiểu duy nhất dùng được cho cả client thường và client trong Unit of Work.
 */
type MakeupOptionPrismaClient = Prisma.TransactionClient

export class PrismaCourseClassMakeupOptionRepository implements ICourseClassMakeupOptionRepository {
  constructor(private readonly prisma: MakeupOptionPrismaClient) {}

  /**
   * Dùng `FOR SHARE` thay vì `FOR UPDATE`: khóa độc quyền trên lớp nguồn gây deadlock khi hai request đảo chiều
   * (A→B và B→A) vì kiểm tra FK lúc ghi cạnh cần khóa chia sẻ trên lớp đích mà request kia đang giữ độc quyền.
   * Việc tuần tự hóa thật sự do khóa độc quyền trên row course đảm nhiệm.
   */
  async lockSourceClassForGraphUpdate(classId: number): Promise<LockedMakeupSourceClass | null> {
    const rows = await this.prisma.$queryRaw<Array<{ class_id: number; course_id: number }>>`
      SELECT class_id, course_id FROM courses_classes WHERE class_id = ${classId} FOR SHARE
    `

    if (rows.length === 0) {
      return null
    }

    return { classId: rows[0].class_id, courseId: rows[0].course_id }
  }

  async lockCourseForGraphUpdate(courseId: number): Promise<void> {
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

  findEdgesByCourse(courseId: number): Promise<CourseClassMakeupEdge[]> {
    return this.prisma.courseClassMakeupOption.findMany({
      where: { sourceClass: { courseId } },
      select: { sourceClassId: true, makeupClassId: true },
    })
  }

  async replaceForSource(sourceClassId: number, makeupClassIds: number[]): Promise<void> {
    await this.prisma.courseClassMakeupOption.deleteMany({ where: { sourceClassId } })

    if (makeupClassIds.length === 0) {
      return
    }

    await this.prisma.courseClassMakeupOption.createMany({
      data: makeupClassIds.map((makeupClassId) => ({ sourceClassId, makeupClassId })),
    })
  }
}
