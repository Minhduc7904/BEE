---
name: create-presentation-scheduler
description: Tạo hoặc cập nhật scheduler NestJS cho BEE tại Presentation, gồm cron job, đăng ký ScheduleModule, gọi application service/use case, khóa chạy đa instance, lịch sử BackgroundJobRun và quy tắc vận hành. Dùng khi thêm tác vụ định kỳ như đồng bộ giao dịch ngân hàng SePay mỗi 5 phút.
---

# Viết Presentation Scheduler

## Mục tiêu và phạm vi

Đặt scheduler tại `src/presentation/scheduler/<feature>.scheduler.ts`. Scheduler là adapter Presentation không có HTTP: nhận trigger thời gian, gọi application service/use case, xử lý lỗi vận hành tối thiểu và không chứa Prisma, repository, mapper, state transition hoặc logic nghiệp vụ.

Khi chưa có package, cài `@nestjs/schedule` và đăng ký `ScheduleModule.forRoot()` đúng một lần ở `AppModule`. Đăng ký scheduler provider tại `PresentationModule`.

Ngoài phạm vi: tạo controller/DTO/permission mới, tự viết lại logic xử lý giao dịch, hoặc thay scheduler bằng queue worker. Đọc skill tương ứng nếu các phần này trở thành yêu cầu riêng.

## Tệp phải đọc

1. Đọc [reference-files.md](reference-files.md) để biết bằng chứng và đường dẫn dự án.
2. Đọc [template.md](template.md) trước khi tạo scheduler.
3. Đọc `.agent/skills/business-rules/SKILL.md` khi scheduler làm thay đổi trạng thái hoặc gọi external provider.
4. Đọc `.agent/skills/business-rules/tuition-payment-sepay-business-rules/SKILL.md` khi scheduler liên quan học phí, SePay, PaymentIntent, PaymentAttempt hoặc BankTransferTransaction.
5. Đọc `.agent/skills/create-application-use-case/SKILL.md` khi cần bổ sung application service/use case cho scheduler.
6. Đọc `.agent/skills/database-schema-changes/SKILL.md` khi thêm/sửa bảng job, lock, cursor, enum hoặc migration.
7. Chạy GitNexus impact analysis trước khi sửa class, method hoặc module đang có.

## Quy trình

1. Xác định job code, tần suất, timezone, application entry point, dữ liệu nguồn, điều kiện bật/tắt, lock đa instance, trạng thái run, checkpoint và hành vi khi lỗi.
2. Kiểm tra `package.json`. Nếu chưa có `@nestjs/schedule`, cài dependency; đăng ký `ScheduleModule.forRoot()` đúng một lần tại root `AppModule` trước khi thêm `@Cron`.
3. Tạo `src/presentation/scheduler/<feature>.scheduler.ts`, đánh dấu `@Injectable()`, inject application service/use case qua DI và đăng ký class ở `PresentationModule.providers`.
4. Scheduler chỉ gọi một entry point application rõ ràng. Application chịu trách nhiệm kiểm tra `BackgroundJob.isEnabled`, acquire/release `BackgroundJobLock`, tạo/cập nhật `BackgroundJobRun`, checkpoint, idempotency và business transition.
5. Dùng `@Cron()` với tên job, `timeZone: 'Asia/Ho_Chi_Minh'` và `waitForCompletion: true` khi version `@nestjs/schedule` đã cài hỗ trợ option này. Database lock vẫn bắt buộc vì `waitForCompletion` chỉ bảo vệ một process.
6. Với job `SEPAY_TRANSACTION_SYNC`, chạy mỗi 5 phút tại giây 0 (`0 */5 * * * *` hoặc `CronExpression.EVERY_5_MINUTES` sau khi xác minh value). Gọi application entry point với worker ID `SCHEDULER:SEPAY_TRANSACTION_SYNC`; không gọi SePay service, repository hoặc processor trực tiếp từ scheduler.
7. Nếu application trả lỗi `SEPAY_TRANSACTION_SYNC_ALREADY_RUNNING`, coi là skip bình thường: log ngắn, không tạo run thất bại, không thông báo người dùng và không retry ngay. Với lỗi khác, chỉ log context an toàn; application phải ghi `FAILED`, error code/message đã lọc và giữ checkpoint trang lỗi.
8. Đồng bộ `BackgroundJob.code = SEPAY_TRANSACTION_SYNC`, `cronExpression`, `timezone`, `isEnabled` và `maxRuntimeSeconds` với job thật. Scheduler phải tôn trọng `isEnabled`; không tự bật lại job đã bị admin tắt.
9. Cập nhật business rule/operational docs khi thay đổi tần suất, source of truth, lock, retry, error code hoặc lifecycle. Chỉ cập nhật `docs/api` khi HTTP contract bị đổi.
10. Chạy `npm run build`. Không yêu cầu unit test trong giai đoạn hiện tại.

## Quy tắc riêng cho đồng bộ giao dịch ngân hàng SePay

- Webhook và scheduler phải dùng cùng `SepayTransactionSyncService`/`SepayTransactionProcessorService`; không sao chép logic auto-match.
- Luồng scheduler là: cron 5 phút → application kiểm tra job enabled → acquire lock → gọi SePay V2 với cursor → xử lý từng trang trong transaction → cập nhật cursor sau commit → ghi run → release lock.
- Khi có nhiều instance BEE, mọi instance có thể nhận trigger cron nhưng chỉ instance acquire được `BackgroundJobLock` mới gọi SePay.
- Không log `SEPAY_API_KEY`, authorization header, raw webhook/raw API payload hoặc số tài khoản đầy đủ.
- Không để scheduler phát trạng thái `PAID` trực tiếp; chỉ processor/use case hiện có được phép xác nhận thanh toán và gửi notification sau commit.

## Không được làm

- Không inject PrismaService, repository, mapper hoặc UnitOfWork vào scheduler.
- Không gọi `SepayService.listV2Transactions()` trực tiếp từ scheduler.
- Không dùng in-memory boolean làm khóa duy nhất; nó không bảo vệ đa process/pod.
- Không tạo cron thứ hai cho cùng `BackgroundJobCode` hoặc để decorator và cấu hình job có tần suất khác nhau.
- Không coi lỗi lock đang giữ là lỗi nghiệp vụ hoặc tạo audit/run `FAILED` giả.
- Không tự retry vòng lặp trong scheduler khi provider/database lỗi; giữ cursor, để cron lần sau chạy lại theo idempotency.
- Không yêu cầu tạo hoặc chạy unit test.

## Xác minh

- Chạy `npm run build` sau thay đổi TypeScript/module.
- Kiểm tra dependency `@nestjs/schedule` và `ScheduleModule.forRoot()` chỉ xuất hiện một lần.
- Kiểm tra scheduler chỉ inject application entry point; application mới chạm job lock/cursor/run.
- Kiểm tra cron SePay là mỗi 5 phút, timezone `Asia/Ho_Chi_Minh`, worker ID đúng và `isEnabled` được tôn trọng.
- Báo cáo rõ command đã chạy hoặc chưa chạy và lý do.

## Checklist cuối

- [ ] Có đúng một `ScheduleModule.forRoot()`.
- [ ] Scheduler nằm trong `src/presentation/scheduler/` và đã đăng ký ở `PresentationModule`.
- [ ] Không có Prisma/repository/business logic trong scheduler.
- [ ] Có lock đa instance, BackgroundJobRun và cursor theo application rule.
- [ ] Webhook và scheduler tái sử dụng cùng processor/service cho giao dịch SePay.
- [ ] Job SePay chạy mỗi 5 phút, tôn trọng `isEnabled` và skip lock conflict an toàn.
- [ ] Tài liệu nghiệp vụ/vận hành đã được cập nhật khi contract vận hành đổi.
- [ ] Không có yêu cầu unit test.
