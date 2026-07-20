---
name: create-prisma-repository
description: Tạo hoặc cập nhật domain repository port và Prisma repository cho BEE. Dùng khi cần truy vấn/persist entity, thêm relation-loading options hoặc đăng ký DI; relation options phải có cờ cụ thể, không dùng includeRelations chung chung.
---

# Viết Prisma repository cho BEE

## Mục tiêu

Tạo repository port trong Domain và Prisma adapter trong Infrastructure. Repository chỉ truy vấn/lưu dữ liệu, xây relation include có kiểm soát, rồi trả Domain Entity qua mapper.

## Tệp phải đọc

1. Đọc [reference-files.md](reference-files.md) trước khi thiết kế repository.
2. Đọc [template.md](template.md) trước khi tạo port, options hoặc adapter.
3. Đọc `create-prisma-mapper` trước khi thêm/sửa mapper hoặc relation được map.
4. Đọc `create-enum` khi filter/data có status, type, visibility hoặc tập giá trị hữu hạn.
5. Đọc `database-schema-changes` trước khi schema, relation hoặc index cần đổi.
6. Đọc `business-rules` nếu method mới có ownership, state transition hoặc policy; chỉ giữ truy vấn/persistence trong repository.

## Relation options

Khi một method có nhiều nhu cầu tải relation, dùng options có **cờ cụ thể theo relation** ở domain contract, ví dụ:

```ts
export interface QuestionRelationOptions {
  includeSubject?: boolean
  includeCreator?: boolean
  includeStatements?: boolean
  includeChapters?: boolean
  includeExamLinks?: boolean
}
```

- Mặc định mọi cờ là `false`: method không tải relation nếu caller không yêu cầu.
- Không dùng `includeRelations?: boolean` trong code mới; cờ này không cho biết chính xác relation nào cần tải và dễ tạo query quá nặng.
- Không nhận `Prisma.<Model>Include`, object `include` tùy ý hoặc tên relation từ Application/Presentation.
- Chỉ thêm cờ khi có use case/DTO/mapper thực sự cần relation đó. Relation luôn tải cùng nhau và là một business view ổn định có thể dùng method chuyên biệt như `findByIdWithDetail` thay vì quá nhiều cờ.
- Options relation phải được dùng đồng thời ở port, adapter, `buildInclude` và mapper để mapper không giả định relation chưa tải.

## Quy trình

1. Đọc entity, Prisma schema, mapper, repository port/adaptor gần nhất và use case caller. Với method/class hiện có, chạy GitNexus impact analysis theo `AGENTS.md` trước khi sửa.
2. Định nghĩa input/filter/pagination/relation options ở `src/domain/interface/<feature>/` hoặc vị trí gần nhất đã được mô-đun dùng; port ở `src/domain/repositories/<feature>.repository.ts` chỉ dùng type domain.
3. Tạo/cập nhật `I<Feature>Repository`; trả entity, collection hoặc result type domain, không trả Prisma record hoặc HTTP DTO.
4. Tạo `Prisma<Feature>Repository` tại `src/infrastructure/repositories/<feature>/`, inject `PrismaService | Prisma.TransactionClient` theo mô-đun lân cận.
5. Dùng `buildInclude(options)` private để chuyển relation options tường minh thành `Prisma.<Model>Include`. Không tạo include khi không có cờ nào bật.
6. Query bằng `where`, `select` hoặc `include` tối thiểu; filter/sort chỉ lấy từ domain options đã whitelist ở DTO/use case. Không truyền client input trực tiếp vào Prisma.
7. Gọi mapper ngay sau `create`, `update`, `findUnique` hoặc `findMany`; mapper chỉ map relation đã được tải và dùng enum shared cho field hữu hạn.
8. Dùng `UNIT_OF_WORK` cho workflow thay đổi nhiều aggregate/audit; repository không tự quyết định business transaction, permission hay ownership.
9. Đăng ký provider/export token repository trong `InfrastructureModule` theo convention hiện có.
10. Chạy `npm run build`; nếu schema/index thay đổi, theo đầy đủ `database-schema-changes`.

## Guardrail

- Application phụ thuộc `I<Feature>Repository`/token, không phụ thuộc `Prisma<Feature>Repository`.
- Domain port không import `@prisma/client`, NestJS hoặc Infrastructure.
- Adapter không import controller, DTO HTTP hoặc xử lý HTTP exception.
- Không dùng `any`, Prisma record thô hoặc `as any` trong repository mới/cập nhật.
- Không mặc định tải relation nặng cho list query; tránh N+1 và tránh include graph đệ quy.
- Không đặt business validation, authorization, ownership hay state transition trong repository.
- Không tạo index/schema chỉ vì thêm filter; chỉ làm khi truy vấn thực tế và theo `database-schema-changes`.

## Xác minh

- Chạy `npm run build` sau thay đổi TypeScript.
- Với schema/migration: chạy các lệnh bắt buộc trong `database-schema-changes`.
- Không bắt buộc tạo hoặc chạy unit test, integration test hay coverage.
- Báo cáo relation nào mỗi method có thể tải, relation mặc định không tải và lệnh đã chạy/chưa chạy.

## Checklist cuối

- [ ] Đã đọc `reference-files.md`, `template.md`, entity, schema, mapper và caller gần nhất.
- [ ] Port dùng type domain; adapter trả entity qua mapper.
- [ ] Relation options dùng cờ cụ thể và mặc định không tải relation.
- [ ] `buildInclude` chỉ include relation được yêu cầu; mapper chỉ map relation đã tải.
- [ ] Không có Prisma type ở Domain, `any`, raw include từ caller, HTTP hay business rule trong repository.
- [ ] DI token/provider/export được đăng ký khi tạo repository mới.
- [ ] Không có yêu cầu unit test.
