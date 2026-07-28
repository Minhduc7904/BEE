import { AssistantTaskProduct } from '../entities/assistant-task'
import type {
  AssistantTaskProductListOptions,
  CreateAssistantTaskProductData,
  UpdateAssistantTaskProductData,
} from '../interface/assistant-task'

export interface IAssistantTaskProductRepository {
  create(data: CreateAssistantTaskProductData): Promise<AssistantTaskProduct>
  findById(assistantTaskProductId: number): Promise<AssistantTaskProduct | null>
  findAll(options?: AssistantTaskProductListOptions): Promise<AssistantTaskProduct[]>
  update(assistantTaskProductId: number, data: UpdateAssistantTaskProductData): Promise<AssistantTaskProduct>
  delete(assistantTaskProductId: number): Promise<boolean>
}
