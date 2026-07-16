/** Application port and Nest injection token for AuthService. */
export abstract class AuthService {}

export interface AuthService {
  verifyTokenAndGetUser(...args: any[]): any
}
export interface AuthenticatedUser {
  userId: number
  username: string
  userType: 'admin' | 'student'
  adminId?: number
  studentId?: number
  roles: Array<{ id: number; name: string; description?: string }>
  permissions: Array<{ id: number; code: string; name: string; group?: string }>
}

