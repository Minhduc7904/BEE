import { Injectable } from '@nestjs/common'
import { TempSection } from '../../../domain/entities/exam-import/temp-section.entity'
import {
  CreateTempSectionData,
  ITempSectionRepository,
  UpdateTempSectionData,
} from '../../../domain/repositories/temp-section.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { TempSectionMapper } from '../../mappers/exam-import/temp-section.mapper'

@Injectable()
export class PrismaTempSectionRepository implements ITempSectionRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  async create(data: CreateTempSectionData): Promise<TempSection> {
    const created = await this.prisma.tempSection.create({
      data: {
        sessionId: data.sessionId,
        tempExamId: data.tempExamId ?? null,
        title: data.title,
        description: data.description,
        order: data.order,
        metadata: data.metadata,
      },
    })

    return TempSectionMapper.toDomainTempSection(created)!
  }

  async findById(tempSectionId: number): Promise<TempSection | null> {
    const tempSection = await this.prisma.tempSection.findUnique({
      where: { tempSectionId },
    })

    if (!tempSection) return null

    return TempSectionMapper.toDomainTempSection(tempSection)!
  }

  async findByIdWithRelations(tempSectionId: number): Promise<TempSection | null> {
    const tempSection = await this.prisma.tempSection.findUnique({
      where: { tempSectionId },
      include: {
        tempQuestions: {
          include: {
            subject: true,
            tempStatements: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!tempSection) return null

    return TempSectionMapper.toDomainTempSection(tempSection)!
  }

  async findBySessionId(sessionId: number): Promise<TempSection[]> {
    const tempSections = await this.prisma.tempSection.findMany({
      where: { sessionId },
      orderBy: { order: 'asc' },
    })

    return TempSectionMapper.toDomainTempSections(tempSections)
  }

  async findByTempExamId(tempExamId: number): Promise<TempSection[]> {
    const tempSections = await this.prisma.tempSection.findMany({
      where: { tempExamId },
      orderBy: { order: 'asc' },
      include: {
        tempQuestions: {
          include: {
            subject: true,
            tempStatements: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    return TempSectionMapper.toDomainTempSections(tempSections)
  }

  async findBySectionId(sectionId: number): Promise<TempSection | null> {
    const tempSection = await this.prisma.tempSection.findUnique({
      where: { sectionId },
    })

    if (!tempSection) return null

    return TempSectionMapper.toDomainTempSection(tempSection)!
  }

  async findAll(): Promise<TempSection[]> {
    const tempSections = await this.prisma.tempSection.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return TempSectionMapper.toDomainTempSections(tempSections)
  }

  async update(tempSectionId: number, data: UpdateTempSectionData): Promise<TempSection> {
    const updated = await this.prisma.tempSection.update({
      where: { tempSectionId },
      data: {
        title: data.title,
        description: data.description,
        order: data.order,
        metadata: data.metadata,
        sectionId: data.sectionId,
      },
    })

    return TempSectionMapper.toDomainTempSection(updated)!
  }

  async delete(tempSectionId: number): Promise<void> {
    await this.prisma.tempSection.delete({
      where: { tempSectionId },
    })
  }

  async linkToFinalSection(tempSectionId: number, sectionId: number): Promise<TempSection> {
    const updated = await this.prisma.tempSection.update({
      where: { tempSectionId },
      data: { sectionId },
    })

    return TempSectionMapper.toDomainTempSection(updated)!
  }
}
