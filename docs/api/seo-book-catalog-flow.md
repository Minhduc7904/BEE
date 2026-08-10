# SeoFE — Catalog sách công khai

SeoFE không cần JWT và chỉ được dùng các API `/api/books/public/seo...`.

1. Tải loại sách: `GET /api/books/public/seo/categories`.
2. Tải danh sách published: `GET /api/books/public/seo?page=1&limit=12&categorySlugs=ky-nang-song&categorySlugs=thieu-nhi&isFeatured=true`. Book thuộc ít nhất một loại được chọn sẽ được trả về.
3. Render detail theo slug: `GET /api/books/public/seo/:slug`.
4. Sau khi detail hiển thị, gọi tối đa một lần `POST /api/books/public/seo/:slug/view`.
5. Job sitemap gọi `GET /api/books/public/seo/sitemap?page=1&limit=1000` và chỉ tạo URL từ response.

Không dùng SEO endpoint để preview `DRAFT`/`PRIVATE`; backend trả `404` cho slug không published hoặc khi cấu hình liên hệ bán sách không sẵn sàng. Response detail chứa metadata SEO, structured data, media URL có hạn và `contact` cho CTA. Xem request/response đầy đủ tại [Books API](books.md).
