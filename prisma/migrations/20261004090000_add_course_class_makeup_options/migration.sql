-- CreateTable
CREATE TABLE `course_class_makeup_options` (
    `source_class_id` INTEGER NOT NULL,
    `makeup_class_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_course_class_makeup_options_target`(`makeup_class_id`),
    PRIMARY KEY (`source_class_id`, `makeup_class_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `course_class_makeup_options` ADD CONSTRAINT `course_class_makeup_options_source_class_id_fkey` FOREIGN KEY (`source_class_id`) REFERENCES `courses_classes`(`class_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_class_makeup_options` ADD CONSTRAINT `course_class_makeup_options_makeup_class_id_fkey` FOREIGN KEY (`makeup_class_id`) REFERENCES `courses_classes`(`class_id`) ON DELETE CASCADE ON UPDATE CASCADE;
