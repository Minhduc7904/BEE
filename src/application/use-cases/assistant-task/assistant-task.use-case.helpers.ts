import type { UnitOfWorkRepos } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { ValidationException } from '../../../shared/exceptions/custom-exceptions'

export function assertDateRange(startAt?: string, endAt?: string): void {
  if (startAt && endAt && new Date(startAt) > new Date(endAt)) {
    throw new ValidationException('Thời gian bắt đầu phải nhỏ hơn hoặc bằng thời gian kết thúc')
  }
}

export async function writeAssistantTaskAudit(
  repos: UnitOfWorkRepos,
  data: {
    adminId: number
    actionKey:
      | (typeof ACTION_KEYS.ASSISTANT_TASK)[keyof typeof ACTION_KEYS.ASSISTANT_TASK]
      | (typeof ACTION_KEYS.ASSISTANT_TASK_PRODUCT)[keyof typeof ACTION_KEYS.ASSISTANT_TASK_PRODUCT]
      | (typeof ACTION_KEYS.ASSISTANT_TASK_PRODUCT_SUBMISSION)[keyof typeof ACTION_KEYS.ASSISTANT_TASK_PRODUCT_SUBMISSION]
    resourceType:
      | typeof RESOURCE_TYPES.ASSISTANT_TASK
      | typeof RESOURCE_TYPES.ASSISTANT_TASK_PRODUCT
      | typeof RESOURCE_TYPES.ASSISTANT_TASK_PRODUCT_SUBMISSION
    resourceId: number
    beforeData?: unknown
    afterData?: unknown
  },
): Promise<void> {
  await repos.adminAuditLogRepository.create({
    adminId: data.adminId,
    actionKey: data.actionKey,
    status: AuditStatus.SUCCESS,
    resourceType: data.resourceType,
    resourceId: data.resourceId.toString(),
    beforeData: data.beforeData,
    afterData: data.afterData,
  })
}
