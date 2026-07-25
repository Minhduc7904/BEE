import { createHash, randomBytes } from 'crypto'

import type { ActionApprovalRequest, AssistantShift, AssistantShiftAssignment } from '../../../../domain/entities'
import type { ActionApprovalRequestJsonObject } from '../../../../domain/entities/action-approval-request'
import type { UnitOfWorkRepos } from '../../../../domain/repositories'
import { ActionApprovalRequestStatus, ActionApprovalRequestType } from '../../../../shared/enums'
import {
  BusinessLogicException,
  ConflictException,
  NotFoundException,
} from '../../../../shared/exceptions/custom-exceptions'

const REQUEST_EXPIRY_MILLISECONDS = 24 * 60 * 60 * 1000
const DUPLICATE_COOLDOWN_MILLISECONDS = 10 * 60 * 1000
export const DECLINED_REQUEST_COOLDOWN_MILLISECONDS = 60 * 60 * 1000

export interface AssistantShiftAssignmentActionPageResult {
  success: boolean
  message: string
}

export interface AssistantShiftSwapApprovalPayload extends ActionApprovalRequestJsonObject {
  version: 1
  sourceAssistantShiftId: number
  sourceAdminId: number
  targetAssistantShiftId: number
  targetAdminId: number
}

export interface AssistantShiftTransferApprovalPayload extends ActionApprovalRequestJsonObject {
  version: 1
  assistantShiftId: number
  sourceAdminId: number
  targetAdminId: number
}

export function assertPendingAssignment(
  assignment: AssistantShiftAssignment | null,
  message: string,
): asserts assignment is AssistantShiftAssignment {
  if (!assignment) {
    throw new NotFoundException('Assignment không tồn tại')
  }
  if (!assignment.isPending()) {
    throw new BusinessLogicException(message)
  }
}

export function assertShiftNotEnded(shift: AssistantShift | null): asserts shift is AssistantShift {
  if (!shift) {
    throw new NotFoundException('Ca trợ giảng không tồn tại')
  }
  if (shift.isBaseShift || shift.isLocked || shift.series?.isLocked) {
    throw new NotFoundException('Ca trợ giảng không tồn tại')
  }
  if (new Date() >= shift.endAt) {
    throw new BusinessLogicException('Không thể thao tác với ca đã kết thúc')
  }
}

export function createActionApprovalToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashActionApprovalValue(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function createActionApprovalDedupKey(
  type: ActionApprovalRequestType,
  payload: ActionApprovalRequestJsonObject,
): string {
  return hashActionApprovalValue(`${type}:${JSON.stringify(payload)}`)
}

export function getActionApprovalExpiry(...shifts: AssistantShift[]): Date {
  const now = new Date()
  const maximumExpiry = new Date(now.getTime() + REQUEST_EXPIRY_MILLISECONDS)
  const earliestShiftEnd = shifts.reduce(
    (earliest, shift) => (shift.endAt < earliest ? shift.endAt : earliest),
    maximumExpiry,
  )

  return earliestShiftEnd
}

export async function assertActionApprovalCreationAllowed(
  repos: UnitOfWorkRepos,
  requesterUserId: number,
  recipientUserId: number,
  dedupKey: string,
): Promise<void> {
  const now = new Date()
  const activeRequest = await repos.actionApprovalRequestRepository.findByActiveDedupKey(dedupKey)
  if (activeRequest) {
    if (activeRequest.isExpired(now)) {
      await repos.actionApprovalRequestRepository.expirePending(
        activeRequest.actionApprovalRequestId,
        now,
        new Date(now.getTime() + DUPLICATE_COOLDOWN_MILLISECONDS),
      )
    } else {
      throw new ConflictException('Đề nghị giống hệt đang chờ phản hồi')
    }
  }

  const latestRequest = await repos.actionApprovalRequestRepository.findLatestByDedupKey(dedupKey)
  if (latestRequest?.cooldownUntil && latestRequest.cooldownUntil > now) {
    throw new BusinessLogicException('Bạn vừa gửi đề nghị này. Vui lòng thử lại sau ít phút')
  }

  const [requesterRecentCount, requesterDailyCount, recipientRecentCount] = await Promise.all([
    repos.actionApprovalRequestRepository.countCreatedByRequesterSince(
      requesterUserId,
      new Date(now.getTime() - 15 * 60 * 1000),
    ),
    repos.actionApprovalRequestRepository.countCreatedByRequesterSince(
      requesterUserId,
      new Date(now.getTime() - 24 * 60 * 60 * 1000),
    ),
    repos.actionApprovalRequestRepository.countCreatedByRecipientSince(
      recipientUserId,
      new Date(now.getTime() - 60 * 60 * 1000),
    ),
  ])

  if (requesterRecentCount >= 5) {
    throw new BusinessLogicException('Bạn đã gửi quá nhiều đề nghị. Vui lòng thử lại sau 15 phút')
  }
  if (requesterDailyCount >= 15) {
    throw new BusinessLogicException('Bạn đã đạt giới hạn 15 đề nghị trong 24 giờ')
  }
  if (recipientRecentCount >= 3) {
    throw new BusinessLogicException('Người nhận đã nhận quá nhiều đề nghị trong một giờ')
  }
}

export async function claimActionApprovalRequest(
  repos: UnitOfWorkRepos,
  actionToken: string,
  type: ActionApprovalRequestType,
): Promise<ActionApprovalRequest> {
  const now = new Date()
  const request = await repos.actionApprovalRequestRepository.findByActionTokenHash(
    hashActionApprovalValue(actionToken),
  )
  if (!request || request.type !== type) {
    throw new NotFoundException('Đề nghị không tồn tại hoặc token không hợp lệ')
  }

  if (request.isExpired(now)) {
    await repos.actionApprovalRequestRepository.expirePending(
      request.actionApprovalRequestId,
      now,
      new Date(now.getTime() + DUPLICATE_COOLDOWN_MILLISECONDS),
    )
    throw new BusinessLogicException('Đề nghị này đã hết hạn')
  }

  if (!(await repos.actionApprovalRequestRepository.claimPending(request.actionApprovalRequestId, now))) {
    const currentRequest = await repos.actionApprovalRequestRepository.findById(request.actionApprovalRequestId)
    throw new BusinessLogicException(getProcessedRequestMessage(currentRequest?.status))
  }

  return request
}

export function parseSwapApprovalPayload(payload: ActionApprovalRequestJsonObject): AssistantShiftSwapApprovalPayload {
  return {
    version: readPayloadVersion(payload),
    sourceAssistantShiftId: readPayloadId(payload, 'sourceAssistantShiftId'),
    sourceAdminId: readPayloadId(payload, 'sourceAdminId'),
    targetAssistantShiftId: readPayloadId(payload, 'targetAssistantShiftId'),
    targetAdminId: readPayloadId(payload, 'targetAdminId'),
  }
}

export function parseTransferApprovalPayload(
  payload: ActionApprovalRequestJsonObject,
): AssistantShiftTransferApprovalPayload {
  return {
    version: readPayloadVersion(payload),
    assistantShiftId: readPayloadId(payload, 'assistantShiftId'),
    sourceAdminId: readPayloadId(payload, 'sourceAdminId'),
    targetAdminId: readPayloadId(payload, 'targetAdminId'),
  }
}

export function assertRequestOwners(
  request: ActionApprovalRequest,
  requesterUserId: number,
  recipientUserId: number,
): void {
  if (request.requesterUserId !== requesterUserId || request.recipientUserId !== recipientUserId) {
    throw new BusinessLogicException('Dữ liệu đề nghị không còn hợp lệ')
  }
}

export function toActionPageResult(error: unknown): AssistantShiftAssignmentActionPageResult {
  if (
    error instanceof BusinessLogicException ||
    error instanceof ConflictException ||
    error instanceof NotFoundException
  ) {
    return { success: false, message: error.message }
  }

  return {
    success: false,
    message: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
  }
}

function readPayloadVersion(payload: ActionApprovalRequestJsonObject): 1 {
  if (payload.version !== 1) {
    throw new BusinessLogicException('Phiên bản dữ liệu đề nghị không được hỗ trợ')
  }

  return 1
}

function readPayloadId(payload: ActionApprovalRequestJsonObject, key: string): number {
  const value = payload[key]
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new BusinessLogicException('Dữ liệu đề nghị không hợp lệ')
  }

  return value
}

function getProcessedRequestMessage(status: ActionApprovalRequestStatus | undefined): string {
  if (status === ActionApprovalRequestStatus.ACCEPTED) {
    return 'Đề nghị này đã được xác nhận trước đó'
  }
  if (status === ActionApprovalRequestStatus.DECLINED) {
    return 'Đề nghị này đã bị từ chối trước đó'
  }
  if (status === ActionApprovalRequestStatus.EXPIRED) {
    return 'Đề nghị này đã hết hạn'
  }
  if (status === ActionApprovalRequestStatus.PROCESSING) {
    return 'Đề nghị đang được xử lý. Vui lòng không bấm lại'
  }

  return 'Đề nghị này không còn hợp lệ'
}
