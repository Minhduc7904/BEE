import { NotificationDestinationType } from '../../../shared/enums'
import { resolveParentNotificationDestination } from './parent-notification-inbox-response.dto'

describe('resolveParentNotificationDestination', () => {
  it('ưu tiên destination canonical', () => {
    expect(resolveParentNotificationDestination({ destinationType: 'attendance_record', resourceId: 12 })).toEqual({
      type: NotificationDestinationType.ATTENDANCE_RECORD,
      resourceId: 12,
    })
  })

  it('map metadata legacy và chuẩn hóa invoiceId cũ thành tuition payment', () => {
    expect(resolveParentNotificationDestination({ invoiceId: '18' })).toEqual({
      type: NotificationDestinationType.TUITION_PAYMENT,
      resourceId: 18,
    })
    expect(resolveParentNotificationDestination({ competitionSubmitId: '22' })).toEqual({
      type: NotificationDestinationType.EXAM_RESULT,
      resourceId: 22,
    })
  })
})
