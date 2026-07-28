/**
 * Đồng bộ với Prisma enum AssistantTaskType.
 */
export enum AssistantTaskType {
  HOMEWORK_ANSWER_KEY = 'HOMEWORK_ANSWER_KEY',
  PUBLISH_HOMEWORK = 'PUBLISH_HOMEWORK',
  HOMEWORK_SOLUTION_VIDEO = 'HOMEWORK_SOLUTION_VIDEO',
  IN_CLASS_EXERCISE_ANSWER_KEY = 'IN_CLASS_EXERCISE_ANSWER_KEY',
  ESSAY_GRADING = 'ESSAY_GRADING',
}

export const AssistantTaskTypeLabels: Record<AssistantTaskType, string> = {
  [AssistantTaskType.HOMEWORK_ANSWER_KEY]: 'Đáp án BTVN',
  [AssistantTaskType.PUBLISH_HOMEWORK]: 'Đăng BTVN',
  [AssistantTaskType.HOMEWORK_SOLUTION_VIDEO]: 'Video chữa BTVN',
  [AssistantTaskType.IN_CLASS_EXERCISE_ANSWER_KEY]: 'Đáp án BTTL',
  [AssistantTaskType.ESSAY_GRADING]: 'Chấm tự luận',
}
