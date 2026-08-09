# Catalog sách và SEO

Catalog sách chỉ phục vụ giới thiệu và liên hệ mua thủ công; không có giỏ hàng, đơn hàng hoặc thanh toán SePay.

## API công khai

- `GET /api/books/public/seo?page=1&limit=10&search=&categorySlug=&isFeatured=`: danh sách sách `PUBLISHED` kèm giá, loại sách và media.
- `GET /api/books/public/seo/:slug`: chi tiết sách công khai, metadata SEO, media và `{ phone, facebookUrl }` để frontend tạo CTA `tel:` hoặc liên kết Facebook.
- `POST /api/books/public/seo/:slug/view`: tăng lượt xem của sách đã xuất bản.
- `GET /api/books/public/seo/categories`: các loại sách đang hoạt động.
- `GET /api/books/public/seo/sitemap?page=1&limit=1000`: trả `{ slug, updatedAt }` cho sitemap.

## API quản trị

- `POST|GET|PUT|DELETE /api/books/categories`: quản lý loại sách.
- `POST|GET|PUT|DELETE /api/books`: quản lý catalog sách; chỉ sách `DRAFT` được xóa.
- `PUT /api/books/:bookId/media`: chỉnh riêng cover, OG image và gallery của sách.
- `GET|PUT /api/books/sales-contact-configuration`: cấu hình hotline và URL Facebook dùng chung.

Sách có thể gắn nhiều loại qua `categoryIds`. Media được gắn qua `coverMediaId`, `ogImageMediaId`, `galleryMediaIds`; tất cả phải là media `READY` và được public hóa qua `MediaUsage`. Các API GET sách (admin list/detail và public list/detail) đều trả `media[]` có `viewUrl` đã ký, `expiresAt` và `expirySeconds`.

`PUT /api/books/:bookId/media` nhận một hoặc nhiều field sau. Với `coverMediaId` hoặc `ogImageMediaId`, truyền `null` để gỡ ảnh; truyền `[]` để xóa toàn bộ gallery. Response trả lại dữ liệu sách cùng danh sách media và URL mới.

```json
{
  "coverMediaId": 101,
  "ogImageMediaId": null,
  "galleryMediaIds": [102, 103]
}
```
