# Quy Tắc Viết Entity - BEE Project

## Tổng Quan
Entity là các class đại diện cho business objects trong domain layer. Chúng chứa logic nghiệp vụ và các thuộc tính cốt lõi của đối tượng.

## Cấu Trúc Thư Mục
```
src/domain/entities/
├── user/
│   └── user.entity.ts
├── document/
│   └── document.entity.ts
├── student/
│   └── student.entity.ts
└── ...
```

## Quy Tắc Cơ Bản

### 1. Naming Convention
- **File**: `{entity-name}.entity.ts` (kebab-case)
- **Class**: `{EntityName}` (PascalCase)
- **Properties**: `camelCase`

### 2. Cấu Trúc Class

#### a) Properties Declaration
```typescript
export class Document {
    // Required properties trước
    documentId: number;
    url: string;
    storageProvider: StorageProvider;
    createdAt: Date;
    updatedAt: Date;
    
    // Optional properties sau
    adminId?: number;
    description?: string;
    anotherUrl?: string;
    // ...
}
```

#### b) Constructor
- Đặt required parameters trước
- Đặt optional parameters sau
- Sử dụng same order như property declaration

```typescript
constructor(
    // Required parameters
    documentId: number,
    url: string,
    storageProvider: StorageProvider,
    createdAt: Date,
    updatedAt: Date,
    // Optional parameters
    adminId?: number,
    description?: string,
    anotherUrl?: string,
    // ...
) {
    this.documentId = documentId;
    this.url = url;
    this.storageProvider = storageProvider;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.adminId = adminId;
    this.description = description;
    this.anotherUrl = anotherUrl;
    // ...
}
```

### 3. Business Methods

#### a) Validation Methods
- Prefix: `has{Property}()` - kiểm tra tồn tại
- Return type: `boolean`

```typescript
hasDescription(): boolean {
    return !!this.description;
}

hasSubject(): boolean {
    return !!this.subject;
}
```

#### b) Display Methods
- Prefix: `get{Property}Display()` - lấy giá trị hiển thị
- Return type: `string`
- Có fallback value

```typescript
getDescriptionDisplay(): string {
    return this.description || 'Không có mô tả';
}

getSubjectDisplay(): string {
    return this.subject || 'Chưa xác định môn học';
}
```

#### c) Relationship Methods
- Format: `isRelatedTo()`, `belongsTo()`, etc.
- Return type: `boolean`

```typescript
isRelatedTo(type: string, id: number): boolean {
    return this.relatedType === type && this.relatedId === id;
}
```

#### d) Type Checking Methods
- Format: `is{Type}()` - kiểm tra loại
- Return type: `boolean`

```typescript
isImage(): boolean {
    return this.mimeType?.startsWith('image/') || false;
}

isPdf(): boolean {
    return this.mimeType === 'application/pdf';
}
```

## Quy Tắc Chi Tiết

### 1. Import Guidelines
```typescript
// Import enums từ shared
import { StorageProvider } from '../../../shared/enums/storage-provider.enum';

// Import types nếu cần
import type { SomeType } from '../path/to/type';
```

### 2. Property Types
- **ID fields**: `number`
- **Optional ID fields**: `number | undefined` (không dùng `number?` nếu có thể null)
- **Dates**: `Date`
- **Enums**: Import từ shared/enums
- **Optional strings**: `string?`

### 3. Constructor Guidelines
- **Tất cả properties** phải được gán trong constructor
- **Thứ tự tham số**: required trước, optional sau
- **Không logic phức tạp** trong constructor
- **Validation** nên để trong separate methods

### 4. Method Guidelines

#### Validation Methods
```typescript
// ✅ Good
hasDescription(): boolean {
    return !!this.description;
}

// ❌ Bad
isDescriptionValid(): boolean {
    return this.description !== null && this.description !== undefined;
}
```

#### Display Methods
```typescript
// ✅ Good - có fallback
getDescriptionDisplay(): string {
    return this.description || 'Không có mô tả';
}

// ❌ Bad - không có fallback
getDescription(): string {
    return this.description;
}
```

#### Type Checking Methods
```typescript
// ✅ Good - safe với optional chaining
isImage(): boolean {
    return this.mimeType?.startsWith('image/') || false;
}

// ❌ Bad - có thể throw error
isImage(): boolean {
    return this.mimeType.startsWith('image/');
}
```

### 5. Business Logic
- **Domain logic** nên ở trong entity
- **Complex calculations** có thể tạo separate methods
- **Side effects** không nên có trong entity (pure functions)

## Ví Dụ Hoàn Chỉnh

```typescript
import { StorageProvider } from '../../../shared/enums/storage-provider.enum';

export class Document {
    // Required properties
    documentId: number;
    url: string;
    storageProvider: StorageProvider;
    createdAt: Date;
    updatedAt: Date;
    
    // Optional properties
    adminId?: number;
    description?: string;
    anotherUrl?: string;
    mimeType?: string;
    subject?: string;
    relatedType?: string;
    relatedId?: number;

    constructor(
        documentId: number,
        url: string,
        storageProvider: StorageProvider,
        createdAt: Date,
        updatedAt: Date,
        adminId?: number,
        description?: string,
        anotherUrl?: string,
        mimeType?: string,
        subject?: string,
        relatedType?: string,
        relatedId?: number
    ) {
        this.documentId = documentId;
        this.adminId = adminId;
        this.description = description;
        this.url = url;
        this.anotherUrl = anotherUrl;
        this.mimeType = mimeType;
        this.subject = subject;
        this.relatedType = relatedType;
        this.relatedId = relatedId;
        this.storageProvider = storageProvider;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Validation methods
    hasDescription(): boolean {
        return !!this.description;
    }

    hasSubject(): boolean {
        return !!this.subject;
    }

    hasAlternativeUrl(): boolean {
        return !!this.anotherUrl;
    }

    // Display methods
    getDescriptionDisplay(): string {
        return this.description || 'Không có mô tả';
    }

    getSubjectDisplay(): string {
        return this.subject || 'Chưa xác định môn học';
    }

    getMimeTypeDisplay(): string {
        return this.mimeType || 'Không xác định';
    }

    // Relationship methods
    isRelatedTo(type: string, id: number): boolean {
        return this.relatedType === type && this.relatedId === id;
    }

    // Type checking methods
    isImage(): boolean {
        return this.mimeType?.startsWith('image/') || false;
    }

    isPdf(): boolean {
        return this.mimeType === 'application/pdf';
    }
}
```

## Checklist
Khi tạo entity mới, kiểm tra:

- [ ] File naming: `{name}.entity.ts`
- [ ] Class naming: `PascalCase`
- [ ] Properties: required trước, optional sau
- [ ] Constructor: tham số theo thứ tự properties
- [ ] Có validation methods cho optional fields
- [ ] Có display methods với fallback values
- [ ] Business logic methods có return type rõ ràng
- [ ] Sử dụng optional chaining cho safe access
- [ ] Import đúng đường dẫn
- [ ] Không có side effects trong methods

## Anti-Patterns Cần Tránh

❌ **Đừng làm:**
```typescript
// Constructor quá phức tạp
constructor(data: any) {
    Object.assign(this, data);
}

// Methods không type safe
getDescription() {
    return this.description;
}

// Logic không thuộc domain
async saveToDatabase() {
    // Database logic không thuộc entity
}
```

✅ **Nên làm:**
```typescript
// Constructor rõ ràng
constructor(
    documentId: number,
    url: string,
    // ...
) {
    this.documentId = documentId;
    this.url = url;
    // ...
}

// Methods type safe với fallback
getDescriptionDisplay(): string {
    return this.description || 'Không có mô tả';
}

// Pure domain logic
isExpired(): boolean {
    return this.expiresAt < new Date();
}
```
