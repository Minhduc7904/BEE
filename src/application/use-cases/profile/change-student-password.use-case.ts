// src/application/use-cases/profile/change-student-password.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos'
import { ChangePasswordDto } from '../../dtos/profile/change-password.dto'
import { PasswordService } from '../../../infrastructure/services/password.service'
import {
    NotFoundException,
    UnauthorizedException,
    ValidationException,
    ForbiddenException,
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class ChangeStudentPasswordUseCase {
    constructor(
        @Inject('IUserRepository') private readonly userRepository: IUserRepository,
        @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
    ) { }

    async execute(userId: number, dto: ChangePasswordDto): Promise<BaseResponseDto<null>> {
        // 1. Tìm user theo userId
        const user = await this.userRepository.findById(userId)
        if (!user) {
            throw new NotFoundException('User not found')
        }

        if (!user.isActive) {
            throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
        }

        // 2. Kiểm tra mật khẩu cũ
        const isOldPasswordValid = await this.passwordService.comparePassword(
            dto.oldPassword,
            user.passwordHash,
        )
        if (!isOldPasswordValid) {
            throw new UnauthorizedException('Mật khẩu cũ không chính xác')
        }

        // 3. Kiểm tra mật khẩu mới không trùng mật khẩu cũ
        const isSamePassword = await this.passwordService.comparePassword(
            dto.newPassword,
            user.passwordHash,
        )
        if (isSamePassword) {
            throw new ValidationException('Mật khẩu mới không được trùng với mật khẩu cũ')
        }

        // 4. Hash mật khẩu mới và cập nhật
        const newPasswordHash = await this.passwordService.hashPassword(dto.newPassword)
        await this.userRepository.update(userId, { passwordHash: newPasswordHash })

        return BaseResponseDto.success('Đổi mật khẩu thành công', null)
    }
}
