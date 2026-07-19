---
name: database-schema-changes
description: Thiet ke va thay doi Prisma/MySQL schema an toan cho BEE. Su dung khi tao/sua bang, cot, enum, relation, index hoac Prisma migration; bao gom comment ro muc dich bang/truong, tao va kiem tra migration.
---

# Database schema changes

## Muc tieu

Thay doi database theo dung kien truc va convention cua BEE, de schema tu giai thich duoc y nghia nghiep vu, migration co the kiem tra/trien khai an toan, va Prisma Client luon dong bo.

## Truoc khi chinh sua

1. Doc hoan chinh:
   - `.agent/skills/shared/architecture.md`
   - `.agent/skills/shared/clean-architecture-rules.md`
2. Kiem tra `prisma/schema.prisma`, cac model lien quan, migration gan day va repository/use case dang su dung du lieu nay.
3. Phan tich tac dong cua symbol truoc khi sua code theo quy dinh GitNexus cua du an. Neu rui ro HIGH/CRITICAL, thong bao pham vi anh huong truoc khi sua.
4. Xac dinh yeu cau nghiep vu: quyen so huu du lieu, quan he, optionality, hanh vi xoa, truy van/phan trang can ho tro, va cach chuyen doi du lieu cu neu co.

## Quy tac thiet ke schema

### Model/bang moi

- Dat comment ngay truoc moi `model` moi, neu ro bang nay luu gi, phuc vu luong nghiep vu nao, va pham vi so huu du lieu.
- Tuan thu quy uoc ten hien co cua du an: field camelCase trong Prisma va `@map`/ `@@map` cho ten cot/bang snake_case.
- Giu `id`, `createdAt`, `updatedAt`, enum va relation nhat quan voi cac model hien co.
- Chon `onDelete` co chu dich. Khong dung cascade neu viec xoa ban ghi cha co the lam mat lich su/nghiep vu can luu.

### Field/cot

- Comment ro tung field moi (hoac tung nhom field co cung y nghia) ngay trong model. Comment phai noi duoc:
  - field luu gia tri gi va muc dich nghiep vu;
  - voi khoa ngoai: tro toi ban ghi nao va quan he nay dung de lam gi;
  - ly do field optional/required neu khong tu nhien;
  - y nghia cua default, enum/status, va timestamp neu co.
- Khong them field chi vi tien dung ky thuat khi chua ro gia tri nghiep vu va lifecycle cua no.
- Dung `@unique`, `@@unique` va `@@index` theo truy van thuc te (filter, sort, lookup quan he); tranh index trung lap voi primary key/unique index.
- Rang buoc schema khong the dien dat (vi du: chi duoc chon mot trong nhieu target optional) phai duoc validate o application layer va ghi ro trong code/DTO phu trach.

## Quy trinh migration bat buoc

1. Kiem tra trang thai truoc khi tao migration:

   ```bash
   npm run prisma:migrate:status
   ```

   Neu co migration dang pending, khong tao migration moi cho den khi da xu ly trang thai do theo moi truong phu hop.

2. Cap nhat `prisma/schema.prisma`, bao gom cac comment nghiep vu bat buoc o tren.

3. Tao migration moi voi ten mo ta ro thay doi:

   ```bash
   npm run prisma:migrate:dev -- --name <ten_thay_doi>
   ```

   Tren PowerShell, neu npm khong chuyen dung tham so `--name`, dung:

   ```powershell
   npm.cmd --% run prisma:migrate:dev -- --name <ten_thay_doi>
   ```

   Khong bao gio dung `prisma db push` thay cho migration.

4. Doc ky file `prisma/migrations/<timestamp>_<ten_thay_doi>/migration.sql` vua tao:
   - doi chieu SQL voi yeu cau va schema;
   - kiem tra xoa/doi ten cot, thay doi enum, FK, unique/index va `ON DELETE`;
   - neu co nguy co mat du lieu, can co ke hoach backup/backfill/chuyen doi du lieu duoc thong nhat truoc khi tiep tuc.

5. Dong bo va xac minh:

   ```bash
   npm run prisma:generate
   npm run build
   npm run prisma:migrate:status
   ```

6. Khi trien khai moi truong khong phai development, ap dung cac migration da commit:

   ```bash
   npm run prisma:migrate:deploy
   npm run prisma:migrate:status
   ```

## Dieu cam

- Khong xoa, sua, doi ten hoac viet lai migration da duoc ap dung/commit.
- Khong dung `prisma db push` cho thay doi schema.
- Khong tao migration ma khong kiem tra SQL.
- Khong bo qua comment mo ta bang va cac field moi.
- Khong xoa du lieu/migration cu chi de lam sach lich su khi chua co yeu cau ro rang va ke hoach phuc hoi.

## Bao cao khi hoan tat

Neu ro:

1. model, field, relation, enum va index da thay doi cung ly do;
2. ten migration va cac diem da kiem tra trong SQL;
3. ket qua generate, build va migration status;
4. buoc deploy/backfill con lai (neu co).
