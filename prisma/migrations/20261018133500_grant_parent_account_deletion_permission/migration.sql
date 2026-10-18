INSERT INTO `permissions` (
  `code`,
  `name`,
  `description`,
  `group`,
  `is_system`,
  `created_at`
)
VALUES (
  'user:manage-account-deletion',
  'Manage account deletion',
  'Manage account deletion (user:manage-account-deletion)',
  'USER_MANAGEMENT',
  TRUE,
  CURRENT_TIMESTAMP(0)
)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `group` = VALUES(`group`),
  `is_system` = VALUES(`is_system`);

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`role_id`, `permissions`.`permission_id`
FROM `roles`
JOIN `permissions` ON `permissions`.`code` = 'user:manage-account-deletion'
WHERE `roles`.`role_name` = 'BASIC_ADMIN';
