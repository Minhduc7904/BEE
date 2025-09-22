import { Image } from '../entities/image/image.entity'
import { StorageProvider } from '../../shared/enums/storage-provider.enum'

export interface CreateImageData {
  url: string
  anotherUrl?: string
  mimeType?: string
  storageProvider: StorageProvider
  adminId?: number
  caption?: string
}

export interface IImageRepository {
  create(data: CreateImageData): Promise<Image>
  findById(id: number): Promise<Image | null>
  findByUrl(url: string): Promise<Image | null>
  findByAdmin(adminId: number): Promise<Image[]>
  update(id: number, data: Partial<CreateImageData>): Promise<Image>
  delete(id: number): Promise<boolean>
}
