import { Injectable, Inject, UnauthorizedException } from '@nestjs/common'
import { JwtTokenService } from './jwt.service'
import type { IRoleRepository } from '../../domain/repositories/role.repository'
import type { IUserRepository } from '../../domain/repositories/user.repository'
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken'

export interface AuthenticatedUser {
  userId: number
  username: string
  userType: 'admin' | 'student'
  adminId?: number
  studentId?: number
  roles: Array<{
    id: number
    name: string
    description?: string
  }>
  permissions: Array<{
    id: number
    code: string
    name: string
    group?: string
  }>
}

@Injectable()
export class AuthService {
  constructor(
    @Inject('JWT_TOKEN_SERVICE') private readonly jwtTokenService: JwtTokenService,
    @Inject('IRoleRepository') private readonly roleRepository: IRoleRepository,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
  ) { }

  async verifyTokenAndGetUser(token: string): Promise<AuthenticatedUser> {
    try {
      // Verify JWT token
      const payload = await this.jwtTokenService.verifyAccessToken(token)

      // Kiểm tra user có tồn tại và đang active
      const user = await this.userRepository.findById(payload.sub)
      if (!user) {
        throw new UnauthorizedException('Tài khoản không tồn tại')
      }
      if (!user.isActive) {
        throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa')
      }

      // Get user roles from database
      const userRoles = await this.roleRepository.getUserRoles(payload.sub)

      // Extract all permissions from all roles (flatten and remove duplicates)
      const permissionsMap = new Map()

      for (const userRole of userRoles) {
        if (userRole.role?.roleId) {
          const roleWithPermissions = await this.roleRepository.findByIdWithPermissions(userRole.role.roleId)
          if (roleWithPermissions?.permissions) {
            roleWithPermissions.permissions.forEach(permission => {
              permissionsMap.set(permission.permissionId, {
                id: permission.permissionId,
                code: permission.code,
                name: permission.name,
                group: permission.group,
              })
            })
          }
        }
      }

      const permissions = Array.from(permissionsMap.values())

      return {
        userId: payload.sub,
        username: payload.username,
        userType: payload.userType,
        adminId: payload.adminId,
        studentId: payload.studentId,
        roles: userRoles.map((ur) => ({
          id: ur.role?.roleId || 0,
          name: ur.role?.roleName || '',
          description: ur.role?.description,
        })),
        permissions,
      }
    } catch (error) {
      console.error('AuthService error:', error)

      // Handle specific JWT errors
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token đã hết hạn, vui lòng đăng nhập lại')
      }

      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Token không hợp lệ')
      }

      // Handle other errors
      throw new UnauthorizedException('Xác thực thất bại')
    }
  }
}
