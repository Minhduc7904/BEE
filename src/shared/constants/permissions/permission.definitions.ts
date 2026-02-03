// src/shared/constants/permissions/permission.definitions.ts

export const PERMISSION_DEFINITIONS = {
    role: {
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
        actions: {
            viewRoleManagement: {
                name: 'Truy cập quản lý vai trò',
                description: 'Truy cập trang quản lý vai trò',
            },
            viewRoleCreation: {
                name: 'Truy cập tạo vai trò',
                description: 'Truy cập trang tạo vai trò',
            },
            viewRoleEdit: {
                name: 'Truy cập chỉnh sửa vai trò',
                description: 'Truy cập trang chỉnh sửa vai trò',
            },
            viewUserRolesManagement: {
                name: 'Truy cập quản lý vai trò người dùng',
                description: 'Truy cập trang quản lý vai trò người dùng',
            },
            getAll: {
                name: 'Xem danh sách vai trò',
                description: 'Xem danh sách và thông tin vai trò',
            },
            getById: {
                name: 'Xem chi tiết vai trò',
                description: 'Xem chi tiết một vai trò',
            },
            create: {
                name: 'Tạo vai trò',
                description: 'Tạo vai trò mới trong hệ thống',
            },
            update: {
                name: 'Cập nhật vai trò',
                description: 'Chỉnh sửa thông tin vai trò',
            },
            delete: {
                name: 'Xóa vai trò',
                description: 'Xóa vai trò khỏi hệ thống',
            },
            assign: {
                name: 'Gán vai trò cho người dùng',
                description: 'Gán vai trò cho người dùng',
            },
            removeFromUser: {
                name: 'Gỡ vai trò khỏi người dùng',
                description: 'Gỡ vai trò khỏi người dùng',
            },
            getUserRoles: {
                name: 'Xem vai trò người dùng',
                description: 'Xem các vai trò được gán cho người dùng',
            },
            toggleRolePermission: {
                name: 'Quản lý quyền của vai trò',
                description: 'Bật/tắt quyền cho vai trò',
            },
        },
    },

    permission: {
        group: 'PERMISSION_MANAGEMENT',
        isSystem: true,
        actions: {
            viewPermissionManagement: {
                name: 'Truy cập quản lý quyền',
                description: 'Truy cập trang quản lý quyền',
            },
            getAll: {
                name: 'Xem danh sách quyền',
                description: 'Xem danh sách và thông tin quyền',
            },
            getById: {
                name: 'Xem chi tiết quyền',
                description: 'Xem chi tiết một quyền',
            },
            getGroups: {
                name: 'Xem nhóm quyền',
                description: 'Xem danh sách các nhóm quyền',
            },
            create: {
                name: 'Tạo quyền',
                description: 'Tạo quyền mới trong hệ thống',
            },
            update: {
                name: 'Cập nhật quyền',
                description: 'Chỉnh sửa thông tin quyền',
            },
            delete: {
                name: 'Xóa quyền',
                description: 'Xóa quyền khỏi hệ thống',
            },
        },
    },

    auditLog: {
        group: 'AUDIT_LOG',
        isSystem: true,
        actions: {
            viewAuditLogsManagement: {
                name: 'Truy cập quản lý audit logs',
                description: 'Truy cập trang quản lý audit logs',
            },
            viewAdminAuditLogs: {
                name: 'Truy cập audit logs của admin',
                description: 'Truy cập trang audit logs của admin',
            },
            getAll: {
                name: 'Xem danh sách audit logs',
                description: 'Xem tất cả các audit logs trong hệ thống',
            },
            getAllByAdmin: {
                name: 'Xem audit logs theo admin',
                description: 'Xem audit logs của một admin cụ thể',
            },
            getById: {
                name: 'Xem chi tiết audit log',
                description: 'Xem chi tiết một audit log cụ thể',
            },
            rollback: {
                name: 'Rollback audit log',
                description: 'Khôi phục dữ liệu từ audit log',
            },
        },
    },

    notification: {
        group: 'NOTIFICATION',
        isSystem: false,
        actions: {
            viewNotificationManagement: {
                name: 'Truy cập quản lý thông báo',
                description: 'Truy cập trang quản lý thông báo',
            },
            viewClassNotificationManagement: {
                name: 'Truy cập thông báo lớp học',
                description: 'Truy cập trang thông báo lớp học',
            },
            getMy: {
                name: 'Xem thông báo của tôi',
                description: 'Xem danh sách thông báo của người dùng hiện tại',
            },
            getByUserId: {
                name: 'Xem thông báo theo user ID',
                description: 'Xem thông báo của người dùng khác (admin)',
                isSystem: true,
            },
            markRead: {
                name: 'Đánh dấu đã đọc',
                description: 'Đánh dấu thông báo đã đọc',
            },
            delete: {
                name: 'Xóa thông báo',
                description: 'Xóa thông báo của mình',
            },
            send: {
                name: 'Gửi thông báo',
                description: 'Gửi thông báo đến người dùng',
                isSystem: true,
            },
        },
    },

    admin: {
        group: 'ADMIN_MANAGEMENT',
        isSystem: true,
        actions: {
            viewAdminManagement: {
                name: 'Truy cập quản lý admin',
                description: 'Truy cập trang quản lý admin',
            },
            viewAdminDetailManagement: {
                name: 'Truy cập chi tiết admin',
                description: 'Truy cập trang chi tiết admin',
            },
            viewAdminRoleManagement: {
                name: 'Truy cập quản lý vai trò admin',
                description: 'Truy cập trang quản lý vai trò của admin',
            },
            viewAdminMediaManagement: {
                name: 'Truy cập media admin',
                description: 'Truy cập trang media của admin',
            },
            viewAdminAuditLogManagement: {
                name: 'Truy cập audit log admin',
                description: 'Truy cập trang audit log của admin',
            },
            getAll: {
                name: 'Xem danh sách quản trị viên',
                description: 'Xem danh sách và thông tin quản trị viên',
            },
            getById: {
                name: 'Xem chi tiết quản trị viên',
                description: 'Xem chi tiết một quản trị viên',
            },
            create: {
                name: 'Tạo quản trị viên',
                description: 'Tạo quản trị viên mới trong hệ thống',
            },
        },
    },

    user: {
        group: 'USER_MANAGEMENT',
        isSystem: true,
        actions: {
            toggleActivation: {
                name: 'Kích hoạt/Vô hiệu hóa người dùng',
                description: 'Thay đổi trạng thái kích hoạt của người dùng',
            },
        },
    },

    student: {
        group: 'STUDENT_MANAGEMENT',
        isSystem: true,
        actions: {
            viewStudentManagement: {
                name: 'Truy cập quản lý học sinh',
                description: 'Truy cập trang quản lý học sinh',
            },
            viewStudentProfile: {
                name: 'Truy cập hồ sơ học sinh',
                description: 'Truy cập trang hồ sơ học sinh',
            },
            viewStudentDetailManagement: {
                name: 'Truy cập chi tiết học sinh',
                description: 'Truy cập trang chi tiết học sinh',
            },
            viewStudentClassesManagement: {
                name: 'Truy cập lớp học sinh',
                description: 'Truy cập trang lớp học của học sinh',
            },
            viewStudentCoursesManagement: {
                name: 'Truy cập khóa học học sinh',
                description: 'Truy cập trang khóa học của học sinh',
            },
            viewStudentAttendanceManagement: {
                name: 'Truy cập điểm danh học sinh',
                description: 'Truy cập trang điểm danh của học sinh',
            },
            viewStudentRoleManagement: {
                name: 'Truy cập vai trò học sinh',
                description: 'Truy cập trang vai trò của học sinh',
            },
            viewStudentMediaManagement: {
                name: 'Truy cập media học sinh',
                description: 'Truy cập trang media của học sinh',
            },
            getAll: {
                name: 'Xem danh sách học sinh',
                description: 'Xem danh sách và thông tin học sinh',
            },
            getById: {
                name: 'Xem chi tiết học sinh',
                description: 'Xem chi tiết một học sinh',
            },
            create: {
                name: 'Tạo học sinh',
                description: 'Tạo học sinh mới trong hệ thống',
            },
            update: {
                name: 'Cập nhật học sinh',
                description: 'Chỉnh sửa thông tin học sinh',
            },
        },
    },

    subject: {
        group: 'SUBJECT_MANAGEMENT',
        isSystem: false,
        actions: {
            viewSubjectManagement: {
                name: 'Truy cập quản lý môn học',
                description: 'Truy cập trang quản lý môn học',
            },
            getAll: {
                name: 'Xem danh sách môn học',
                description: 'Xem danh sách và thông tin môn học',
            },
            getById: {
                name: 'Xem chi tiết môn học',
                description: 'Xem chi tiết một môn học',
            },
            create: {
                name: 'Tạo môn học',
                description: 'Tạo môn học mới trong hệ thống',
                isSystem: true,
            },
            update: {
                name: 'Cập nhật môn học',
                description: 'Chỉnh sửa thông tin môn học',
                isSystem: true,
            },
            delete: {
                name: 'Xóa môn học',
                description: 'Xóa môn học khỏi hệ thống',
                isSystem: true,
            },
        },
    },

    chapter: {
        group: 'CHAPTER_MANAGEMENT',
        isSystem: false,
        actions: {
            viewChapterManagement: {
                name: 'Truy cập quản lý chương',
                description: 'Truy cập trang quản lý chương',
            },
            getAll: {
                name: 'Xem danh sách chương',
                description: 'Xem danh sách và thông tin chương',
            },
            getById: {
                name: 'Xem chi tiết chương',
                description: 'Xem chi tiết một chương',
            },
            create: {
                name: 'Tạo chương',
                description: 'Tạo chương mới trong hệ thống',
                isSystem: true,
            },
            update: {
                name: 'Cập nhật chương',
                description: 'Chỉnh sửa thông tin chương',
                isSystem: true,
            },
            delete: {
                name: 'Xóa chương',
                description: 'Xóa chương khỏi hệ thống',
                isSystem: true,
            },
        },
    },

    course: {
        group: 'COURSE_MANAGEMENT',
        isSystem: false,
        actions: {
            viewCourseManagement: {
                name: 'Truy cập quản lý khóa học',
                description: 'Truy cập trang quản lý khóa học',
            },
            viewMyCourseManagement: {
                name: 'Truy cập quản lý khóa học của tôi',
                description: 'Truy cập trang quản lý khóa học của tôi',
            },
            viewCourseDetailManagement: {
                name: 'Truy cập quản lý chi tiết khóa học',
                description: 'Truy cập trang quản lý chi tiết khóa học',
            },
            viewCourseClassManagement: {
                name: 'Truy cập quản lý lớp học trong khóa học',
                description: 'Truy cập trang quản lý lớp học trong khóa học',
            },
            getAll: {
                name: 'Xem danh sách khóa học',
                description: 'Xem danh sách và thông tin khóa học',
            },
            getMyCourses: {
                name: 'Xem khóa học của tôi',
                description: 'Xem các khóa học mà tôi tham gia',
            },
            getById: {
                name: 'Xem chi tiết khóa học',
                description: 'Xem chi tiết một khóa học',
            },
            create: {
                name: 'Tạo khóa học',
                description: 'Tạo khóa học mới trong hệ thống',
                isSystem: true,
            },
            update: {
                name: 'Cập nhật khóa học',
                description: 'Chỉnh sửa thông tin khóa học',
                isSystem: true,
            },
            delete: {
                name: 'Xóa khóa học',
                description: 'Xóa khóa học khỏi hệ thống',
                isSystem: true,
            },
            getStudentsAttendance: {
                name: 'Xem điểm danh học sinh',
                description: 'Xem thông tin điểm danh học sinh trong khóa học',
            },
        },
    },

    courseClass: {
        group: 'CLASS_MANAGEMENT',
        isSystem: false,
        actions: {
            viewClassManagement: {
                name: 'Truy cập quản lý lớp học',
                description: 'Truy cập trang quản lý lớp học',
            },
            viewMyClassesManagement: {
                name: 'Truy cập quản lý lớp học của tôi',
                description: 'Truy cập trang quản lý lớp học của tôi',
            },
            viewClassDetailManagement: {
                name: 'Truy cập quản lý chi tiết lớp học',
                description: 'Truy cập trang quản lý chi tiết lớp học',
            },
            getAll: {
                name: 'Xem danh sách lớp học',
                description: 'Xem danh sách và thông tin lớp học',
            },
            getMyClasses: {
                name: 'Xem lớp học của tôi',
                description: 'Xem các lớp học mà tôi tham gia',
            },
            getById: {
                name: 'Xem chi tiết lớp học',
                description: 'Xem chi tiết một lớp học',
            },
            create: {
                name: 'Tạo lớp học',
                description: 'Tạo lớp học mới trong hệ thống',
                isSystem: true,
            },
            update: {
                name: 'Cập nhật lớp học',
                description: 'Chỉnh sửa thông tin lớp học',
                isSystem: true,
            },
            delete: {
                name: 'Xóa lớp học',
                description: 'Xóa lớp học khỏi hệ thống',
                isSystem: true,
            },
        },
    },

    classStudent: {
        group: 'CLASS_MANAGEMENT',
        isSystem: true,
        actions: {
            viewClassStudentManagement: {
                name: 'Truy cập quản lý học sinh trong lớp',
                description: 'Truy cập trang quản lý học sinh trong lớp',
            },
            getAll: {
                name: 'Xem danh sách học sinh trong lớp',
                description: 'Xem danh sách học sinh trong lớp học',
            },
            getMyClasses: {
                name: 'Xem lớp học của tôi',
                description: 'Xem các lớp học mà tôi đang tham gia',
                isSystem: false,
            },
            create: {
                name: 'Thêm học sinh vào lớp',
                description: 'Thêm học sinh vào lớp học',
            },
            delete: {
                name: 'Xóa học sinh khỏi lớp',
                description: 'Xóa học sinh khỏi lớp học',
            },
        },
    },

    classSession: {
        group: 'CLASS_MANAGEMENT',
        isSystem: true,
        actions: {
            viewClassSessionManagement: {
                name: 'Truy cập quản lý buổi học',
                description: 'Truy cập trang quản lý buổi học',
            },
            getAll: {
                name: 'Xem danh sách buổi học',
                description: 'Xem danh sách và thông tin buổi học',
            },
            getById: {
                name: 'Xem chi tiết buổi học',
                description: 'Xem chi tiết một buổi học',
            },
            create: {
                name: 'Tạo buổi học',
                description: 'Tạo buổi học mới trong hệ thống',
            },
            update: {
                name: 'Cập nhật buổi học',
                description: 'Chỉnh sửa thông tin buổi học',
            },
            delete: {
                name: 'Xóa buổi học',
                description: 'Xóa buổi học khỏi hệ thống',
            },
        },
    },

    courseEnrollment: {
        group: 'ENROLLMENT_MANAGEMENT',
        isSystem: true,
        actions: {
            viewEnrollmentManagement: {
                name: 'Truy cập quản lý đăng ký khóa học',
                description: 'Truy cập trang quản lý đăng ký khóa học',
            },
            viewCourseEnrollmentManagement: {
                name: 'Truy cập đăng ký khóa học',
                description: 'Truy cập trang đăng ký khóa học',
            },
            getAll: {
                name: 'Xem danh sách đăng ký khóa học',
                description: 'Xem danh sách đăng ký khóa học',
            },
            getMyEnrollments: {
                name: 'Xem đăng ký của tôi',
                description: 'Xem các đăng ký khóa học của tôi',
                isSystem: false,
            },
            getById: {
                name: 'Xem chi tiết đăng ký',
                description: 'Xem chi tiết một đăng ký khóa học',
            },
            create: {
                name: 'Tạo đăng ký',
                description: 'Đăng ký khóa học mới',
            },
            update: {
                name: 'Cập nhật đăng ký',
                description: 'Chỉnh sửa thông tin đăng ký',
            },
            delete: {
                name: 'Xóa đăng ký',
                description: 'Hủy đăng ký khóa học',
            },
        },
    },

    attendance: {
        group: 'ATTENDANCE_MANAGEMENT',
        isSystem: false,
        actions: {
            viewAttendanceManagement: {
                name: 'Truy cập quản lý điểm danh',
                description: 'Truy cập trang quản lý điểm danh',
            },
            viewCourseAttendanceManagement: {
                name: 'Truy cập điểm danh khóa học',
                description: 'Truy cập trang điểm danh khóa học',
            },
            viewClassAttendanceManagement: {
                name: 'Truy cập điểm danh lớp học',
                description: 'Truy cập trang điểm danh lớp học',
            },
            getAll: {
                name: 'Xem danh sách điểm danh',
                description: 'Xem danh sách và thông tin điểm danh',
                isSystem: true,
            },
            getAllBySession: {
                name: 'Xem điểm danh theo buổi học',
                description: 'Xem thông tin điểm danh của một buổi học',
                isSystem: true,
            },
            getMyAttendances: {
                name: 'Xem điểm danh của tôi',
                description: 'Xem lịch sử điểm danh của tôi',
            },
            getById: {
                name: 'Xem chi tiết điểm danh',
                description: 'Xem chi tiết một bản ghi điểm danh',
            },
            create: {
                name: 'Tạo điểm danh',
                description: 'Tạo bản ghi điểm danh mới',
                isSystem: true,
            },
            update: {
                name: 'Cập nhật điểm danh',
                description: 'Chỉnh sửa thông tin điểm danh',
                isSystem: true,
            },
            delete: {
                name: 'Xóa điểm danh',
                description: 'Xóa bản ghi điểm danh',
                isSystem: true,
            },
        },
    },

    lesson: {
        group: 'LESSON_MANAGEMENT',
        isSystem: true,
        actions: {
            viewCourseLessonManagement: {
                name: 'Truy cập quản lý bài học trong khóa học',
                description: 'Truy cập trang quản lý bài học trong khóa học',
            },
            viewLessonManagement: {
                name: 'Truy cập quản lý bài học',
                description: 'Truy cập trang quản lý bài học',
            },
            getAll: {
                name: 'Xem danh sách bài học',
                description: 'Xem danh sách và thông tin bài học',
            },
            getById: {
                name: 'Xem chi tiết bài học',
                description: 'Xem chi tiết một bài học',
            },
            create: {
                name: 'Tạo bài học',
                description: 'Tạo bài học mới trong hệ thống',
            },
            update: {
                name: 'Cập nhật bài học',
                description: 'Chỉnh sửa thông tin bài học',
            },
            delete: {
                name: 'Xóa bài học',
                description: 'Xóa bài học khỏi hệ thống',
            },
        },
    },

    learningItem: {
        group: 'LEARNING_ITEM_MANAGEMENT',
        isSystem: false,
        actions: {
            viewLearningItemManagement: {
                name: 'Truy cập quản lý mục học tập',
                description: 'Truy cập trang quản lý mục học tập',
            },
            getAll: {
                name: 'Xem danh sách mục học tập',
                description: 'Xem danh sách và thông tin mục học tập',
                isSystem: true,
            },
            getMyLearningItems: {
                name: 'Xem mục học tập của tôi',
                description: 'Xem các mục học tập của tôi',
            },
            getById: {
                name: 'Xem chi tiết mục học tập',
                description: 'Xem chi tiết một mục học tập',
            },
            create: {
                name: 'Tạo mục học tập',
                description: 'Tạo mục học tập mới trong hệ thống',
                isSystem: true,
            },
            update: {
                name: 'Cập nhật mục học tập',
                description: 'Chỉnh sửa thông tin mục học tập',
                isSystem: true,
            },
            delete: {
                name: 'Xóa mục học tập',
                description: 'Xóa mục học tập khỏi hệ thống',
                isSystem: true,
            },
        },
    },

    lessonLearningItem: {
        group: 'LESSON_MANAGEMENT',
        isSystem: true,
        actions: {
            viewLessonLearningItemManagement: {
                name: 'Truy cập quản lý liên kết bài học - mục học tập',
                description: 'Truy cập trang quản lý liên kết bài học - mục học tập',
            },
            getAll: {
                name: 'Xem danh sách liên kết bài học',
                description: 'Xem danh sách liên kết giữa bài học và mục học tập',
            },
            getById: {
                name: 'Xem chi tiết liên kết',
                description: 'Xem chi tiết một liên kết',
            },
            create: {
                name: 'Tạo liên kết',
                description: 'Tạo liên kết giữa bài học và mục học tập',
            },
            delete: {
                name: 'Xóa liên kết',
                description: 'Xóa liên kết giữa bài học và mục học tập',
            },
        },
    },

    documentContent: {
        group: 'CONTENT_MANAGEMENT',
        isSystem: true,
        actions: {
            viewDoucmentContentManagement: {
                name: 'Truy cập quản lý tài liệu',
                description: 'Truy cập trang quản lý tài liệu',
            },
            getAll: {
                name: 'Xem danh sách tài liệu',
                description: 'Xem danh sách và thông tin tài liệu',
            },
            getById: {
                name: 'Xem chi tiết tài liệu',
                description: 'Xem chi tiết một tài liệu',
            },
            create: {
                name: 'Tạo tài liệu',
                description: 'Tạo tài liệu mới trong hệ thống',
            },
            update: {
                name: 'Cập nhật tài liệu',
                description: 'Chỉnh sửa thông tin tài liệu',
            },
            delete: {
                name: 'Xóa tài liệu',
                description: 'Xóa tài liệu khỏi hệ thống',
            },
        },
    },

    videoContent: {
        group: 'CONTENT_MANAGEMENT',
        isSystem: true,
        actions: {
            viewVideoContentManagement: {
                name: 'Truy cập quản lý video',
                description: 'Truy cập trang quản lý video',
            },
            getAll: {
                name: 'Xem danh sách video',
                description: 'Xem danh sách và thông tin video',
            },
            getById: {
                name: 'Xem chi tiết video',
                description: 'Xem chi tiết một video',
            },
            create: {
                name: 'Tạo video',
                description: 'Tạo video mới trong hệ thống',
            },
            update: {
                name: 'Cập nhật video',
                description: 'Chỉnh sửa thông tin video',
            },
            delete: {
                name: 'Xóa video',
                description: 'Xóa video khỏi hệ thống',
            },
        },
    },

    youtubeContent: {
        group: 'CONTENT_MANAGEMENT',
        isSystem: true,
        actions: {
            viewYoutubeContentManagement: {
                name: 'Truy cập quản lý video YouTube',
                description: 'Truy cập trang quản lý video YouTube',
            },
            getAll: {
                name: 'Xem danh sách video YouTube',
                description: 'Xem danh sách và thông tin video YouTube',
            },
            getById: {
                name: 'Xem chi tiết video YouTube',
                description: 'Xem chi tiết một video YouTube',
            },
            create: {
                name: 'Tạo video YouTube',
                description: 'Tạo video YouTube mới trong hệ thống',
            },
            update: {
                name: 'Cập nhật video YouTube',
                description: 'Chỉnh sửa thông tin video YouTube',
            },
            delete: {
                name: 'Xóa video YouTube',
                description: 'Xóa video YouTube khỏi hệ thống',
            },
        },
    },

    homeworkContent: {
        group: 'CONTENT_MANAGEMENT',
        isSystem: true,
        actions: {
            viewHomeworkContentManagement: {
                name: 'Truy cập quản lý bài tập',
                description: 'Truy cập trang quản lý bài tập',
            },
            getAll: {
                name: 'Xem danh sách bài tập',
                description: 'Xem danh sách và thông tin bài tập',
            },
            getById: {
                name: 'Xem chi tiết bài tập',
                description: 'Xem chi tiết một bài tập',
            },
            create: {
                name: 'Tạo bài tập',
                description: 'Tạo bài tập mới trong hệ thống',
            },
            update: {
                name: 'Cập nhật bài tập',
                description: 'Chỉnh sửa thông tin bài tập',
            },
            delete: {
                name: 'Xóa bài tập',
                description: 'Xóa bài tập khỏi hệ thống',
            },
        },
    },

    homeworkSubmit: {
        group: 'HOMEWORK_MANAGEMENT',
        isSystem: false,
        actions: {
            viewHomeworkSubmitManagement: {
                name: 'Truy cập quản lý bài nộp',
                description: 'Truy cập trang quản lý bài nộp',
            },
            viewHomeworkSubmitInHomework: {
                name: 'Truy cập quản lý bài nộp trong bài tập',
                description: 'Truy cập trang quản lý bài nộp trong bài tập',
            },
            getAll: {
                name: 'Xem danh sách bài nộp',
                description: 'Xem danh sách và thông tin bài nộp',
                isSystem: true,
            },
            getById: {
                name: 'Xem chi tiết bài nộp',
                description: 'Xem chi tiết một bài nộp',
            },
            create: {
                name: 'Nộp bài tập',
                description: 'Nộp bài tập mới',
            },
            update: {
                name: 'Cập nhật bài nộp',
                description: 'Chỉnh sửa thông tin bài nộp',
            },
            grade: {
                name: 'Chấm điểm bài nộp',
                description: 'Chấm điểm bài tập đã nộp',
                isSystem: true,
            },
            delete: {
                name: 'Xóa bài nộp',
                description: 'Xóa bài nộp khỏi hệ thống',
            },
        },
    },

    media: {
        group: 'MEDIA_MANAGEMENT',
        isSystem: true,
        actions: {
            viewMediaManagement: {
                name: 'Truy cập quản lý media',
                description: 'Truy cập trang quản lý media',
            },
            viewMyMediaManagement: {
                name: 'Truy cập media của tôi',
                description: 'Truy cập trang media của tôi',
            },
            getAll: {
                name: 'Xem danh sách media',
                description: 'Xem danh sách tất cả media files',
            },
            getMyMedia: {
                name: 'Xem media của tôi',
                description: 'Xem danh sách media files của tôi',
            },
            getById: {
                name: 'Xem chi tiết media',
                description: 'Xem thông tin chi tiết media file',
            },
            upload: {
                name: 'Upload media',
                description: 'Tải lên media file mới',
            },
            update: {
                name: 'Cập nhật media',
                description: 'Chỉnh sửa thông tin media file',
            },
            delete: {
                name: 'Xóa media',
                description: 'Xóa media file khỏi hệ thống',
            },
            getBuckets: {
                name: 'Xem danh sách buckets',
                description: 'Xem danh sách các storage buckets',
            },
            getStatisticsBuckets: {
                name: 'Xem thống kê buckets',
                description: 'Xem thống kê buckets'
            },
            download: {
                name: 'Tải xuống media',
                description: 'Tạo URL để tải xuống media file',
            },
            adminDownload: {
                name: 'Quản trị tải xuống media',
                description: 'Tạo URL để admin tải xuống media file',
            },
            view: {
                name: 'Xem media',
                description: 'Tạo URL để xem/preview media file',
            },
            adminView: {
                name: 'Quản trị xem media',
                description: 'Tạo URL để admin xem/preview media file',
            },
            folder: {
                group: 'MEDIA_FOLDER',
                actions: {
                    create: {
                        name: 'Tạo thư mục',
                        description: 'Tạo thư mục media mới',
                    },
                    view: {
                        name: 'Xem thư mục',
                        description: 'Xem danh sách và thông tin thư mục',
                    },
                    update: {
                        name: 'Cập nhật thư mục',
                        description: 'Chỉnh sửa thông tin thư mục',
                    },
                    delete: {
                        name: 'Xóa thư mục',
                        description: 'Xóa thư mục khỏi hệ thống',
                    },
                },
            },
        },
    },

    mediaUsage: {
        group: 'MEDIA_USAGE',
        isSystem: true,
        actions: {
            viewMediaUsageInMedia: {
                name: 'Truy cập quản lý media usage trong media',
                description: 'Truy cập trang quản lý media usage trong media',
            },
            getAll: {
                name: 'Xem media usage',
                description: 'Xem danh sách media usage',
            },
            getByMedia: {
                name: 'Xem media usage theo media',
                description: 'Xem danh sách media usage của một media cụ thể',
            },
            getByEntity: {
                name: 'Xem media usage theo entity',
                description: 'Xem danh sách media usage của một entity cụ thể',
            },
            attach: {
                name: 'Gắn media',
                description: 'Gắn media vào entity',
            },
            detach: {
                name: 'Gỡ media',
                description: 'Gỡ media khỏi entity',
            },
        },
    },

    tempQuestion: {
        group: 'TEMP_QUESTION',
        isSystem: true,
        actions: {
            getBySession: {
                name: 'Xem câu hỏi tạm theo session',
                description: 'Xem danh sách câu hỏi tạm thời của một session',
            },
            getById: {
                name: 'Xem câu hỏi tạm theo ID',
                description: 'Xem chi tiết câu hỏi tạm thời',
            },
            create: {
                name: 'Tạo câu hỏi tạm',
                description: 'Tạo câu hỏi tạm thời mới',
            },
            update: {
                name: 'Cập nhật câu hỏi tạm',
                description: 'Chỉnh sửa câu hỏi tạm thời',
            },
            delete: {
                name: 'Xóa câu hỏi tạm',
                description: 'Xóa câu hỏi tạm thời',
            },
        },
    },

    tempSection: {
        group: 'TEMP_SECTION',
        isSystem: true,
        actions: {
            getByExam: {
                name: 'Xem section tạm theo exam',
                description: 'Xem danh sách section tạm thời của một exam',
            },
            getById: {
                name: 'Xem section tạm theo ID',
                description: 'Xem chi tiết section tạm thời',
            },
            create: {
                name: 'Tạo section tạm',
                description: 'Tạo section tạm thời mới',
            },
            update: {
                name: 'Cập nhật section tạm',
                description: 'Chỉnh sửa section tạm thời',
            },
            delete: {
                name: 'Xóa section tạm',
                description: 'Xóa section tạm thời',
            },
        },
    },

    tempStatement: {
        group: 'TEMP_STATEMENT',
        isSystem: true,
        actions: {
            create: {
                name: 'Tạo đáp án tạm',
                description: 'Tạo đáp án tạm thời mới cho câu hỏi',
            },
            update: {
                name: 'Cập nhật đáp án tạm',
                description: 'Chỉnh sửa đáp án tạm thời',
            },
            delete: {
                name: 'Xóa đáp án tạm',
                description: 'Xóa đáp án tạm thời',
            },
        },
    },

    question: {
        group: 'QUESTION',
        isSystem: true,
        actions: {
            getAll: {
                name: 'Xem danh sách câu hỏi',
                description: 'Xem danh sách tất cả câu hỏi',
            },
            getById: {
                name: 'Xem câu hỏi theo ID',
                description: 'Xem chi tiết câu hỏi',
            },
            create: {
                name: 'Tạo câu hỏi',
                description: 'Tạo câu hỏi mới',
            },
            update: {
                name: 'Cập nhật câu hỏi',
                description: 'Chỉnh sửa câu hỏi',
            },
            delete: {
                name: 'Xóa câu hỏi',
                description: 'Xóa câu hỏi',
            },
        },
    },

    statement: {
        group: 'STATEMENT',
        isSystem: true,
        actions: {
            update: {
                name: 'Cập nhật đáp án',
                description: 'Chỉnh sửa đáp án',
            },
            delete: {
                name: 'Xóa đáp án',
                description: 'Xóa đáp án',
            },
        },
    },
} as const;
