-- CreateTable
CREATE TABLE `parents` (
    `parent_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `phone` VARCHAR(15) NOT NULL,

    UNIQUE INDEX `parents_user_id_key`(`user_id`),
    UNIQUE INDEX `parents_phone_key`(`phone`),
    PRIMARY KEY (`parent_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parents_students` (
    `parent_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,

    INDEX `idx_parent_students_student_id`(`student_id`),
    PRIMARY KEY (`parent_id`, `student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_students_parent_phone` ON `students`(`parent_phone`);

-- AddForeignKey
ALTER TABLE `parents` ADD CONSTRAINT `parents_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parents_students` ADD CONSTRAINT `parents_students_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `parents`(`parent_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parents_students` ADD CONSTRAINT `parents_students_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE ON UPDATE CASCADE;
