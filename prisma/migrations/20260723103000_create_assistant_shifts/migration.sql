-- Create assistant shift series, individual shifts, and assignments.
CREATE TABLE `assistant_shift_series` (
    `assistant_shift_series_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `is_locked` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_assistant_shift_series_locked`(`is_locked`),
    PRIMARY KEY (`assistant_shift_series_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `assistant_shifts` (
    `assistant_shift_id` INTEGER NOT NULL AUTO_INCREMENT,
    `assistant_shift_series_id` INTEGER NOT NULL,
    `class_id` INTEGER NULL,
    `name` VARCHAR(200) NOT NULL,
    `notes` TEXT NULL,
    `start_at` TIMESTAMP(0) NOT NULL,
    `end_at` TIMESTAMP(0) NOT NULL,
    `is_locked` BOOLEAN NOT NULL DEFAULT false,
    `self_registration_open_at` TIMESTAMP(0) NULL,
    `self_registration_close_at` TIMESTAMP(0) NULL,
    `required_assistant_count` INTEGER NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_assistant_shifts_class_start_at`(`class_id`, `start_at`),
    INDEX `idx_assistant_shifts_series_start_at`(`assistant_shift_series_id`, `start_at`),
    INDEX `idx_assistant_shifts_start_at`(`start_at`),
    PRIMARY KEY (`assistant_shift_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `assistant_shift_assignments` (
    `assistant_shift_id` INTEGER NOT NULL,
    `admin_id` INTEGER NOT NULL,
    `assigned_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `attendance_status` ENUM('PENDING', 'PRESENT', 'ABSENT') NOT NULL DEFAULT 'PENDING',
    `absence_reason` TEXT NULL,
    `manager_note` TEXT NULL,
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_assistant_shift_assignments_admin_id`(`admin_id`),
    PRIMARY KEY (`assistant_shift_id`, `admin_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `assistant_shifts`
    ADD CONSTRAINT `assistant_shifts_assistant_shift_series_id_fkey`
    FOREIGN KEY (`assistant_shift_series_id`) REFERENCES `assistant_shift_series`(`assistant_shift_series_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `assistant_shifts`
    ADD CONSTRAINT `assistant_shifts_class_id_fkey`
    FOREIGN KEY (`class_id`) REFERENCES `courses_classes`(`class_id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `assistant_shift_assignments`
    ADD CONSTRAINT `assistant_shift_assignments_assistant_shift_id_fkey`
    FOREIGN KEY (`assistant_shift_id`) REFERENCES `assistant_shifts`(`assistant_shift_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `assistant_shift_assignments`
    ADD CONSTRAINT `assistant_shift_assignments_admin_id_fkey`
    FOREIGN KEY (`admin_id`) REFERENCES `admins`(`admin_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
