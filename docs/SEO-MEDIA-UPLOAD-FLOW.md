# SEO Media Upload And Item Flow

## Goal

Use one flow for SEO images and videos:

1. Upload a file to the public `seoMedia` MinIO bucket.
2. List media from that bucket with `GET /api/seo-media/bucket/media`.
3. Select one media object.
4. Create a SEO media item with `POST /api/seo-media/items`.

Use `mediaType=IMAGE` on `/api/seo-media/bucket/media` when the UI needs images only, and `mediaType=VIDEO` when it needs videos only.

## Required Setup

The `seo_media_items` table supports both images and videos.

New columns:

| Column       | Type             | Purpose                                                                      |
| ------------ | ---------------- | ---------------------------------------------------------------------------- |
| `media_type` | `MediaType` enum | `IMAGE` or `VIDEO` for SEO item rendering. Existing rows default to `IMAGE`. |
| `duration`   | nullable double  | Video duration in seconds when available.                                    |

Migration file:

```text
prisma/migrations/20260626000000_add_seo_media_item_media_fields/migration.sql
```

Run the migration before using video items in a real DB.

## Permissions

The user must send:

```http
Authorization: Bearer <access-token>
```

Required permissions:

| Action               | Permission                                   |
| -------------------- | -------------------------------------------- |
| Upload media         | `seo-media:upload-media`                     |
| List media in bucket | `seo-media:bucket-media:view`                |
| Create item          | `seo-media:item:create`                      |
| View item/slot       | `seo-media:item:view`, `seo-media:slot:view` |

If permissions are synced from code, run:

```http
POST /api/super-admin/permissions/sync-from-codes
```

## API 1: Upload SEO Media

```http
POST /api/seo-media/upload-media
Content-Type: multipart/form-data
Authorization: Bearer <access-token>
```

Request form-data:

| Field  | Type   | Required | Notes                             |
| ------ | ------ | -------- | --------------------------------- |
| `file` | binary | Yes      | Supports `image/*` and `video/*`. |

Image response example:

```json
{
  "success": true,
  "message": "SEO media uploaded successfully",
  "data": {
    "bucketName": "seo-media",
    "objectKey": "images/2026/06/uuid.webp",
    "publicUrl": "http://localhost:9000/seo-media/images/2026/06/uuid.webp",
    "originalName": "banner_home.webp",
    "mediaType": "IMAGE",
    "mimeType": "image/webp",
    "fileSize": 123456,
    "width": 1920,
    "height": 1080,
    "duration": null
  }
}
```

Video response example:

```json
{
  "success": true,
  "message": "SEO media uploaded successfully",
  "data": {
    "bucketName": "seo-media",
    "objectKey": "videos/2026/06/uuid.mp4",
    "publicUrl": "http://localhost:9000/seo-media/videos/2026/06/uuid.mp4",
    "originalName": "intro.mp4",
    "mediaType": "VIDEO",
    "mimeType": "video/mp4",
    "fileSize": 3456780,
    "width": 1280,
    "height": 720,
    "duration": 32.5
  }
}
```

You can create the item directly from this response. Listing from the bucket is only needed when the UI lets users pick from uploaded files.

## API 2: List SEO Media In Bucket

```http
GET /api/seo-media/bucket/media?page=1&limit=20&mediaType=IMAGE&prefix=2026/06&search=home&sortBy=lastModified&sortOrder=desc
Authorization: Bearer <access-token>
```

Query params:

| Param       | Type               | Required | Default                | Notes                                                                                                              |
| ----------- | ------------------ | -------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `page`      | number             | No       | `1`                    | Current page.                                                                                                      |
| `limit`     | number             | No       | `10`                   | Max 1000.                                                                                                          |
| `mediaType` | `IMAGE` or `VIDEO` | No       | none                   | If omitted, returns both images and videos.                                                                        |
| `prefix`    | string             | No       | depends on `mediaType` | With `mediaType=IMAGE`, `2026/06` becomes `images/2026/06/`. With `mediaType=VIDEO`, it becomes `videos/2026/06/`. |
| `search`    | string             | No       | none                   | Searches by `objectKey`/file name.                                                                                 |
| `sortBy`    | string             | No       | `lastModified`         | Supports `lastModified`, `objectKey`, `fileName`, `fileSize`.                                                      |
| `sortOrder` | `asc` or `desc`    | No       | `desc`                 | Sort direction.                                                                                                    |

Response example:

```json
{
  "success": true,
  "message": "SEO media bucket media retrieved successfully",
  "data": [
    {
      "bucketName": "seo-media",
      "objectKey": "images/2026/06/uuid.webp",
      "fileName": "uuid.webp",
      "originalName": "uuid.webp",
      "publicUrl": "http://localhost:9000/seo-media/images/2026/06/uuid.webp",
      "mediaType": "IMAGE",
      "mimeType": "image/webp",
      "fileSize": 123456,
      "duration": null,
      "etag": "9b2cf535f27731c974343645a3985328",
      "lastModified": "2026-06-26T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

Important:

- Bucket listing can infer `mediaType` and `mimeType` from the file extension.
- Bucket listing cannot reliably infer `width`, `height`, or `duration`; use values from the upload response if the UI needs exact metadata.

## API 3: Create SEO Media Item

```http
POST /api/seo-media/items
Content-Type: application/json
Authorization: Bearer <access-token>
```

Image request:

```json
{
  "slotId": 1,
  "bucketName": "seo-media",
  "objectKey": "images/2026/06/uuid.webp",
  "originalName": "uuid.webp",
  "mimeType": "image/webp",
  "mediaType": "IMAGE",
  "fileSize": 123456,
  "width": 1920,
  "height": 1080,
  "sortOrder": 0,
  "alt": "Home hero",
  "linkUrl": "https://example.com"
}
```

Video request:

```json
{
  "slotId": 1,
  "bucketName": "seo-media",
  "objectKey": "videos/2026/06/uuid.mp4",
  "originalName": "intro.mp4",
  "mimeType": "video/mp4",
  "mediaType": "VIDEO",
  "fileSize": 3456780,
  "width": 1280,
  "height": 720,
  "duration": 32.5,
  "sortOrder": 1,
  "alt": "Intro video",
  "linkUrl": "https://example.com"
}
```

Required fields:

| Field          | Required | Notes                                                                  |
| -------------- | -------- | ---------------------------------------------------------------------- |
| `slotId`       | Yes      | SEO media slot ID.                                                     |
| `objectKey`    | Yes      | Must be from SEO upload: `images/YYYY/MM/...` or `videos/YYYY/MM/...`. |
| `originalName` | Yes      | Use upload response or bucket media response.                          |
| `mimeType`     | Yes      | Use upload response or bucket media response.                          |
| `fileSize`     | Yes      | Use upload response or bucket media response.                          |

Optional fields:

| Field             | Notes                                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| `bucketName`      | Defaults to configured `seoMedia`; any other bucket is rejected.        |
| `mediaType`       | Optional; backend can infer from `mimeType`, but sending it is clearer. |
| `publicUrl`       | Optional; backend recalculates it from `bucketName` and `objectKey`.    |
| `width`, `height` | Recommended when available from upload response.                        |
| `duration`        | Recommended for videos when available from upload response.             |
| `sortOrder`       | Display order in the slot.                                              |
| `alt`             | Alt/label text.                                                         |
| `linkUrl`         | Link when the media is clicked.                                         |

Create response includes `mediaType` and `duration`:

```json
{
  "success": true,
  "message": "SEO media item created successfully",
  "data": {
    "itemId": 10,
    "slotId": 1,
    "bucketName": "seo-media",
    "objectKey": "videos/2026/06/uuid.mp4",
    "publicUrl": "http://localhost:9000/seo-media/videos/2026/06/uuid.mp4",
    "originalName": "intro.mp4",
    "mimeType": "video/mp4",
    "mediaType": "VIDEO",
    "fileSize": 3456780,
    "width": 1280,
    "height": 720,
    "duration": 32.5,
    "sortOrder": 1,
    "alt": "Intro video",
    "linkUrl": "https://example.com",
    "createdAt": "2026-06-26T10:05:00.000Z",
    "updatedAt": "2026-06-26T10:05:00.000Z"
  }
}
```

## Frontend Flow

1. User uploads image or video with `POST /api/seo-media/upload-media`.
2. If the UI needs a library picker, call `GET /api/seo-media/bucket/media`.
3. For image picker: use `mediaType=IMAGE`.
4. For video picker: use `mediaType=VIDEO`.
5. User selects one media object.
6. Call `POST /api/seo-media/items` with `slotId` and selected media metadata.
7. Verify with `GET /api/seo-media/slots/:slotId/items` or public `GET /api/seo-media/public/slots/:code/items`.
