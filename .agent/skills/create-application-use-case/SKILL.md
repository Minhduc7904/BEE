---
name: create-application-use-case
description: Hien thuc use case, repository, mapper, DTO va controller theo Clean Architecture cua BEE. Su dung khi tao hoac sua API/feature application, truy van/persist du lieu, phan trang, phan quyen, validation, hoac dang ky DI.
---

# Create application use case

## Pham vi

Skill nay quy dinh **cach hien thuc ky thuat**. Rule ve actor, ownership, validation nghiep vu va state transition phai doc tu skill `business-rules` khi task co hanh vi nghiep vu.

## Truoc khi hien thuc

1. Doc hai shared skills va skill `business-rules` neu task them/sua hanh vi nghiep vu.
2. Doc skill `database-schema-changes` neu can sua Prisma schema.
3. Tim module gan nhat va lam theo convention dang dung truoc khi them file moi.
4. Phan tich tac dong theo quy dinh GitNexus truoc khi sua function, class hoac method.

## Trinh tu implement

1. **Domain:** tao/cap nhat entity, filter interface va repository port trong `src/domain/`.
2. **Infrastructure:** tao mapper Prisma-to-domain va repository implementation; chi chua query, relation selection va persistence.
3. **Application:** tao request/response DTO, use case `execute`, validation lien truong va orchestration; dung repository token, khong goi Prisma truc tiep.
4. **Presentation:** tao/sua controller de bind route, DTO, auth context va permission; khong dua business rule hoac query database vao controller.
5. **Registration:** dang ky repository, use case module, controller, enum va permission o cac module/constants/seed can thiet.

## Quy tac API

- Dung `BaseResponseDto` cho mot ket qua va `PaginationResponseDto` cho danh sach.
- Danh sach phai extend `ListQueryDto`, whitelist truong sort va tach DTO admin/self-service neu filter khac nhau.
- Lay ownership tu `@CurrentUser`; khong nhan ownership field tu request self-service.
- Dung `RequirePermission(PERMISSION_CODES...)` cho endpoint dac quyen; `RequirePermission()` chi khi can JWT nhung khong can permission.
- Dung exception cua du an cho not found, forbidden va vi pham rule; khong de loi Prisma lo ra response.

## Xac minh

1. Kiem tra dependency direction va DI registration.
2. Viet/cap nhat test cho use case, dac biet cac rule bi tu choi.
3. Build va chay test lien quan.
4. Mo ta day du request, response, permission va loi cua API moi/thay doi.
