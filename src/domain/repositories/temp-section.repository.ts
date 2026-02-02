import { TempSection } from '../entities/exam-import/temp-section.entity'

export interface CreateTempSectionData {
  sessionId: number
  tempExamId?: number | null
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
  findById(tempSectionId: number): Promise<TempSection | null>
  findByIdWithRelations(tempSectionId: number): Promise<TempSection | null>
  findBySessionId(sessionId: number): Promise<TempSection[]>
  findByTempExamId(tempExamId: number): Promise<TempSection[]>
  findBySectionId(sectionId: number): Promise<TempSection | null>
  findAll(): Promise<TempSection[]>
  update(tempSectionId: number, data: UpdateTempSectionData): Promise<TempSection>
  delete(tempSectionId: number): Promise<void>
  linkToFinalSection(tempSectionId: number, sectionId: number): Promise<TempSection>
}
