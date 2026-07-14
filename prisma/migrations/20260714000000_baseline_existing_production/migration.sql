-- CreateTable
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(120) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    `date_of_birth` DATE NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_login_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,
    `is_email_verified` BOOLEAN NOT NULL DEFAULT false,
    `email_verified_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    INDEX `idx_users_name`(`last_name`, `first_name`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `notification_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('SYSTEM', 'COURSE', 'LESSON', 'ATTENDANCE', 'TUITION', 'MESSAGE', 'OTHER') NOT NULL DEFAULT 'SYSTEM',
    `level` ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR') NOT NULL DEFAULT 'INFO',
    `data` JSON NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_notifications_user_read`(`user_id`, `is_read`),
    INDEX `idx_notifications_user_created`(`user_id`, `created_at`),
    PRIMARY KEY (`notification_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `tokenHash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `is_used` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_password_reset_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_verification_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `tokenHash` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `consumedAt` DATETIME(3) NULL,

    UNIQUE INDEX `email_verification_tokens_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `student_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `student_phone` VARCHAR(15) NULL,
    `parent_phone` VARCHAR(15) NULL,
    `student_zalo_id` VARCHAR(32) NULL,
    `parent_zalo_id` VARCHAR(32) NULL,
    `grade` TINYINT NOT NULL,
    `school` VARCHAR(120) NULL,
    `high_school_graduation_year` SMALLINT NULL,
    `student_type` ENUM('OFFLINE', 'ONLINE') NOT NULL DEFAULT 'OFFLINE',
    `total_point` INTEGER NOT NULL DEFAULT 0,
    `conversation_mode` ENUM('BOT', 'HUMAN') NOT NULL DEFAULT 'BOT',
    `last_admin_reply_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `students_user_id_key`(`user_id`),
    INDEX `idx_students_grade_school`(`grade`, `school`),
    INDEX `idx_students_student_type`(`student_type`),
    UNIQUE INDEX `uq_student_studentPhone_parentPhone`(`student_phone`, `parent_phone`),
    PRIMARY KEY (`student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_point_logs` (
    `point_log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `type` ENUM('BONUS', 'PENALTY') NOT NULL,
    `points` INTEGER NOT NULL,
    `source` VARCHAR(50) NOT NULL,
    `reference_type` VARCHAR(50) NULL,
    `reference_id` INTEGER NULL,
    `note` VARCHAR(255) NULL,
    `metadata` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_student_point_logs_student_created`(`student_id`, `created_at`),
    INDEX `idx_student_point_logs_student_type`(`student_id`, `type`),
    INDEX `idx_student_point_logs_source`(`source`),
    INDEX `idx_student_point_logs_ref`(`reference_type`, `reference_id`),
    UNIQUE INDEX `uq_student_point_logs_student_source_ref`(`student_id`, `source`, `reference_type`, `reference_id`),
    PRIMARY KEY (`point_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `admin_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `subject_id` INTEGER NULL,
    `admin_zalo_oa_id` VARCHAR(32) NULL,

    UNIQUE INDEX `admins_user_id_key`(`user_id`),
    INDEX `idx_admins_subject_id`(`subject_id`),
    PRIMARY KEY (`admin_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `role_id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `is_assignable` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `roles_role_name_key`(`role_name`),
    PRIMARY KEY (`role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `permission_id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `group` VARCHAR(50) NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `permissions_code_key`(`code`),
    INDEX `idx_permissions_group`(`group`),
    PRIMARY KEY (`permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,

    INDEX `idx_role_permissions_permission`(`permission_id`),
    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `user_id` INTEGER NOT NULL,
    `role_id` INTEGER NOT NULL,
    `assigned_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `expires_at` TIMESTAMP(0) NULL,
    `assigned_by` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `idx_user_roles_role_id`(`role_id`),
    INDEX `idx_user_roles_user_active`(`user_id`, `is_active`),
    INDEX `idx_user_roles_expires`(`expires_at`),
    INDEX `idx_user_roles_assigned_by`(`assigned_by`),
    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_refresh_tokens` (
    `token_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `family_id` VARCHAR(36) NOT NULL,
    `token_hash` CHAR(60) NOT NULL,
    `expires_at` TIMESTAMP(0) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `last_used_at` TIMESTAMP(0) NULL,
    `revoked_at` TIMESTAMP(0) NULL,
    `replaced_by_token` INTEGER NULL,
    `user_agent` VARCHAR(255) NULL,
    `ip_address` VARCHAR(45) NULL,
    `device_fingerprint` VARCHAR(128) NULL,

    UNIQUE INDEX `user_refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `idx_user_tokens_user_id`(`user_id`),
    INDEX `idx_user_tokens_family_id`(`family_id`),
    INDEX `idx_user_tokens_expires_at`(`expires_at`),
    INDEX `idx_user_tokens_revoked_at`(`revoked_at`),
    PRIMARY KEY (`token_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `zalo_tokens` (
    `zalo_token_id` INTEGER NOT NULL AUTO_INCREMENT,
    `oa_id` VARCHAR(32) NOT NULL,
    `app_id` VARCHAR(32) NOT NULL,
    `access_token` TEXT NOT NULL,
    `refresh_token` TEXT NOT NULL,
    `expires_in` INTEGER NOT NULL,
    `expires_at` TIMESTAMP(0) NULL,
    `token_type` VARCHAR(50) NULL,
    `scope` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_zalo_tokens_expires_at`(`expires_at`),
    UNIQUE INDEX `uq_zalo_tokens_oa_app`(`oa_id`, `app_id`),
    PRIMARY KEY (`zalo_token_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_audit_logs` (
    `log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NOT NULL,
    `action_key` VARCHAR(64) NOT NULL,
    `status` ENUM('SUCCESS', 'FAIL', 'ROLLBACK') NOT NULL DEFAULT 'SUCCESS',
    `error_message` TEXT NULL,
    `resource_type` VARCHAR(64) NOT NULL,
    `resource_id` VARCHAR(64) NULL,
    `before_data` JSON NULL,
    `after_data` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_admin_audit_admin_created`(`admin_id`, `created_at`),
    INDEX `idx_admin_audit_resource`(`resource_type`, `resource_id`),
    INDEX `idx_admin_audit_action_created`(`action_key`, `created_at`),
    INDEX `idx_admin_audit_status`(`status`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `subject_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,

    UNIQUE INDEX `subjects_name_key`(`name`),
    UNIQUE INDEX `subjects_code_key`(`code`),
    INDEX `idx_subjects_name`(`name`),
    PRIMARY KEY (`subject_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chapters` (
    `chapter_id` INTEGER NOT NULL AUTO_INCREMENT,
    `subject_id` INTEGER NOT NULL,
    `code` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `parent_chapter_id` INTEGER NULL,
    `order_in_parent` INTEGER NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `chapters_code_key`(`code`),
    UNIQUE INDEX `chapters_slug_key`(`slug`),
    INDEX `idx_chapters_subject_id`(`subject_id`),
    INDEX `idx_chapters_parent_id`(`parent_chapter_id`),
    UNIQUE INDEX `chapters_subject_id_name_parent_chapter_id_key`(`subject_id`, `name`, `parent_chapter_id`),
    UNIQUE INDEX `chapters_subject_id_parent_chapter_id_order_in_parent_key`(`subject_id`, `parent_chapter_id`, `order_in_parent`),
    PRIMARY KEY (`chapter_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exams` (
    `exam_id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `grade` TINYINT NULL,
    `subject_id` INTEGER NULL,
    `created_by` INTEGER NOT NULL,
    `visibility` ENUM('DRAFT', 'PUBLISHED', 'PRIVATE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `solution_youtube_url` VARCHAR(500) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,
    `type_of_exam` ENUM('CK1', 'TSA', 'THPT', 'OTTHPT', 'OT', 'CK2', 'GK1', 'GK2', 'HSA', 'OTHS') NULL,

    UNIQUE INDEX `exams_slug_key`(`slug`),
    INDEX `idx_exams_grade_subject`(`grade`, `subject_id`),
    INDEX `idx_exams_subject_id`(`subject_id`),
    INDEX `idx_exams_created_by`(`created_by`),
    INDEX `idx_exams_created_at`(`created_at`),
    INDEX `idx_exams_sitemap_published`(`visibility`, `updated_at`, `slug`),
    PRIMARY KEY (`exam_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_attempts` (
    `attempt_id` INTEGER NOT NULL AUTO_INCREMENT,
    `exam_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `score` DOUBLE NULL,
    `started_at` TIMESTAMP(0) NOT NULL,
    `end_at` TIMESTAMP(0) NULL,
    `graded_at` TIMESTAMP(0) NULL,
    `status` ENUM('IN_PROGRESS', 'SUBMITTED') NOT NULL,
    `duration` INTEGER NULL,
    `points` DECIMAL(10, 2) NULL,
    `max_points` DECIMAL(10, 2) NULL,
    `question_ids` JSON NULL,
    `grader_id` INTEGER NULL,
    `feedback` TEXT NULL,

    INDEX `idx_exam_attempts_exam_id`(`exam_id`),
    INDEX `idx_exam_attempts_student_id`(`student_id`),
    INDEX `idx_exam_attempts_grader_id`(`grader_id`),
    INDEX `idx_exam_attempts_started_at`(`started_at`),
    PRIMARY KEY (`attempt_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_answers` (
    `question_answer_id` INTEGER NOT NULL AUTO_INCREMENT,
    `attempt_id` INTEGER NULL,
    `question_id` INTEGER NOT NULL,
    `answer` TEXT NULL,
    `selected_statement_ids` JSON NULL,
    `is_correct` BOOLEAN NULL,
    `points` DECIMAL(10, 2) NULL,
    `max_points` DECIMAL(10, 2) NULL,
    `time_spent_seconds` INTEGER NULL,

    INDEX `idx_question_answers_attempt_id`(`attempt_id`),
    INDEX `idx_question_answers_question_id`(`question_id`),
    PRIMARY KEY (`question_answer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sections` (
    `section_id` INTEGER NOT NULL AUTO_INCREMENT,
    `exam_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `order` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_sections_exam_id`(`exam_id`),
    UNIQUE INDEX `unique_exam_section_order`(`exam_id`, `order`),
    PRIMARY KEY (`section_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `question_id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` LONGTEXT NOT NULL,
    `searchable_content` TEXT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `type` ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY', 'TRUE_FALSE') NOT NULL,
    `correct_answer` TEXT NULL,
    `solution` TEXT NULL,
    `difficulty` ENUM('TH', 'NB', 'VD', 'VDC') NULL,
    `solution_youtube_url` VARCHAR(500) NULL,
    `grade` TINYINT NULL,
    `subject_id` INTEGER NULL,
    `points_origin` INTEGER NULL,
    `visibility` ENUM('DRAFT', 'PRIVATE', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `created_by` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `questions_slug_key`(`slug`),
    INDEX `idx_questions_subject_grade`(`subject_id`, `grade`),
    INDEX `idx_questions_subject_id`(`subject_id`),
    INDEX `idx_questions_type`(`type`),
    INDEX `idx_questions_difficulty`(`difficulty`),
    INDEX `idx_questions_created_by`(`created_by`),
    INDEX `idx_questions_created_at`(`created_at`),
    INDEX `idx_questions_grade_visibility`(`grade`, `visibility`),
    INDEX `idx_questions_sitemap_published`(`visibility`, `updated_at`, `slug`),
    FULLTEXT INDEX `ft_idx_questions_search`(`searchable_content`, `content`, `solution`, `correct_answer`),
    PRIMARY KEY (`question_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_import_sessions` (
    `session_id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('PENDING', 'PROCESSING', 'PARSED', 'REVIEWING', 'MIGRATING', 'APPROVED', 'COMPLETED', 'REJECTED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `raw_content` LONGTEXT NULL,
    `metadata` JSON NULL,
    `created_by` INTEGER NOT NULL,
    `approved_by` INTEGER NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `completed_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_exam_import_status`(`status`),
    INDEX `idx_exam_import_created_by`(`created_by`),
    INDEX `idx_exam_import_created_at`(`created_at`),
    PRIMARY KEY (`session_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `temp_exams` (
    `temp_exam_id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `grade` TINYINT NULL,
    `subject_id` INTEGER NULL,
    `type_of_exam` ENUM('CK1', 'TSA', 'THPT', 'OTTHPT', 'OT', 'CK2', 'GK1', 'GK2', 'HSA', 'OTHS') NULL,
    `visibility` ENUM('DRAFT', 'PUBLISHED', 'PRIVATE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `solution_youtube_url` VARCHAR(500) NULL,
    `metadata` JSON NULL,
    `exam_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `temp_exams_session_id_key`(`session_id`),
    UNIQUE INDEX `temp_exams_exam_id_key`(`exam_id`),
    INDEX `idx_temp_exams_session`(`session_id`),
    INDEX `idx_temp_exams_subject`(`subject_id`),
    PRIMARY KEY (`temp_exam_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `temp_sections` (
    `temp_section_id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `temp_exam_id` INTEGER NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `order` INTEGER NOT NULL,
    `metadata` JSON NULL,
    `section_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `temp_sections_section_id_key`(`section_id`),
    INDEX `idx_temp_sections_session`(`session_id`),
    INDEX `idx_temp_sections_exam`(`temp_exam_id`),
    PRIMARY KEY (`temp_section_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `temp_questions` (
    `temp_question_id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `temp_section_id` INTEGER NULL,
    `content` LONGTEXT NOT NULL,
    `type` ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY', 'TRUE_FALSE') NOT NULL,
    `correct_answer` TEXT NULL,
    `solution` TEXT NULL,
    `difficulty` ENUM('TH', 'NB', 'VD', 'VDC') NULL,
    `solution_youtube_url` VARCHAR(500) NULL,
    `grade` TINYINT NULL,
    `subject_id` INTEGER NULL,
    `points_origin` INTEGER NULL,
    `order` INTEGER NOT NULL,
    `metadata` JSON NULL,
    `question_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `temp_questions_question_id_key`(`question_id`),
    INDEX `idx_temp_questions_session`(`session_id`),
    INDEX `idx_temp_questions_section`(`temp_section_id`),
    INDEX `idx_temp_questions_subject`(`subject_id`),
    PRIMARY KEY (`temp_question_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `temp_statements` (
    `temp_statement_id` INTEGER NOT NULL AUTO_INCREMENT,
    `temp_question_id` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `is_correct` BOOLEAN NOT NULL,
    `order` INTEGER NULL,
    `difficulty` ENUM('TH', 'NB', 'VD', 'VDC') NULL,
    `metadata` JSON NULL,
    `statement_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `temp_statements_statement_id_key`(`statement_id`),
    INDEX `idx_temp_statements_question`(`temp_question_id`),
    PRIMARY KEY (`temp_statement_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `temp_questions_chapters` (
    `temp_question_id` INTEGER NOT NULL,
    `chapter_id` INTEGER NOT NULL,

    INDEX `idx_temp_question_chapters_chapter_id`(`chapter_id`),
    PRIMARY KEY (`temp_question_id`, `chapter_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions_chapters` (
    `question_id` INTEGER NOT NULL,
    `chapter_id` INTEGER NOT NULL,

    INDEX `idx_question_chapters_chapter_id`(`chapter_id`),
    PRIMARY KEY (`question_id`, `chapter_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statements` (
    `statement_id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` TEXT NOT NULL,
    `question_id` INTEGER NOT NULL,
    `is_correct` BOOLEAN NOT NULL,
    `order` INTEGER NULL,
    `difficulty` ENUM('TH', 'NB', 'VD', 'VDC') NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_statements_question_id`(`question_id`),
    INDEX `idx_statements_is_correct`(`is_correct`),
    PRIMARY KEY (`statement_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions_exams` (
    `question_id` INTEGER NOT NULL,
    `exam_id` INTEGER NOT NULL,
    `section_id` INTEGER NULL,
    `order` INTEGER NOT NULL,
    `points` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_question_exams_exam_id`(`exam_id`),
    INDEX `idx_question_exams_question_id`(`question_id`),
    INDEX `idx_question_exams_section_id`(`section_id`),
    PRIMARY KEY (`question_id`, `exam_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `competitions` (
    `competition_id` INTEGER NOT NULL AUTO_INCREMENT,
    `exam_id` INTEGER NULL,
    `title` VARCHAR(255) NOT NULL,
    `subtitle` VARCHAR(255) NULL,
    `start_date` TIMESTAMP(0) NULL,
    `end_date` TIMESTAMP(0) NULL,
    `policies` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `visibility` ENUM('DRAFT', 'PRIVATE', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `duration_minutes` INTEGER NULL,
    `max_attempts` INTEGER NULL,
    `show_result_detail` BOOLEAN NOT NULL DEFAULT false,
    `allow_leaderboard` BOOLEAN NOT NULL DEFAULT false,
    `allow_view_score` BOOLEAN NOT NULL DEFAULT true,
    `allow_view_answer` BOOLEAN NOT NULL DEFAULT false,
    `enable_anti_cheating` BOOLEAN NOT NULL DEFAULT false,
    `allow_view_solution_youtube_url` BOOLEAN NOT NULL DEFAULT false,
    `allow_view_exam_content` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_competitions_exam_id`(`exam_id`),
    INDEX `idx_competitions_date_range`(`start_date`, `end_date`),
    INDEX `idx_competitions_created_by`(`created_by`),
    INDEX `idx_competitions_created_at`(`created_at`),
    PRIMARY KEY (`competition_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `competition_submits` (
    `competition_submit_id` INTEGER NOT NULL AUTO_INCREMENT,
    `competition_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `attempt_number` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'ABANDONED') NOT NULL DEFAULT 'IN_PROGRESS',
    `started_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `submitted_at` TIMESTAMP(0) NULL,
    `graded_at` TIMESTAMP(0) NULL,
    `total_points` DECIMAL(10, 2) NULL,
    `max_points` DECIMAL(10, 2) NULL,
    `time_spent_seconds` INTEGER NULL,
    `grader_id` INTEGER NULL,
    `feedback` TEXT NULL,
    `metadata` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_competition_submits_competition`(`competition_id`),
    INDEX `idx_competition_submits_student`(`student_id`),
    INDEX `idx_competition_submits_grader_id`(`grader_id`),
    INDEX `idx_competition_submits_status`(`status`),
    INDEX `idx_competition_submits_submitted_at`(`submitted_at`),
    UNIQUE INDEX `unique_competition_student_attempt`(`competition_id`, `student_id`, `attempt_number`),
    PRIMARY KEY (`competition_submit_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `competition_answers` (
    `competition_answer_id` INTEGER NOT NULL AUTO_INCREMENT,
    `competition_submit_id` INTEGER NOT NULL,
    `question_id` INTEGER NOT NULL,
    `answer` TEXT NULL,
    `selected_statement_ids` JSON NULL,
    `is_correct` BOOLEAN NULL,
    `points` DECIMAL(10, 2) NULL,
    `max_points` DECIMAL(10, 2) NULL,
    `time_spent_seconds` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_competition_answers_submit`(`competition_submit_id`),
    INDEX `idx_competition_answers_question`(`question_id`),
    INDEX `idx_competition_answers_is_correct`(`is_correct`),
    UNIQUE INDEX `unique_submit_question`(`competition_submit_id`, `question_id`),
    PRIMARY KEY (`competition_answer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_items` (
    `learning_item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('HOMEWORK', 'DOCUMENT', 'YOUTUBE', 'VIDEO') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_learning_items_type`(`type`),
    INDEX `idx_learning_items_created_at`(`created_at`),
    PRIMARY KEY (`learning_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `homework_contents` (
    `homework_content_id` INTEGER NOT NULL AUTO_INCREMENT,
    `learning_item_id` INTEGER NOT NULL,
    `type` ENUM('COMPETITION', 'FILE_UPLOAD') NOT NULL DEFAULT 'COMPETITION',
    `content` TEXT NOT NULL,
    `due_date` TIMESTAMP(0) NULL,
    `competition_id` INTEGER NULL,
    `allow_late_submit` BOOLEAN NOT NULL DEFAULT false,
    `update_points_on_late_submit` BOOLEAN NOT NULL DEFAULT false,
    `update_points_on_re_submit` BOOLEAN NOT NULL DEFAULT false,
    `update_max_points` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_homework_contents_learning_item_id`(`learning_item_id`),
    PRIMARY KEY (`homework_content_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `homework_submits` (
    `homework_submit_id` INTEGER NOT NULL AUTO_INCREMENT,
    `homework_content_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `competition_submit_id` INTEGER NULL,
    `submit_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `content` TEXT NOT NULL,
    `points` DOUBLE NULL,
    `graded_at` TIMESTAMP(0) NULL,
    `grader_id` INTEGER NULL,
    `feedback` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `homework_submits_competition_submit_id_key`(`competition_submit_id`),
    INDEX `idx_homework_submits_student_id`(`student_id`),
    INDEX `idx_homework_submits_competition_submit_id`(`competition_submit_id`),
    UNIQUE INDEX `unique_homework_submit`(`homework_content_id`, `student_id`),
    PRIMARY KEY (`homework_submit_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_contents` (
    `document_content_id` INTEGER NOT NULL AUTO_INCREMENT,
    `learning_item_id` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `order_in_document` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_document_contents_learning_item_id`(`learning_item_id`),
    PRIMARY KEY (`document_content_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `youtube_contents` (
    `youtube_content_id` INTEGER NOT NULL AUTO_INCREMENT,
    `learning_item_id` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `youtube_url` VARCHAR(500) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_youtube_contents_learning_item_id`(`learning_item_id`),
    PRIMARY KEY (`youtube_content_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `video_contents` (
    `video_content_id` INTEGER NOT NULL AUTO_INCREMENT,
    `learning_item_id` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_video_contents_learning_item_id`(`learning_item_id`),
    PRIMARY KEY (`video_content_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students_learning_items` (
    `student_id` INTEGER NOT NULL,
    `learning_item_id` INTEGER NOT NULL,
    `is_learned` BOOLEAN NOT NULL DEFAULT false,
    `learned_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_student_learning_items_learning_item_id`(`learning_item_id`),
    PRIMARY KEY (`student_id`, `learning_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_assistants` (
    `course_assistant_id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NOT NULL,
    `admin_id` INTEGER NOT NULL,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `course_assistants_course_id_idx`(`course_id`),
    INDEX `course_assistants_admin_id_idx`(`admin_id`),
    UNIQUE INDEX `course_assistants_course_id_admin_id_key`(`course_id`, `admin_id`),
    PRIMARY KEY (`course_assistant_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `course_id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `subtitle` VARCHAR(255) NULL,
    `academic_year` VARCHAR(9) NULL,
    `grade` INTEGER NULL,
    `subject_id` INTEGER NULL,
    `description` TEXT NULL,
    `price_vnd` INTEGER NOT NULL DEFAULT 0,
    `compare_at_vnd` INTEGER NULL,
    `visibility` ENUM('DRAFT', 'PRIVATE', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `is_ended` BOOLEAN NOT NULL DEFAULT false,
    `teacher_id` INTEGER NULL,
    `course_type` ENUM('ONLINE', 'OFFLINE', 'ALL') NOT NULL DEFAULT 'OFFLINE',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `courses_code_key`(`code`),
    INDEX `idx_courses_visibility`(`visibility`),
    INDEX `idx_courses_grade_subject`(`grade`, `subject_id`),
    INDEX `idx_courses_subject_id`(`subject_id`),
    INDEX `idx_courses_teacher_id`(`teacher_id`),
    INDEX `idx_courses_course_type`(`course_type`),
    INDEX `idx_courses_created_at`(`created_at`),
    INDEX `idx_courses_sitemap_online`(`visibility`, `course_type`, `updated_at`, `code`),
    UNIQUE INDEX `unique_course_code`(`code`),
    PRIMARY KEY (`course_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses_classes` (
    `class_id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NOT NULL,
    `class_name` VARCHAR(100) NOT NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `weekly_schedule` VARCHAR(255) NULL,
    `room` VARCHAR(100) NULL,
    `instructorId` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_course_classes_course_id`(`course_id`),
    PRIMARY KEY (`class_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_sessions` (
    `session_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `makeup_note` TEXT NULL,
    `class_id` INTEGER NOT NULL,
    `homework_id` INTEGER NULL,
    `session_date` DATE NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,

    INDEX `idx_class_sessions_class_id`(`class_id`),
    INDEX `idx_class_sessions_homework_id`(`homework_id`),
    INDEX `idx_class_sessions_date`(`session_date`),
    PRIMARY KEY (`session_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classes_students` (
    `class_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,

    INDEX `idx_class_students_student_id`(`student_id`),
    PRIMARY KEY (`class_id`, `student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses_enrollments` (
    `enrollment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `enrolled_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'BLOCKED_UNPAID', 'TRIAL') NOT NULL,
    `is_paid_full` BOOLEAN NOT NULL DEFAULT false,

    INDEX `idx_course_enrollments_student_id`(`student_id`),
    INDEX `idx_course_enrollments_enrolled_at`(`enrolled_at`),
    UNIQUE INDEX `unique_course_enrollment`(`course_id`, `student_id`),
    PRIMARY KEY (`enrollment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `online_course_invoices` (
    `invoice_id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_code` VARCHAR(50) NOT NULL,
    `buyer_user_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `status` ENUM('PENDING_PAYMENT', 'PAID', 'PAYMENT_FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `currency` VARCHAR(3) NOT NULL DEFAULT 'VND',
    `subtotal_amount` INTEGER NOT NULL DEFAULT 0,
    `discount_amount` INTEGER NOT NULL DEFAULT 0,
    `total_amount` INTEGER NOT NULL DEFAULT 0,
    `paid_amount` INTEGER NOT NULL DEFAULT 0,
    `refunded_amount` INTEGER NOT NULL DEFAULT 0,
    `payment_provider` ENUM('VNPAY', 'MOMO', 'ZALOPAY', 'PAYOS', 'STRIPE', 'BANK_TRANSFER', 'OTHER') NULL,
    `provider_order_id` VARCHAR(120) NULL,
    `checkout_url` TEXT NULL,
    `qr_code_url` TEXT NULL,
    `expires_at` TIMESTAMP(0) NULL,
    `paid_at` TIMESTAMP(0) NULL,
    `canceled_at` TIMESTAMP(0) NULL,
    `refunded_at` TIMESTAMP(0) NULL,
    `cancel_reason` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `metadata` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `online_course_invoices_invoice_code_key`(`invoice_code`),
    INDEX `idx_online_course_invoices_buyer_status`(`buyer_user_id`, `status`),
    INDEX `idx_online_course_invoices_student_status`(`student_id`, `status`),
    INDEX `idx_online_course_invoices_status_created`(`status`, `created_at`),
    INDEX `idx_online_course_invoices_provider_order`(`provider_order_id`),
    PRIMARY KEY (`invoice_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `online_course_invoice_items` (
    `invoice_item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_id` INTEGER NOT NULL,
    `course_id` INTEGER NULL,
    `enrollment_id` INTEGER NULL,
    `course_code` VARCHAR(50) NULL,
    `course_title` VARCHAR(200) NOT NULL,
    `unit_price_amount` INTEGER NOT NULL DEFAULT 0,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `discount_amount` INTEGER NOT NULL DEFAULT 0,
    `total_amount` INTEGER NOT NULL DEFAULT 0,
    `metadata` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_online_course_invoice_items_invoice`(`invoice_id`),
    INDEX `idx_online_course_invoice_items_course`(`course_id`),
    INDEX `idx_online_course_invoice_items_enrollment`(`enrollment_id`),
    PRIMARY KEY (`invoice_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `online_course_payment_attempts` (
    `attempt_id` INTEGER NOT NULL AUTO_INCREMENT,
    `attempt_code` VARCHAR(80) NOT NULL,
    `invoice_id` INTEGER NOT NULL,
    `provider` ENUM('VNPAY', 'MOMO', 'ZALOPAY', 'PAYOS', 'STRIPE', 'BANK_TRANSFER', 'OTHER') NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'VND',
    `qr_content` TEXT NULL,
    `provider_order_id` VARCHAR(120) NOT NULL,
    `provider_transaction_id` VARCHAR(120) NULL,
    `provider_response_code` VARCHAR(50) NULL,
    `provider_message` VARCHAR(255) NULL,
    `provider_bank_code` VARCHAR(50) NULL,
    `provider_bank_tran_no` VARCHAR(120) NULL,
    `provider_card_type` VARCHAR(50) NULL,
    `provider_pay_date` VARCHAR(14) NULL,
    `checkout_url` TEXT NULL,
    `qr_code_url` TEXT NULL,
    `request_payload` JSON NULL,
    `response_payload` JSON NULL,
    `callback_payload` JSON NULL,
    `paid_at` TIMESTAMP(0) NULL,
    `failed_at` TIMESTAMP(0) NULL,
    `canceled_at` TIMESTAMP(0) NULL,
    `expired_at` TIMESTAMP(0) NULL,
    `cancel_reason` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `online_course_payment_attempts_attempt_code_key`(`attempt_code`),
    INDEX `idx_online_payment_attempts_invoice_status`(`invoice_id`, `status`),
    INDEX `idx_online_payment_attempts_provider_txn`(`provider_transaction_id`),
    UNIQUE INDEX `uq_online_payment_attempts_provider_order`(`provider`, `provider_order_id`),
    PRIMARY KEY (`attempt_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendances` (
    `attendance_id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LATE', 'MAKEUP') NOT NULL,
    `marked_at` TIMESTAMP(0) NOT NULL,
    `notes` TEXT NULL,
    `updated_at` TIMESTAMP(0) NOT NULL,
    `marker` INTEGER NULL,
    `parent_notified` BOOLEAN NOT NULL DEFAULT false,

    INDEX `idx_attendances_student_id`(`student_id`),
    INDEX `idx_attendances_marked_at`(`marked_at`),
    UNIQUE INDEX `unique_attendance_record`(`session_id`, `student_id`),
    PRIMARY KEY (`attendance_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lessons` (
    `lesson_id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `visibility` ENUM('DRAFT', 'PRIVATE', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `order_in_course` INTEGER NOT NULL,
    `teacher_id` INTEGER NULL,
    `allow_trial` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_lessons_course_id`(`course_id`),
    INDEX `idx_lessons_teacher_id`(`teacher_id`),
    INDEX `idx_lessons_created_at`(`created_at`),
    PRIMARY KEY (`lesson_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lessons_chapters` (
    `lesson_id` INTEGER NOT NULL,
    `chapter_id` INTEGER NOT NULL,

    INDEX `idx_lesson_chapters_chapter_id`(`chapter_id`),
    PRIMARY KEY (`lesson_id`, `chapter_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_class_lessons` (
    `class_id` INTEGER NOT NULL,
    `lesson_id` INTEGER NOT NULL,
    `display_order` INTEGER NULL,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `available_from` TIMESTAMP(0) NULL,
    `available_until` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_course_class_lessons_lesson_id`(`lesson_id`),
    INDEX `idx_course_class_lessons_class_visible`(`class_id`, `is_visible`),
    PRIMARY KEY (`class_id`, `lesson_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson_learning_items` (
    `lesson_id` INTEGER NOT NULL,
    `learning_item_id` INTEGER NOT NULL,
    `order` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_lesson_learning_items_lesson`(`lesson_id`),
    INDEX `idx_lesson_learning_items_learning_item`(`learning_item_id`),
    PRIMARY KEY (`lesson_id`, `learning_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_folders` (
    `folder_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `parent_id` INTEGER NULL,
    `created_by` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_media_folders_parent`(`parent_id`),
    INDEX `idx_media_folders_created_by`(`created_by`),
    UNIQUE INDEX `uq_media_folders_parent_slug`(`parent_id`, `slug`),
    PRIMARY KEY (`folder_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media` (
    `media_id` INTEGER NOT NULL AUTO_INCREMENT,
    `file_name` VARCHAR(255) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `file_size` BIGINT NOT NULL,
    `type` ENUM('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER') NOT NULL,
    `status` ENUM('UPLOADING', 'READY', 'FAILED', 'DELETED') NOT NULL DEFAULT 'UPLOADING',
    `bucket_name` VARCHAR(100) NOT NULL,
    `object_key` VARCHAR(500) NOT NULL,
    `public_url` VARCHAR(1000) NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `duration` INTEGER NULL,
    `folder_id` INTEGER NULL,
    `parent_id` INTEGER NULL,
    `description` TEXT NULL,
    `alt` VARCHAR(255) NULL,
    `raw_content` LONGTEXT NULL,
    `uploaded_by` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_media_type`(`type`),
    INDEX `idx_media_status`(`status`),
    INDEX `idx_media_folder`(`folder_id`),
    INDEX `idx_media_parent`(`parent_id`),
    INDEX `idx_media_uploaded_by`(`uploaded_by`),
    INDEX `idx_media_created_at`(`created_at`),
    INDEX `idx_media_mime_type`(`mime_type`),
    UNIQUE INDEX `unique_media_location`(`bucket_name`, `object_key`),
    PRIMARY KEY (`media_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_usages` (
    `usage_id` INTEGER NOT NULL AUTO_INCREMENT,
    `media_id` INTEGER NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` INTEGER NOT NULL,
    `field_name` VARCHAR(100) NULL,
    `used_by` INTEGER NULL,
    `visibility` ENUM('PUBLIC', 'PRIVATE', 'PROTECTED') NOT NULL DEFAULT 'PRIVATE',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_media_usages_media`(`media_id`),
    INDEX `idx_media_usages_entity`(`entity_type`, `entity_id`),
    INDEX `idx_media_usages_used_by`(`used_by`),
    UNIQUE INDEX `unique_media_usage`(`media_id`, `entity_type`, `entity_id`, `field_name`),
    PRIMARY KEY (`usage_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `document_id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `short_description` VARCHAR(500) NULL,
    `content` LONGTEXT NULL,
    `source_name` VARCHAR(255) NULL,
    `source_url` VARCHAR(1000) NULL,
    `target_keyword` VARCHAR(255) NULL,
    `keyword_text` TEXT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` VARCHAR(500) NULL,
    `og_title` VARCHAR(255) NULL,
    `og_description` VARCHAR(500) NULL,
    `search_intent` VARCHAR(100) NULL,
    `seo_score` TINYINT NULL,
    `visibility` ENUM('DRAFT', 'PRIVATE', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `download_count` INTEGER NOT NULL DEFAULT 0,
    `reading_time` INTEGER NULL,
    `created_by` INTEGER NULL,
    `updated_by` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `documents_slug_key`(`slug`),
    INDEX `idx_documents_visibility`(`visibility`),
    INDEX `idx_documents_target_keyword`(`target_keyword`),
    INDEX `idx_documents_featured_visibility`(`is_featured`, `visibility`),
    INDEX `idx_documents_created_by`(`created_by`),
    INDEX `idx_documents_updated_by`(`updated_by`),
    INDEX `idx_documents_sitemap_published`(`visibility`, `updated_at`, `slug`),
    FULLTEXT INDEX `ft_documents_seo`(`title`, `short_description`, `content`, `target_keyword`, `keyword_text`, `meta_title`, `meta_description`),
    PRIMARY KEY (`document_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_profiles` (
    `teacher_profile_id` INTEGER NOT NULL AUTO_INCREMENT,
    `display_name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `headline` VARCHAR(255) NULL,
    `short_description` VARCHAR(500) NULL,
    `bio` LONGTEXT NULL,
    `expertise` TEXT NULL,
    `teaching_subjects` TEXT NULL,
    `grade_levels` VARCHAR(255) NULL,
    `teaching_formats` VARCHAR(255) NULL,
    `teaching_methods` TEXT NULL,
    `years_experience` SMALLINT NULL,
    `education` TEXT NULL,
    `certifications` TEXT NULL,
    `achievements` TEXT NULL,
    `teaching_area` VARCHAR(255) NULL,
    `workplace` VARCHAR(255) NULL,
    `contact_email` VARCHAR(120) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `contact_zalo` VARCHAR(32) NULL,
    `contact_facebook` VARCHAR(255) NULL,
    `contact_website` VARCHAR(255) NULL,
    `contact_address` VARCHAR(500) NULL,
    `booking_url` VARCHAR(1000) NULL,
    `cta_label` VARCHAR(120) NULL,
    `cta_url` VARCHAR(1000) NULL,
    `target_keyword` VARCHAR(255) NULL,
    `keyword_text` TEXT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` VARCHAR(500) NULL,
    `og_title` VARCHAR(255) NULL,
    `og_description` VARCHAR(500) NULL,
    `search_intent` VARCHAR(100) NULL,
    `seo_score` TINYINT NULL,
    `visibility` ENUM('DRAFT', 'PRIVATE', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_by` INTEGER NULL,
    `updated_by` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `teacher_profiles_slug_key`(`slug`),
    INDEX `idx_teacher_profiles_visibility`(`visibility`),
    INDEX `idx_teacher_profiles_target_keyword`(`target_keyword`),
    INDEX `idx_teacher_profiles_featured_visibility`(`is_featured`, `visibility`),
    INDEX `idx_teacher_profiles_sort_order`(`sort_order`),
    INDEX `idx_teacher_profiles_sitemap_published`(`visibility`, `updated_at`, `slug`),
    INDEX `idx_teacher_profiles_created_by`(`created_by`),
    INDEX `idx_teacher_profiles_updated_by`(`updated_by`),
    FULLTEXT INDEX `ft_teacher_profiles_seo`(`display_name`, `headline`, `short_description`, `bio`, `expertise`, `teaching_subjects`, `teaching_methods`, `target_keyword`, `keyword_text`, `meta_title`, `meta_description`),
    PRIMARY KEY (`teacher_profile_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `tag_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `type` ENUM('GRADE', 'CHAPTER', 'DOCUMENT_TYPE', 'LEVEL', 'SUBJECT', 'TOPIC', 'KEYWORD', 'OTHER') NOT NULL DEFAULT 'KEYWORD',
    `description` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `tags_name_key`(`name`),
    UNIQUE INDEX `tags_slug_key`(`slug`),
    INDEX `idx_tags_active`(`is_active`),
    INDEX `idx_tags_type`(`type`),
    PRIMARY KEY (`tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents_tags` (
    `document_id` INTEGER NOT NULL,
    `tag_id` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_document_tags_tag`(`tag_id`),
    INDEX `idx_document_tags_document_order`(`document_id`, `sort_order`),
    PRIMARY KEY (`document_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_media_slots` (
    `slot_id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `page_key` VARCHAR(100) NULL,
    `type` VARCHAR(50) NOT NULL DEFAULT 'image',
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `min_items` INTEGER NOT NULL DEFAULT 0,
    `max_items` INTEGER NULL,
    `recommended_width` INTEGER NULL,
    `recommended_height` INTEGER NULL,
    `metadata` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `seo_media_slots_code_key`(`code`),
    INDEX `idx_seo_media_slots_active`(`is_active`),
    INDEX `idx_seo_media_slots_page_key`(`page_key`),
    INDEX `idx_seo_media_slots_type`(`type`),
    PRIMARY KEY (`slot_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_media_items` (
    `item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `slot_id` INTEGER NOT NULL,
    `bucket_name` VARCHAR(100) NOT NULL,
    `object_key` VARCHAR(500) NOT NULL,
    `public_url` VARCHAR(1000) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `media_type` ENUM('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER') NOT NULL DEFAULT 'IMAGE',
    `file_size` BIGINT NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `duration` DOUBLE NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `alt` VARCHAR(255) NULL,
    `link_url` VARCHAR(1000) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_seo_media_items_slot_order`(`slot_id`, `sort_order`),
    INDEX `idx_seo_media_items_slot_media_type`(`slot_id`, `media_type`),
    INDEX `idx_seo_media_items_location`(`bucket_name`, `object_key`),
    UNIQUE INDEX `uq_seo_media_items_slot_object`(`slot_id`, `object_key`),
    PRIMARY KEY (`item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achievement_boards` (
    `achievement_board_id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `competition_name` VARCHAR(255) NOT NULL,
    `academic_year` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `short_description` VARCHAR(500) NULL,
    `target_keyword` VARCHAR(255) NULL,
    `keyword_text` TEXT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` VARCHAR(500) NULL,
    `og_title` VARCHAR(255) NULL,
    `og_description` VARCHAR(500) NULL,
    `search_intent` VARCHAR(100) NULL,
    `seo_score` INTEGER NULL,
    `visibility` ENUM('DRAFT', 'PRIVATE', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_by` INTEGER NULL,
    `updated_by` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `achievement_boards_slug_key`(`slug`),
    INDEX `idx_achievement_boards_visibility`(`visibility`),
    INDEX `idx_achievement_boards_competition`(`competition_name`),
    INDEX `idx_achievement_boards_academic_year`(`academic_year`),
    INDEX `idx_achievement_boards_featured_visibility`(`is_featured`, `visibility`),
    INDEX `idx_achievement_boards_sort_order`(`sort_order`),
    FULLTEXT INDEX `ft_achievement_boards_seo`(`title`, `competition_name`, `academic_year`, `description`, `short_description`, `target_keyword`, `keyword_text`, `meta_title`, `meta_description`),
    PRIMARY KEY (`achievement_board_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achievement_rows` (
    `achievement_row_id` INTEGER NOT NULL AUTO_INCREMENT,
    `achievement_board_id` INTEGER NOT NULL,
    `student_name` VARCHAR(255) NOT NULL,
    `school_name` VARCHAR(255) NULL,
    `grade` TINYINT NULL,
    `score` DECIMAL(10, 2) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_achievement_rows_board_order`(`achievement_board_id`, `sort_order`),
    INDEX `idx_achievement_rows_school`(`school_name`),
    INDEX `idx_achievement_rows_grade`(`grade`),
    PRIMARY KEY (`achievement_row_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news_articles` (
    `news_article_id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('NEWS', 'ANNOUNCEMENT', 'GUIDE', 'EVENT', 'LEARNING', 'COURSE_MEMORY') NOT NULL DEFAULT 'NEWS',
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `excerpt` VARCHAR(500) NULL,
    `content_json` JSON NULL,
    `content_html` LONGTEXT NULL,
    `content_text` LONGTEXT NULL,
    `author_name` VARCHAR(255) NULL,
    `published_at` TIMESTAMP(0) NULL,
    `target_keyword` VARCHAR(255) NULL,
    `keyword_text` TEXT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` VARCHAR(500) NULL,
    `og_title` VARCHAR(255) NULL,
    `og_description` VARCHAR(500) NULL,
    `canonical_url` VARCHAR(1000) NULL,
    `search_intent` VARCHAR(100) NULL,
    `seo_score` TINYINT NULL,
    `structured_data` JSON NULL,
    `visibility` ENUM('DRAFT', 'PRIVATE', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `reading_time` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_by` INTEGER NULL,
    `updated_by` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `news_articles_slug_key`(`slug`),
    INDEX `idx_news_articles_visibility_published_at`(`visibility`, `published_at`),
    INDEX `idx_news_articles_type_visibility_published_at`(`type`, `visibility`, `published_at`),
    INDEX `idx_news_articles_featured_visibility`(`is_featured`, `visibility`),
    INDEX `idx_news_articles_sort_order`(`sort_order`),
    INDEX `idx_news_articles_created_by`(`created_by`),
    INDEX `idx_news_articles_updated_by`(`updated_by`),
    INDEX `idx_news_articles_sitemap_published`(`visibility`, `updated_at`, `slug`),
    FULLTEXT INDEX `ft_news_articles_seo`(`title`, `excerpt`, `content_text`, `author_name`, `target_keyword`, `keyword_text`, `meta_title`, `meta_description`),
    PRIMARY KEY (`news_article_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tuition_payments` (
    `payment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NULL,
    `month` TINYINT NOT NULL,
    `year` SMALLINT NOT NULL,
    `student_id` INTEGER NOT NULL,
    `amount` INTEGER NULL,
    `status` ENUM('UNPAID', 'PAID') NOT NULL DEFAULT 'UNPAID',
    `paid_at` TIMESTAMP(0) NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_tuition_payments_student_id`(`student_id`),
    INDEX `idx_tuition_payments_course_id`(`course_id`),
    INDEX `idx_tuition_payments_year_month`(`year`, `month`),
    INDEX `idx_tuition_payments_status`(`status`),
    UNIQUE INDEX `tuition_payments_student_id_month_year_key`(`student_id`, `month`, `year`),
    PRIMARY KEY (`payment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_chats` (
    `chat_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `question_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_question_chats_user_question`(`user_id`, `question_id`),
    INDEX `idx_question_chats_user_created`(`user_id`, `created_at`),
    INDEX `idx_question_chats_question`(`question_id`),
    PRIMARY KEY (`chat_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_chat_messages` (
    `message_id` INTEGER NOT NULL AUTO_INCREMENT,
    `chat_id` INTEGER NOT NULL,
    `role` ENUM('USER', 'AI') NOT NULL,
    `content` LONGTEXT NOT NULL,
    `metadata` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_question_chat_messages_chat_created`(`chat_id`, `created_at`),
    PRIMARY KEY (`message_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jobs` (
    `job_id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('AI_EXAM_PARSE', 'AI_QUESTION_GENERATE', 'AI_CONTENT_GENERATE', 'AI_GRADING', 'EMAIL_SEND', 'REPORT_GENERATE', 'DATA_EXPORT', 'DATA_IMPORT') NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING') NOT NULL DEFAULT 'PENDING',
    `priority` INTEGER NOT NULL DEFAULT 0,
    `payload` JSON NULL,
    `result` JSON NULL,
    `error_message` TEXT NULL,
    `error_stack` TEXT NULL,
    `retry_count` INTEGER NOT NULL DEFAULT 0,
    `max_retries` INTEGER NOT NULL DEFAULT 3,
    `scheduled_at` TIMESTAMP(0) NULL,
    `started_at` TIMESTAMP(0) NULL,
    `completed_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,
    `created_by` INTEGER NULL,
    `metadata` JSON NULL,

    INDEX `idx_jobs_status_priority_created`(`status`, `priority`, `created_at`),
    INDEX `idx_jobs_type_status`(`type`, `status`),
    INDEX `idx_jobs_created_by`(`created_by`),
    INDEX `idx_jobs_scheduled_at`(`scheduled_at`),
    PRIMARY KEY (`job_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_verification_tokens` ADD CONSTRAINT `email_verification_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_point_logs` ADD CONSTRAINT `student_point_logs_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admins` ADD CONSTRAINT `admins_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admins` ADD CONSTRAINT `admins_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`permission_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_assigned_by_fkey` FOREIGN KEY (`assigned_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_refresh_tokens` ADD CONSTRAINT `user_refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_refresh_tokens` ADD CONSTRAINT `user_refresh_tokens_replaced_by_token_fkey` FOREIGN KEY (`replaced_by_token`) REFERENCES `user_refresh_tokens`(`token_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_audit_logs` ADD CONSTRAINT `admin_audit_logs_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`admin_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chapters` ADD CONSTRAINT `chapters_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chapters` ADD CONSTRAINT `chapters_parent_chapter_id_fkey` FOREIGN KEY (`parent_chapter_id`) REFERENCES `chapters`(`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `admins`(`admin_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_attempts` ADD CONSTRAINT `exam_attempts_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_attempts` ADD CONSTRAINT `exam_attempts_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_attempts` ADD CONSTRAINT `exam_attempts_grader_id_fkey` FOREIGN KEY (`grader_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_answers` ADD CONSTRAINT `question_answers_attempt_id_fkey` FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts`(`attempt_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_answers` ADD CONSTRAINT `question_answers_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temp_exams` ADD CONSTRAINT `temp_exams_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `exam_import_sessions`(`session_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temp_exams` ADD CONSTRAINT `temp_exams_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temp_exams` ADD CONSTRAINT `temp_exams_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temp_sections` ADD CONSTRAINT `temp_sections_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `exam_import_sessions`(`session_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temp_sections` ADD CONSTRAINT `temp_sections_temp_exam_id_fkey` FOREIGN KEY (`temp_exam_id`) REFERENCES `temp_exams`(`temp_exam_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temp_sections` ADD CONSTRAINT `temp_sections_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `sections`(`section_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temp_questions` ADD CONSTRAINT `temp_questions_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `exam_import_sessions`(`session_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temp_questions` ADD CONSTRAINT `temp_questions_temp_section_id_fkey` FOREIGN KEY (`temp_section_id`) REFERENCES `temp_sections`(`temp_section_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temp_questions` ADD CONSTRAINT `temp_questions_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temp_questions` ADD CONSTRAINT `temp_questions_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temp_statements` ADD CONSTRAINT `temp_statements_temp_question_id_fkey` FOREIGN KEY (`temp_question_id`) REFERENCES `temp_questions`(`temp_question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temp_statements` ADD CONSTRAINT `temp_statements_statement_id_fkey` FOREIGN KEY (`statement_id`) REFERENCES `statements`(`statement_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temp_questions_chapters` ADD CONSTRAINT `temp_questions_chapters_temp_question_id_fkey` FOREIGN KEY (`temp_question_id`) REFERENCES `temp_questions`(`temp_question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temp_questions_chapters` ADD CONSTRAINT `temp_questions_chapters_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions_chapters` ADD CONSTRAINT `questions_chapters_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions_chapters` ADD CONSTRAINT `questions_chapters_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `statements` ADD CONSTRAINT `statements_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions_exams` ADD CONSTRAINT `questions_exams_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions_exams` ADD CONSTRAINT `questions_exams_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions_exams` ADD CONSTRAINT `questions_exams_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `sections`(`section_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competitions` ADD CONSTRAINT `competitions_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competitions` ADD CONSTRAINT `competitions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `admins`(`admin_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competition_submits` ADD CONSTRAINT `competition_submits_competition_id_fkey` FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`competition_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competition_submits` ADD CONSTRAINT `competition_submits_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competition_submits` ADD CONSTRAINT `competition_submits_grader_id_fkey` FOREIGN KEY (`grader_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competition_answers` ADD CONSTRAINT `competition_answers_competition_submit_id_fkey` FOREIGN KEY (`competition_submit_id`) REFERENCES `competition_submits`(`competition_submit_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competition_answers` ADD CONSTRAINT `competition_answers_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_items` ADD CONSTRAINT `learning_items_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `admins`(`admin_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_contents` ADD CONSTRAINT `homework_contents_learning_item_id_fkey` FOREIGN KEY (`learning_item_id`) REFERENCES `learning_items`(`learning_item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_contents` ADD CONSTRAINT `homework_contents_competition_id_fkey` FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`competition_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_submits` ADD CONSTRAINT `homework_submits_homework_content_id_fkey` FOREIGN KEY (`homework_content_id`) REFERENCES `homework_contents`(`homework_content_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_submits` ADD CONSTRAINT `homework_submits_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_submits` ADD CONSTRAINT `homework_submits_grader_id_fkey` FOREIGN KEY (`grader_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_submits` ADD CONSTRAINT `homework_submits_competition_submit_id_fkey` FOREIGN KEY (`competition_submit_id`) REFERENCES `competition_submits`(`competition_submit_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_contents` ADD CONSTRAINT `document_contents_learning_item_id_fkey` FOREIGN KEY (`learning_item_id`) REFERENCES `learning_items`(`learning_item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `youtube_contents` ADD CONSTRAINT `youtube_contents_learning_item_id_fkey` FOREIGN KEY (`learning_item_id`) REFERENCES `learning_items`(`learning_item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `video_contents` ADD CONSTRAINT `video_contents_learning_item_id_fkey` FOREIGN KEY (`learning_item_id`) REFERENCES `learning_items`(`learning_item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students_learning_items` ADD CONSTRAINT `students_learning_items_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students_learning_items` ADD CONSTRAINT `students_learning_items_learning_item_id_fkey` FOREIGN KEY (`learning_item_id`) REFERENCES `learning_items`(`learning_item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_assistants` ADD CONSTRAINT `course_assistants_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_assistants` ADD CONSTRAINT `course_assistants_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`admin_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses_classes` ADD CONSTRAINT `courses_classes_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses_classes` ADD CONSTRAINT `courses_classes_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_sessions` ADD CONSTRAINT `class_sessions_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `courses_classes`(`class_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_sessions` ADD CONSTRAINT `class_sessions_homework_id_fkey` FOREIGN KEY (`homework_id`) REFERENCES `homework_contents`(`homework_content_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes_students` ADD CONSTRAINT `classes_students_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `courses_classes`(`class_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes_students` ADD CONSTRAINT `classes_students_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses_enrollments` ADD CONSTRAINT `courses_enrollments_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses_enrollments` ADD CONSTRAINT `courses_enrollments_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_course_invoices` ADD CONSTRAINT `online_course_invoices_buyer_user_id_fkey` FOREIGN KEY (`buyer_user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_course_invoices` ADD CONSTRAINT `online_course_invoices_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_course_invoice_items` ADD CONSTRAINT `online_course_invoice_items_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `online_course_invoices`(`invoice_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_course_invoice_items` ADD CONSTRAINT `online_course_invoice_items_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_course_invoice_items` ADD CONSTRAINT `online_course_invoice_items_enrollment_id_fkey` FOREIGN KEY (`enrollment_id`) REFERENCES `courses_enrollments`(`enrollment_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_course_payment_attempts` ADD CONSTRAINT `online_course_payment_attempts_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `online_course_invoices`(`invoice_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`session_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_marker_fkey` FOREIGN KEY (`marker`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons_chapters` ADD CONSTRAINT `lessons_chapters_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`lesson_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons_chapters` ADD CONSTRAINT `lessons_chapters_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_class_lessons` ADD CONSTRAINT `course_class_lessons_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `courses_classes`(`class_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_class_lessons` ADD CONSTRAINT `course_class_lessons_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`lesson_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_learning_items` ADD CONSTRAINT `lesson_learning_items_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`lesson_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_learning_items` ADD CONSTRAINT `lesson_learning_items_learning_item_id_fkey` FOREIGN KEY (`learning_item_id`) REFERENCES `learning_items`(`learning_item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_folders` ADD CONSTRAINT `media_folders_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `media_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_folder_id_fkey` FOREIGN KEY (`folder_id`) REFERENCES `media_folders`(`folder_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `media`(`media_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_usages` ADD CONSTRAINT `media_usages_media_id_fkey` FOREIGN KEY (`media_id`) REFERENCES `media`(`media_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_profiles` ADD CONSTRAINT `teacher_profiles_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_profiles` ADD CONSTRAINT `teacher_profiles_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents_tags` ADD CONSTRAINT `documents_tags_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`document_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents_tags` ADD CONSTRAINT `documents_tags_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`tag_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_media_items` ADD CONSTRAINT `seo_media_items_slot_id_fkey` FOREIGN KEY (`slot_id`) REFERENCES `seo_media_slots`(`slot_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `achievement_rows` ADD CONSTRAINT `achievement_rows_achievement_board_id_fkey` FOREIGN KEY (`achievement_board_id`) REFERENCES `achievement_boards`(`achievement_board_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tuition_payments` ADD CONSTRAINT `tuition_payments_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tuition_payments` ADD CONSTRAINT `tuition_payments_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_chats` ADD CONSTRAINT `question_chats_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_chats` ADD CONSTRAINT `question_chats_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_chat_messages` ADD CONSTRAINT `question_chat_messages_chat_id_fkey` FOREIGN KEY (`chat_id`) REFERENCES `question_chats`(`chat_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

