import { QuestionImage } from '../entities/image/question-image.entity';

export interface CreateQuestionImageData {
  url: string;
  anotherUrl?: string;
  mimeType?: string;
  storageProvider: string;
  relatedType?: string;
  relatedId?: number;
  adminId: number;
}

export interface IQuestionImageRepository {
  create(data: CreateQuestionImageData): Promise<QuestionImage>;
  findById(id: number): Promise<QuestionImage | null>;
  findByUrl(url: string): Promise<QuestionImage | null>;
  findByAdmin(adminId: number): Promise<QuestionImage[]>;
  update(id: number, data: Partial<CreateQuestionImageData>): Promise<QuestionImage>;
  delete(id: number): Promise<boolean>;
}
