import { Subject as PrismaSubject } from '@prisma/client'
import { Subject } from '../../domain/entities/subject/subject.entity'

export class SubjectMapper {
  /**
   * Convert Prisma model to Domain entity
   */
  static toDomainSubject(prisma: PrismaSubject | null): Subject | null {
    if (!prisma) return null

    return new Subject({
      subjectId: prisma.subjectId,
      name: prisma.name,
      code: prisma.code,
    })
  }

  /**
   * Convert array of Prisma models to Domain entities
   */
  static toDomainSubjects(prismaSubjects: PrismaSubject[]): Subject[] {
    return prismaSubjects.map((prisma) => this.toDomainSubject(prisma)!).filter(Boolean)
  }

  /**
   * Convert Prisma model with relations to Domain entity
   */
  static toDomainSubjectWithRelations(prisma: any): Subject | null {
    if (!prisma) return null

    return new Subject({
      subjectId: prisma.subjectId,
      name: prisma.name,
      code: prisma.code,
      chapters: prisma.chapters || [],
      admins: prisma.admins || [],
      exams: prisma.exams || [],
      questions: prisma.questions || [],
      courses: prisma.courses || [],
    })
  }
}
