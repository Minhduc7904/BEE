# Tài liệu tham chiếu cho Infrastructure Service

## Mẫu đã đối chiếu

| Tệp | Phân loại | Quy ước rút ra |
| --- | --- | --- |
| `src/infrastructure/services/payos.service.ts` | BẮT BUỘC | Concrete service `implements` application port, inject typed feature config qua `ConfigType`, kiểm tra config bắt buộc và map lỗi provider. |
| `src/application/interfaces/payos.interface.ts` | BẮT BUỘC | Abstract class đồng thời là DI token; interface có input/output type cụ thể. |
| `src/config/payos.config.ts` | BẮT BUỘC | Dùng `registerAs`, đọc/trim toàn bộ env trong config và chuẩn hóa URL trước khi inject. |
| `src/infrastructure/infrastructure.module.ts` | BẮT BUỘC | `ConfigModule.forFeature(PayosConfig)`, `{ provide: PayosServicePort, useExisting: PayosService }` và export application port. |
| `src/config/index.ts` | ƯU TIÊN | Barrel export các config theo convention hiện có. |
| `src/infrastructure/services/http-client.service.ts` | TÙY NGỮ CẢNH | Dùng khi integration phù hợp với HTTP client dùng chung; kiểm tra contract trước khi thêm SDK/axios riêng. |
| `src/infrastructure/services/resend-email.service.ts` | CŨ/KHÔNG LẶP LẠI | Có config injection và interface nhưng interface nằm ở Infrastructure/contract application còn `any`; service mới phải dùng application port typed. |
| `src/config/email.config.ts` | CŨ/KHÔNG LẶP LẠI | Là config riêng nhưng chưa trim/type/chuẩn hóa đầy đủ; service mới dùng mẫu feature config rõ ràng hơn. |

## Ranh giới lớp

```text
application/interfaces/<feature>.interface.ts
  ← application use case injects abstract token
  ← infrastructure/services/<feature>.service.ts implements interface
       ← src/config/<feature>.config.ts supplies typed configuration
       ← InfrastructureModule registers config/provider/export
```

Không để application import `src/infrastructure/services/...`. Không để Infrastructure service đọc `process.env`; config file là nguồn duy nhất của env name.

## Tệp cần đọc thêm theo trường hợp

| Trường hợp | Đọc thêm |
| --- | --- |
| Service được gọi từ use case | `.agent/skills/create-application-use-case/SKILL.md` và use case consumer. |
| Provider HTTP | `src/infrastructure/services/http-client.service.ts`, `src/config/http-client.config.ts`. |
| Payment/webhook | `.agent/skills/business-rules/tuition-payment-sepay-business-rules/SKILL.md` hoặc business skill payment tương ứng. |
| Thêm/sửa config/module/provider hiện có | GitNexus impact analysis trước khi sửa symbol. |

## Kiểm tra trước khi code

1. Port có thật sự thuộc Application và type input/output đã đủ cho use case chưa?
2. Toàn bộ env name, timeout, URL provider, secret và derived URL đã nằm trong config chưa?
3. Secret nào là bắt buộc, lúc thiếu service fail ở đâu và có lộ secret qua log/error không?
4. Config đã được `forFeature`, port đã `useExisting`, export đã đúng và consumer có inject port không?
