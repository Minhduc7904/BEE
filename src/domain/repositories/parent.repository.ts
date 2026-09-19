import { Parent } from '../entities/user/parent.entity'
import { CreateParentData, ParentRelationOptions } from '../interface/parent/parent.interface'

export interface IParentRepository {
  create(data: CreateParentData): Promise<Parent>
  findById(parentId: number, options?: ParentRelationOptions): Promise<Parent | null>
  findByUserId(userId: number, options?: ParentRelationOptions): Promise<Parent | null>
  findByPhone(phone: string, options?: ParentRelationOptions): Promise<Parent | null>
}
