# AdminFrontend — Quản lý catalog sách

## Phạm vi

Catalog sách chỉ hỗ trợ trưng bày và liên hệ mua thủ công. Admin không tạo giỏ hàng, đơn hàng, thanh toán, tồn kho hoặc giao dịch SePay cho sách.

Các API admin đều cần access token và permission tương ứng:

- `BOOK`: quản lý sách.
- `BOOK_CATEGORY`: quản lý loại sách.
- `BOOK_SALES_CONTACT_CONFIGURATION`: cập nhật thông tin liên hệ bán sách.

## 1. Thiết lập kênh liên hệ trước khi xuất bản

1. Màn hình cấu hình gọi `GET /api/books/sales-contact-configuration` để lấy cấu hình hiện tại.
2. Admin nhập hotline và URL Facebook, sau đó lưu bằng `PUT /api/books/sales-contact-configuration`.
3. Backend lưu một cấu hình dùng chung cho toàn bộ catalog. Nếu cấu hình chưa tồn tại, không thể chuyển sách sang `PUBLISHED`.
4. Không lưu từng yêu cầu liên hệ, đơn hàng hoặc thanh toán phát sinh từ CTA này.

Ví dụ payload:

```json
{
  "phone": "0901234567",
  "facebookUrl": "https://www.facebook.com/bee.edu.vn"
}
```

## 2. Quản lý loại sách

1. Tạo loại bằng `POST /api/books/categories` với `name`, `slug`, `description`, `sortOrder`, `isActive`.
2. Danh sách và tìm kiếm dùng `GET /api/books/categories`.
3. Chỉnh sửa bằng `PUT /api/books/categories/:categoryId`; có thể ngừng sử dụng bằng `isActive: false` thay vì xóa.
4. Khi tạo hoặc cập nhật sách, chỉ được gắn các loại đang hoạt động.
5. Chỉ gọi `DELETE /api/books/categories/:categoryId` khi loại chưa được gắn với sách nào. Nếu đang được dùng, frontend hướng admin về thao tác ngừng hoạt động.

Slug loại phải là duy nhất. `sortOrder` quyết định thứ tự hiển thị của danh sách loại công khai.

## 3. Tạo sách nháp

1. Admin tạo sách qua `POST /api/books` với tối thiểu `sku`, `title`, `priceVnd`, `categoryIds` và `visibility`.
2. Dùng `DRAFT` trong lúc soạn nội dung; `PRIVATE` dành cho nội dung chỉ nội bộ; chỉ `PUBLISHED` mới xuất hiện ở website.
3. Bổ sung trường SEO khi cần: `metaTitle`, `metaDescription`, `ogTitle`, `ogDescription`, `canonicalUrl`, `structuredData`, `targetKeywords`, `searchIntent` và `seoScore`.
4. `sku` là duy nhất và bắt buộc. `isbn` là tùy chọn, nhưng nếu có thì phải duy nhất. Slug SEO cũng phải duy nhất.

Ví dụ payload rút gọn:

```json
{
  "sku": "BOOK-ATOMIC-HABITS",
  "title": "Atomic Habits",
  "priceVnd": 199000,
  "categoryIds": ["<book-category-id>"],
  "visibility": "DRAFT",
  "shortDescription": "Sách về xây dựng thói quen tốt.",
  "metaTitle": "Atomic Habits | Nhà sách BEE"
}
```

## 4. Gắn ảnh và hoàn thiện nội dung

1. Upload media theo luồng media hiện có và chờ trạng thái `READY`.
2. Khi tạo sách, có thể truyền `coverMediaId`, `galleryMediaIds` và/hoặc `ogImageMediaId` cùng request tạo sách.
3. Backend từ chối media chưa sẵn sàng hoặc ID bị lặp trong cùng nhóm ảnh.
4. Dùng `PUT /api/books/:bookId/media` để thay cover, OG image hoặc toàn bộ gallery mà không sửa nội dung sách. Truyền `null` để gỡ cover/OG image và `[]` để xóa gallery.
5. Ảnh cover, gallery và OG image được trả cùng dữ liệu sách, mỗi phần tử có `viewUrl`, `expiresAt` và `expirySeconds`. Gallery giữ thứ tự liên kết.
6. Cập nhật các thông tin còn lại qua `PUT /api/books/:bookId`; danh sách sách admin dùng `GET /api/books`; chi tiết dùng `GET /api/books/:bookId`.

## 5. Xuất bản và kiểm tra công khai

1. Xác nhận cấu hình hotline/Facebook đã tồn tại.
2. Đổi `visibility` sang `PUBLISHED` qua `PUT /api/books/:bookId`.
3. Kiểm tra website bằng `GET /api/books/public/seo/:slug`. Response phải có `priceVnd`, media, metadata SEO và `contact`.
4. Khi cần ẩn sách, chuyển về `DRAFT` hoặc `PRIVATE`. Sách đó lập tức không còn ở danh sách, chi tiết và sitemap công khai.

## 6. Xóa sách

1. Chỉ sách `DRAFT` mới có thể xóa bằng `DELETE /api/books/:bookId`.
2. Nếu sách đang `PUBLISHED` hoặc `PRIVATE`, chuyển về `DRAFT` trước.
3. Khi xóa, backend gỡ liên kết loại sách và media của sách; file media gốc không bị xóa.

## 7. Theo dõi thay đổi

Các thao tác tạo, sửa, xóa sách; tạo, sửa, xóa loại sách; và cập nhật cấu hình liên hệ đều được ghi audit. Admin không cần tự tạo log từ frontend.

Xem chi tiết request/response tại [Books API](books.md).
