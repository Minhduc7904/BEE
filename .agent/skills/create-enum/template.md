# Mẫu shared enum

Giữ value đồng nhất với Prisma enum khi enum được lưu persistence. Chỉ thêm label/description khi tầng hiển thị cần chúng.

```ts
/**
 * Đồng bộ với Prisma schema enum FeatureStatus khi field được lưu persistence.
 */
export enum FeatureStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export const FeatureStatusLabels: Record<FeatureStatus, string> = {
  [FeatureStatus.DRAFT]: 'Bản nháp',
  [FeatureStatus.ACTIVE]: 'Đang hoạt động',
  [FeatureStatus.ARCHIVED]: 'Đã lưu trữ',
}
```

Sau khi tạo, thêm `export * from './feature-status.enum'` vào `src/shared/enums/index.ts`.

Nếu enum được lưu trong database, dùng cùng tên và cùng value ở `prisma/schema.prisma`, sau đó tạo migration theo `database-schema-changes`. Không dùng numeric enum, `string` thay thế hoặc value chưa có ý nghĩa được xác minh.
