import { Prisma } from '@prisma/client'
import { ParentStudent } from '../../../domain/entities/user/parent-student.entity'
import { CreateParentStudentData } from '../../../domain/interface/parent/parent.interface'
import { IParentStudentRepository } from '../../../domain/repositories/parent-student.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { NumberUtil } from '../../../shared/utils'
import { ParentStudentMapper } from '../../mappers/user/parent-student.mapper'

export class PrismaParentStudentRepository implements IParentStudentRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async createMany(data: CreateParentStudentData[]): Promise<ParentStudent[]> {
    if (data.length === 0) return []

    await this.prisma.parentStudent.createMany({ data, skipDuplicates: true })

    const records = await this.prisma.parentStudent.findMany({
      where: {
        OR: data.map((item) => ({ parentId: item.parentId, studentId: item.studentId })),
      },
      include: { student: { include: { user: true } } },
    })

    return ParentStudentMapper.toDomainParentStudents(records)
  }

  async findByParentId(parentId: number): Promise<ParentStudent[]> {
    const records = await this.prisma.parentStudent.findMany({
      where: { parentId: NumberUtil.ensureValidId(parentId, 'Parent ID') },
      include: { student: { include: { user: true } } },
      orderBy: { studentId: 'asc' },
    })

    return ParentStudentMapper.toDomainParentStudents(records)
  }

  async exists(parentId: number, studentId: number): Promise<boolean> {
    const count = await this.prisma.parentStudent.count({
      where: {
        parentId: NumberUtil.ensureValidId(parentId, 'Parent ID'),
        studentId: NumberUtil.ensureValidId(studentId, 'Student ID'),
      },
    })

    return count > 0
  }
}
