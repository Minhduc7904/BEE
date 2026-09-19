export interface CreateParentData {
  userId: number
  phone: string
}

export interface ParentRelationOptions {
  includeUser?: boolean
  includeStudents?: boolean
}

export interface CreateParentStudentData {
  parentId: number
  studentId: number
}
