// src/infrastructure/mappers/student.mapper.ts
import { Student, StudentPointLog } from '../../../domain/entities'
import { PointType } from '../../../shared/enums'
import { UserMapper } from '..'

/**
 * Mapper class để convert từ Prisma Student models sang Domain Student entities
 */
export class StudentMapper {
  /**
   * Convert Prisma Student model sang Domain Student entity
   */
  static toDomainStudent(prismaStudent: any): Student | undefined {
    if (!prismaStudent) return undefined

    return new Student({
      studentId: prismaStudent.studentId,
      userId: prismaStudent.userId,
      grade: prismaStudent.grade,
      studentPhone: prismaStudent.studentPhone ?? undefined,
      parentPhone: prismaStudent.parentPhone ?? undefined,
      school: prismaStudent.school ?? undefined,
      user: UserMapper.toDomainUser(prismaStudent.user) ?? undefined,
    })
  }

  /**
   * Convert array của Prisma Students sang array của Domain Students
   */
  static toDomainStudents(prismaStudents: any[]): Student[] {
    return prismaStudents
      .map((student) => this.toDomainStudent(student))
      .filter(Boolean) as Student[]
  }
}

/**
 * Mapper class để convert từ Prisma StudentPointLog models sang Domain StudentPointLog entities
 */
export class StudentPointLogMapper {
  /**
   * Convert Prisma StudentPointLog model sang Domain StudentPointLog entity
   */
  static toDomainStudentPointLog(prismaLog: any): StudentPointLog | undefined {
    if (!prismaLog) return undefined

    return new StudentPointLog({
      id: prismaLog.id,
      studentId: prismaLog.studentId,
      type: prismaLog.type as PointType,
      points: prismaLog.points,
      source: prismaLog.source,
      createdAt: prismaLog.createdAt,
      note: prismaLog.note ?? undefined,
      student: prismaLog.student ? StudentMapper.toDomainStudent(prismaLog.student) : undefined,
    })
  }

  /**
   * Convert array của Prisma StudentPointLogs sang array của Domain StudentPointLogs
   */
  static toDomainStudentPointLogs(prismaLogs: any[]): StudentPointLog[] {
    return prismaLogs
      .map((log) => this.toDomainStudentPointLog(log))
      .filter(Boolean) as StudentPointLog[]
  }
}
