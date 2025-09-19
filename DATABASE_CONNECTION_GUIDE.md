# Database Connection Pool Configuration

## Vấn đề
Lỗi "Unable to start a transaction in the given time" xảy ra do:
1. Connection pool bị cạn kiệt
2. Transaction timeout quá ngắn
3. Không có cấu hình connection pool phù hợp

## Giải pháp

### 1. Cập nhật DATABASE_URL trong .env

Thêm các tham số connection pool vào DATABASE_URL:

```bash
# MySQL Connection với Connection Pool
DATABASE_URL="mysql://username:password@localhost:3306/database_name?connection_limit=10&pool_timeout=20&socket_timeout=60"

# Hoặc chi tiết hơn:
DATABASE_URL="mysql://username:password@localhost:3306/database_name?connection_limit=20&pool_timeout=20&socket_timeout=60&connect_timeout=60"
```

### 2. Giải thích các tham số:

- **connection_limit=20**: Tối đa 20 connections trong pool
- **pool_timeout=20**: Chờ tối đa 20 giây để lấy connection từ pool
- **socket_timeout=60**: Timeout cho socket connection (60 giây)
- **connect_timeout=60**: Timeout khi kết nối database (60 giây)

### 3. Các cấu hình đã áp dụng trong code:

#### PrismaService:
- Thêm logging cho development
- Auto connect/disconnect
- Error handling

#### UnitOfWork:
- **maxWait: 10000ms** - Chờ tối đa 10 giây để có transaction slot
- **timeout: 30000ms** - Transaction timeout 30 giây
- Support isolation level

### 4. Monitoring và Debug:

```typescript
// Trong development, sẽ log:
// - Database queries
// - Connection status
// - Transaction timeouts
```

### 5. Recommended DATABASE_URL examples:

```bash
# Development (Local MySQL)
DATABASE_URL="mysql://root:password@localhost:3306/qldatt_dev?connection_limit=5&pool_timeout=10&socket_timeout=30"

# Production (Remote MySQL)
DATABASE_URL="mysql://user:password@remote-host:3306/qldatt_prod?connection_limit=20&pool_timeout=20&socket_timeout=60&connect_timeout=60&sslaccept=strict"
```

### 6. Troubleshooting:

1. **Kiểm tra MySQL max_connections**: `SHOW VARIABLES LIKE 'max_connections';`
2. **Monitor active connections**: `SHOW PROCESSLIST;`
3. **Restart MySQL service** nếu cần
4. **Tăng connection_limit** trong DATABASE_URL nếu load cao

### 7. Best Practices:

- Không để connection_limit > MySQL max_connections / 2
- Set pool_timeout >= maxWait trong UnitOfWork
- Monitor database connections trong production
- Sử dụng connection pooling cho performance tốt hơn
