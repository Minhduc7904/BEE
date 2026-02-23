# Migration Utilities

## Các hàm tiện ích hỗ trợ migration

### Data Processing
- `sanitizeString()` - Làm sạch chuỗi, loại bỏ emoji và ký tự đặc biệt
- `parseDate()` - Parse date từ nhiều format khác nhau
- `parseNumber()` - Parse number an toàn với default value
- `generateSlug()` - Tạo slug từ text (có hỗ trợ Unicode)
- `isValidEmail()` - Validate email

### Batch Processing
- `processBatch()` - Xử lý dữ liệu theo batch để tránh quá tải
- `sleep()` - Delay giữa các batch

### Error Handling
- `retry()` - Retry với exponential backoff

### Logging
- `logProgress()` - Log tiến trình migration
- `logResult()` - Log kết quả migration
- `formatDuration()` - Format thời gian

### Types
- `MigrationResult` - Kết quả của một migration
- `MigrationOptions` - Options cho migration
- `MigrationFunction` - Type của hàm migration
