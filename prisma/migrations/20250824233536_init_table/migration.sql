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
    `student_phone` VARCHAR(15) NOT NULL,
    `parent_phone` VARCHAR(15) NULL,
    `grade` TINYINT NOT NULL,
    `high_school` VARCHAR(120) NOT NULL,

    UNIQUE INDEX `students_user_id_key`(`user_id`),
    INDEX `idx_students_grade_school`(`grade`, `high_school`),
    PRIMARY KEY (`student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `admin_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `subject` VARCHAR(120) NOT NULL,

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
CREATE TABLE `admin_refresh_tokens` (
    `token_id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NOT NULL,
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

    UNIQUE INDEX `admin_refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `idx_admin_tokens_admin_id`(`admin_id`),
    INDEX `idx_admin_tokens_family_id`(`family_id`),
    INDEX `idx_admin_tokens_expires_at`(`expires_at`),
    INDEX `idx_admin_tokens_revoked_at`(`revoked_at`),
    PRIMARY KEY (`token_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_refresh_tokens` (
    `token_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
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

    UNIQUE INDEX `student_refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `idx_student_tokens_student_id`(`student_id`),
    INDEX `idx_student_tokens_family_id`(`family_id`),
    INDEX `idx_student_tokens_expires_at`(`expires_at`),
    INDEX `idx_student_tokens_revoked_at`(`revoked_at`),
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
ALTER TABLE `admin_refresh_tokens` ADD CONSTRAINT `admin_refresh_tokens_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`admin_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_refresh_tokens` ADD CONSTRAINT `admin_refresh_tokens_replaced_by_token_fkey` FOREIGN KEY (`replaced_by_token`) REFERENCES `admin_refresh_tokens`(`token_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_refresh_tokens` ADD CONSTRAINT `student_refresh_tokens_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_refresh_tokens` ADD CONSTRAINT `student_refresh_tokens_replaced_by_token_fkey` FOREIGN KEY (`replaced_by_token`) REFERENCES `student_refresh_tokens`(`token_id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
