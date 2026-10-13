import { NotificationDestinationType } from '../../../shared/enums'

/**
 * Lượt thi của bài tập về nhà (CompetitionSubmit gắn HomeworkSubmit) chỉ được xem qua chi tiết bài tập; chi tiết bài thi
 * của phụ huynh chỉ phục vụ lượt thi độc lập. Thông báo kết quả được tạo khi nộp bài, trước khi HomeworkSubmit được tạo,
 * nên đích `exam_result` của lượt thi gắn BTVN phải được đổi thành `homework_result` lúc đọc/gửi.
 */
export function examResultCompetitionSubmitId(
  destination: {
    type: string
    resourceId: number
  } | null,
): number | null {
  return destination?.type === NotificationDestinationType.EXAM_RESULT ? destination.resourceId : null
}

/** Đích chuẩn hóa cho lượt thi đã gắn BTVN; trả `null` nếu lượt thi không gắn bài tập nào. */
export function linkedHomeworkDestination(
  competitionSubmitId: number | null,
  homeworkSubmitIds: Map<number, number>,
): { type: NotificationDestinationType; resourceId: number } | null {
  if (competitionSubmitId === null) return null
  const homeworkSubmitId = homeworkSubmitIds.get(competitionSubmitId)
  return homeworkSubmitId === undefined
    ? null
    : { type: NotificationDestinationType.HOMEWORK_RESULT, resourceId: homeworkSubmitId }
}
