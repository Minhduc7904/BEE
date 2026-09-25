# Parent Notification API (FCM)

## Phạm vi

- Base URL: `/api`. Mọi endpoint dưới `/api/parent` yêu cầu access token của Parent (`userType=parent`); token khác nhận `403`.
- `userId` và `parentId` luôn lấy từ access token, không nhận từ body.
- Đợt này chỉ dựng nền tảng: lưu thiết bị, lưu lựa chọn nhận thông báo và có sẵn dịch vụ FCM phía BE. **Chưa có luồng nào gửi
  thông báo đẩy** (điểm danh, học phí, kết quả sẽ gắn ở pha sau). Thông báo Zalo hiện có không đổi.

## Mô hình dữ liệu

| Bảng | Ý nghĩa |
| --- | --- |
| `user_devices` | Thiết bị đăng ký nhận thông báo: `(user_id, device_id)` duy nhất; `fcm_token` duy nhất toàn bảng. |
| `user_notification_settings` | Thông báo tổng của tài khoản. `is_enabled`: `null` chưa hỏi, `true` nhận, `false` không nhận. |
| `parent_notification_settings` | Ba cờ loại thông báo của phụ huynh: điểm danh, kết quả, học phí. Mặc định bật cả ba. |

Chưa có bản ghi nghĩa là dùng mặc định (`isEnabled: null`, cả ba cờ `true`); bản ghi chỉ được tạo khi người dùng thay đổi.

Điều kiện gửi thông báo về sau: `isEnabled = true` **và** cờ loại tương ứng bật **và** có thiết bị đã đăng ký token.

## Thiết bị

### `POST /api/parent/devices`

Upsert theo `(userId, deviceId)`. Nếu `fcmToken` đang thuộc bản ghi khác (tài khoản khác trên cùng máy, hoặc `deviceId` cũ),
bản ghi đó bị xóa và token chuyển sang tài khoản hiện tại. App gọi khi mở app đã đăng nhập và mỗi khi FCM token xoay.

```json
{ "deviceId": "3f1c9c62-5f3e-4e1b-9a4e-2f7f4f8a1c11", "fcmToken": "<fcm-token>", "platform": "ANDROID", "appVersion": "1.0.0" }
```

`platform`: `ANDROID` hoặc `IOS`. Trả `200`:

```json
{ "success": true, "message": "Đăng ký thiết bị nhận thông báo thành công", "data": { "deviceId": "...", "platform": "ANDROID", "lastSeenAt": "2026-09-25T02:00:00.000Z" } }
```

### `DELETE /api/parent/devices/:deviceId`

Gỡ thiết bị của chính tài khoản. Trả `200` với `data: { "removed": true|false }`.

### Khi nào thiết bị bị gỡ tự động

- Đăng nhập Parent: gỡ mọi thiết bị trừ `deviceId` gửi lên (không gửi thì gỡ hết).
- Logout (`deviceId` tùy chọn), logout-all, đặt lại mật khẩu: xem [parent-auth.md](parent-auth.md).

## Cài đặt thông báo

Cả ba endpoint trả cùng một dạng `data`:

```json
{ "isEnabled": null, "attendanceEnabled": true, "resultEnabled": true, "tuitionEnabled": true }
```

- `GET /api/parent/notification-settings`: đọc cài đặt hiện tại.
- `PUT /api/parent/notification-settings/enabled`: body `{ "isEnabled": true|false }` (không nhận `null`). Ghi vào
  `user_notification_settings`.
- `PUT /api/parent/notification-settings/preferences`: body chứa ít nhất một trong `attendanceEnabled`, `resultEnabled`,
  `tuitionEnabled`; chỉ các trường gửi lên được đổi, thiếu trường nào giữ nguyên. Body rỗng trả `400`.

Cài đặt cũng được trả kèm ở login, register và `GET/PUT /api/parent/profile` dưới khóa `notificationSettings`.

## Cấu hình môi trường

Xem khối `Firebase Cloud Messaging` trong `.env.example`: `FIREBASE_ENABLED`, `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FCM_DRY_RUN`, `FCM_ANDROID_CHANNEL_ID`. Kiểm tra cấu hình bằng script:

```bash
npm run fcm:test -- <fcmToken> "Tiêu đề" "Nội dung"
```
