-- Thay cấu hình lớp học bù theo từng lớp bằng nhóm các lớp học bù cho nhau (bảng chỉ chứa nhóm và các class_id).
-- Tính năng chưa có dữ liệu nên bảng cũ được xóa, không backfill.

-- DropForeignKey
ALTER TABLE `course_class_makeup_options` DROP FOREIGN KEY `course_class_makeup_options_source_class_id_fkey`;

-- DropForeignKey
ALTER TABLE `course_class_makeup_options` DROP FOREIGN KEY `course_class_makeup_options_makeup_class_id_fkey`;

-- DropTable
DROP TABLE `course_class_makeup_options`;

-- CreateTable
CREATE TABLE `course_class_makeup_groups` (
    `makeup_group_id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`makeup_group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_class_makeup_group_members` (
    `class_id` INTEGER NOT NULL,
    `makeup_group_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_course_class_makeup_group_members_group_id`(`makeup_group_id`),
    PRIMARY KEY (`class_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `course_class_makeup_group_members` ADD CONSTRAINT `course_class_makeup_group_members_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `courses_classes`(`class_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_class_makeup_group_members` ADD CONSTRAINT `course_class_makeup_group_members_makeup_group_id_fkey` FOREIGN KEY (`makeup_group_id`) REFERENCES `course_class_makeup_groups`(`makeup_group_id`) ON DELETE CASCADE ON UPDATE CASCADE;

