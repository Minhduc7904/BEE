import { Parent as PrismaParent, Prisma } from '@prisma/client'
import { Parent } from '../../../domain/entities/user/parent.entity'
import { UserMapper } from './user.mapper'
import { ParentStudentMapper } from './parent-student.mapper'

type PrismaParentWithRelations = Prisma.ParentGetPayload<{
  include: {
    user: true
    students: { include: { student: { include: { user: true } } } }
  }
}>

export class ParentMapper {
  static toDomainParent(record: PrismaParent | PrismaParentWithRelations | null): Parent | null {
    if (!record) return null

    return new Parent({
      parentId: record.parentId,
      userId: record.userId,
      phone: record.phone,
      user: 'user' in record ? (UserMapper.toDomainUser(record.user) ?? undefined) : undefined,
      studentLinks: 'students' in record ? ParentStudentMapper.toDomainParentStudents(record.students) : undefined,
    })
  }

  static toDomainParents(records: Array<PrismaParent | PrismaParentWithRelations>): Parent[] {
    return records.map((record) => this.toDomainParent(record)).filter((record): record is Parent => record !== null)
  }
}
