/*
  Warnings:

  - You are about to alter the column `scheduled_at` on the `lessons` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to drop the `admin_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_roles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `admin_roles` DROP FOREIGN KEY `admin_roles_admin_id_fkey`;

-- DropForeignKey
ALTER TABLE `admin_roles` DROP FOREIGN KEY `admin_roles_role_id_fkey`;

-- DropForeignKey
ALTER TABLE `student_roles` DROP FOREIGN KEY `student_roles_role_id_fkey`;

-- DropForeignKey
ALTER TABLE `student_roles` DROP FOREIGN KEY `student_roles_student_id_fkey`;

-- AlterTable
ALTER TABLE `lessons` MODIFY `scheduled_at` DATETIME NULL;

-- AlterTable
ALTER TABLE `roles` ADD COLUMN `is_assignable` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `max_duration_days` INTEGER NULL;

-- DropTable
DROP TABLE `admin_roles`;

-- DropTable
DROP TABLE `student_roles`;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER NOT NULL,
    `required_role_id` INTEGER NOT NULL,

    INDEX `idx_role_permissions_role`(`role_id`),
    INDEX `idx_role_permissions_required`(`required_role_id`),
    UNIQUE INDEX `role_permissions_role_id_required_role_id_key`(`role_id`, `required_role_id`),
    PRIMARY KEY (`id`)
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

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_required_role_id_fkey` FOREIGN KEY (`required_role_id`) REFERENCES `roles`(`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_assigned_by_fkey` FOREIGN KEY (`assigned_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
