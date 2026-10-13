import type { ParentNotificationInboxItem, ParentNotificationInboxRepository } from '../../interfaces'
import { ParentNotificationDestinationDto, ParentNotificationInboxItemDto } from '../../dtos'
import { examResultCompetitionSubmitId, linkedHomeworkDestination } from '../notification/linked-homework-destination'

/**
 * Map item inbox sang DTO và đổi đích `exam_result` của lượt thi đã gắn BTVN thành `homework_result` (kể cả thông báo
 * cũ đã lưu). Một truy vấn cho cả trang.
 */
export async function toParentNotificationInboxItemDtos(
  items: ParentNotificationInboxItem[],
  inbox: ParentNotificationInboxRepository,
): Promise<ParentNotificationInboxItemDto[]> {
  const dtos = items.map((item) => ParentNotificationInboxItemDto.fromItem(item))
  const competitionSubmitIds = dtos
    .map((dto) => examResultCompetitionSubmitId(dto.destination))
    .filter((id): id is number => id !== null)
  if (competitionSubmitIds.length === 0) return dtos

  const homeworkSubmitIds = await inbox.findHomeworkSubmitIdsByCompetitionSubmitIds(competitionSubmitIds)
  return dtos.map((dto) => {
    const linked = linkedHomeworkDestination(examResultCompetitionSubmitId(dto.destination), homeworkSubmitIds)
    return linked ? { ...dto, destination: new ParentNotificationDestinationDto(linked.type, linked.resourceId) } : dto
  })
}

export async function toParentNotificationInboxItemDto(
  item: ParentNotificationInboxItem,
  inbox: ParentNotificationInboxRepository,
): Promise<ParentNotificationInboxItemDto> {
  const [dto] = await toParentNotificationInboxItemDtos([item], inbox)
  return dto
}
