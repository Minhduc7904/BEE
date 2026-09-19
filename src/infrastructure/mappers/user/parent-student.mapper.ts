import { ParentStudent as PrismaParentStudent, Prisma } from '@prisma/client'
import { ParentStudent } from '../../../domain/entities/user/parent-student.entity'
import { StudentMapper } from './student.mapper'

type PrismaParentStudentWithStudent = Prisma.ParentStudentGetPayload<{
  include: { student: { include: { user: true } } }
}>

export class ParentStudentMapper {
  static toDomainParentStudent(
    record: PrismaParentStudent | PrismaParentStudentWithStudent | null,
  ): ParentStudent | null {
    if (!record) return null

    return new ParentStudent({
      parentId: record.parentId,
      studentId: record.studentId,
      student: 'student' in record ? StudentMapper.toDomainStudent(record.student) : undefined,
    })
  }

  static toDomainParentStudents(records: Array<PrismaParentStudent | PrismaParentStudentWithStudent>): ParentStudent[] {
    return records
      .map((record) => this.toDomainParentStudent(record))
      .filter((record): record is ParentStudent => record !== null)
  }
}
