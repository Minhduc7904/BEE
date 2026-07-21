-- Seed tài khoản nhận tiền Vietcombank dùng làm fallback thủ công cho thu học phí.
-- Upsert theo unique (bank_code, account_number) để không tạo bản ghi trùng khi dữ liệu đã tồn tại.
INSERT INTO `receiving_bank_accounts` (
  `bank_code`,
  `account_number`,
  `account_holder`,
  `display_name`,
  `status`,
  `sepay_bank_account_id`,
  `sepay_status`,
  `notes`,
  `created_at`,
  `updated_at`
)
VALUES (
  'VCB',
  '1058122843',
  'HKD THAY BEE',
  'Vietcombank - HKD THAY BEE',
  'ACTIVE',
  NULL,
  'UNKNOWN',
  NULL,
  CURRENT_TIMESTAMP(0),
  CURRENT_TIMESTAMP(0)
)
ON DUPLICATE KEY UPDATE
  `account_holder` = VALUES(`account_holder`),
  `display_name` = VALUES(`display_name`),
  `status` = 'ACTIVE',
  `sepay_bank_account_id` = NULL,
  `sepay_status` = 'UNKNOWN',
  `updated_at` = CURRENT_TIMESTAMP(0);

-- TuitionCollectionConfiguration là singleton.
-- Nếu chưa có thì tạo cấu hình mặc định với tài khoản Vietcombank vừa seed.
INSERT INTO `tuition_collection_configurations` (
  `collection_mode`,
  `default_manual_receiving_bank_account_id`,
  `created_at`,
  `updated_at`
)
SELECT
  'AUTOMATIC',
  `receiving_bank_account_id`,
  CURRENT_TIMESTAMP(0),
  CURRENT_TIMESTAMP(0)
FROM `receiving_bank_accounts`
WHERE `bank_code` = 'VCB'
  AND `account_number` = '1058122843'
  AND NOT EXISTS (
    SELECT 1
    FROM `tuition_collection_configurations`
  );

-- Với cấu hình đã tồn tại, chuẩn hóa bản ghi singleton đầu tiên
-- để sử dụng tài khoản Vietcombank vừa seed.
UPDATE `tuition_collection_configurations`
SET
  `default_manual_receiving_bank_account_id` = (
    SELECT `receiving_bank_account_id`
    FROM `receiving_bank_accounts`
    WHERE `bank_code` = 'VCB'
      AND `account_number` = '1058122843'
    LIMIT 1
  ),
  `updated_at` = CURRENT_TIMESTAMP(0)
WHERE `tuition_collection_configuration_id` = (
  SELECT `tuition_collection_configuration_id`
  FROM (
    SELECT `tuition_collection_configuration_id`
    FROM `tuition_collection_configurations`
    ORDER BY `tuition_collection_configuration_id` ASC
    LIMIT 1
  ) AS `singleton_configuration`
);