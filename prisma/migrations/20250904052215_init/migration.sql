-- CreateTable
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(120) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_login_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `idx_users_name`(`last_name`, `first_name`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `student_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `student_phone` VARCHAR(15) NULL,
    `parent_phone` VARCHAR(15) NULL,
    `grade` TINYINT NOT NULL,
    `school` VARCHAR(120) NULL,

    UNIQUE INDEX `students_user_id_key`(`user_id`),
    INDEX `idx_students_grade_school`(`grade`, `school`),
    PRIMARY KEY (`student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `admin_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `subject` VARCHAR(120) NULL,

    UNIQUE INDEX `admins_user_id_key`(`user_id`),
    PRIMARY KEY (`admin_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `role_id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `roles_role_name_key`(`role_name`),
    PRIMARY KEY (`role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_roles` (
    `admin_id` INTEGER NOT NULL,
    `role_id` INTEGER NOT NULL,
    `assigned_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_admin_roles_role_id`(`role_id`),
    PRIMARY KEY (`admin_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_roles` (
    `student_id` INTEGER NOT NULL,
    `role_id` INTEGER NOT NULL,
    `assigned_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_student_roles_role_id`(`role_id`),
    PRIMARY KEY (`student_id`, `role_id`)
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
CREATE TABLE `admin_audit_logs` (
    `log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NOT NULL,
    `action_key` VARCHAR(64) NOT NULL,
    `status` ENUM('SUCCESS', 'FAIL') NOT NULL DEFAULT 'SUCCESS',
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
CREATE TABLE `documents` (
    `document_id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NULL,
    `description` TEXT NULL,
    `url` VARCHAR(500) NOT NULL,
    `another_url` VARCHAR(500) NULL,
    `mime_type` VARCHAR(100) NULL,
    `subject` VARCHAR(100) NULL,
    `related_type` VARCHAR(50) NULL,
    `related_id` INTEGER NULL,
    `storage_provider` ENUM('LOCAL', 'S3', 'GCS', 'EXTERNAL') NOT NULL DEFAULT 'EXTERNAL',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_documents_related`(`related_type`, `related_id`),
    INDEX `idx_documents_created_at`(`created_at`),
    PRIMARY KEY (`document_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_images` (
    `image_id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NULL,
    `url` VARCHAR(500) NOT NULL,
    `another_url` VARCHAR(500) NULL,
    `mime_type` VARCHAR(100) NULL,
    `storage_provider` ENUM('LOCAL', 'S3', 'GCS', 'EXTERNAL') NOT NULL DEFAULT 'EXTERNAL',
    `related_type` VARCHAR(50) NULL,
    `related_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `question_images_url_key`(`url`),
    INDEX `idx_images_related`(`related_type`, `related_id`),
    INDEX `idx_images_created_at`(`created_at`),
    PRIMARY KEY (`image_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solution_images` (
    `image_id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NULL,
    `url` VARCHAR(500) NOT NULL,
    `another_url` VARCHAR(500) NULL,
    `mime_type` VARCHAR(100) NULL,
    `storage_provider` ENUM('LOCAL', 'S3', 'GCS', 'EXTERNAL') NOT NULL DEFAULT 'EXTERNAL',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `solution_images_url_key`(`url`),
    INDEX `idx_images_created_at`(`created_at`),
    PRIMARY KEY (`image_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_images` (
    `image_id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NULL,
    `url` VARCHAR(500) NOT NULL,
    `another_url` VARCHAR(500) NULL,
    `mime_type` VARCHAR(100) NULL,
    `storage_provider` ENUM('LOCAL', 'S3', 'GCS', 'EXTERNAL') NOT NULL DEFAULT 'EXTERNAL',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `media_images_url_key`(`url`),
    INDEX `idx_images_created_at`(`created_at`),
    PRIMARY KEY (`image_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `images` (
    `image_id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NULL,
    `url` VARCHAR(500) NOT NULL,
    `another_url` VARCHAR(500) NULL,
    `mime_type` VARCHAR(100) NULL,
    `storage_provider` ENUM('LOCAL', 'S3', 'GCS', 'EXTERNAL') NOT NULL DEFAULT 'EXTERNAL',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `images_url_key`(`url`),
    INDEX `idx_images_created_at`(`created_at`),
    PRIMARY KEY (`image_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exams` (
    `exam_id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `grade` TINYINT NOT NULL,
    `subject` VARCHAR(100) NOT NULL,
    `file_id` INTEGER NULL,
    `solution_file_id` INTEGER NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_exams_grade_subject`(`grade`, `subject`),
    INDEX `idx_exams_created_by`(`created_by`),
    INDEX `idx_exams_created_at`(`created_at`),
    PRIMARY KEY (`exam_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `question_id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` TEXT NOT NULL,
    `type` ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'FILL_IN_THE_BLANK', 'SHORT_ANSWER', 'ESSAY') NOT NULL,
    `image_id` INTEGER NULL,
    `correct_answer` TEXT NULL,
    `solution` TEXT NULL,
    `chapter` VARCHAR(100) NULL,
    `difficulty` ENUM('TH', 'NB', 'VD', 'VDC') NOT NULL,
    `solution_youtube_url` VARCHAR(500) NULL,
    `solution_image_id` INTEGER NULL,
    `grade` TINYINT NOT NULL,
    `subject` VARCHAR(100) NULL,
    `created_by` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_questions_subject_grade`(`subject`, `grade`),
    INDEX `idx_questions_type`(`type`),
    INDEX `idx_questions_difficulty`(`difficulty`),
    INDEX `idx_questions_created_by`(`created_by`),
    INDEX `idx_questions_created_at`(`created_at`),
    PRIMARY KEY (`question_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statements` (
    `statement_id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` TEXT NOT NULL,
    `question_id` INTEGER NOT NULL,
    `is_correct` BOOLEAN NOT NULL,
    `order` INTEGER NULL,
    `difficulty` ENUM('TH', 'NB', 'VD', 'VDC') NULL,
    `image_id` INTEGER NULL,
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
    `order` INTEGER NOT NULL,
    `points` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_question_exams_exam_id`(`exam_id`),
    INDEX `idx_question_exams_question_id`(`question_id`),
    PRIMARY KEY (`question_id`, `exam_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `competitions` (
    `competition_id` INTEGER NOT NULL AUTO_INCREMENT,
    `exam_id` INTEGER NULL,
    `title` VARCHAR(255) NOT NULL,
    `subtitle` VARCHAR(255) NULL,
    `start_date` TIMESTAMP(0) NOT NULL,
    `end_date` TIMESTAMP(0) NOT NULL,
    `policies` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_competitions_exam_id`(`exam_id`),
    INDEX `idx_competitions_date_range`(`start_date`, `end_date`),
    INDEX `idx_competitions_created_by`(`created_by`),
    INDEX `idx_competitions_created_at`(`created_at`),
    PRIMARY KEY (`competition_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_items` (
    `learning_item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('HOMEWORK', 'DOCUMENT', 'YOUTUBE', 'EXERCISE') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `document_id` INTEGER NULL,
    `competition_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_learning_items_type`(`type`),
    INDEX `idx_learning_items_created_at`(`created_at`),
    PRIMARY KEY (`learning_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `course_id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `subtitle` VARCHAR(255) NULL,
    `thumb_image_id` INTEGER NULL,
    `academic_year` VARCHAR(9) NULL,
    `grade` VARCHAR(10) NULL,
    `subject` VARCHAR(50) NULL,
    `price_cents` INTEGER NOT NULL DEFAULT 0,
    `compare_at_cents` INTEGER NULL,
    `visibility` ENUM('DRAFT', 'PRIVATE', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `teacher_id` INTEGER NULL,
    `is_updatable` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_courses_visibility`(`visibility`),
    INDEX `idx_courses_grade_subject`(`grade`, `subject`),
    INDEX `idx_courses_teacher_id`(`teacher_id`),
    INDEX `idx_courses_created_at`(`created_at`),
    PRIMARY KEY (`course_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses_schedules` (
    `schedule_id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NOT NULL,
    `day_of_week` TINYINT NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `room` VARCHAR(100) NULL,

    INDEX `idx_course_schedules_course_id`(`course_id`),
    UNIQUE INDEX `unique_course_schedule`(`course_id`, `day_of_week`, `start_time`),
    PRIMARY KEY (`schedule_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lessons` (
    `lesson_id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `teacher_id` INTEGER NULL,
    `scheduled_at` DATETIME NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_lessons_course_id`(`course_id`),
    INDEX `idx_lessons_teacher_id`(`teacher_id`),
    INDEX `idx_lessons_scheduled_at`(`scheduled_at`),
    INDEX `idx_lessons_created_at`(`created_at`),
    PRIMARY KEY (`lesson_id`)
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

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admins` ADD CONSTRAINT `admins_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_roles` ADD CONSTRAINT `admin_roles_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`admin_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_roles` ADD CONSTRAINT `admin_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_roles` ADD CONSTRAINT `student_roles_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_roles` ADD CONSTRAINT `student_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_refresh_tokens` ADD CONSTRAINT `user_refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_refresh_tokens` ADD CONSTRAINT `user_refresh_tokens_replaced_by_token_fkey` FOREIGN KEY (`replaced_by_token`) REFERENCES `user_refresh_tokens`(`token_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_audit_logs` ADD CONSTRAINT `admin_audit_logs_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`admin_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_images` ADD CONSTRAINT `question_images_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solution_images` ADD CONSTRAINT `solution_images_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_images` ADD CONSTRAINT `media_images_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `admins`(`admin_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `statements` ADD CONSTRAINT `statements_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions_exams` ADD CONSTRAINT `questions_exams_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions_exams` ADD CONSTRAINT `questions_exams_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competitions` ADD CONSTRAINT `competitions_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competitions` ADD CONSTRAINT `competitions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `admins`(`admin_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_items` ADD CONSTRAINT `learning_items_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`document_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_items` ADD CONSTRAINT `learning_items_competition_id_fkey` FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`competition_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses_schedules` ADD CONSTRAINT `courses_schedules_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_learning_items` ADD CONSTRAINT `lesson_learning_items_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`lesson_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_learning_items` ADD CONSTRAINT `lesson_learning_items_learning_item_id_fkey` FOREIGN KEY (`learning_item_id`) REFERENCES `learning_items`(`learning_item_id`) ON DELETE CASCADE ON UPDATE CASCADE;
