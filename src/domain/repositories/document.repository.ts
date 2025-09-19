import { Document } from '../entities/document/document.entity'
import { StorageProvider } from '../../shared/enums/storage-provider.enum'

export interface CreateDocumentData {
  adminId?: number
  description?: string
  url: string
  anotherUrl?: string
  mimeType?: string
  subjectId?: number
  relatedType?: string
  relatedId?: number
  storageProvider: StorageProvider
}

export interface IDocumentRepository {
  create(data: CreateDocumentData): Promise<Document>
  findById(id: number): Promise<Document | null>
  findAll(limit?: number, offset?: number): Promise<Document[]>
  update(id: number, data: Partial<CreateDocumentData>): Promise<Document>
  delete(id: number): Promise<void>
  findByRelated(relatedType: string, relatedId: number): Promise<Document[]>
}
