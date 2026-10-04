import { PrismaClient } from '@prisma/client'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import { PrismaCourseClassMakeupOptionRepository } from '../../../infrastructure/repositories/class/prisma-course-class-makeup-option.repository'
import { PrismaCourseClassRepository } from '../../../infrastructure/repositories/class/prisma-course-class.repository'
import { ReplaceCourseClassMakeupOptionsDto } from '../../dtos/course-class/replace-course-class-makeup-options.dto'
import { ConflictException } from '../../../shared/exceptions/custom-exceptions'
import { ReplaceCourseClassMakeupOptionsUseCase } from './replace-course-class-makeup-options.use-case'

/**
 * Integration test với MySQL thật cho invariant "không có chu trình" khi cập nhật đồng thời.
 *
 * Chỉ chạy khi đặt MAKEUP_OPTIONS_IT_DATABASE_URL trỏ tới một database RIÊNG đã `prisma migrate deploy`
 * (không dùng database phát triển chính), ví dụ:
 *   MAKEUP_OPTIONS_IT_DATABASE_URL="mysql://root:***@localhost:3307/bee_makeup_it" npx jest makeup-options.integration
 *
 * Audit log được thay bằng stub vì bảng audit có FK tới Admin; phần được kiểm chứng là transaction,
 * locking, đọc graph và ghi quan hệ học bù trên cùng database.
 */
const databaseUrl = process.env.MAKEUP_OPTIONS_IT_DATABASE_URL
const describeWithDatabase = databaseUrl ? describe : describe.skip

const ADMIN_ID = 1
const RACE_ITERATIONS = 30

function dto(makeupClassIds: number[]): ReplaceCourseClassMakeupOptionsDto {
  const body = new ReplaceCourseClassMakeupOptionsDto()
  body.makeupClassIds = makeupClassIds
  return body
}

describeWithDatabase('ReplaceCourseClassMakeupOptionsUseCase (MySQL thật)', () => {
  jest.setTimeout(120000)

  let prisma: PrismaClient
  let useCase: ReplaceCourseClassMakeupOptionsUseCase
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
              courseClassMakeupOptionRepository: new PrismaCourseClassMakeupOptionRepository(tx),
              adminAuditLogRepository: auditLogRepository,
            } as unknown as UnitOfWorkRepos),
          { maxWait: 10000, timeout: 30000, isolationLevel: options?.isolationLevel },
        ),
    }

    useCase = new ReplaceCourseClassMakeupOptionsUseCase(unitOfWork)
  })

  afterAll(async () => {
    // Xóa course sẽ cascade xóa lớp và cấu hình học bù tạo trong test.
    await prisma.course.deleteMany({ where: { courseId: { in: createdCourseIds } } })
    await prisma.$disconnect()
  })

  async function createCourseWithClasses(classCount: number) {
    const course = await prisma.course.create({
      data: {
        code: `MKUP-IT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: 'Khóa học kiểm thử học bù',
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

  it('lưu và đọc lại cấu hình học bù trên database thật', async () => {
    const { classIds } = await createCourseWithClasses(3)
    const [a, b, c] = classIds

    await useCase.execute(a, dto([b, c]), ADMIN_ID)

    const edges = await prisma.courseClassMakeupOption.findMany({
      where: { sourceClassId: a },
      select: { makeupClassId: true },
      orderBy: { makeupClassId: 'asc' },
    })
    expect(edges.map((edge) => edge.makeupClassId)).toEqual([b, c])

    await useCase.execute(a, dto([c]), ADMIN_ID)
    const afterReplace = await prisma.courseClassMakeupOption.findMany({ where: { sourceClassId: a } })
    expect(afterReplace.map((edge) => edge.makeupClassId)).toEqual([c])
  })

  it('hai request đồng thời A→B và B→A chỉ cho phép đúng một request thành công', async () => {
    for (let iteration = 0; iteration < RACE_ITERATIONS; iteration += 1) {
      const { classIds } = await createCourseWithClasses(2)
      const [a, b] = classIds

      const results = await Promise.allSettled([
        useCase.execute(a, dto([b]), ADMIN_ID),
        useCase.execute(b, dto([a]), ADMIN_ID),
      ])

      const fulfilled = results.filter((result) => result.status === 'fulfilled')
      const rejected = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')

      expect({ iteration, fulfilled: fulfilled.length }).toEqual({ iteration, fulfilled: 1 })
      expect(rejected).toHaveLength(1)
      expect(rejected[0].reason).toBeInstanceOf(ConflictException)

      const edges = await prisma.courseClassMakeupOption.findMany({
        where: { sourceClassId: { in: [a, b] } },
      })
      expect({ iteration, edges: edges.length }).toEqual({ iteration, edges: 1 })
    }
  })

  it('ba request đồng thời tạo vòng A→B, B→C, C→A chỉ cho phép hai request thành công và không có chu trình', async () => {
    for (let iteration = 0; iteration < RACE_ITERATIONS; iteration += 1) {
      const { classIds } = await createCourseWithClasses(3)
      const [a, b, c] = classIds

      const results = await Promise.allSettled([
        useCase.execute(a, dto([b]), ADMIN_ID),
        useCase.execute(b, dto([c]), ADMIN_ID),
        useCase.execute(c, dto([a]), ADMIN_ID),
      ])

      const fulfilled = results.filter((result) => result.status === 'fulfilled')
      const rejected = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')

      expect({ iteration, fulfilled: fulfilled.length }).toEqual({ iteration, fulfilled: 2 })
      expect(rejected[0].reason).toBeInstanceOf(ConflictException)

      const edges = await prisma.courseClassMakeupOption.findMany({
        where: { sourceClassId: { in: [a, b, c] } },
      })
      expect({ iteration, edges: edges.length }).toEqual({ iteration, edges: 2 })
    }
  })
})
