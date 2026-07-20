---
name: create-infrastructure-service
description: Viết hoặc cập nhật Infrastructure service cho BEE, đặc biệt service gọi external provider, gửi email, storage, AI, Socket hoặc HTTP. Dùng khi cần tách env vào file config riêng, định nghĩa application interface/DI token, inject ConfigType và đăng ký provider trong InfrastructureModule.
---

# Viết Infrastructure Service

## Mục tiêu

Service triển khai tích hợp kỹ thuật, nằm tại `src/infrastructure/services/<feature>.service.ts`. Application chỉ biết application port/interface; Infrastructure chứa SDK, HTTP client, crypto, logger và chi tiết provider.

Mỗi service mới hoặc service có external configuration phải có đủ ba phần:

```text
src/application/interfaces/<feature>.interface.ts  # port + DI token + input/output type
src/config/<feature>.config.ts                     # đọc process.env và chuẩn hóa cấu hình
src/infrastructure/services/<feature>.service.ts  # implements port, không đọc process.env
```

Đọc `template.md` để áp dụng mẫu và `reference-files.md` để đối chiếu tệp thật của dự án.

## Quy tắc bắt buộc

1. **Không dùng `process.env` trong service.** Không hard-code tên biến environment, secret, URL môi trường, key hoặc fallback environment trong service.
2. Chỉ file `src/config/<feature>.config.ts` đọc `process.env`, dùng `registerAs('<feature>', ...)`, trim/chuẩn hóa giá trị và gom toàn bộ tên env tại đó.
3. Service inject config đã đăng ký bằng `@Inject(<Feature>Config.KEY)` và `ConfigType<typeof <Feature>Config>`; không inject `ConfigService` rồi đọc string key rải rác nếu feature có config riêng.
4. Tạo application interface cho mọi service được use case/Gateway/Controller hoặc service khác gọi. Interface phải có input/output type tường minh, không dùng `any` hoặc `...args: any[]` cho contract mới.
5. Xuất abstract class cùng tên từ application interface làm Nest DI token, rồi để class Infrastructure `implements` interface. Consumer inject token/interface, không import concrete Infrastructure service.
6. Đăng ký `ConfigModule.forFeature(<Feature>Config)`, provider mapping `{ provide: <Feature>ServicePort, useExisting: <Feature>Service }` và export port tại `InfrastructureModule`.
7. Giữ service ở Infrastructure. Use case giữ orchestration, ownership, state transition, audit và transaction; service không tự quyết định business state.

## Trước khi thực hiện

1. Đọc `template.md`, `reference-files.md`, service gần nhất, config và application interface liên quan.
2. Đọc `create-application-use-case` nếu service được use case gọi; đọc `business-rules` nếu hành vi có state/ownership/payment policy.
3. Kiểm tra `src/config/index.ts` để export config mới khi convention cần dùng barrel export.
4. Kiểm tra `InfrastructureModule` để thêm import/provider/export đúng một lần.
5. Khi sửa class/method service hiện có, chạy GitNexus impact analysis trước khi sửa.

## Quy trình

1. Xác định ranh giới: service này làm tích hợp kỹ thuật nào, input/output nào và provider nào; không biến service thành generic business use case.
2. Thiết kế application port trước: abstract token, interface, input/output, error semantics và dữ liệu không được rò rỉ.
3. Viết config feature: mọi `process.env.<NAME>`, URL/timeout/provider option phụ thuộc môi trường, derived URL và safe default đều nằm ở đây. Không đặt secret/default production trong mã nguồn.
4. Viết concrete service `@Injectable()`: inject typed config và dependency kỹ thuật; kiểm tra config bắt buộc tại điểm khởi tạo hoặc trước operation theo yêu cầu provider.
5. Map lỗi provider thành exception/result kỹ thuật phù hợp; không trả raw SDK error, request/response có secret hay stack trace cho Presentation.
6. Đăng ký config và port trong `InfrastructureModule`; export application port để `ApplicationModule` consumer inject được.
7. Nếu service có log, log context không nhạy cảm (provider request ID, feature, operation); không log API key, authorization, token, full webhook payload hoặc dữ liệu cá nhân không cần thiết.

## Config và dependency injection

```text
Application use case
  └── injects <Feature>Service (abstract token)
        └── InfrastructureModule maps token to <Feature>Service concrete class
              └── concrete service injects <Feature>Config.KEY
                    └── config file is the only place that reads process.env
```

- Safe public defaults (ví dụ provider API base URL công khai) chỉ để trong config, phải có lý do rõ ràng.
- Secret như API key, checksum key, private key, OAuth secret bắt buộc lấy từ config; khi thiếu phải fail an toàn với lỗi cấu hình rõ ràng, không gọi provider bằng giá trị rỗng.
- Với config cần ở nhiều module, đăng ký `ConfigModule.forFeature` tại module sở hữu integration theo mẫu hiện có.
- Không tạo hai token cho cùng service. Chọn abstract application class token cho service mới; không dùng string token mới trừ khi phải tương thích legacy đã có.

## Điều không được làm

- Không viết `process.env.*`, tên env string, secret, URL môi trường hoặc credential trực tiếp trong service.
- Không để use case/Controller/Gateway import concrete service từ `infrastructure`.
- Không thêm service không interface/port, không dùng `any` trong contract mới.
- Không để service truy cập Prisma/repository chỉ để thực hiện business workflow.
- Không gửi/log raw provider error, token, authorization header, API key, checksum key hoặc payload nhạy cảm.
- Không bỏ đăng ký config, provider hoặc export port rồi inject class trực tiếp để “chạy tạm”.
- Không yêu cầu unit test trong giai đoạn hiện tại; khi có thay đổi TypeScript, chạy build/typecheck phù hợp.

## Checklist

- [ ] Có interface + abstract DI token ở `src/application/interfaces/` với type rõ ràng.
- [ ] Có config riêng `src/config/<feature>.config.ts`; service không chứa `process.env`.
- [ ] Service inject `ConfigType<typeof <Feature>Config>` qua `<Feature>Config.KEY`.
- [ ] Config thiếu secret fail an toàn, log không lộ secret/PII.
- [ ] Concrete service chỉ lo integration kỹ thuật và implements port.
- [ ] `InfrastructureModule` đã forFeature config, map `useExisting` và export port.
- [ ] Consumer inject application port, không phụ thuộc Infrastructure.
- [ ] Không thêm yêu cầu unit test.
