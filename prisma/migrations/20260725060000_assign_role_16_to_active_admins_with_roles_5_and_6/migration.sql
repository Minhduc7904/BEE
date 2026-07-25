-- Gán role 16 cho admin đang hoạt động có đồng thời role 5 và role 6 còn hiệu lực.
-- Chỉ chạy khi cả role 5, 6 và 16 đều tồn tại; khóa chính (user_id, role_id) giúp migration idempotent.
INSERT INTO `user_roles` (
    `user_id`,
    `role_id`,
    `assigned_at`,
    `expires_at`,
    `assigned_by`,
    `is_active`
)
SELECT
    `admins`.`user_id`,
    16,
    CURRENT_TIMESTAMP(0),
    NULL,
    NULL,
    TRUE
FROM `admins`
INNER JOIN `users`
    ON `users`.`user_id` = `admins`.`user_id`
    AND `users`.`is_active` = TRUE
INNER JOIN `user_roles` AS `role_5`
    ON `role_5`.`user_id` = `admins`.`user_id`
    AND `role_5`.`role_id` = 5
    AND `role_5`.`is_active` = TRUE
    AND (`role_5`.`expires_at` IS NULL OR `role_5`.`expires_at` > CURRENT_TIMESTAMP(0))
INNER JOIN `user_roles` AS `role_6`
    ON `role_6`.`user_id` = `admins`.`user_id`
    AND `role_6`.`role_id` = 6
    AND `role_6`.`is_active` = TRUE
    AND (`role_6`.`expires_at` IS NULL OR `role_6`.`expires_at` > CURRENT_TIMESTAMP(0))
WHERE (
    SELECT COUNT(*)
    FROM `roles`
    WHERE `role_id` IN (5, 6, 16)
) = 3
ON DUPLICATE KEY UPDATE
    `expires_at` = NULL,
    `is_active` = TRUE;
