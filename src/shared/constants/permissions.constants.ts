// src/shared/constants/permissions.constants.ts

/**
 * Permission codes as constants - imported from permission.codes.ts
 */
export { PERMISSION_CODES } from './permissions/permission.codes';

/**
 * Permission definitions for seeding and role management
 */
export const PERMISSIONS = [
    // ===================================
    // EXAM MANAGEMENT
    // ===================================
    {
        code: 'exam:get-my-exams',
        name: 'Xem đề thi của tôi',
        description: 'Xem danh sách đề thi do mình tạo',
        group: 'EXAM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'exam:get-all',
        name: 'Xem tất cả đề thi',
        description: 'Xem danh sách tất cả đề thi trong hệ thống',
        group: 'EXAM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'exam:get-by-id',
        name: 'Xem chi tiết đề thi',
        description: 'Xem chi tiết thông tin đề thi',
        group: 'EXAM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'exam:create',
        name: 'Tạo đề thi',
        description: 'Tạo đề thi mới',
        group: 'EXAM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'exam:update',
        name: 'Cập nhật đề thi',
        description: 'Chỉnh sửa thông tin đề thi',
        group: 'EXAM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'exam:delete',
        name: 'Xóa đề thi',
        description: 'Xóa đề thi khỏi hệ thống',
        group: 'EXAM_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // QUESTION MANAGEMENT
    // ===================================
    {
        code: 'question:get-my-questions',
        name: 'Xem câu hỏi của tôi',
        description: 'Xem danh sách câu hỏi do mình tạo',
        group: 'QUESTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'question:search',
        name: 'Tìm kiếm câu hỏi',
        description: 'Tìm kiếm câu hỏi trong hệ thống',
        group: 'QUESTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'question:get-all',
        name: 'Xem tất cả câu hỏi',
        description: 'Xem danh sách tất cả câu hỏi',
        group: 'QUESTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'question:get-by-id',
        name: 'Xem chi tiết câu hỏi',
        description: 'Xem chi tiết thông tin câu hỏi',
        group: 'QUESTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'question:create',
        name: 'Tạo câu hỏi',
        description: 'Tạo câu hỏi mới',
        group: 'QUESTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'question:reorder',
        name: 'Sắp xếp lại câu hỏi',
        description: 'Thay đổi thứ tự câu hỏi',
        group: 'QUESTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'question:update',
        name: 'Cập nhật câu hỏi',
        description: 'Chỉnh sửa thông tin câu hỏi',
        group: 'QUESTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'question:add-to-exam',
        name: 'Thêm câu hỏi vào đề thi',
        description: 'Thêm câu hỏi vào đề thi',
        group: 'QUESTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'question:add-to-section',
        name: 'Thêm câu hỏi vào section',
        description: 'Thêm câu hỏi vào section của đề thi',
        group: 'QUESTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'question:remove-from-exam',
        name: 'Xóa câu hỏi khỏi đề thi',
        description: 'Xóa câu hỏi khỏi đề thi',
        group: 'QUESTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'question:delete',
        name: 'Xóa câu hỏi',
        description: 'Xóa câu hỏi khỏi hệ thống',
        group: 'QUESTION_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // SECTION MANAGEMENT
    // ===================================
    {
        code: 'section:get-by-exam',
        name: 'Xem section theo đề thi',
        description: 'Xem danh sách section của đề thi',
        group: 'SECTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'section:get-by-id',
        name: 'Xem chi tiết section',
        description: 'Xem chi tiết thông tin section',
        group: 'SECTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'section:create',
        name: 'Tạo section',
        description: 'Tạo section mới cho đề thi',
        group: 'SECTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'section:update',
        name: 'Cập nhật section',
        description: 'Chỉnh sửa thông tin section',
        group: 'SECTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'section:delete',
        name: 'Xóa section',
        description: 'Xóa section khỏi đề thi',
        group: 'SECTION_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // STATEMENT MANAGEMENT
    // ===================================
    {
        code: 'statement:create',
        name: 'Tạo đáp án',
        description: 'Tạo đáp án cho câu hỏi',
        group: 'STATEMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'statement:update',
        name: 'Cập nhật đáp án',
        description: 'Chỉnh sửa đáp án',
        group: 'STATEMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'statement:delete',
        name: 'Xóa đáp án',
        description: 'Xóa đáp án của câu hỏi',
        group: 'STATEMENT_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // COURSE MANAGEMENT
    // ===================================
    {
        code: 'course:get-all',
        name: 'Xem tất cả khóa học',
        description: 'Xem danh sách tất cả khóa học',
        group: 'COURSE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course:search',
        name: 'Tìm kiếm khóa học',
        description: 'Tìm kiếm khóa học trong hệ thống',
        group: 'COURSE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course:get-my-courses',
        name: 'Xem khóa học của tôi',
        description: 'Xem danh sách khóa học do mình quản lý',
        group: 'COURSE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course:get-by-id',
        name: 'Xem chi tiết khóa học',
        description: 'Xem chi tiết thông tin khóa học',
        group: 'COURSE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course:create',
        name: 'Tạo khóa học',
        description: 'Tạo khóa học mới',
        group: 'COURSE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course:update',
        name: 'Cập nhật khóa học',
        description: 'Chỉnh sửa thông tin khóa học',
        group: 'COURSE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course:update-pricing',
        name: 'Cập nhật giá khóa học',
        description: 'Thay đổi giá khóa học',
        group: 'COURSE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course:delete',
        name: 'Xóa khóa học',
        description: 'Xóa khóa học khỏi hệ thống',
        group: 'COURSE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course:get-students-attendance',
        name: 'Xem điểm danh khóa học',
        description: 'Xem thông tin điểm danh học viên',
        group: 'COURSE_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // STUDENT MANAGEMENT
    // ===================================
    {
        code: 'student:get-all',
        name: 'Xem tất cả học viên',
        description: 'Xem danh sách tất cả học viên',
        group: 'STUDENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'student:get-by-id',
        name: 'Xem chi tiết học viên',
        description: 'Xem chi tiết thông tin học viên',
        group: 'STUDENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'student:search',
        name: 'Tìm kiếm học viên',
        description: 'Tìm kiếm học viên trong hệ thống',
        group: 'STUDENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'student:create',
        name: 'Tạo học viên',
        description: 'Tạo học viên mới',
        group: 'STUDENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'student:update',
        name: 'Cập nhật học viên',
        description: 'Chỉnh sửa thông tin học viên',
        group: 'STUDENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'student:export-excel',
        name: 'Xuất danh sách học viên',
        description: 'Xuất danh sách học viên ra Excel',
        group: 'STUDENT_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // SUBJECT MANAGEMENT
    // ===================================
    {
        code: 'subject:get-all',
        name: 'Xem tất cả môn học',
        description: 'Xem danh sách tất cả môn học',
        group: 'SUBJECT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'subject:get-by-id',
        name: 'Xem chi tiết môn học',
        description: 'Xem chi tiết thông tin môn học',
        group: 'SUBJECT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'subject:create',
        name: 'Tạo môn học',
        description: 'Tạo môn học mới',
        group: 'SUBJECT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'subject:update',
        name: 'Cập nhật môn học',
        description: 'Chỉnh sửa thông tin môn học',
        group: 'SUBJECT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'subject:delete',
        name: 'Xóa môn học',
        description: 'Xóa môn học khỏi hệ thống',
        group: 'SUBJECT_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // LESSON MANAGEMENT
    // ===================================
    {
        code: 'lesson:get-all',
        name: 'Xem tất cả bài học',
        description: 'Xem danh sách tất cả bài học',
        group: 'LESSON_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'lesson:get-by-id',
        name: 'Xem chi tiết bài học',
        description: 'Xem chi tiết thông tin bài học',
        group: 'LESSON_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'lesson:create',
        name: 'Tạo bài học',
        description: 'Tạo bài học mới',
        group: 'LESSON_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'lesson:update',
        name: 'Cập nhật bài học',
        description: 'Chỉnh sửa thông tin bài học',
        group: 'LESSON_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'lesson:delete',
        name: 'Xóa bài học',
        description: 'Xóa bài học khỏi hệ thống',
        group: 'LESSON_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // CHAPTER MANAGEMENT
    // ===================================
    {
        code: 'chapter:get-all',
        name: 'Xem tất cả chương',
        description: 'Xem danh sách tất cả chương',
        group: 'CHAPTER_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'chapter:get-by-id',
        name: 'Xem chi tiết chương',
        description: 'Xem chi tiết thông tin chương',
        group: 'CHAPTER_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'chapter:create',
        name: 'Tạo chương',
        description: 'Tạo chương mới',
        group: 'CHAPTER_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'chapter:update',
        name: 'Cập nhật chương',
        description: 'Chỉnh sửa thông tin chương',
        group: 'CHAPTER_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'chapter:delete',
        name: 'Xóa chương',
        description: 'Xóa chương khỏi hệ thống',
        group: 'CHAPTER_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // ADMIN MANAGEMENT
    // ===================================
    {
        code: 'admin:get-all',
        name: 'Xem tất cả admin',
        description: 'Xem danh sách tất cả admin',
        group: 'ADMIN_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'admin:get-by-id',
        name: 'Xem chi tiết admin',
        description: 'Xem chi tiết thông tin admin',
        group: 'ADMIN_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'admin:search',
        name: 'Tìm kiếm admin',
        description: 'Tìm kiếm admin trong hệ thống',
        group: 'ADMIN_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'admin:create',
        name: 'Tạo admin',
        description: 'Tạo tài khoản admin mới',
        group: 'ADMIN_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // ROLE MANAGEMENT
    // ===================================
    {
        code: 'role:get-all',
        name: 'Xem tất cả vai trò',
        description: 'Xem danh sách và thông tin vai trò',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'role:get-by-id',
        name: 'Xem chi tiết vai trò',
        description: 'Xem chi tiết một vai trò',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'role:create',
        name: 'Tạo vai trò',
        description: 'Tạo vai trò mới trong hệ thống',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'role:update',
        name: 'Cập nhật vai trò',
        description: 'Chỉnh sửa thông tin vai trò',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'role:delete',
        name: 'Xóa vai trò',
        description: 'Xóa vai trò khỏi hệ thống',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'role:assign',
        name: 'Gán vai trò',
        description: 'Gán vai trò cho người dùng',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'role:remove-from-user',
        name: 'Gỡ vai trò',
        description: 'Gỡ vai trò khỏi người dùng',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'role:get-user-roles',
        name: 'Xem vai trò người dùng',
        description: 'Xem các vai trò được gán cho người dùng',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'role:toggle-role-permission',
        name: 'Quản lý quyền vai trò',
        description: 'Bật/tắt quyền cho vai trò',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // PERMISSION MANAGEMENT
    // ===================================
    {
        code: 'permission:get-all',
        name: 'Xem tất cả quyền',
        description: 'Xem danh sách và thông tin quyền',
        group: 'PERMISSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'permission:get-by-id',
        name: 'Xem chi tiết quyền',
        description: 'Xem chi tiết một quyền',
        group: 'PERMISSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'permission:get-groups',
        name: 'Xem nhóm quyền',
        description: 'Xem danh sách các nhóm quyền',
        group: 'PERMISSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'permission:create',
        name: 'Tạo quyền',
        description: 'Tạo quyền mới trong hệ thống',
        group: 'PERMISSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'permission:update',
        name: 'Cập nhật quyền',
        description: 'Chỉnh sửa thông tin quyền',
        group: 'PERMISSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'permission:delete',
        name: 'Xóa quyền',
        description: 'Xóa quyền khỏi hệ thống',
        group: 'PERMISSION_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // USER MANAGEMENT
    // ===================================
    {
        code: 'user:toggle-activation',
        name: 'Kích hoạt/Vô hiệu hóa người dùng',
        description: 'Bật/tắt trạng thái hoạt động của người dùng',
        group: 'USER_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // MEDIA MANAGEMENT
    // ===================================
    {
        code: 'media:upload',
        name: 'Tải lên media',
        description: 'Tải lên file media',
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media:get-all',
        name: 'Xem tất cả media',
        description: 'Xem danh sách tất cả media',
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media:get-my-media',
        name: 'Xem media của tôi',
        description: 'Xem danh sách media do mình tải lên',
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media:get-buckets',
        name: 'Xem danh sách buckets',
        description: 'Xem danh sách các buckets lưu trữ',
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media:get-by-id',
        name: 'Xem chi tiết media',
        description: 'Xem chi tiết thông tin media',
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media:update',
        name: 'Cập nhật media',
        description: 'Chỉnh sửa thông tin media',
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media:download',
        name: 'Tải xuống media',
        description: 'Tải xuống file media',
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media:view-my',
        name: 'Xem media của tôi',
        description: 'Xem media do mình tải lên',
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media:admin-view',
        name: 'Xem media (Admin)',
        description: 'Xem tất cả media với quyền admin',
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media:admin-download',
        name: 'Tải xuống media (Admin)',
        description: 'Tải xuống bất kỳ media nào',
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media:download-my',
        name: 'Tải xuống media của tôi',
        description: 'Tải xuống media do mình tải lên',
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media:get-statistics-buckets',
        name: 'Xem thống kê buckets',
        description: 'Xem thống kê dung lượng buckets',
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media:delete',
        name: 'Xóa media',
        description: 'Xóa media khỏi hệ thống',
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media:permanent-delete',
        name: 'Xóa vĩnh viễn media',
        description: 'Xóa vĩnh viễn media khỏi hệ thống',
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media:delete-my',
        name: 'Xóa media của tôi',
        description: 'Xóa media do mình tải lên',
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // ATTENDANCE MANAGEMENT
    // ===================================
    {
        code: 'attendance:get-all',
        name: 'Xem tất cả điểm danh',
        description: 'Xem danh sách tất cả điểm danh',
        group: 'ATTENDANCE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'attendance:get-all-by-session',
        name: 'Xem điểm danh theo buổi học',
        description: 'Xem danh sách điểm danh của buổi học',
        group: 'ATTENDANCE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'attendance:get-my-attendances',
        name: 'Xem điểm danh của tôi',
        description: 'Xem lịch sử điểm danh của mình',
        group: 'ATTENDANCE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'attendance:get-by-id',
        name: 'Xem chi tiết điểm danh',
        description: 'Xem chi tiết thông tin điểm danh',
        group: 'ATTENDANCE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'attendance:create',
        name: 'Tạo điểm danh',
        description: 'Tạo bản ghi điểm danh',
        group: 'ATTENDANCE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'attendance:update',
        name: 'Cập nhật điểm danh',
        description: 'Chỉnh sửa thông tin điểm danh',
        group: 'ATTENDANCE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'attendance:delete',
        name: 'Xóa điểm danh',
        description: 'Xóa bản ghi điểm danh',
        group: 'ATTENDANCE_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // CLASS SESSION MANAGEMENT
    // ===================================
    {
        code: 'class-session:get-all',
        name: 'Xem tất cả buổi học',
        description: 'Xem danh sách tất cả buổi học',
        group: 'CLASS_SESSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'class-session:search',
        name: 'Tìm kiếm buổi học',
        description: 'Tìm kiếm buổi học trong hệ thống',
        group: 'CLASS_SESSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'class-session:get-by-id',
        name: 'Xem chi tiết buổi học',
        description: 'Xem chi tiết thông tin buổi học',
        group: 'CLASS_SESSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'class-session:create',
        name: 'Tạo buổi học',
        description: 'Tạo buổi học mới',
        group: 'CLASS_SESSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'class-session:update',
        name: 'Cập nhật buổi học',
        description: 'Chỉnh sửa thông tin buổi học',
        group: 'CLASS_SESSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'class-session:delete',
        name: 'Xóa buổi học',
        description: 'Xóa buổi học khỏi hệ thống',
        group: 'CLASS_SESSION_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // COURSE CLASS MANAGEMENT
    // ===================================
    {
        code: 'course-class:get-all',
        name: 'Xem tất cả lớp học',
        description: 'Xem danh sách tất cả lớp học',
        group: 'COURSE_CLASS_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course-class:search',
        name: 'Tìm kiếm lớp học',
        description: 'Tìm kiếm lớp học trong hệ thống',
        group: 'COURSE_CLASS_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course-class:get-my-classes',
        name: 'Xem lớp học của tôi',
        description: 'Xem danh sách lớp học do mình quản lý',
        group: 'COURSE_CLASS_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course-class:get-by-id',
        name: 'Xem chi tiết lớp học',
        description: 'Xem chi tiết thông tin lớp học',
        group: 'COURSE_CLASS_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course-class:create',
        name: 'Tạo lớp học',
        description: 'Tạo lớp học mới',
        group: 'COURSE_CLASS_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course-class:update',
        name: 'Cập nhật lớp học',
        description: 'Chỉnh sửa thông tin lớp học',
        group: 'COURSE_CLASS_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course-class:delete',
        name: 'Xóa lớp học',
        description: 'Xóa lớp học khỏi hệ thống',
        group: 'COURSE_CLASS_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // COURSE ENROLLMENT MANAGEMENT
    // ===================================
    {
        code: 'course-enrollment:get-all',
        name: 'Xem tất cả đăng ký',
        description: 'Xem danh sách tất cả đăng ký khóa học',
        group: 'COURSE_ENROLLMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course-enrollment:get-my-enrollments',
        name: 'Xem đăng ký của tôi',
        description: 'Xem danh sách đăng ký khóa học của mình',
        group: 'COURSE_ENROLLMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course-enrollment:get-by-id',
        name: 'Xem chi tiết đăng ký',
        description: 'Xem chi tiết thông tin đăng ký',
        group: 'COURSE_ENROLLMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course-enrollment:create',
        name: 'Tạo đăng ký',
        description: 'Đăng ký khóa học mới',
        group: 'COURSE_ENROLLMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course-enrollment:update',
        name: 'Cập nhật đăng ký',
        description: 'Chỉnh sửa thông tin đăng ký',
        group: 'COURSE_ENROLLMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'course-enrollment:delete',
        name: 'Xóa đăng ký',
        description: 'Hủy đăng ký khóa học',
        group: 'COURSE_ENROLLMENT_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // NOTIFICATION MANAGEMENT
    // ===================================
    {
        code: 'notification:get-my',
        name: 'Xem thông báo của tôi',
        description: 'Xem danh sách thông báo của mình',
        group: 'NOTIFICATION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'notification:get-by-user-id',
        name: 'Xem thông báo theo user',
        description: 'Xem thông báo của người dùng khác',
        group: 'NOTIFICATION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'notification:mark-read',
        name: 'Đánh dấu đã đọc',
        description: 'Đánh dấu thông báo đã đọc',
        group: 'NOTIFICATION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'notification:delete',
        name: 'Xóa thông báo',
        description: 'Xóa thông báo của mình',
        group: 'NOTIFICATION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'notification:send',
        name: 'Gửi thông báo',
        description: 'Gửi thông báo đến người dùng',
        group: 'NOTIFICATION_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // MEDIA FOLDER MANAGEMENT
    // ===================================
    {
        code: 'media-folder:create',
        name: 'Tạo thư mục media',
        description: 'Tạo thư mục lưu trữ media',
        group: 'MEDIA_FOLDER_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media-folder:view',
        name: 'Xem thư mục media',
        description: 'Xem danh sách thư mục media',
        group: 'MEDIA_FOLDER_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media-folder:update',
        name: 'Cập nhật thư mục media',
        description: 'Chỉnh sửa thông tin thư mục',
        group: 'MEDIA_FOLDER_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media-folder:delete',
        name: 'Xóa thư mục media',
        description: 'Xóa thư mục lưu trữ media',
        group: 'MEDIA_FOLDER_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // MEDIA USAGE MANAGEMENT
    // ===================================
    {
        code: 'media-usage:attach',
        name: 'Gắn media',
        description: 'Gắn media vào entity',
        group: 'MEDIA_USAGE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media-usage:get-all',
        name: 'Xem tất cả sử dụng media',
        description: 'Xem danh sách sử dụng media',
        group: 'MEDIA_USAGE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media-usage:get-by-media',
        name: 'Xem theo media',
        description: 'Xem danh sách entity sử dụng media',
        group: 'MEDIA_USAGE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media-usage:get-by-entity',
        name: 'Xem theo entity',
        description: 'Xem danh sách media của entity',
        group: 'MEDIA_USAGE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'media-usage:detach',
        name: 'Gỡ media',
        description: 'Gỡ media khỏi entity',
        group: 'MEDIA_USAGE_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // LEARNING ITEM MANAGEMENT
    // ===================================
    {
        code: 'learning-item:get-all',
        name: 'Xem tất cả tài liệu học tập',
        description: 'Xem danh sách tất cả tài liệu học tập',
        group: 'LEARNING_ITEM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'learning-item:get-my-learning-items',
        name: 'Xem tài liệu của tôi',
        description: 'Xem danh sách tài liệu do mình tạo',
        group: 'LEARNING_ITEM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'learning-item:get-by-id',
        name: 'Xem chi tiết tài liệu',
        description: 'Xem chi tiết thông tin tài liệu học tập',
        group: 'LEARNING_ITEM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'learning-item:create',
        name: 'Tạo tài liệu học tập',
        description: 'Tạo tài liệu học tập mới',
        group: 'LEARNING_ITEM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'learning-item:update',
        name: 'Cập nhật tài liệu',
        description: 'Chỉnh sửa thông tin tài liệu',
        group: 'LEARNING_ITEM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'learning-item:delete',
        name: 'Xóa tài liệu học tập',
        description: 'Xóa tài liệu học tập khỏi hệ thống',
        group: 'LEARNING_ITEM_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // TUITION PAYMENT MANAGEMENT
    // ===================================
    {
        code: 'tuition-payment:stats',
        name: 'Xem thống kê học phí',
        description: 'Xem thống kê thu học phí',
        group: 'TUITION_PAYMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'tuition-payment:get-all',
        name: 'Xem tất cả học phí',
        description: 'Xem danh sách tất cả học phí',
        group: 'TUITION_PAYMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'tuition-payment:get-by-course',
        name: 'Xem học phí theo khóa học',
        description: 'Xem danh sách học phí của khóa học',
        group: 'TUITION_PAYMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'tuition-payment:get-by-student',
        name: 'Xem học phí theo học viên',
        description: 'Xem lịch sử học phí của học viên',
        group: 'TUITION_PAYMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'tuition-payment:get-my',
        name: 'Xem học phí của tôi',
        description: 'Xem lịch sử học phí của mình',
        group: 'TUITION_PAYMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'tuition-payment:get-by-id',
        name: 'Xem chi tiết học phí',
        description: 'Xem chi tiết thông tin học phí',
        group: 'TUITION_PAYMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'tuition-payment:create',
        name: 'Tạo học phí',
        description: 'Tạo bản ghi học phí mới',
        group: 'TUITION_PAYMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'tuition-payment:create-bulk',
        name: 'Tạo học phí hàng loạt',
        description: 'Tạo nhiều bản ghi học phí cùng lúc',
        group: 'TUITION_PAYMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'tuition-payment:update',
        name: 'Cập nhật học phí',
        description: 'Chỉnh sửa thông tin học phí',
        group: 'TUITION_PAYMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'tuition-payment:delete',
        name: 'Xóa học phí',
        description: 'Xóa bản ghi học phí',
        group: 'TUITION_PAYMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'tuition-payment:export-excel',
        name: 'Xuất danh sách học phí',
        description: 'Xuất danh sách học phí ra Excel',
        group: 'TUITION_PAYMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'tuition-payment:import-excel',
        name: 'Nhập học phí từ Excel',
        description: 'Nhập danh sách học phí từ Excel',
        group: 'TUITION_PAYMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'my-tuition-payment:stats',
        name: 'Xem thống kê học phí của tôi',
        description: 'Xem thống kê học phí cá nhân',
        group: 'TUITION_PAYMENT_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // TEMP EXAM MANAGEMENT
    // ===================================
    {
        code: 'temp-exam:get-by-session',
        name: 'Xem đề thi tạm theo session',
        description: 'Xem đề thi tạm của session import',
        group: 'TEMP_EXAM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'temp-exam:create',
        name: 'Tạo đề thi tạm',
        description: 'Tạo đề thi tạm trong quá trình import',
        group: 'TEMP_EXAM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'temp-exam:update',
        name: 'Cập nhật đề thi tạm',
        description: 'Chỉnh sửa đề thi tạm',
        group: 'TEMP_EXAM_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // TEMP SECTION MANAGEMENT
    // ===================================
    {
        code: 'temp-section:get-by-exam',
        name: 'Xem section tạm theo đề thi',
        description: 'Xem danh sách section tạm của đề thi',
        group: 'TEMP_SECTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'temp-section:get-by-id',
        name: 'Xem chi tiết section tạm',
        description: 'Xem chi tiết section tạm',
        group: 'TEMP_SECTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'temp-section:create',
        name: 'Tạo section tạm',
        description: 'Tạo section tạm trong quá trình import',
        group: 'TEMP_SECTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'temp-section:update',
        name: 'Cập nhật section tạm',
        description: 'Chỉnh sửa section tạm',
        group: 'TEMP_SECTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'temp-section:delete',
        name: 'Xóa section tạm',
        description: 'Xóa section tạm',
        group: 'TEMP_SECTION_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // TEMP QUESTION MANAGEMENT
    // ===================================
    {
        code: 'temp-question:get-by-session',
        name: 'Xem câu hỏi tạm theo session',
        description: 'Xem danh sách câu hỏi tạm của session',
        group: 'TEMP_QUESTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'temp-question:get-by-id',
        name: 'Xem chi tiết câu hỏi tạm',
        description: 'Xem chi tiết câu hỏi tạm',
        group: 'TEMP_QUESTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'temp-question:create',
        name: 'Tạo câu hỏi tạm',
        description: 'Tạo câu hỏi tạm trong quá trình import',
        group: 'TEMP_QUESTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'temp-question:update',
        name: 'Cập nhật câu hỏi tạm',
        description: 'Chỉnh sửa câu hỏi tạm',
        group: 'TEMP_QUESTION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'temp-question:delete',
        name: 'Xóa câu hỏi tạm',
        description: 'Xóa câu hỏi tạm',
        group: 'TEMP_QUESTION_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // TEMP STATEMENT MANAGEMENT
    // ===================================
    {
        code: 'temp-statement:create',
        name: 'Tạo đáp án tạm',
        description: 'Tạo đáp án tạm trong quá trình import',
        group: 'TEMP_STATEMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'temp-statement:update',
        name: 'Cập nhật đáp án tạm',
        description: 'Chỉnh sửa đáp án tạm',
        group: 'TEMP_STATEMENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'temp-statement:delete',
        name: 'Xóa đáp án tạm',
        description: 'Xóa đáp án tạm',
        group: 'TEMP_STATEMENT_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // VIDEO CONTENT MANAGEMENT
    // ===================================
    {
        code: 'video-content:get-all',
        name: 'Xem tất cả video',
        description: 'Xem danh sách tất cả video',
        group: 'VIDEO_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'video-content:get-by-id',
        name: 'Xem chi tiết video',
        description: 'Xem chi tiết thông tin video',
        group: 'VIDEO_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'video-content:create',
        name: 'Tạo video',
        description: 'Tạo nội dung video mới',
        group: 'VIDEO_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'video-content:update',
        name: 'Cập nhật video',
        description: 'Chỉnh sửa thông tin video',
        group: 'VIDEO_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'video-content:delete',
        name: 'Xóa video',
        description: 'Xóa nội dung video',
        group: 'VIDEO_CONTENT_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // YOUTUBE CONTENT MANAGEMENT
    // ===================================
    {
        code: 'youtube-content:get-all',
        name: 'Xem tất cả YouTube',
        description: 'Xem danh sách tất cả video YouTube',
        group: 'YOUTUBE_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'youtube-content:get-by-id',
        name: 'Xem chi tiết YouTube',
        description: 'Xem chi tiết video YouTube',
        group: 'YOUTUBE_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'youtube-content:create',
        name: 'Tạo YouTube',
        description: 'Thêm video YouTube mới',
        group: 'YOUTUBE_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'youtube-content:update',
        name: 'Cập nhật YouTube',
        description: 'Chỉnh sửa thông tin video YouTube',
        group: 'YOUTUBE_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'youtube-content:delete',
        name: 'Xóa YouTube',
        description: 'Xóa video YouTube',
        group: 'YOUTUBE_CONTENT_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // AUDIT LOG MANAGEMENT
    // ===================================
    {
        code: 'audit-log:get-all',
        name: 'Xem tất cả audit log',
        description: 'Xem danh sách tất cả audit log',
        group: 'AUDIT_LOG_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'audit-log:get-all-by-admin',
        name: 'Xem audit log theo admin',
        description: 'Xem audit log của admin cụ thể',
        group: 'AUDIT_LOG_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'audit-log:get-by-id',
        name: 'Xem chi tiết audit log',
        description: 'Xem chi tiết audit log',
        group: 'AUDIT_LOG_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'audit-log:rollback',
        name: 'Rollback audit log',
        description: 'Khôi phục dữ liệu từ audit log',
        group: 'AUDIT_LOG_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // CLASS STUDENT MANAGEMENT
    // ===================================
    {
        code: 'class-student:get-all',
        name: 'Xem tất cả học viên lớp',
        description: 'Xem danh sách học viên trong lớp',
        group: 'CLASS_STUDENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'class-student:get-my-classes',
        name: 'Xem lớp học của tôi',
        description: 'Xem danh sách lớp mà mình tham gia',
        group: 'CLASS_STUDENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'class-student:create',
        name: 'Thêm học viên vào lớp',
        description: 'Thêm học viên mới vào lớp học',
        group: 'CLASS_STUDENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'class-student:delete',
        name: 'Xóa học viên khỏi lớp',
        description: 'Xóa học viên ra khỏi lớp học',
        group: 'CLASS_STUDENT_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // DOCUMENT CONTENT MANAGEMENT
    // ===================================
    {
        code: 'document-content:get-all',
        name: 'Xem tất cả tài liệu',
        description: 'Xem danh sách tất cả tài liệu',
        group: 'DOCUMENT_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'document-content:get-by-id',
        name: 'Xem chi tiết tài liệu',
        description: 'Xem chi tiết thông tin tài liệu',
        group: 'DOCUMENT_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'document-content:create',
        name: 'Tạo tài liệu',
        description: 'Tạo tài liệu mới',
        group: 'DOCUMENT_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'document-content:update',
        name: 'Cập nhật tài liệu',
        description: 'Chỉnh sửa thông tin tài liệu',
        group: 'DOCUMENT_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'document-content:delete',
        name: 'Xóa tài liệu',
        description: 'Xóa tài liệu khỏi hệ thống',
        group: 'DOCUMENT_CONTENT_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // EXAM IMPORT SESSION MANAGEMENT
    // ===================================
    {
        code: 'exam-import-session:get-all',
        name: 'Xem tất cả session import',
        description: 'Xem danh sách session import đề thi',
        group: 'EXAM_IMPORT_SESSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'exam-import-session:create',
        name: 'Tạo session import',
        description: 'Tạo session import đề thi mới',
        group: 'EXAM_IMPORT_SESSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'exam-import-session:get-by-id',
        name: 'Xem chi tiết session import',
        description: 'Xem chi tiết session import đề thi',
        group: 'EXAM_IMPORT_SESSION_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // HOMEWORK CONTENT MANAGEMENT
    // ===================================
    {
        code: 'homework-content:get-all',
        name: 'Xem tất cả bài tập',
        description: 'Xem danh sách tất cả bài tập',
        group: 'HOMEWORK_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'homework-content:get-by-id',
        name: 'Xem chi tiết bài tập',
        description: 'Xem chi tiết thông tin bài tập',
        group: 'HOMEWORK_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'homework-content:create',
        name: 'Tạo bài tập',
        description: 'Tạo bài tập mới',
        group: 'HOMEWORK_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'homework-content:update',
        name: 'Cập nhật bài tập',
        description: 'Chỉnh sửa thông tin bài tập',
        group: 'HOMEWORK_CONTENT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'homework-content:delete',
        name: 'Xóa bài tập',
        description: 'Xóa bài tập khỏi hệ thống',
        group: 'HOMEWORK_CONTENT_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // HOMEWORK SUBMIT MANAGEMENT
    // ===================================
    {
        code: 'homework-submit:get-all',
        name: 'Xem tất cả bài nộp',
        description: 'Xem danh sách tất cả bài nộp',
        group: 'HOMEWORK_SUBMIT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'homework-submit:get-by-id',
        name: 'Xem chi tiết bài nộp',
        description: 'Xem chi tiết thông tin bài nộp',
        group: 'HOMEWORK_SUBMIT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'homework-submit:create',
        name: 'Nộp bài tập',
        description: 'Nộp bài tập mới',
        group: 'HOMEWORK_SUBMIT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'homework-submit:update',
        name: 'Cập nhật bài nộp',
        description: 'Chỉnh sửa bài nộp',
        group: 'HOMEWORK_SUBMIT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'homework-submit:grade',
        name: 'Chấm điểm bài tập',
        description: 'Chấm điểm và nhận xét bài tập',
        group: 'HOMEWORK_SUBMIT_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'homework-submit:delete',
        name: 'Xóa bài nộp',
        description: 'Xóa bài nộp khỏi hệ thống',
        group: 'HOMEWORK_SUBMIT_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // LESSON LEARNING ITEM MANAGEMENT
    // ===================================
    {
        code: 'lesson-learning-item:get-all',
        name: 'Xem tất cả tài liệu bài học',
        description: 'Xem danh sách tài liệu của bài học',
        group: 'LESSON_LEARNING_ITEM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'lesson-learning-item:get-by-id',
        name: 'Xem chi tiết tài liệu bài học',
        description: 'Xem chi tiết tài liệu của bài học',
        group: 'LESSON_LEARNING_ITEM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'lesson-learning-item:create',
        name: 'Thêm tài liệu vào bài học',
        description: 'Thêm tài liệu mới vào bài học',
        group: 'LESSON_LEARNING_ITEM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'lesson-learning-item:update',
        name: 'Cập nhật tài liệu bài học',
        description: 'Cập nhật thông tin và thứ tự tài liệu trong bài học',
        group: 'LESSON_LEARNING_ITEM_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'lesson-learning-item:delete',
        name: 'Xóa tài liệu khỏi bài học',
        description: 'Xóa tài liệu ra khỏi bài học',
        group: 'LESSON_LEARNING_ITEM_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // ADMIN PAGE ACCESS PERMISSIONS
    // ===================================
    {
        code: 'admin:page:dashboard',
        name: 'Truy cập trang Dashboard',
        description: 'Cho phép truy cập vào trang Dashboard của admin - trang chủ hiển thị thống kê tổng quan hệ thống',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:roles',
        name: 'Truy cập trang Vai trò',
        description: 'Cho phép truy cập vào trang quản lý danh sách vai trò (Roles) trong hệ thống',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:role-create',
        name: 'Truy cập trang Tạo vai trò',
        description: 'Cho phép truy cập vào trang tạo vai trò mới (Create Role) với form nhập thông tin',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:role-edit',
        name: 'Truy cập trang Sửa vai trò',
        description: 'Cho phép truy cập vào trang chỉnh sửa thông tin vai trò (Edit Role) đã tồn tại',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:permissions',
        name: 'Truy cập trang Quyền hạn',
        description: 'Cho phép truy cập vào trang quản lý danh sách quyền hạn (Permissions) của hệ thống',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:audit-logs',
        name: 'Truy cập trang Nhật ký hệ thống',
        description: 'Cho phép truy cập vào trang xem nhật ký hoạt động (Audit Logs) - lịch sử thao tác của admin',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:media',
        name: 'Truy cập trang Quản lý Media',
        description: 'Cho phép truy cập vào trang quản lý tất cả file media (hình ảnh, video, tài liệu) trong hệ thống',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:media-folders',
        name: 'Truy cập trang Thư mục Media',
        description: 'Cho phép truy cập vào trang quản lý thư mục media cá nhân - thư mục lưu trữ file của admin',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:admins',
        name: 'Truy cập trang Quản trị viên',
        description: 'Cho phép truy cập vào trang quản lý danh sách quản trị viên (Admins) trong hệ thống',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:admin-detail',
        name: 'Truy cập trang Chi tiết Admin',
        description: 'Cho phép truy cập vào trang xem chi tiết thông tin cá nhân và hoạt động của quản trị viên',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:students',
        name: 'Truy cập trang Học viên',
        description: 'Cho phép truy cập vào trang quản lý danh sách học viên (Students) đang học tại trung tâm',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:student-detail',
        name: 'Truy cập trang Chi tiết Học viên',
        description: 'Cho phép truy cập vào trang xem chi tiết thông tin học viên - hồ sơ, lớp học, điểm danh, học phí',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:chapters',
        name: 'Truy cập trang Chương học',
        description: 'Cho phép truy cập vào trang quản lý danh sách chương học (Chapters) của các môn học',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:subjects',
        name: 'Truy cập trang Môn học',
        description: 'Cho phép truy cập vào trang quản lý danh sách môn học (Subjects) được giảng dạy',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:courses',
        name: 'Truy cập trang Khóa học',
        description: 'Cho phép truy cập vào trang quản lý tất cả khóa học (Courses) trong hệ thống',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:course-detail',
        name: 'Truy cập trang Chi tiết Khóa học',
        description: 'Cho phép truy cập vào trang xem chi tiết khóa học - thông tin, lớp học, học viên, bài học, giá',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:my-courses',
        name: 'Truy cập trang Khóa học của tôi',
        description: 'Cho phép truy cập vào trang xem danh sách khóa học do admin đang phụ trách giảng dạy',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:classes',
        name: 'Truy cập trang Lớp học',
        description: 'Cho phép truy cập vào trang quản lý tất cả lớp học (Classes) đang hoạt động trong hệ thống',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:class-detail',
        name: 'Truy cập trang Chi tiết Lớp học',
        description: 'Cho phép truy cập vào trang xem chi tiết lớp học - thông tin, học viên, buổi học, điểm danh, thông báo',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:my-classes',
        name: 'Truy cập trang Lớp học của tôi',
        description: 'Cho phép truy cập vào trang xem danh sách lớp học do admin đang trực tiếp giảng dạy',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:broadcast-notifications',
        name: 'Truy cập trang Gửi thông báo',
        description: 'Cho phép truy cập vào trang gửi thông báo hàng loạt (Broadcast) đến nhiều người dùng',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:tuition-payments',
        name: 'Truy cập trang Học phí',
        description: 'Cho phép truy cập vào trang quản lý học phí - thu, chi, thống kê thanh toán của học viên',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:exam-import-sessions',
        name: 'Truy cập trang Import đề thi',
        description: 'Cho phép truy cập vào trang quản lý phiên import đề thi - nhập đề từ file, phân loại câu hỏi',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:questions',
        name: 'Truy cập trang Câu hỏi',
        description: 'Cho phép truy cập vào trang quản lý tất cả câu hỏi (Questions) trong ngân hàng đề thi',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:my-questions',
        name: 'Truy cập trang Câu hỏi của tôi',
        description: 'Cho phép truy cập vào trang xem danh sách câu hỏi do admin tự tạo và quản lý',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:exams',
        name: 'Truy cập trang Đề thi',
        description: 'Cho phép truy cập vào trang quản lý tất cả đề thi (Exams) trong hệ thống',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
    {
        code: 'admin:page:my-exams',
        name: 'Truy cập trang Đề thi của tôi',
        description: 'Cho phép truy cập vào trang xem danh sách đề thi do admin tự tạo và biên soạn',
        group: 'ADMIN_PAGE_ACCESS',
        isSystem: true,
    },
];
