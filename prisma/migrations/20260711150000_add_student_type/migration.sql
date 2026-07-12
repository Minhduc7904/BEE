ALTER TABLE `students`
  ADD COLUMN `student_type` ENUM('OFFLINE', 'ONLINE') NOT NULL DEFAULT 'OFFLINE' AFTER `high_school_graduation_year`;

CREATE INDEX `idx_students_student_type` ON `students`(`student_type`);
