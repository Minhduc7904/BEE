-- Thêm loại notification kết quả/điểm thi; giữ nguyên toàn bộ giá trị và dữ liệu hiện có.
ALTER TABLE `notifications`
  MODIFY `type` ENUM(
    'SYSTEM',
    'COURSE',
    'LESSON',
    'ATTENDANCE',
    'TUITION',
    'MESSAGE',
    'RESULT',
    'OTHER'
  ) NOT NULL DEFAULT 'SYSTEM';

-- Đồng bộ payload của notification job với bảng notifications đích.
ALTER TABLE `notification_dispatch_jobs`
  MODIFY `type` ENUM(
    'SYSTEM',
    'COURSE',
    'LESSON',
    'ATTENDANCE',
    'TUITION',
    'MESSAGE',
    'RESULT',
    'OTHER'
  ) NOT NULL DEFAULT 'SYSTEM';
