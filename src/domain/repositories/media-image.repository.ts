import { MediaImage } from '../entities/image/media-image.entity';

export interface CreateMediaImageData {
  url: string;
  anotherUrl?: string;
  mimeType?: string;
  storageProvider: string;
  adminId: number;
}

export interface IMediaImageRepository {
  create(data: CreateMediaImageData): Promise<MediaImage>;
  findById(id: number): Promise<MediaImage | null>;
  findByUrl(url: string): Promise<MediaImage | null>;
  findByAdmin(adminId: number): Promise<MediaImage[]>;
  update(id: number, data: Partial<CreateMediaImageData>): Promise<MediaImage>;
  delete(id: number): Promise<boolean>;
}
