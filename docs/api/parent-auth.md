# Parent Authentication API

## Phạm vi và quy ước

- Base URL: `/api`.
- Ba endpoint check/register/login là public; refresh và logout dùng refresh token trong body.
- `phone` chỉ nhận số nội địa Việt Nam gồm 10 chữ số, bắt đầu bằng `0`, ví dụ `0392923661`. Không nhận `+84...`, `84...`, khoảng trắng hoặc dấu phân cách.
- Access token có `userType=parent` và `parentId`. Refresh token được rotation và token cũ bị revoke.
- V1 chưa có OTP, rate limit, khóa tạm thời, quên mật khẩu hoặc xóa tài khoản.

## `POST /api/auth/parent/check-phone`

Request:

```json
{ "phone": "0392923661" }
```

Nếu Parent đã tồn tại, trả `200 OK`:

```json
{
  "success": true,
  "message": "Số điện thoại đã đăng ký tài khoản phụ huynh",
  "data": { "canLogin": true, "canRegister": false, "students": [] }
}
```

Nếu được đăng ký, trả `200 OK` và chỉ cung cấp dữ liệu học sinh tối thiểu:

```json
{
  "success": true,
  "message": "Số điện thoại có thể đăng ký tài khoản phụ huynh",
  "data": {
    "canLogin": false,
    "canRegister": true,
    "students": [
      {
        "studentId": 12,
        "fullName": "Nguyễn Minh An",
        "grade": 8,
        "school": "THCS Minh Khai",
        "avatarUrl": null,
        "gender": "FEMALE"
      }
    ]
  }
}
```

Lỗi: `400` khi sai định dạng; `404` khi chưa có học sinh khai báo số này; `409` khi số đã là username của loại tài khoản khác.

## `POST /api/auth/parent/register`

```json
{
  "phone": "0392923661",
  "password": "Example123",
  "firstName": "An",
  "lastName": "Nguyễn",
  "studentIds": [12, 15]
}
```

- `password`: 6–100 ký tự; `firstName` tối đa 50, `lastName` tối đa 100.
- `studentIds`: ít nhất một ID nguyên dương, không trùng. Mỗi học sinh phải có `parentPhone` khớp `phone`.
- Backend tạo User, Parent và tất cả liên kết trong cùng transaction. API không tự đăng nhập.

Thành công: `201 Created`, `data` gồm `userId`, `parentId`, `phone`, tên, trạng thái và danh sách học sinh. Lỗi `400` cho danh sách không hợp lệ; `409` khi Parent/User đã tồn tại.

## `POST /api/auth/parent/login`

```json
{
  "phone": "0392923661",
  "password": "Example123",
  "deviceFingerprint": "device-example"
}
```

Thành công: `200 OK`:

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "tokens": {
      "accessToken": "<access-token>",
      "refreshToken": "<refresh-token>",
      "expiresIn": 3600
    },
    "user": {
      "userId": 25,
      "parentId": 4,
      "phone": "0392923661",
      "firstName": "An",
      "lastName": "Nguyễn",
      "fullName": "An Nguyễn",
      "isActive": true,
      "students": []
    }
  }
}
```

Sai số điện thoại hoặc mật khẩu trả cùng lỗi `401`; tài khoản bị khóa cũng trả `401` với hướng dẫn liên hệ admin.

## Refresh và logout

- `POST /api/auth/refresh`: body `{ "refreshToken": "..." }`; trả token pair mới và giữ `parentId` trong JWT.
- `POST /api/auth/logout`: body `{ "refreshToken": "..." }`; revoke refresh token hiện tại.
- Mobile chỉ lưu token qua `TokenStore`; không đưa token, mật khẩu hoặc số điện thoại vào URL/log/analytics.

Error envelope chung:

```json
{
  "success": false,
  "message": "Nội dung lỗi",
  "statusCode": 400,
  "timestamp": "2026-09-19T00:00:00.000Z",
  "path": "/api/auth/parent/check-phone"
}
```
