# StudentFrontend — Khám phá và liên hệ mua sách

## Phạm vi

Trong tài liệu này, “student” là người dùng website. Luồng xem sách là công khai, không yêu cầu đăng nhập và không tạo giỏ hàng, đơn hàng, thanh toán hay giao dịch SePay.

## 1. Tải danh sách loại và catalog

1. Tải loại sách công khai bằng `GET /api/books/public/seo/categories`.
2. Tải catalog bằng `GET /api/books/public/seo`.
3. Có thể truyền `page`, `limit`, `search`, `categorySlug` và `featured` để phân trang, tìm kiếm, lọc theo loại hoặc sách nổi bật.
4. Chỉ render các sách backend trả về; API công khai chỉ trả sách `PUBLISHED`.

Ví dụ:

```http
GET /api/books/public/seo?categorySlug=ky-nang-song&featured=true&page=1&limit=12
```

## 2. Hiển thị thẻ sách

Mỗi thẻ nên dùng `title`, `slug`, `shortDescription`, `priceVnd`, `coverMedia` và `categories`. Giá là VND nguyên; frontend tự định dạng, ví dụ `199000` thành `199.000 đ`.

URL media trong response là URL truy cập có thời hạn. Khi cần dữ liệu mới, tải lại catalog hoặc chi tiết sách thay vì lưu URL để dùng lâu dài.

## 3. Xem chi tiết và SEO

1. Điều hướng theo slug tới trang sách.
2. Gọi `GET /api/books/public/seo/:slug`.
3. Dùng `content`, tác giả, nhà xuất bản, cover/gallery và metadata SEO để render trang.
4. Dùng `metaTitle`, `metaDescription`, Open Graph, `canonicalUrl` và `structuredData` từ response khi có. Frontend không tự công khai một sách không được API trả về.

Nếu sách không tồn tại, chưa xuất bản, ở chế độ riêng tư, hoặc cấu hình liên hệ bán sách không còn tồn tại, API trả 404; frontend hiển thị trang không tìm thấy.

## 4. CTA liên hệ mua sách

Response chi tiết có:

```json
{
  "contact": {
    "phone": "0901234567",
    "facebookUrl": "https://www.facebook.com/bee.edu.vn"
  }
}
```

- Nút gọi điện dùng `href="tel:0901234567"`.
- Nút Facebook dùng liên kết `facebookUrl`.
- Có thể đưa tên sách/SKU vào nội dung hướng dẫn người dùng trao đổi với tư vấn viên, nhưng frontend không gửi yêu cầu mua lên API.

## 5. Ghi nhận lượt xem

Sau khi trang chi tiết đã render, frontend có thể gọi một lần `POST /api/books/public/seo/:slug/view` để tăng lượt xem. Chỉ gọi một lần cho mỗi lần hiển thị trang để tránh tăng số liệu do re-render.

## 6. Sitemap

Job frontend/SEO gọi `GET /api/books/public/seo/sitemap`. Mỗi phần tử có `slug` và `updatedAt`; chỉ tạo URL sitemap cho các phần tử API trả về. Chi tiết tích hợp sitemap nằm trong [Frontend SEO sitemap](../FRONTEND-SEO-SITEMAP.md).

Xem đầy đủ field và contract tại [Books API](books.md).
