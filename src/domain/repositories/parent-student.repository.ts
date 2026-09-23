import { ParentStudent } from '../entities/user/parent-student.entity'
import { CreateParentStudentData } from '../interface/parent/parent.interface'

export interface IParentStudentRepository {
  createMany(data: CreateParentStudentData[]): Promise<ParentStudent[]>
  findByParentId(parentId: number): Promise<ParentStudent[]>
  exists(parentId: number, studentId: number): Promise<boolean>
  delete(parentId: number, studentId: number): Promise<boolean>
}
