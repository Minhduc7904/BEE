import { Injectable, Inject } from "@nestjs/common";
import { BaseResponseDto } from "src/application/dtos/base-response.dto";
import { CreateRoleDto, RoleResponseDto } from "src/application/dtos/role/role.dto";
import type { IRoleRepository } from "src/domain/repositories/role.repository";
import { ConflictException } from "src/shared/exceptions/custom-exceptions";

@Injectable()
export class CreateRoleUseCase {
    constructor(@Inject('ROLE_REPOSITORY') private readonly roleRepository: IRoleRepository) { }

    async execute(dto: CreateRoleDto): Promise<BaseResponseDto<RoleResponseDto>> {
        // Kiểm tra role name đã tồn tại chưa
        const existingRole = await this.roleRepository.findByName(dto.roleName);
        if (existingRole) {
            throw new ConflictException(`Role với tên '${dto.roleName}' đã tồn tại`);
        }

        // Tạo role mới
        const role = await this.roleRepository.create({
            roleName: dto.roleName,
            description: dto.description,
        });

        const response: RoleResponseDto = {
            roleId: role.roleId,
            roleName: role.roleName,
            description: role.description,
            isAssignable: role.isAssignable,
            requiredByRoleId: role.requiredByRoleId,
            createdAt: role.createdAt,
        };

        return BaseResponseDto.success('Role được tạo thành công', response);
    }
}