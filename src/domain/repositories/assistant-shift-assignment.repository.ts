import { AssistantShiftAssignment } from '../entities/assistant-shift'
import {
  AssistantShiftAssignmentListOptions,
  CreateAssistantShiftAssignmentData,
  UpdateAssistantShiftAssignmentData,
} from '../interface/assistant-shift'

export interface IAssistantShiftAssignmentRepository {
  create(data: CreateAssistantShiftAssignmentData): Promise<AssistantShiftAssignment>
  findById(assistantShiftId: number, adminId: number): Promise<AssistantShiftAssignment | null>
  findAll(options?: AssistantShiftAssignmentListOptions): Promise<AssistantShiftAssignment[]>
  update(
    assistantShiftId: number,
    adminId: number,
    data: UpdateAssistantShiftAssignmentData,
  ): Promise<AssistantShiftAssignment>
  delete(assistantShiftId: number, adminId: number): Promise<boolean>
}
