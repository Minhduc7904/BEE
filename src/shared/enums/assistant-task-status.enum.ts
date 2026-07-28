/**
 * Đồng bộ với Prisma enum AssistantTaskStatus.
 */
export enum AssistantTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export const AssistantTaskStatusLabels: Record<AssistantTaskStatus, string> = {
  [AssistantTaskStatus.PENDING]: 'Chờ thực hiện',
  [AssistantTaskStatus.IN_PROGRESS]: 'Đang thực hiện',
  [AssistantTaskStatus.COMPLETED]: 'Hoàn thành',
}
