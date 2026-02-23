// src/infrastructure/mappers/exam/exam.mapper.ts
import { Exam as PrismaExam } from '@prisma/client'
import { Exam } from '../../../domain/entities/exam/exam.entity'
import { SubjectMapper } from '../subject/subject.mapper'
import { AdminMapper } from '../user/admin.mapper'
export class ExamMapper {
  /**
   * Convert Prisma model to Domain entity
   */
  static toDomainExam(prisma: any): Exam | null {
    if (!prisma) return null

    // Count questions from _count or from questions array
    const questionCount = prisma._count?.questions ?? prisma.questions?.length ?? 0

    return new Exam({
      examId: prisma.examId,
      title: prisma.title,
      grade: prisma.grade ?? undefined,
      createdBy: prisma.createdBy,
      visibility: prisma.visibility as any,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
      description: prisma.description,
      subjectId: prisma.subjectId,
      solutionYoutubeUrl: prisma.solutionYoutubeUrl,
      typeOfExam: prisma.typeOfExam as any,
      questionCount: questionCount,
      subject: prisma.subject ? SubjectMapper.toDomainSubject(prisma.subject) : null,
      admin: prisma.admin ? AdminMapper.toDomainAdmin(prisma.admin) : undefined,
      questions: prisma.questions,
      competitions: prisma.competitions,
    })
  }

  /**
   * Convert array of Prisma models to Domain entities
   */
  static toDomainExams(prismaExams: PrismaExam[]): Exam[] {
    return prismaExams.map((prisma) => this.toDomainExam(prisma)!).filter(Boolean)
  }
}
