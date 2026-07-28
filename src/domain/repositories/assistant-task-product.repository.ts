import { AssistantTaskProduct } from '../entities/assistant-task'
import type {
  AssistantTaskProductListOptions,
  AssistantTaskProductRelationOptions,
  CreateAssistantTaskProductData,
  UpdateAssistantTaskProductData,
} from '../interface/assistant-task'

export interface IAssistantTaskProductRepository {
  create(data: CreateAssistantTaskProductData): Promise<AssistantTaskProduct>
  findById(
    assistantTaskProductId: number,
    options?: AssistantTaskProductRelationOptions,
  ): Promise<AssistantTaskProduct | null>
  findAll(options?: AssistantTaskProductListOptions): Promise<AssistantTaskProduct[]>
  count(options?: AssistantTaskProductListOptions): Promise<number>
  update(assistantTaskProductId: number, data: UpdateAssistantTaskProductData): Promise<AssistantTaskProduct>
  delete(assistantTaskProductId: number): Promise<boolean>
}
