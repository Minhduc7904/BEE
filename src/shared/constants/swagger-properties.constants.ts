// Swagger API Properties Constants
// Chứa các description và example để tái sử dụng trong các DTO

export const SWAGGER_PROPERTIES = {
    // Authentication & User
    USERNAME: {
        description: 'Tên đăng nhập',
        example: 'admin123'
    },

    PASSWORD: {
        description: 'Mật khẩu',
        example: 'password123'
    },

    EMAIL: {
        description: 'Địa chỉ email',
        example: 'user@example.com'
    },

    FIRST_NAME: {
        description: 'Tên',
        example: 'Nguyễn'
    },

    LAST_NAME: {
        description: 'Họ',
        example: 'Văn A'
    },

    FULL_NAME: {
        description: 'Họ và tên đầy đủ',
        example: 'Nguyễn Văn A'
    },

    PHONE: {
        description: 'Số điện thoại',
        example: '0123456789'
    },

    // Student specific
    STUDENT_PHONE: {
        description: 'Số điện thoại sinh viên',
        example: '0123456789',
        pattern: '^(\\+84|84|0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])[0-9]{7}$'
    },

    PARENT_PHONE: {
        description: 'Số điện thoại phụ huynh',
        example: '0987654321',
        pattern: '^(\\+84|84|0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])[0-9]{7}$'
    },

    GRADE: {
        description: 'Khối lớp',
        example: 12,
        minimum: 1,
        maximum: 12
    },

    GRADE_6_12: {
        description: 'Khối lớp (6-12)',
        example: 11,
        minimum: 6,
        maximum: 12
    },

    SCHOOL: {
        description: 'Trường học',
        example: 'THPT Nguyễn Huệ'
    },

    // Document & File
    URL: {
        description: 'URL chính',
        example: 'https://example.com/document.pdf'
    },

    ANOTHER_URL: {
        description: 'URL phụ (tùy chọn)',
        example: 'https://example.com/document-backup.pdf'
    },

    DESCRIPTION: {
        description: 'Mô tả',
        example: 'Tài liệu toán học lớp 10 - Chương 1: Hàm số'
    },

    MIME_TYPE: {
        description: 'MIME type',
        example: 'application/pdf'
    },

    SUBJECT: {
        description: 'Môn học',
        example: 'Toán học',
        required: false
    },

    // Role & Permission
    ROLE_NAME: {
        description: 'Tên role',
        example: 'TEACHER'
    },

    ROLE_DESCRIPTION: {
        description: 'Mô tả role',
        example: 'Role dành cho giảng viên'
    },

    // Common fields
    ID: {
        description: 'ID định danh',
        example: 1
    },

    USER_ID: {
        description: 'ID của user',
        example: 1
    },

    ADMIN_ID: {
        description: 'ID của admin',
        example: 1
    },
    
    DOCUMENT_ID: {
        description: 'ID của document',
        example: 1
    },
    
    RELATED_TYPE: {
        description: 'Loại đối tượng liên kết',
        example: 'question'
    },
    
    RELATED_ID: {
        description: 'ID của đối tượng liên kết',
        example: 123
    },
    
    STORAGE_PROVIDER: {
        description: 'Nhà cung cấp lưu trữ',
        example: 'EXTERNAL'
    },

    TOKEN: {
        description: 'Token',
        example: 'abc123-def456-ghi789'
    },

    // Email Verification
    EMAIL_VERIFICATION_TOKEN: {
        description: 'Token xác nhận email',
        example: 'abc123-def456-ghi789'
    },

    EMAIL_SENT: {
        description: 'Email đã được gửi tới',
        example: 'user@example.com'
    },

    EMAIL_VERIFIED: {
        description: 'Email đã được xác nhận thành công',
        example: 'user@example.com'
    },

    EXPIRES_AT: {
        description: 'Thời gian hết hạn',
        example: '2025-09-08T10:30:00Z'
    },

    VERIFIED_AT: {
        description: 'Thời gian xác nhận',
        example: '2025-09-08T10:15:00Z'
    },

    IS_ACTIVE: {
        description: 'Trạng thái hoạt động',
        example: true
    },

    CREATED_AT: {
        description: 'Thời gian tạo',
        example: '2024-08-28T10:30:00Z'
    },

    UPDATED_AT: {
        description: 'Thời gian cập nhật',
        example: '2024-08-28T10:30:00Z'
    },

    // Pagination
    PAGE: {
        description: 'Số trang (bắt đầu từ 1)',
        example: 1,
        minimum: 1,
        default: 1
    },

    LIMIT: {
        description: 'Số lượng items per page',
        example: 10,
        minimum: 1,
        maximum: 100,
        default: 10
    },

    SEARCH: {
        description: 'Từ khóa tìm kiếm',
        example: 'admin'
    },

    SORT_BY: {
        description: 'Trường để sắp xếp',
        example: 'createdAt'
    },

    SORT_ORDER: {
        description: 'Thứ tự sắp xếp',
        example: 'desc',
        enum: ['asc', 'desc'],
        default: 'desc'
    },

    // Date filters
    FROM_DATE: {
        description: 'Lọc từ ngày (ISO 8601)',
        example: '2024-01-01T00:00:00.000Z'
    },

    TO_DATE: {
        description: 'Lọc đến ngày (ISO 8601)',
        example: '2024-12-31T23:59:59.999Z'
    },

    // Google OAuth & JWT
    GOOGLE_ID: {
        description: 'Google ID của user',
        example: '123456789012345678901'
    },

    GOOGLE_ACCESS_TOKEN: {
        description: 'Google OAuth access token',
        example: 'ya29.a0ARrdaM...'
    },

    GOOGLE_ID_TOKEN: {
        description: 'Google OAuth ID token',
        example: 'eyJhbGciOiJSUzI1NiIs...'
    },

    ACCESS_TOKEN: {
        description: 'JWT Access Token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },

    REFRESH_TOKEN: {
        description: 'Refresh Token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },

    EXPIRES_IN: {
        description: 'Thời gian hết hạn Access Token (giây)',
        example: 3600
    },

    AVATAR_URL: {
        description: 'Avatar URL',
        example: 'https://lh3.googleusercontent.com/...'
    },

    VERIFIED_STATUS: {
        description: 'Trạng thái verified',
        example: true
    },

    SUCCESS_MESSAGE: {
        description: 'Thông báo thành công',
        example: 'Thao tác thành công'
    },

    LOGOUT_MESSAGE: {
        description: 'Thông báo logout thành công',
        example: 'Đăng xuất thành công'
    },

    GOOGLE_LOGIN_MESSAGE: {
        description: 'Thông báo đăng nhập Google thành công',
        example: 'Đăng nhập Google thành công'
    },

    USER_TYPE: {
        description: 'Loại người dùng',
        example: 'admin'
    },

    // Log Properties
    ACTION_KEY: {
        description: 'Key của hành động',
        example: 'CREATE_USER'
    },

    STATUS: {
        description: 'Trạng thái của hành động',
        example: 'SUCCESS'
    },

    ERROR_MESSAGE: {
        description: 'Lỗi nếu có',
        example: 'User already exists'
    },

    RESOURCE_TYPE: {
        description: 'Loại tài nguyên',
        example: 'user'
    },

    RESOURCE_ID: {
        description: 'ID của tài nguyên',
        example: '1'
    },

    BEFORE_DATA: {
        description: 'Dữ liệu trước khi thay đổi',
        example: { name: 'John Doe' }
    },

    AFTER_DATA: {
        description: 'Dữ liệu sau khi thay đổi',
        example: { name: 'John Smith' }
    },

    LOG_ID: {
        description: 'ID của log',
        example: 1
    },

    // Pagination Meta Properties
    TOTAL: {
        description: 'Tổng số bản ghi',
        example: 100
    },

    TOTAL_PAGES: {
        description: 'Tổng số trang',
        example: 10
    },

    HAS_PREVIOUS: {
        description: 'Có trang trước không',
        example: false
    },

    HAS_NEXT: {
        description: 'Có trang sau không',
        example: true
    },

    PREVIOUS_PAGE: {
        description: 'Trang trước (nếu có)',
        example: null,
        required: false
    },

    NEXT_PAGE: {
        description: 'Trang sau (nếu có)',
        example: 2,
        required: false
    },

    SUCCESS: {
        description: 'Trạng thái thành công',
        example: true
    },

    DATA: {
        description: 'Danh sách dữ liệu',
        type: 'array'
    },

    META: {
        description: 'Thông tin phân trang'
    },

    MESSAGE: {
        description: 'Thông báo kết quả',
        example: 'Lấy dữ liệu thành công'
    },

    // User Role Properties
    ASSIGNED_BY: {
        description: 'ID của user đã cấp role này',
        example: 3
    },

    ROLE_ID: {
        description: 'ID của role',
        example: 2
    },

    ASSIGNED_AT: {
        description: 'Thời gian được cấp role',
        example: '2025-09-04T05:36:25.000Z'
    },

    // Additional Student Properties
    CREATED_AFTER: {
        description: 'Lọc từ ngày tạo (ISO 8601)',
        example: '2024-01-01T00:00:00.000Z'
    },

    CREATED_BEFORE: {
        description: 'Lọc đến ngày tạo (ISO 8601)',
        example: '2024-12-31T23:59:59.999Z'
    },

    LAST_LOGIN_AFTER: {
        description: 'Lọc từ ngày đăng nhập cuối (ISO 8601)',
        example: '2024-01-01T00:00:00.000Z'
    },

    LAST_LOGIN_BEFORE: {
        description: 'Lọc đến ngày đăng nhập cuối (ISO 8601)',
        example: '2024-12-31T23:59:59.999Z'
    },

    STUDENT_ID: {
        description: 'ID của student',
        example: 1
    },

    IS_EMAIL_VERIFIED: {
        description: 'Email đã được xác nhận',
        example: true
    },

    EMAIL_VERIFIED_AT: {
        description: 'Thời gian xác nhận email',
        example: '2024-01-01T00:00:00.000Z'
    },

    LAST_LOGIN_AT: {
        description: 'Lần đăng nhập cuối',
        example: '2024-01-01T00:00:00.000Z'
    },

    STATUS_CODE: {
        description: 'Mã lỗi HTTP',
        example: 409
    },

    TIMESTAMP: {
        description: 'Timestamp lỗi',
        example: '2025-08-27T10:30:00.000Z'
    },

    PATH: {
        description: 'Đường dẫn API',
        example: '/auth/register/admin'
    }
};

// Helper function để tạo API Property object
export const createApiProperty = (
    baseProperty: any,
    overrides?: Partial<any>
) => ({
    ...baseProperty,
    ...overrides
});

// Helper function để tạo Optional API Property
export const createOptionalApiProperty = (
    baseProperty: any,
    overrides?: Partial<any>
) => ({
    ...baseProperty,
    required: false,
    ...overrides
});
