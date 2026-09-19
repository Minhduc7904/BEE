import { User } from './user.entity'
import { ParentStudent } from './parent-student.entity'

export class Parent {
  parentId: number
  userId: number
  phone: string
  user?: User
  studentLinks?: ParentStudent[]

  constructor(data: { parentId: number; userId: number; phone: string; user?: User; studentLinks?: ParentStudent[] }) {
    this.parentId = data.parentId
    this.userId = data.userId
    this.phone = data.phone
    this.user = data.user
    this.studentLinks = data.studentLinks
  }

  equals(other: Parent): boolean {
    return this.parentId === other.parentId
  }
}
