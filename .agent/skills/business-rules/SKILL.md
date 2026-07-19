---
name: business-rules
description: Xac dinh, ghi nhan va ap dung business rule cho BEE. Su dung khi them/sua hanh vi nghiep vu, phan quyen theo so huu du lieu, validation lien truong, chuyen trang thai, chinh sach xoa, han muc, hoac quy tac xu ly loi.
---

# Business rules

## Pham vi

Skill nay la nguon huong dan cho **quy tac nghiep vu**. Khong dung no de quy dinh cach viet Prisma repository, DTO hay controller; phan hien thuc ky thuat thuoc skill `create-application-use-case`.

## Truoc khi code

1. Doc cac skill chung trong `.agent/skills/shared/`.
2. Xac dinh domain va nguon su that cua rule: yeu cau duoc phe duyet, tai lieu nghiep vu, hoac hanh vi da co trong code.
3. Khong tu dat ra rule khi yeu cau chua du thong tin. Neu rule anh huong quyen, du lieu cu, trang thai, hoac thanh toan/diem so, neu ro gia dinh va xin xac nhan truoc khi thay doi.

## Cach dinh nghia mot rule

Voi moi rule moi hoac thay doi, ghi ro:

- actor nao thuc hien va pham vi du lieu actor duoc tac dong;
- dieu kien tien quyet va du lieu dau vao hop le;
- ket qua, trang thai truoc/sau, va side effect;
- truong hop bi tu choi va ma loi nghiep vu phu hop;
- quy tac xoa/giu lich su/audit neu lien quan.

Dat rule o application use case. DTO chi validate cau truc request; repository chi truy van va luu tru; controller chi kiem soat HTTP/authentication/permission.

## Mau rule

```md
### <Ten rule>

- Actor: <ai duoc phep thuc hien>
- Scope: <ban ghi nao actor duoc phep tac dong>
- Precondition: <dieu kien bat buoc>
- Transition/outcome: <trang thai va ket qua>
- Rejection: <truong hop loi va exception>
- Audit/notification: <neu can>
```

## Vi du: gui bao cao

- Actor: student da dang nhap.
- Scope: chi tao report moi; khong tu gan `reporterId` cua nguoi khac.
- Precondition: loai target phai phu hop voi ID/URL duoc bao cao; noi dung ly do phai du de xu ly.
- Outcome: tao report o trang thai `PENDING`, luu nguoi bao cao neu co trong auth context.
- Rejection: target khong ton tai, target type khong khop, hoac request khong co target hop le.
- Audit: luu thoi diem tao/cap nhat; cac hanh dong quan tri sau do phai truy vet duoc.

## Khi hien thuc

1. Chuyen rule thanh validation va transition ro rang trong use case.
2. Ap dung scope/ownership truoc khi doc, sua hoac xoa ban ghi.
3. Viet test cho duong thanh cong va moi dieu kien bi tu choi quan trong.
4. Cap nhat API documentation khi input, output, permission, status, hoac loi nhin thay tu client thay doi.
5. Chi goi `database-schema-changes` khi rule can thay doi schema hoac migration.
