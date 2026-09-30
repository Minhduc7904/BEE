import { IsOptionalEnumValue, IsOptionalInt } from '../../../shared/decorators/validate'
import { NotificationDispatchJobStatus, NotificationType } from '../../../shared/enums'
import { ListQueryDto } from '../pagination/list-query.dto'

export class NotificationDispatchJobListQueryDto extends ListQueryDto {
  @IsOptionalEnumValue(NotificationDispatchJobStatus, 'Trạng thái job')
  status?: NotificationDispatchJobStatus

  @IsOptionalEnumValue(NotificationType, 'Loại thông báo')
  type?: NotificationType

  @IsOptionalInt('Người tạo', 1)
  creatorId?: number
}
