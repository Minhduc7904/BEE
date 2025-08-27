/*
  Warnings:

  - You are about to drop the `admin_refresh_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_refresh_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `admin_refresh_tokens` DROP FOREIGN KEY `admin_refresh_tokens_admin_id_fkey`;

-- DropForeignKey
ALTER TABLE `admin_refresh_tokens` DROP FOREIGN KEY `admin_refresh_tokens_replaced_by_token_fkey`;

-- DropForeignKey
ALTER TABLE `student_refresh_tokens` DROP FOREIGN KEY `student_refresh_tokens_replaced_by_token_fkey`;

-- DropForeignKey
ALTER TABLE `student_refresh_tokens` DROP FOREIGN KEY `student_refresh_tokens_student_id_fkey`;

-- DropTable
DROP TABLE `admin_refresh_tokens`;

-- DropTable
DROP TABLE `student_refresh_tokens`;

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

-- AddForeignKey
ALTER TABLE `user_refresh_tokens` ADD CONSTRAINT `user_refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_refresh_tokens` ADD CONSTRAINT `user_refresh_tokens_replaced_by_token_fkey` FOREIGN KEY (`replaced_by_token`) REFERENCES `user_refresh_tokens`(`token_id`) ON DELETE SET NULL ON UPDATE CASCADE;
