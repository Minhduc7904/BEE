import { TempSection } from '../entities/exam-import/temp-section.entity'

export interface CreateTempSectionData {
  sessionId: number
  tempExamId: string
  title: string
  description?: string
  order: number
  metadata?: any
}

export interface UpdateTempSectionData {
  title?: string
  description?: string
  order?: number
  metadata?: any
  sectionId?: number
}

export interface ITempSectionRepository {
  create(data: CreateTempSectionData): Promise<TempSection>
  findById(tempSectionId: string): Promise<TempSection | null>
  findByIdWithRelations(tempSectionId: string): Promise<TempSection | null>
  findBySessionId(sessionId: number): Promise<TempSection[]>
  findByTempExamId(tempExamId: string): Promise<TempSection[]>
  findBySectionId(sectionId: number): Promise<TempSection | null>
  findAll(): Promise<TempSection[]>
  update(tempSectionId: string, data: UpdateTempSectionData): Promise<TempSection>
  delete(tempSectionId: string): Promise<void>
  linkToFinalSection(tempSectionId: string, sectionId: number): Promise<TempSection>
}
