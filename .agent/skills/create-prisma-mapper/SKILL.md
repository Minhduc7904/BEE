---
name: create-prisma-mapper
description: Tạo hoặc cập nhật Prisma mapper cho BEE tại ranh giới Infrastructure. Dùng khi repository cần chuyển Prisma record hoặc relation đã tải thành Domain Entity; không dùng cho DTO HTTP, query hay business rule.
---

# Viết Prisma mapper cho BEE

## Mục tiêu

Tạo mapper tại `src/infrastructure/mappers/` để Prisma record không rời Infrastructure và Domain Entity không biết Prisma.

## Tệp phải đọc

1. Đọc [reference-files.md](reference-files.md) trước khi tạo hoặc sửa mapper.
2. Đọc [template.md](template.md) trước khi viết lớp mapper.
3. Đọc `create-enum` trước khi map field có status, type, visibility hoặc tập giá trị hữu hạn.
4. Đọc `database-schema-changes` trước khi field/relation Prisma thay đổi.
5. Đọc `create-application-use-case` nếu mapper thay đổi contract repository/use case/DTO.

## Quy trình

1. Đọc entity đích, Prisma schema, query của repository và mapper cùng mô-đun.
2. Nếu sửa class/method hiện có, chạy GitNexus impact analysis theo `AGENTS.md` trước khi sửa.
3. Dùng lớp `<Entity>Mapper` với `toDomain<Entity>` cho một record và `toDomain<Entities>` cho danh sách.
4. Dùng type Prisma cụ thể cho record cơ bản; dùng `Prisma.<Model>GetPayload` hoặc type đã xác minh cho record có relation.
5. Với field hữu hạn, import shared enum từ `src/shared/enums`; chỉ cast Prisma value sang enum sau khi đã xác minh enum Prisma và shared enum có cùng giá trị.
6. Map tường minh từng field vào `new Entity({ ... })`; chuẩn hóa `null` sang `undefined` chỉ khi constructor domain dùng optional property.
7. Chỉ map relation được repository `include`/`select`, và gọi mapper riêng cho relation đó.
8. Gọi mapper trong repository ngay sau query/persistence; cập nhật barrel export nếu mô-đun hiện có dùng nó.
9. Chạy `npm run build` sau thay đổi TypeScript.

## Guardrail kiến trúc

- Mapper chỉ thuộc Infrastructure; không import controller, DTO HTTP, use case hoặc `PrismaService`.
- Không query database, mở transaction, kiểm tra permission hoặc điều phối business rule trong mapper.
- Không dùng `any`, `as any`, relation Prisma thô hoặc non-null assertion để che lỗi mapping.
- Không map status, type, visibility hoặc tập giá trị hữu hạn thành `string`, number hoặc `any`; dùng shared enum phù hợp.
- Không import Prisma hay thêm `fromPrisma` vào Domain Entity.
- Không map relation chưa được tải và không tạo graph đệ quy vô hạn.

## Xác minh

- Không bắt buộc tạo hoặc chạy unit test, integration test hay coverage.
- Khi mapper đổi do schema, theo đầy đủ quy trình `database-schema-changes`.
- Báo cáo trung thực lệnh đã chạy, chưa chạy và lý do.

## Checklist cuối

- [ ] Đã đọc `reference-files.md` và `template.md`.
- [ ] Input mapper có type Prisma cụ thể.
- [ ] Record và relation được chuyển thành Domain Entity đúng kiểu.
- [ ] Field có tập giá trị hữu hạn được map sang shared enum sau khi xác minh giá trị đồng bộ với Prisma.
- [ ] Không có query, HTTP, transaction, authorization hoặc business rule trong mapper.
- [ ] Không có yêu cầu unit test.
