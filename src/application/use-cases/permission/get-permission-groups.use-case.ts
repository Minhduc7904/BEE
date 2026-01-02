import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos'
import type { IPermissionRepository } from '../../../domain/repositories'

@Injectable()
export class GetPermissionGroupsUseCase {
    constructor(
        @Inject('IPermissionRepository')
        private readonly permissionRepository: IPermissionRepository,
    ) { }

    async execute(): Promise<BaseResponseDto<string[]>> {
        const groups = await this.permissionRepository.getDistinctGroups()

        return BaseResponseDto.success('Get permission groups successfully', groups)
    }
}
