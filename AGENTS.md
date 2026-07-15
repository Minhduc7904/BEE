# Database schema changes

Khi yêu cầu liên quan đến tạo bảng, sửa cột, enum, relation, index hoặc migration Prisma, phải đọc và tuân thủ [docs/PRISMA-MIGRATION-WORKFLOW.md](docs/PRISMA-MIGRATION-WORKFLOW.md) trước khi chỉnh sửa.

Không dùng `prisma db push` cho các thay đổi schema. Tạo migration bằng `npm run prisma:migrate:dev -- --name <ten_thay_doi>`, kiểm tra SQL, generate Prisma Client, build và dùng `npm run prisma:migrate:deploy` khi triển khai.
