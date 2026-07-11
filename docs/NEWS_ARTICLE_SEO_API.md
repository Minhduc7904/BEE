# API Tin Tuc Cho Trang SEO

Base URL: `/api`. Tat ca API trong tai lieu nay la public, khong gui `Authorization`.

Backend chi tra bai viet co `visibility = PUBLISHED`. Media trong response dung presigned URL, co thoi han 24 gio.

## Danh sach bai viet

`GET /api/news-articles/public/seo`

Query co the gui:

| Query | Kieu | Mo ta |
| --- | --- | --- |
| `page` | number | Mac dinh `1` |
| `limit` | number | Mac dinh `10` |
| `search` | string | Tim theo title, slug, excerpt va SEO fields |
| `type` | enum | `NEWS`, `ANNOUNCEMENT`, `GUIDE`, `EVENT`, `LEARNING`, `COURSE_MEMORY` |
| `isFeatured` | boolean | Loc bai noi bat neu can |
| `sortBy` | string | `publishedAt`, `sortOrder`, `viewCount`, `createdAt`, ... |
| `sortOrder` | `asc` or `desc` | Thu tu sap xep |

Vi du: `GET /api/news-articles/public/seo?page=1&limit=12&type=LEARNING&sortBy=publishedAt&sortOrder=desc`

Response la `PaginationResponseDto<NewsArticleResponseDto>`:

```json
{
  "success": true,
  "message": "Lay danh sach bai viet tin tuc thanh cong",
  "data": [
    {
      "newsArticleId": 12,
      "type": "LEARNING",
      "title": "Cach lap ke hoach on thi Toan 12",
      "slug": "cach-lap-ke-hoach-on-thi-toan-12",
      "excerpt": "Huong dan on tap trong 8 tuan.",
      "thumbnailMediaId": 120,
      "thumbnailViewUrl": "https://minio...signed...",
      "publishedAt": "2026-07-11T08:00:00.000Z",
      "readingTime": 5,
      "viewCount": 100,
      "isFeatured": true
    }
  ],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

API danh sach, noi bat va moi nhat khong tra `contentJson`, `contentText`, `contentMedia` va khong tao presigned URL cho media trong noi dung. Chi `thumbnailViewUrl` duoc tao de hien thi card bai viet. Goi API chi tiet khi can noi dung day du.

## Bai viet noi bat

`GET /api/news-articles/public/seo/featured`

Query: `page`, `limit`, `search`, `type`, `sortBy`, `sortOrder`. Backend luon ep `visibility = PUBLISHED` va `isFeatured = true`.

Vi du: `GET /api/news-articles/public/seo/featured?limit=6&type=COURSE_MEMORY`

Response cung format danh sach o tren. Mac dinh sap xep theo `sortOrder` tang dan.

## Bai viet moi nhat

`GET /api/news-articles/public/seo/latest`

Query: `page`, `limit`, `search`, `type`, `isFeatured`. Backend luon ep `visibility = PUBLISHED`, sap xep `publishedAt desc`; frontend khong can gui `sortBy` hay `sortOrder`.

Vi du: `GET /api/news-articles/public/seo/latest?limit=8`

Response cung format danh sach o tren.

## Chi tiet bai viet

`GET /api/news-articles/public/seo/:slug`

Vi du: `GET /api/news-articles/public/seo/cach-lap-ke-hoach-on-thi-toan-12`

Response `BaseResponseDto<NewsArticleResponseDto>`:

```json
{
  "success": true,
  "message": "Lay chi tiet bai viet tin tuc thanh cong",
  "data": {
    "newsArticleId": 12,
    "type": "LEARNING",
    "title": "Cach lap ke hoach on thi Toan 12",
    "slug": "cach-lap-ke-hoach-on-thi-toan-12",
    "contentJson": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [{ "type": "text", "text": "Noi dung bai viet" }]
        },
        {
          "type": "image",
          "attrs": {
            "mediaId": 125,
            "alt": "Hoc sinh dang on tap",
            "src": "https://minio...signed...",
            "viewUrl": "https://minio...signed..."
          }
        }
      ]
    },
    "contentHtml": "<p>Noi dung bai viet</p><img src=\"https://minio...signed...\" alt=\"Hoc sinh dang on tap\">",
    "contentMedia": [
      {
        "mediaId": 125,
        "type": "IMAGE",
        "mimeType": "image/webp",
        "viewUrl": "https://minio...signed..."
      }
    ],
    "targetKeyword": "ke hoach on thi Toan 12",
    "metaTitle": "Cach lap ke hoach on thi Toan 12",
    "metaDescription": "Huong dan lap ke hoach on thi Toan 12 hieu qua.",
    "visibility": "PUBLISHED",
    "publishedAt": "2026-07-11T08:00:00.000Z",
    "readingTime": 5,
    "viewCount": 100
  }
}
```

`contentJson` la nguon uu tien khi render Tiptap. Moi node media luon co `attrs.mediaId`; dung `attrs.src` hoac `attrs.viewUrl` de hien thi. Alt phai lay tu `attrs.alt` cua tung node, khong lay tu `contentMedia`.

`contentHtml` da duoc backend thay `media:<mediaId>` bang presigned URL, phu hop de render HTML/SSR. Frontend phai chay sanitizer truoc khi gan HTML vao DOM.

## Tang luot xem

Sau khi tai thanh cong trang chi tiet, frontend goi mot lan:

`POST /api/news-articles/public/seo/:slug/view`

Khong co request body. Response:

```json
{
  "success": true,
  "message": "Tang luot xem bai viet tin tuc thanh cong",
  "data": { "viewCount": 101 }
}
```

Khong goi API nay khi render preview trong trang quan tri, va khong goi lap lai moi lan re-render component.
