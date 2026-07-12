# Frontend: xác thực học sinh

Tài liệu này mô tả các luồng xác thực Student hiện có. Backend đặt global prefix là `/api`; dùng biến `API_BASE_URL` theo môi trường, ví dụ `http://localhost:3000/api`.

## Tổng quan endpoint

| Mục đích | Method | Endpoint |
| --- | --- | --- |
| Đăng nhập bằng tài khoản hoặc email | `POST` | `/auth/student/login` |
| Đăng ký bằng tài khoản/mật khẩu | `POST` | `/auth/student/register` |
| Bắt đầu đăng nhập Google | `GET` (điều hướng trình duyệt) | `/auth/google/student` |
| Làm mới phiên đăng nhập | `POST` | `/auth/refresh` |
| Đăng xuất | `POST` | `/auth/logout` |

Mọi request JSON dùng header `Content-Type: application/json`.

## 1. Đăng nhập bằng tài khoản hoặc email

Endpoint: `POST ${API_BASE_URL}/auth/student/login`

FE chỉ gửi **một trong hai**: `username` hoặc `email`. Gửi đồng thời cả hai, hoặc không gửi trường nào, sẽ bị từ chối.

### Request bằng username

```json
{
  "username": "nguyen.van.a",
  "password": "mat-khau-toi-thieu-6-ky-tu",
  "deviceFingerprint": "web-browser-device-id"
}
```

### Request bằng email

```json
{
  "email": "student@example.com",
  "password": "mat-khau-toi-thieu-6-ky-tu",
  "deviceFingerprint": "web-browser-device-id"
}
```

`userAgent` và `ipAddress` là tùy chọn. `userAgent` có thể lấy từ `navigator.userAgent`; không cần để FE tự gửi IP.

### Response thành công — `200`

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "tokens": {
      "accessToken": "<jwt-access-token>",
      "refreshToken": "<jwt-refresh-token>",
      "expiresIn": 3600
    },
    "user": {
      "userId": 101,
      "studentId": 55,
      "username": "nguyen.van.a",
      "email": "student@example.com",
      "firstName": "Văn",
      "lastName": "Nguyễn",
      "grade": 10,
      "studentType": "ONLINE"
    }
  }
}
```

Lưu `accessToken` để gọi API cần xác thực với `Authorization: Bearer <accessToken>`. `refreshToken` dùng cho refresh/logout. Mỗi lần đăng nhập mới sẽ thu hồi refresh token cũ của tài khoản (single-device login).

### Response lỗi

Backend trả lỗi theo dạng:

```json
{
  "success": false,
  "message": "Mật khẩu hoặc tên đăng nhập/email không đúng",
  "statusCode": 400,
  "path": "/api/auth/student/login",
  "timestamp": "2026-07-11T00:00:00.000Z"
}
```

FE cần hiển thị `message`; không suy luận nguyên nhân cụ thể từ HTTP status vì thông tin đăng nhập sai có thể là `400` hoặc `404`.

## 2. Đăng ký học sinh bằng tài khoản/mật khẩu

Endpoint: `POST ${API_BASE_URL}/auth/student/register`

### Request

```json
{
  "username": "nguyen.van.a",
  "email": "student@example.com",
  "password": "mat-khau-toi-thieu-6-ky-tu",
  "firstName": "Văn",
  "lastName": "Nguyễn",
  "gender": "MALE",
  "dateOfBirth": "2010-05-20",
  "studentPhone": "0987654321",
  "parentPhone": "0912345678",
  "school": "THPT ABC",
  "highSchoolGraduationYear": 2028,
  "grade": 10
}
```

Trường bắt buộc: `username`, `password`, `firstName`, `lastName`, `grade` (1–12). `email` và các trường còn lại là tùy chọn. `gender` nhận `MALE`, `FEMALE`, hoặc `OTHER`.

Không gửi `studentType` trong API Auth này: backend tự tạo học sinh với `studentType: "ONLINE"`.

### Response thành công — `201`

```json
{
  "success": true,
  "message": "Tạo tài khoản thành công",
  "data": {
    "userId": 101,
    "studentId": 55,
    "username": "nguyen.van.a",
    "email": "student@example.com",
    "firstName": "Văn",
    "lastName": "Nguyễn",
    "grade": 10,
    "studentType": "ONLINE"
  }
}
```

API đăng ký không trả token. Sau khi thành công, FE gọi `POST /auth/student/login` để tạo phiên đăng nhập.

## 3. Đăng nhập/đăng ký Google

Google OAuth là luồng điều hướng trình duyệt, không gọi bằng `fetch`/Axios rồi mong nhận JSON.

### Việc FE cần làm

1. Có route frontend `/auth/google/callback`.
2. Khi người dùng bấm “Tiếp tục với Google”, điều hướng toàn bộ trang đến `${API_BASE_URL}/auth/google/student`.
3. Route callback đọc query string `token`, `refresh` hoặc `error`.
4. Nếu có token, lưu phiên và điều hướng về trang sau đăng nhập; nếu có `error`, hiển thị lỗi và xóa query string.

Ví dụ React Router:

```ts
// Nút Google
window.location.assign(`${API_BASE_URL}/auth/google/student`)

// Route /auth/google/callback
const params = new URLSearchParams(window.location.search)
const error = params.get('error')
const accessToken = params.get('token')
const refreshToken = params.get('refresh')

if (error) {
  // Hiển thị decodeURIComponent(error)
} else if (accessToken && refreshToken) {
  // Lưu token, sau đó navigate('/');
} else {
  // Hiển thị lỗi callback không hợp lệ
}
```

### Chuỗi redirect

```text
FE /login
  → GET API /auth/google/student
  → Google consent/sign-in
  → GET API /auth/google/student/callback
  → FE /auth/google/callback?token=<access>&refresh=<refresh>
```

Nếu email Google chưa có tài khoản, backend tạo User/Student mới, gán role Student và đặt `studentType: "ONLINE"`. Nếu đã có Student, backend đăng nhập vào Student hiện có.

### Cấu hình bắt buộc phía backend/Google Console

FE cần cung cấp URL production và development để backend cấu hình:

```env
FRONTEND_URL=http://localhost:5173
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

`GOOGLE_OAUTH_CALLBACK_URL` là URL cơ sở; backend tự đổi phần cuối thành `/student/callback`. Vì vậy cần đăng ký chính xác redirect URI sau trong Google Cloud Console:

```text
http://localhost:3000/api/auth/google/student/callback
```

Production cũng tương tự, ví dụ `https://api.example.com/api/auth/google/student/callback`. `FRONTEND_URL` phải trỏ đến origin FE chứa route `/auth/google/callback`.

## 4. Refresh token và logout

### Làm mới access token

`POST ${API_BASE_URL}/auth/refresh`

```json
{ "refreshToken": "<jwt-refresh-token>" }
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "accessToken": "<new-access-token>",
    "refreshToken": "<new-refresh-token>",
    "expiresIn": 3600
  }
}
```

Thay thế cả hai token cũ bằng token mới.

### Đăng xuất

`POST ${API_BASE_URL}/auth/logout`

```json
{ "refreshToken": "<jwt-refresh-token>" }
```

Sau khi API thành công, FE xóa access token, refresh token và dữ liệu phiên cục bộ.

## Checklist tích hợp

- [ ] Đặt `API_BASE_URL` đúng prefix `/api`.
- [ ] Tạo `/auth/google/callback` trên FE.
- [ ] Cấu hình URL callback FE trong `FRONTEND_URL` và redirect URI Google đúng như phần Google OAuth.
- [ ] Không gửi đồng thời `username` và `email` khi đăng nhập.
- [ ] Không gửi `studentType` khi đăng ký bằng Auth; backend tự gán `ONLINE`.
- [ ] Gắn header Bearer cho API được bảo vệ và triển khai refresh token khi access token hết hạn.
