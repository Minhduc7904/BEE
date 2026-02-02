// src/infrastructure/repositories/exam/prisma-section.repository.ts
import { Injectable } from '@nestjs/common'
import { Section } from '../../../domain/entities/exam/section.entity'
import { ISectionRepository, CreateSectionData } from '../../../domain/repositories/section.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { SectionMapper } from '../../mappers/exam/section.mapper'

@Injectable()
export class PrismaSectionRepository implements ISectionRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  async create(data: CreateSectionData, txClient?: any): Promise<Section> {
    const client = txClient || this.prisma

    const created = await client.section.create({
      data: {
        examId: data.examId,
        title: data.title,
        description: data.description,
        order: data.order,
      },
    })

    return SectionMapper.toDomainSection(created)!
  }

  async findById(id: number, txClient?: any): Promise<Section | null> {
    const client = txClient || this.prisma

    const section = await client.section.findUnique({
      where: { sectionId: id },
    })

    if (!section) return null

    return SectionMapper.toDomainSection(section)
  }

  async findByExamId(examId: number, txClient?: any): Promise<Section[]> {
    const client = txClient || this.prisma

    const sections = await client.section.findMany({
      where: { examId },
      orderBy: { order: 'asc' },
    })

    return SectionMapper.toDomainSections(sections)
  }

  async update(id: number, data: Partial<CreateSectionData>, txClient?: any): Promise<Section> {
    const client = txClient || this.prisma

    const updated = await client.section.update({
      where: { sectionId: id },
      data,
    })

    return SectionMapper.toDomainSection(updated)!
  }

  async delete(id: number, txClient?: any): Promise<void> {
    const client = txClient || this.prisma

    await client.section.delete({
      where: { sectionId: id },
    })
  }
}
