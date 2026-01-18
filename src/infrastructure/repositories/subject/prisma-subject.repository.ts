import { Injectable } from '@nestjs/common'
import { Subject } from '../../../domain/entities/subject/subject.entity'
import {
  CreateSubjectData,
  ISubjectRepository,
  UpdateSubjectData,
  FindAllSubjectsOptions,
  FindAllSubjectsResult,
} from '../../../domain/repositories/subject.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { SubjectMapper } from '../../mappers/subject/subject.mapper'
import { NumberUtil } from '../../../shared/utils'

@Injectable()
export class PrismaSubjectRepository implements ISubjectRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  async create(data: CreateSubjectData): Promise<Subject> {
    const created = await this.prisma.subject.create({
      data: {
        name: data.name,
        code: data.code,
      },
    })

    return SubjectMapper.toDomainSubject(created)!
  }

  async findById(id: number): Promise<Subject | null> {
    const numericId = NumberUtil.ensureValidId(id, 'Subject ID')

    const subject = await this.prisma.subject.findUnique({
      where: { subjectId: numericId },
      include: {
        chapters: true,
      },
    })

    if (!subject) return null

    return SubjectMapper.toDomainSubjectWithRelations(subject)!
  }

  async findByCode(code: string): Promise<Subject | null> {
    const subject = await this.prisma.subject.findUnique({
      where: { code: code },
    })

    if (!subject) return null

    return SubjectMapper.toDomainSubject(subject)!
  }

  async findByName(name: string): Promise<Subject | null> {
    const subject = await this.prisma.subject.findUnique({
      where: { name: name },
    })

    if (!subject) return null

    return SubjectMapper.toDomainSubject(subject)!
  }

  async findAll(limit?: number, offset?: number): Promise<Subject[]> {
    const subjects = await this.prisma.subject.findMany({
      take: limit,
      skip: offset,
      orderBy: { name: 'asc' },
    })

    return SubjectMapper.toDomainSubjects(subjects)
  }

  async findAllWithPagination(options: FindAllSubjectsOptions): Promise<FindAllSubjectsResult> {
    const where: any = {}

    // Search filter
    if (options.search) {
      where.OR = [
        { name: { contains: options.search } },
        { code: { contains: options.search } },
      ]
    }

    // Code filter
    if (options.code) {
      where.code = options.code
    }

    // Sort configuration
    const orderBy: any = {}
    if (options.sortBy) {
      orderBy[options.sortBy] = options.sortOrder || 'asc'
    } else {
      // Default sort
      orderBy.name = 'asc'
    }

    // Execute queries in parallel
    const [subjects, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        orderBy,
        skip: options.skip,
        take: options.take,
        include: {
          _count: {
            select: { chapters: true },
          },
        },
      }),
      this.prisma.subject.count({ where }),
    ])

    return {
      data: SubjectMapper.toDomainSubjects(subjects),
      total,
    }
  }

  async update(id: number, data: UpdateSubjectData): Promise<Subject> {
    const numericId = NumberUtil.ensureValidId(id, 'Subject ID')

    const updated = await this.prisma.subject.update({
      where: { subjectId: numericId },
      data: {
        name: data.name,
        code: data.code,
      },
    })

    return SubjectMapper.toDomainSubject(updated)!
  }

  async delete(id: number): Promise<void> {
    const numericId = NumberUtil.ensureValidId(id, 'Subject ID')

    await this.prisma.subject.delete({
      where: { subjectId: numericId },
    })
  }
}
