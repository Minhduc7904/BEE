// src/domain/repositories/section.repository.ts
import { Section } from '../entities/exam/section.entity'

export interface CreateSectionData {
  examId: number
  title: string
  order: number
  description?: string | null
}

export interface ISectionRepository {
  create(data: CreateSectionData, txClient?: any): Promise<Section>
  findById(id: number, txClient?: any): Promise<Section | null>
  findByExamId(examId: number, txClient?: any): Promise<Section[]>
  update(id: number, data: Partial<CreateSectionData>, txClient?: any): Promise<Section>
  delete(id: number, txClient?: any): Promise<void>
}
