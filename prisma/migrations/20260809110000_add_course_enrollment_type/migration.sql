-- Enrollment cũ đều là enrollment do các luồng hiện hữu/admin tạo thủ công.
-- DEFAULT điền MANUAL cho toàn bộ row hiện có khi thêm cột NOT NULL.
ALTER TABLE `courses_enrollments`
  ADD COLUMN `type` ENUM('MANUAL', 'ONLINE_PURCHASE') NOT NULL DEFAULT 'MANUAL' AFTER `status`;

CREATE INDEX `idx_course_enrollments_type_enrolled_at`
  ON `courses_enrollments`(`type`, `enrolled_at`);
