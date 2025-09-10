// src/application/use-cases/admin/update-admin.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { IsNumber, IsOptional } from 'class-validator';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository';
import { AdminResponseDto, UpdateAdminDto } from '../../dtos/admin/admin.dto';
import { UpdateUserDto } from '../../dtos/user/user.dto';
import {
    NotFoundException,
    ConflictException,
    BusinessLogicException
} from '../../../shared/exceptions/custom-exceptions';

@Injectable()
export class UpdateAdminUseCase {
    constructor(
        @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(adminId: number, dto: UpdateAdminDto): Promise<AdminResponseDto> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            // 1. Tìm admin với thông tin user
            const admin = await repos.adminRepository.findById(adminId);
            if (!admin) {
                throw new NotFoundException(`Admin với ID ${adminId} không tồn tại`);
            }

            if (!admin.user) {
                throw new BusinessLogicException('Thông tin user của admin không tồn tại');
            }

            // 2. Kiểm tra unique constraints trước khi cập nhật
            await this.validateUniqueConstraints(repos, admin.user.userId, dto);

            // 3. Tách data cho User và Admin
            const userUpdateData: UpdateUserDto = {};
            const adminUpdateData: { subjectId?: number | undefined } = {};

            // Tách các trường của User
            if (dto.username !== undefined) userUpdateData.username = dto.username;
            if (dto.email !== undefined) userUpdateData.email = dto.email;
            if (dto.firstName !== undefined) userUpdateData.firstName = dto.firstName;
            if (dto.lastName !== undefined) userUpdateData.lastName = dto.lastName;

            // Tách các trường của Admin
            if (dto.subjectId !== undefined) adminUpdateData.subjectId = dto.subjectId;

            // 4. Kiểm tra xem có thay đổi thực sự không
            const hasUserChanges = this.hasRealChanges(admin.user, userUpdateData);
            const hasAdminChanges = this.hasRealChanges(admin, adminUpdateData);

            if (!hasUserChanges && !hasAdminChanges) {
                // Không có thay đổi gì, trả về admin hiện tại
                return AdminResponseDto.fromUserWithAdmin(admin.user, admin);
            }

            // 5. Cập nhật User nếu có thay đổi
            if (hasUserChanges) {
                await repos.userRepository.update(admin.user.userId, userUpdateData);
            }

            // 6. Cập nhật Admin nếu có thay đổi
            if (hasAdminChanges) {
                await repos.adminRepository.update(adminId, adminUpdateData);
            }

            // 7. Lấy lại admin đã cập nhật với thông tin user mới
            const updatedAdmin = await repos.adminRepository.findById(adminId);
            if (!updatedAdmin) {
                throw new BusinessLogicException('Không thể lấy thông tin admin sau khi cập nhật');
            }

            return AdminResponseDto.fromUserWithAdmin(updatedAdmin.user, updatedAdmin);
        });
    }

    /**
     * Validate unique constraints cho username và email, và kiểm tra subjectId tồn tại
     */
    private async validateUniqueConstraints(repos: any, currentUserId: number, dto: UpdateAdminDto): Promise<void> {
        // Kiểm tra username unique
        if (dto.username) {
            const existingUser = await repos.userRepository.findByUsername(dto.username);
            if (existingUser && existingUser.userId !== currentUserId) {
                throw new ConflictException(`Username '${dto.username}' đã được sử dụng bởi user khác`);
            }
        }

        // Kiểm tra email unique
        if (dto.email) {
            const existingUser = await repos.userRepository.findByEmail(dto.email);
            if (existingUser && existingUser.userId !== currentUserId) {
                throw new ConflictException(`Email '${dto.email}' đã được sử dụng bởi user khác`);
            }
        }

        // Kiểm tra subjectId tồn tại
        if (dto.subjectId !== undefined) {
            if (dto.subjectId !== null) {
                // Nếu subjectId không phải null, kiểm tra subject có tồn tại không
                const subject = await repos.subjectRepository.findById(dto.subjectId);
                if (!subject) {
                    throw new NotFoundException(`Môn học với ID ${dto.subjectId} không tồn tại`);
                }
            }
            // Nếu subjectId là null thì cho phép (unassign subject)
        }
    }

    /**
     * Helper method để kiểm tra xem có thay đổi thực sự không
     */
    private hasRealChanges(currentData: any, updateData: any): boolean {
        for (const key in updateData) {
            if (updateData[key] !== undefined && updateData[key] !== currentData[key]) {
                return true;
            }
        }
        return false;
    }
}
