-- Lưu cặp buổi học có thể học bù cho nhau (session_makeup_registrations) và liên kết buổi vắng với buổi đã học bù.
-- Không backfill dữ liệu cũ: bảng mới rỗng, cột mới nullable nên các bản ghi điểm danh hiện có không bị ảnh hưởng.

-- AlterTable
ALTER TABLE `attendances` ADD COLUMN `makeup_by_attendance_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `session_makeup_registrations` (
    `session_makeup_registration_id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `makeup_session_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_session_makeup_registrations_makeup_session_id`(`makeup_session_id`),
    UNIQUE INDEX `uq_session_makeup_registrations_pair`(`session_id`, `makeup_session_id`),
    PRIMARY KEY (`session_makeup_registration_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_attendances_makeup_by_attendance_id` ON `attendances`(`makeup_by_attendance_id`);

-- AddForeignKey
ALTER TABLE `session_makeup_registrations` ADD CONSTRAINT `session_makeup_registrations_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`session_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_makeup_registrations` ADD CONSTRAINT `session_makeup_registrations_makeup_session_id_fkey` FOREIGN KEY (`makeup_session_id`) REFERENCES `class_sessions`(`session_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_makeup_by_attendance_id_fkey` FOREIGN KEY (`makeup_by_attendance_id`) REFERENCES `attendances`(`attendance_id`) ON DELETE SET NULL ON UPDATE CASCADE;
