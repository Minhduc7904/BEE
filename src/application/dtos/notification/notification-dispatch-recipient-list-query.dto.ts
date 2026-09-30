import { IsOptionalEnumValue } from '../../../shared/decorators/validate'
import {
  NotificationDeliveryChannel,
  NotificationDeliveryStatus,
  NotificationRecipientType,
} from '../../../shared/enums'
import { ListQueryDto } from '../pagination/list-query.dto'

export class NotificationDispatchRecipientListQueryDto extends ListQueryDto {
  @IsOptionalEnumValue(NotificationRecipientType, 'Loại người nhận')
  recipientType?: NotificationRecipientType

  @IsOptionalEnumValue(NotificationDeliveryChannel, 'Kênh')
  channel?: NotificationDeliveryChannel

  @IsOptionalEnumValue(NotificationDeliveryStatus, 'Trạng thái giao')
  deliveryStatus?: NotificationDeliveryStatus
}
