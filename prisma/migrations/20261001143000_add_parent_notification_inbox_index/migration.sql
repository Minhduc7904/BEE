-- AddIndex
-- Tăng tốc lọc inbox phụ huynh theo tài khoản và học sinh nguồn; không thay đổi dữ liệu hiện có.
CREATE INDEX `idx_notification_dispatch_recipients_user_student`
ON `notification_dispatch_recipients`(`user_id`, `source_student_id`);
