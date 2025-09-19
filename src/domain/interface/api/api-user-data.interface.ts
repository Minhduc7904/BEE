// src/application/interfaces/api/api-user-data.interface.ts

/**
 * Interface cho dữ liệu user từ API external
 */
export interface ApiUserData {
  id: number
  lastName: string
  firstName: string
  username: string
  password: string // số điện thoại học sinh
  userType: string
  gender: boolean
  birthDate: string | null
  phone: string // số điện thoại phụ huynh
  highSchool: string
  class: string
  avatarUrl: string | null
  currentToken: string
  averageScore: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  graduationYear: number
}

/**
 * Response structure từ API
 */
export interface ApiUserResponse {
  success: boolean
  data: ApiUserData[] | ApiUserData
  message?: string
}
