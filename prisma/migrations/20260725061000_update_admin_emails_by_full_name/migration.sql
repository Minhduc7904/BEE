-- Cập nhật email của user có bản ghi admin, khớp chính xác cả họ đệm và tên.
-- Chạy lại an toàn: cùng một mapping luôn ghi cùng một email.
UPDATE `users`
INNER JOIN `admins`
    ON `admins`.`user_id` = `users`.`user_id`
INNER JOIN (
    SELECT 'Trịnh Khánh' AS `last_name`, 'Linh' AS `first_name`, 'trk.linh05@gmail.com' AS `email`
    UNION ALL SELECT 'Đặng Duy', 'Hùng', 'flfennik12@gmail.com'
    UNION ALL SELECT 'Phùng Quang', 'Vinh', 'quangvinh260807@gmail.com'
    UNION ALL SELECT 'Nguyễn Hải', 'Linh', 'hailinhndc@gmail.com'
    UNION ALL SELECT 'Nguyễn Đức Thành', 'Đạt', 'dat310807@gmail.com'
    UNION ALL SELECT 'Phạm Thảo', 'Linh', 'linhpham120207@gmail.com'
    UNION ALL SELECT 'Nguyễn Minh', 'Châu', 'ngminhchau228@gmail.com'
    UNION ALL SELECT 'Phùng Mai', 'Trinh', 'maitrinhh0201@gmail.com'
    UNION ALL SELECT 'Nguyễn Phương', 'Thảo', 'phuongthao4753@gmail.com'
    UNION ALL SELECT 'Dương Tuấn', 'Anh', 'tuanduongquoc53@gmail.com'
    UNION ALL SELECT 'Mai Hoàng', 'Ngân', 'hoangnganmai1108@gmail.com'
    UNION ALL SELECT 'Nguyễn Minh', 'Thư', 'gtknguyenthu@gmail.com'
    UNION ALL SELECT 'Trương Anh', 'Quân', 'aquan0168@gmail.com'
    UNION ALL SELECT 'Vũ Ngọc', 'Anh', 'khmin1601@gmail.com'
    UNION ALL SELECT 'Nguyễn Duy', 'Khánh', 'dukhanh942008@gmail.com'
    UNION ALL SELECT 'Phạm Thiên', 'Phong', 'phong1442008@gmail.com'
    UNION ALL SELECT 'Nguyễn Minh', 'Ngọc', 'nguyennngoc1103@gmail.com'
    UNION ALL SELECT 'Nguyễn Quỳnh', 'Trang', 'quynhtrang260508@gmail.com'
    UNION ALL SELECT 'Nguyễn Ngọc', 'Chi', 'nguyenngocchi2806@gmail.com'
) AS `email_updates`
    ON `email_updates`.`last_name` = `users`.`last_name`
    AND `email_updates`.`first_name` = `users`.`first_name`
SET `users`.`email` = `email_updates`.`email`;
