# Quan Ly Bai Viet Tin Tuc

Base URL: `/api` (theo global prefix hien tai cua backend). Tat ca API duoi day can `Authorization: Bearer <admin-access-token>` va permission `news-article:*` tuong ung.

## Quy uoc Tiptap va media

1. Upload media bang API media hien co va lay `mediaId` khi upload hoan tat.
2. Media trong noi dung phai duoc dat trong node Tiptap qua `attrs.mediaId`; khong luu presigned URL vao request. `attrs.alt` la alt theo tung vi tri chen, phai la chuoi sau khi trim va toi da 500 ky tu.
3. Node anh/video co the gui nhu sau:

```json
{
  "type": "image",
  "attrs": {
    "mediaId": 125,
    "alt": "Hoc sinh trong lop Toan"
  }
}
```

4. Neu gui `contentHtml`, media phai dung placeholder `media:<mediaId>`, vi du `<img src="media:125" alt="Hoc sinh">`. Backend luu placeholder va thay bang presigned URL khi tra response.
5. Khi xem/tao/sua, `contentJson.attrs.mediaId` va `contentJson.attrs.alt` luon duoc giu lai. Backend them `attrs.src` va `attrs.viewUrl` co thoi han 24 gio de extension Tiptap render. Khong gui lai `src`/`viewUrl` khi luu; backend se bo cac field nay. `contentHtml` giu nguyen alt cua the `img` do frontend gui.
6. `contentMedia` chi la danh sach URL theo mediaId, khong co alt. Frontend phai render alt tu `contentJson` cua tung node, vi mot media co the duoc chen nhieu lan voi alt khac nhau.

## Loai bai viet

| Gia tri | Su dung |
| --- | --- |
| `NEWS` | Tin tuc chung |
| `ANNOUNCEMENT` | Thong bao |
| `GUIDE` | Huong dan |
| `EVENT` | Su kien |
| `LEARNING` | Bai viet hoc tap |
| `COURSE_MEMORY` | Thong tin, thanh tich va ky niem cua khoa hoc cu tai trung tam |

## Tao bai viet

`POST /api/news-articles` - permission `news-article:create`.

`slug` khong duoc gui tu frontend. Backend tu sinh slug duy nhat tu `title`.
`auto` mac dinh la `true`: backend goi AI de bo sung cac truong SEO con thieu va tu tinh `readingTime` tu content. Gui `auto: false` de khong goi AI.

```json
{
  "auto": true,
  "type": "LEARNING",
  "title": "Cach lap ke hoach on thi Toan 12",
  "excerpt": "Huong dan lap ke hoach on thi trong 8 tuan.",
  "thumbnailMediaId": 120,
  "contentJson": {
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Noi dung bai viet" }] },
      { "type": "image", "attrs": { "mediaId": 125, "alt": "So do on tap" } }
    ]
  },
  "contentHtml": "<p>Noi dung bai viet</p><img src=\"media:125\" alt=\"So do on tap\">",
  "contentText": "Noi dung bai viet",
  "authorName": "BEE Education",
  "publishedAt": "2026-07-11T08:00:00.000Z",
  "visibility": "PUBLISHED",
  "isFeatured": true,
  "targetKeyword": "ke hoach on thi Toan 12",
  "metaTitle": "Cach lap ke hoach on thi Toan 12",
  "metaDescription": "Huong dan lap ke hoach on thi Toan 12 hieu qua.",
  "structuredData": {
    "@context": "https://schema.org",
    "@type": "NewsArticle"
  }
}
```

Response `201` co dang `BaseResponseDto<NewsArticleResponseDto>`. `data.thumbnailViewUrl`, `data.contentMedia[]`, `data.contentJson` va `data.contentHtml` da co presigned URL de hien thi ngay.

## Danh sach bai viet

`GET /api/news-articles?page=1&limit=10&type=LEARNING&visibility=PUBLISHED&isFeatured=true&sortBy=publishedAt&sortOrder=desc` - permission `news-article:get-all`.

Query ho tro: `page`, `limit`, `search`, `type`, `visibility`, `isFeatured`, `sortBy`, `sortOrder`.

Response la `PaginationResponseDto<NewsArticleResponseDto>`:

```json
{
  "success": true,
  "message": "Lay danh sach bai viet tin tuc thanh cong",
  "data": [{
    "newsArticleId": 1,
    "type": "LEARNING",
    "title": "Cach lap ke hoach on thi Toan 12",
    "slug": "cach-lap-ke-hoach-on-thi-toan-12",
    "thumbnailMediaId": 120,
    "thumbnailViewUrl": "https://...signed...",
    "contentMedia": [{ "mediaId": 125, "type": "IMAGE", "mimeType": "image/webp", "viewUrl": "https://...signed..." }]
  }],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1, "hasPrevious": false, "hasNext": false }
}
```

API danh sach khong tra `contentJson`, `contentText`, `contentMedia` va khong tao presigned URL cho media trong noi dung. Chi `thumbnailViewUrl` duoc tao de hien thi card bai viet.

## Chi tiet bai viet

`GET /api/news-articles/:newsArticleId` - permission `news-article:get-by-id`.

Response tra day du `contentJson`, `contentHtml`, SEO fields va media URLs. Dung response nay de nap lai Tiptap editor.

## Cap nhat bai viet

`PUT /api/news-articles/:newsArticleId` - permission `news-article:update`.

Gui cac field can thay doi, theo cung format voi API tao. Slug khong nhan tu frontend; khi thay `title`, backend tu sinh slug duy nhat moi. Khi gui `contentJson`, backend so sanh `attrs.mediaId` moi voi media usage cu, go usage cua media bi xoa khoi noi dung va gan usage cho media moi. Khi gui `thumbnailMediaId`, backend thay usage thumbnail; gui `null` de xoa thumbnail.

```json
{
  "thumbnailMediaId": null,
  "contentJson": {
    "type": "doc",
    "content": [{ "type": "image", "attrs": { "mediaId": 131, "alt": "Anh moi" } }]
  },
  "contentHtml": "<img src=\"media:131\" alt=\"Anh moi\">"
}
```

## Xoa bai viet

`DELETE /api/news-articles/:newsArticleId` - permission `news-article:delete`.

Response:

```json
{
  "success": true,
  "message": "Xoa bai viet tin tuc thanh cong",
  "data": { "deleted": true, "message": "Xoa bai viet tin tuc thanh cong" }
}
```

API chi xoa cac dong `MediaUsage` cua bai viet, khong xoa file media goc trong kho.

## Tang luot xem public

`POST /api/news-articles/public/seo/:slug/view` - public, khong can JWT.

Khong co request body. API chi tang luot xem cho bai viet co `visibility = PUBLISHED`.

```json
{
  "success": true,
  "message": "Tang luot xem bai viet tin tuc thanh cong",
  "data": { "viewCount": 101 }
}
```
