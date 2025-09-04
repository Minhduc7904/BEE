import { SolutionImage } from '../entities/image/solution-image.entity';

export interface CreateSolutionImageData {
  url: string;
  anotherUrl?: string;
  mimeType?: string;
  storageProvider: string;
  adminId: number;
}

export interface ISolutionImageRepository {
  create(data: CreateSolutionImageData): Promise<SolutionImage>;
  findById(id: number): Promise<SolutionImage | null>;
  findByUrl(url: string): Promise<SolutionImage | null>;
  findByAdmin(adminId: number): Promise<SolutionImage[]>;
  update(id: number, data: Partial<CreateSolutionImageData>): Promise<SolutionImage>;
  delete(id: number): Promise<boolean>;
}
