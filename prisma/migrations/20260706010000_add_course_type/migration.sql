ALTER TABLE `courses`
  ADD COLUMN `course_type` ENUM('ONLINE', 'OFFLINE', 'ALL') NOT NULL DEFAULT 'OFFLINE' AFTER `teacher_id`;

CREATE INDEX `idx_courses_course_type` ON `courses`(`course_type`);
