# Tệp tham chiếu cho `create-presentation-scheduler`

| Tệp tham chiếu | Vai trò | Quy ước trích xuất | Phân loại | Độ tin cậy |
| --- | --- | --- | --- | --- |
| `AGENTS.md` | Kỷ luật thay đổi mã | Chạy GitNexus impact analysis trước khi sửa symbol; kiểm tra phạm vi thay đổi trước commit. | BẮT BUỘC | Cao |
| `.agent/skills/shared/architecture.md` | Kiến trúc nền | Scheduler là adapter Presentation, gọi Application; không đảo chiều dependency. | BẮT BUỘC | Cao |
| `.agent/skills/shared/clean-architecture-rules.md` | Ranh giới layer | Presentation không chứa Prisma, repository, mapper hoặc business rule. | BẮT BUỘC | Cao |
| `.agent/skills/create-presentation-gateway/SKILL.md` | Mẫu adapter Presentation | Provider Presentation chỉ nhận trigger và gọi application entry point; đăng ký ở `PresentationModule`. | ƯU TIÊN | Cao |
| `src/presentation/presentation.module.ts` | Module Presentation hiện có | Import `ApplicationModule`; khai báo provider Gateway tại `providers`. Chưa có scheduler. | BẮT BUỘC | Cao |
| `src/application/use-cases/sepay/sepay-transaction-sync.service.ts` | Luồng sync SePay dùng chung | Có cursor `IN_ALL`, lock, BackgroundJobRun, worker ID và processor dùng chung webhook. Scheduler phải tái sử dụng service này. | BẮT BUỘC | Cao |
| `src/application/use-cases/sepay/transaction-processing/sepay-transaction-processor.service.ts` | Xử lý giao dịch chung | Tự động đối soát chỉ thực hiện ở Application processor, không sao chép xuống scheduler. | BẮT BUỘC | Cao |
| `src/domain/entities/background-job/background-job.entity.ts` | Cấu hình job | `isEnabled`, `cronExpression`, `timezone`, `maxRuntimeSeconds` là trạng thái vận hành. | BẮT BUỘC | Cao |
| `src/domain/entities/background-job/background-job-run.entity.ts` | Lịch sử chạy | Vòng đời run và lease phải được Application cập nhật. | BẮT BUỘC | Cao |
| `src/domain/entities/background-job/background-job-lock.entity.ts` | Khóa đa instance | Lease database thay cho in-memory lock. | BẮT BUỘC | Cao |
| `.agent/skills/business-rules/tuition-payment-sepay-business-rules/SKILL.md` | Rule thanh toán/SePay | Webhook và sync dùng cùng processor; lock conflict là skip bình thường cho scheduler. | BẮT BUỘC | Cao |
| `package.json` | Dependency thực tế | Hiện chưa có `@nestjs/schedule`; cài trước khi import decorator/module. | BẮT BUỘC | Cao |
| [NestJS Task Scheduling](https://docs.nestjs.com/techniques/task-scheduling) | Tài liệu framework chính thức | Cài `@nestjs/schedule`, `ScheduleModule.forRoot()` một lần, dùng `@Cron`, `timeZone` và `waitForCompletion` khi version hỗ trợ. | BẮT BUỘC | Cao |
