import { AssistantShiftAssignment } from '../entities/assistant-shift'
import { AssistantShiftAssignmentAttendanceStatus } from '../../shared/enums'
import {
  AssistantShiftReminderCandidate,
  AssistantShiftAssignmentListOptions,
  CreateAssistantShiftAssignmentData,
  UpdateAssistantShiftAssignmentData,
} from '../interface/assistant-shift'

export interface IAssistantShiftAssignmentRepository {
  create(data: CreateAssistantShiftAssignmentData): Promise<AssistantShiftAssignment>
  findById(assistantShiftId: number, adminId: number): Promise<AssistantShiftAssignment | null>
  findByCheckInToken(assistantShiftId: number, token: string): Promise<AssistantShiftAssignment | null>
  findAll(options?: AssistantShiftAssignmentListOptions): Promise<AssistantShiftAssignment[]>
  findCheckInReminderCandidates(now: Date): Promise<AssistantShiftReminderCandidate[]>
  findExpiredAbsenceCandidates(now: Date): Promise<AssistantShiftReminderCandidate[]>
  claimCheckInReminderEmail(assistantShiftId: number, adminId: number, sentAt: Date): Promise<boolean>
  requeueCheckInReminderEmail(assistantShiftId: number, adminId: number): Promise<void>
  claimAbsenceNotification(
    assistantShiftId: number,
    adminId: number,
    attendanceStatus: AssistantShiftAssignmentAttendanceStatus,
    sentAt: Date,
  ): Promise<boolean>
  requeueAbsenceNotification(assistantShiftId: number, adminId: number): Promise<void>
  update(
    assistantShiftId: number,
    adminId: number,
    data: UpdateAssistantShiftAssignmentData,
  ): Promise<AssistantShiftAssignment>
  delete(assistantShiftId: number, adminId: number): Promise<boolean>
}
