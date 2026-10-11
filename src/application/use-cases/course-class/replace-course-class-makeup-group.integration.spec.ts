import { PrismaClient } from '@prisma/client'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import { PrismaCourseClassMakeupGroupRepository } from '../../../infrastructure/repositories/class/prisma-course-class-makeup-group.repository'
import { PrismaCourseClassRepository } from '../../../infrastructure/repositories/class/prisma-course-class.repository'
import { ReplaceCourseClassMakeupGroupDto } from '../../dtos/course-class/replace-course-class-makeup-group.dto'
import { ConflictException } from '../../../shared/exceptions/custom-exceptions'
import { ReplaceCourseClassMakeupGroupUseCase } from './replace-course-class-makeup-group.use-case'

/**
 * Integration test với MySQL thật cho nhóm lớp học bù.
 *
 * Chỉ chạy khi đặt MAKEUP_GROUP_IT_DATABASE_URL trỏ tới một database RIÊNG đã `prisma migrate deploy`
 * (không dùng database phát triển chính), ví dụ:
 *   MAKEUP_GROUP_IT_DATABASE_URL="mysql://root:***@localhost:3307/bee_makeup_it" npx jest makeup-group.integration
 *
 * Audit log được thay bằng stub vì bảng audit có FK tới Admin; phần được kiểm chứng là transaction
 * và ghi nhóm học bù trên cùng database.
 */
const databaseUrl = process.env.MAKEUP_GROUP_IT_DATABASE_URL
const describeWithDatabase = databaseUrl ? describe : describe.skip

const ADMIN_ID = 1
const RACE_ITERATIONS = 15

function dto(makeupClassIds: number[]): ReplaceCourseClassMakeupGroupDto {
  const body = new ReplaceCourseClassMakeupGroupDto()
  body.makeupClassIds = makeupClassIds
  return body
}

describeWithDatabase('ReplaceCourseClassMakeupGroupUseCase (MySQL thật)', () => {
  jest.setTimeout(120000)

  let prisma: PrismaClient
  let useCase: ReplaceCourseClassMakeupGroupUseCase
  const createdCourseIds: number[] = []

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } })
    await prisma.$connect()

    const auditLogRepository = { create: jest.fn().mockResolvedValue(undefined) }
    const unitOfWork: IUnitOfWork = {
      executeInTransaction: (work, options) =>
        prisma.$transaction(
          (tx) =>
            work({
              courseClassRepository: new PrismaCourseClassRepository(tx),
              courseClassMakeupGroupRepository: new PrismaCourseClassMakeupGroupRepository(tx),
              adminAuditLogRepository: auditLogRepository,
            } as unknown as UnitOfWorkRepos),
          { maxWait: 10000, timeout: 30000, isolationLevel: options?.isolationLevel },
        ),
    }

    useCase = new ReplaceCourseClassMakeupGroupUseCase(unitOfWork)
  })

  afterAll(async () => {
    // Xóa course cascade xóa lớp và thành viên; nhóm rỗng còn lại được dọn riêng.
    await prisma.course.deleteMany({ where: { courseId: { in: createdCourseIds } } })
    await prisma.courseClassMakeupGroup.deleteMany({ where: { members: { none: {} } } })
    await prisma.$disconnect()
  })

  async function createCourseWithClasses(classCount: number) {
    const course = await prisma.course.create({
      data: {
        code: `MKGRP-IT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: 'Khóa học kiểm thử nhóm học bù',
      },
    })
    createdCourseIds.push(course.courseId)

    const classIds: number[] = []
    for (let index = 0; index < classCount; index += 1) {
      const courseClass = await prisma.courseClass.create({
        data: { courseId: course.courseId, className: `Lớp ${index + 1}` },
      })
      classIds.push(courseClass.classId)
    }

    return { courseId: course.courseId, classIds }
  }

  async function groupsOf(courseId: number) {
    const groups = await prisma.courseClassMakeupGroup.findMany({
      where: { members: { some: { courseClass: { courseId } } } },
      orderBy: { makeupGroupId: 'asc' },
      select: { makeupGroupId: true, members: { select: { classId: true }, orderBy: { classId: 'asc' } } },
    })
    return groups.map((group) => ({
      groupId: group.makeupGroupId,
      classIds: group.members.map((member) => member.classId),
    }))
  }

  it('tạo nhóm, thêm bớt lớp rồi giải tán nhóm trên database thật', async () => {
    const { courseId, classIds } = await createCourseWithClasses(4)
    const [a, b, c, d] = classIds

    await useCase.execute(a, dto([b, c]), ADMIN_ID)
    expect((await groupsOf(courseId)).map((group) => group.classIds)).toEqual([[a, b, c]])

    await useCase.execute(a, dto([c, d]), ADMIN_ID)
    expect((await groupsOf(courseId)).map((group) => group.classIds)).toEqual([[a, c, d]])

    await useCase.execute(a, dto([]), ADMIN_ID)
    expect(await groupsOf(courseId)).toEqual([])
  })

  it('sửa nhóm từ thẻ của một lớp bất kỳ trong nhóm đều áp dụng cho cả nhóm', async () => {
    const { courseId, classIds } = await createCourseWithClasses(3)
    const [a, b, c] = classIds

    await useCase.execute(a, dto([b, c]), ADMIN_ID)
    await useCase.execute(b, dto([a]), ADMIN_ID)

    const groups = await groupsOf(courseId)
    expect(groups.map((group) => group.classIds)).toEqual([[a, b]])
  })

  it('từ chối lớp đang ở nhóm khác bằng ConflictException và không đổi dữ liệu', async () => {
    const { courseId, classIds } = await createCourseWithClasses(4)
    const [a, b, c, d] = classIds

    await useCase.execute(a, dto([b]), ADMIN_ID)
    await useCase.execute(c, dto([d]), ADMIN_ID)
    const before = await groupsOf(courseId)

    await expect(useCase.execute(a, dto([b, c]), ADMIN_ID)).rejects.toBeInstanceOf(ConflictException)

    expect(await groupsOf(courseId)).toEqual(before)
  })

  it('dọn nhóm mồ côi do xóa lớp: lớp còn lại được vào nhóm mới và nhóm cũ bị xóa', async () => {
    const { courseId, classIds } = await createCourseWithClasses(3)
    const [a, b, c] = classIds

    await useCase.execute(a, dto([b]), ADMIN_ID)
    await prisma.courseClass.delete({ where: { classId: b } })
    expect((await groupsOf(courseId)).map((group) => group.classIds)).toEqual([[a]])

    await useCase.execute(c, dto([a]), ADMIN_ID)

    expect((await groupsOf(courseId)).map((group) => group.classIds)).toEqual([[a, c]])
  })

  it('hai lần lưu đồng thời cùng muốn một lớp vào hai nhóm khác nhau: chỉ một thành công, lớp chỉ ở một nhóm', async () => {
    for (let iteration = 0; iteration < RACE_ITERATIONS; iteration += 1) {
      const { courseId, classIds } = await createCourseWithClasses(3)
      const [a, b, c] = classIds

      const results = await Promise.allSettled([
        useCase.execute(a, dto([b]), ADMIN_ID),
        useCase.execute(c, dto([b]), ADMIN_ID),
      ])

      const fulfilled = results.filter((result) => result.status === 'fulfilled')
      const rejected = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')

      expect({ iteration, fulfilled: fulfilled.length }).toEqual({ iteration, fulfilled: 1 })
      expect(rejected[0].reason).toBeInstanceOf(ConflictException)

      const groups = await groupsOf(courseId)
      expect(groups).toHaveLength(1)
      expect(groups[0].classIds).toContain(b)
      expect(groups[0].classIds).toHaveLength(2)
    }
  })

  it('hai lần lưu đồng thời tạo cùng một nhóm từ hai phía: không lỗi lạ, không sinh nhóm trùng', async () => {
    for (let iteration = 0; iteration < RACE_ITERATIONS; iteration += 1) {
      const { courseId, classIds } = await createCourseWithClasses(2)
      const [a, b] = classIds

      const results = await Promise.allSettled([
        useCase.execute(a, dto([b]), ADMIN_ID),
        useCase.execute(b, dto([a]), ADMIN_ID),
      ])

      const rejected = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      for (const failure of rejected) {
        expect(failure.reason).toBeInstanceOf(ConflictException)
      }

      expect(results.some((result) => result.status === 'fulfilled')).toBe(true)
      expect((await groupsOf(courseId)).map((group) => group.classIds)).toEqual([[a, b]])
    }
  })
})
