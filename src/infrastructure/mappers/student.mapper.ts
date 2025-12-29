// src/infrastructure/mappers/student.mapper.ts
import { Student, StudentPointLog, PointType } from '../../domain/entities'
import { UserMapper } from '../mappers'

/**
 * Mapper class để convert từ Prisma Student models sang Domain Student entities
 */
export class StudentMapper {
  /**
   * Convert Prisma Student model sang Domain Student entity
   */
  static toDomainStudent(prismaStudent: any): Student | undefined {
    if (!prismaStudent) return undefined

    return new Student(
      prismaStudent.studentId,
      prismaStudent.userId,
      prismaStudent.grade,
      prismaStudent.studentPhone ?? undefined,
      prismaStudent.parentPhone ?? undefined,
      prismaStudent.school ?? undefined,
      UserMapper.toDomainUser(prismaStudent.user) ?? undefined,
    )
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

    return new StudentPointLog(
      prismaLog.id,
      prismaLog.studentId,
      prismaLog.type as PointType,
      prismaLog.points,
      prismaLog.source,
      prismaLog.note ?? undefined,
      prismaLog.createdAt,
      prismaLog.student ? StudentMapper.toDomainStudent(prismaLog.student) : undefined,
    )
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
