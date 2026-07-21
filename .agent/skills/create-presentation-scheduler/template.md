# Mẫu Presentation Scheduler

## `<Tên scheduler>`

- Job code: `<BackgroundJobCode>`.
- Tần suất: `<cron expression hoặc CronExpression đã xác minh>`.
- Timezone: `<timezone>`.
- Provider class: `src/presentation/scheduler/<feature>.scheduler.ts`.
- Application entry point: `<UseCase hoặc ApplicationService>.<method>`.
- Worker ID: `<SCHEDULER:JOB_CODE>`.
- Điều kiện chạy: `<BackgroundJob.isEnabled và precondition khác>`.
- Lock: `<BackgroundJobLock / token / lease>`.
- Checkpoint: `<cursor hoặc không có>`.
- Lịch sử run: `<RUNNING → SUCCEEDED/FAILED/SKIPPED>`.
- Khi lock đang giữ: `<skip/log, không tạo failed run>`.
- Khi lỗi provider/database: `<error code, checkpoint, log đã lọc>`.
- Tài liệu cần cập nhật: `<business rule / operational doc / docs/api nếu có HTTP contract>`.

## Khung lớp

```ts
import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { <ApplicationEntryPoint> } from 'src/application/use-cases/<feature>'

@Injectable()
export class <Feature>Scheduler {
  private readonly logger = new Logger(<Feature>Scheduler.name)

  constructor(private readonly applicationEntryPoint: <ApplicationEntryPoint>) {}

  @Cron('<cron>', {
    name: '<scheduler-name>',
    timeZone: 'Asia/Ho_Chi_Minh',
    waitForCompletion: true,
  })
  async execute(): Promise<void> {
    try {
      await this.applicationEntryPoint.executeScheduled({
        workerId: 'SCHEDULER:<JOB_CODE>',
      })
    } catch (error) {
      if (isAlreadyRunningError(error)) {
        this.logger.debug('<job> đang được worker khác xử lý')
        return
      }
      this.logger.error('<job> thất bại')
    }
  }
}
```

`isAlreadyRunningError` phải dùng error code ổn định do Application trả về; không so khớp message tự do. Chỉ dùng `waitForCompletion` sau khi xác minh version package đang cài hỗ trợ option đó; database lock vẫn là điều kiện bắt buộc.

## Mẫu luồng SePay mỗi 5 phút

```text
@Cron mỗi 5 phút
  → SepayTransactionSyncService.executeScheduled(workerId)
  → kiểm tra BackgroundJob.isEnabled
  → acquire BackgroundJobLock
  → tạo BackgroundJobRun RUNNING
  → đọc SepayTransactionSyncCursor.IN_ALL
  → gọi SePay V2 theo since_id
  → SepayTransactionProcessorService cho từng giao dịch mới
  → commit trang + cập nhật cursor
  → run SUCCEEDED hoặc FAILED
  → release lock bằng lockToken
```
