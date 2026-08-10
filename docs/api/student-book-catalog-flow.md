# StudentFE — Catalog sách đã đăng nhập

## Mục tiêu và giới hạn

StudentFE chỉ hiển thị sách đã `PUBLISHED` cho role `STUDENT`. Đây là catalog và CTA liên hệ mua thủ công; không có giỏ hàng, order, thanh toán hoặc SePay.

Mọi request cần:

```http
Authorization: Bearer <student-access-token>
```

## Luồng giao diện

1. Khi mở catalog, gọi `GET /api/books/student/my/categories` và `GET /api/books/student/my?page=1&limit=12` song song.
2. Khi người dùng tìm/lọc, gửi lại query `search`, `categorySlugs`, `isFeatured`, `sortBy`, `sortOrder`, `page`, `limit`. Có thể gửi lặp `categorySlugs` để chọn nhiều loại; Book thuộc ít nhất một loại được chọn sẽ khớp. Không gửi `visibility`; backend luôn ép `PUBLISHED`.
3. Khi mở trang sách, gọi `GET /api/books/student/my/:slug`. Nếu `404`, hiển thị trang không tìm thấy, không suy đoán trạng thái sách.
4. Sau khi trang detail render thành công, gọi đúng một lần `POST /api/books/student/my/:slug/view`.
5. Dùng `contact.phone` làm `tel:` và `contact.facebookUrl` làm CTA Facebook. Không gửi request mua sách lên backend.

## Ví dụ request

```http
GET /api/books/student/my?categorySlugs=ky-nang-song&categorySlugs=thieu-nhi&isFeatured=true&page=1&limit=12
Authorization: Bearer <student-access-token>
```

```http
GET /api/books/student/my/atomic-habits
Authorization: Bearer <student-access-token>
```

```http
POST /api/books/student/my/atomic-habits/view
Authorization: Bearer <student-access-token>
```

## Quy tắc hiển thị

- Chỉ render các item backend trả về; không cố mở `DRAFT`/`PRIVATE` bằng slug.
- List không có `content`; dùng detail để lấy nội dung đầy đủ và metadata SEO.
- `media[].viewUrl` có hạn; reload list/detail khi URL hết hạn.
- Khi token hết hạn hoặc không phải role học sinh, chuyển về luồng đăng nhập; không fallback sang API SEO vì hai contract khác nhau.

Request/response, lỗi và toàn bộ API xem tại [Books API](books.md).
