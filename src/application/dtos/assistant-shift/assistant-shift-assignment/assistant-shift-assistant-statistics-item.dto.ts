export class AssistantShiftAssistantStatisticsItemDto {
  adminId: number
  userId: number
  fullName: string

  totalAssignmentCount: number
  totalHours: number

  pendingAssignmentCount: number
  pendingHours: number

  presentAssignmentCount: number
  presentHours: number

  absentAssignmentCount: number
  absentHours: number

  sundayPresentAssignmentCount: number
  sundayPresentHours: number

  presentWorkDayCount: number

  // Legacy fields retained for existing clients.
  registeredShiftCount: number
  workedHours: number
}
