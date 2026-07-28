/** Đồng bộ với Prisma enum AssistantTaskType. */
export enum AssistantTaskType {
  BTVN = 'BTVN',
  VIDEO = 'VIDEO',
  BTTL = 'BTTL',
  BAI_CHAM = 'BAI_CHAM',
}

export const AssistantTaskTypeLabels: Record<AssistantTaskType, string> = {
  [AssistantTaskType.BTVN]: 'Bài tập về nhà',
  [AssistantTaskType.VIDEO]: 'Video',
  [AssistantTaskType.BTTL]: 'Bài tập trên lớp',
  [AssistantTaskType.BAI_CHAM]: 'Bài chấm',
}
