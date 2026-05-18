import { DocumentTagEntity } from '../entities'

export interface IDocumentTagRepository {
  setDocumentTags(documentId: number, tagIds: number[]): Promise<DocumentTagEntity[]>
}
