import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { Permission } from '../../../domain/entities/role/permission.entity'
import {
  PERMISSION_CODE_DEFINITIONS,
  PermissionCodeDefinition,
  PermissionCodeDefinitionTree,
} from '../../../shared/constants/permissions/permission.codes'

type SyncStatus = 'created' | 'updated' | 'unchanged'

interface FlattenedPermissionCode extends PermissionCodeDefinition {
  sourceKey: string
}

interface SyncPermissionResultItem extends FlattenedPermissionCode {
  permissionId: number
  status: SyncStatus
}

interface DuplicatePermissionCode {
  code: string
  sourceKeys: string[]
}

export interface SyncPermissionsFromCodesResponse {
  source: string
  totalFromSource: number
  totalUnique: number
  createdCount: number
  updatedCount: number
  unchangedCount: number
  duplicateCodes: DuplicatePermissionCode[]
  permissions: SyncPermissionResultItem[]
}

@Injectable()
export class SyncPermissionsFromCodesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(): Promise<BaseResponseDto<SyncPermissionsFromCodesResponse>> {
    const flattened = this.flattenPermissionDefinitions(PERMISSION_CODE_DEFINITIONS)
    const duplicateCodes = this.findDuplicateCodes(flattened)
    const seeds = this.uniqueByCode(flattened)

    const permissions = await this.unitOfWork.executeInTransaction(async (repos) => {
      const results: SyncPermissionResultItem[] = []

      for (const seed of seeds) {
        const existing = await repos.permissionRepository.findByCode(seed.code)
        const permissionData = {
          code: seed.code,
          name: seed.name,
          description: seed.description,
          group: seed.group,
          isSystem: seed.isSystem,
        }
        const permission = await repos.permissionRepository.upsertByCode(permissionData)

        results.push({
          ...seed,
          permissionId: permission.permissionId,
          status: this.getSyncStatus(existing, permissionData),
        })
      }

      return results
    })

    return BaseResponseDto.success('Sync permissions from PERMISSION_CODES successfully', {
      source: 'src/shared/constants/permissions/permission.codes.ts',
      totalFromSource: flattened.length,
      totalUnique: seeds.length,
      createdCount: permissions.filter((item) => item.status === 'created').length,
      updatedCount: permissions.filter((item) => item.status === 'updated').length,
      unchangedCount: permissions.filter((item) => item.status === 'unchanged').length,
      duplicateCodes,
      permissions,
    })
  }

  private flattenPermissionDefinitions(
    node: PermissionCodeDefinitionTree,
    path: string[] = [],
  ): FlattenedPermissionCode[] {
    if (this.isPermissionDefinition(node)) {
      return [
        {
          ...node,
          sourceKey: path.join('.'),
        },
      ]
    }

    return Object.entries(node).flatMap(([key, value]) => this.flattenPermissionDefinitions(value, [...path, key]))
  }

  private isPermissionDefinition(node: PermissionCodeDefinitionTree): node is PermissionCodeDefinition {
    return typeof (node as PermissionCodeDefinition).code === 'string'
  }

  private uniqueByCode(items: FlattenedPermissionCode[]): FlattenedPermissionCode[] {
    const uniqueItems = new Map<string, FlattenedPermissionCode>()

    for (const item of items) {
      if (!uniqueItems.has(item.code)) {
        uniqueItems.set(item.code, item)
      }
    }

    return Array.from(uniqueItems.values())
  }

  private findDuplicateCodes(items: FlattenedPermissionCode[]): DuplicatePermissionCode[] {
    const sourceKeysByCode = new Map<string, string[]>()

    for (const item of items) {
      sourceKeysByCode.set(item.code, [...(sourceKeysByCode.get(item.code) || []), item.sourceKey])
    }

    return Array.from(sourceKeysByCode.entries())
      .filter(([, sourceKeys]) => sourceKeys.length > 1)
      .map(([code, sourceKeys]) => ({ code, sourceKeys }))
  }

  private getSyncStatus(existing: Permission | null, seed: PermissionCodeDefinition): SyncStatus {
    if (!existing) {
      return 'created'
    }

    const isUnchanged =
      existing.name === seed.name &&
      (existing.description ?? undefined) === seed.description &&
      (existing.group ?? undefined) === seed.group &&
      existing.isSystem === seed.isSystem

    return isUnchanged ? 'unchanged' : 'updated'
  }
}
