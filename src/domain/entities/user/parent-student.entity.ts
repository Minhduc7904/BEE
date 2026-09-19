import { Student } from './student.entity'

export class ParentStudent {
  parentId: number
  studentId: number
  student?: Student

  constructor(data: { parentId: number; studentId: number; student?: Student }) {
    this.parentId = data.parentId
    this.studentId = data.studentId
    this.student = data.student
  }

  equals(other: ParentStudent): boolean {
    return this.parentId === other.parentId && this.studentId === other.studentId
  }
}
