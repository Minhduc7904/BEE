-- Chuyển thanh toán mua course sang SePay. Dữ liệu invoice cũ bị loại bỏ theo quyết định sản phẩm.
DROP TABLE `online_course_payment_attempts` CASCADE;
DROP TABLE `online_course_invoice_items` CASCADE;
DROP TABLE `online_course_invoices` CASCADE;

ALTER TABLE `payment_intents`
  MODIFY `tuition_payment_id` INTEGER NULL,
  ADD COLUMN `type` ENUM('TUITION_PAYMENT', 'COURSE_PURCHASE') NOT NULL DEFAULT 'TUITION_PAYMENT' AFTER `payment_intent_id`,
  ADD COLUMN `course_enrollment_id` INTEGER NULL AFTER `tuition_payment_id`,
  ADD UNIQUE INDEX `payment_intents_course_enrollment_id_key`(`course_enrollment_id`),
  ADD INDEX `idx_payment_intents_type_status`(`type`, `status`),
  ADD CONSTRAINT `payment_intents_course_enrollment_id_fkey`
    FOREIGN KEY (`course_enrollment_id`) REFERENCES `courses_enrollments`(`enrollment_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE `payment_intents` SET `type` = 'TUITION_PAYMENT';

ALTER TABLE `bank_transfer_transactions`
  ADD COLUMN `type` ENUM('TUITION_PAYMENT', 'COURSE_PURCHASE') NULL AFTER `raw_payload`,
  ADD INDEX `idx_bank_transfer_transactions_type_time`(`type`, `transaction_at`);

UPDATE `bank_transfer_transactions` SET `type` = 'TUITION_PAYMENT';

CREATE TABLE `course_payment_configurations` (
  `course_payment_configuration_id` INTEGER NOT NULL AUTO_INCREMENT,
  `scope_key` VARCHAR(20) NOT NULL DEFAULT 'GLOBAL',
  `receiving_bank_account_id` INTEGER NOT NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` DATETIME(0) NOT NULL,
  UNIQUE INDEX `course_payment_configurations_scope_key_key`(`scope_key`),
  UNIQUE INDEX `course_payment_configurations_receiving_bank_account_id_key`(`receiving_bank_account_id`),
  PRIMARY KEY (`course_payment_configuration_id`),
  CONSTRAINT `course_payment_configurations_receiving_bank_account_id_fkey`
    FOREIGN KEY (`receiving_bank_account_id`) REFERENCES `receiving_bank_accounts`(`receiving_bank_account_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed cấu hình course từ tài khoản manual thu học phí nếu hệ thống đã có cấu hình.
INSERT INTO `course_payment_configurations` (`scope_key`, `receiving_bank_account_id`, `created_at`, `updated_at`)
SELECT 'GLOBAL', `default_manual_receiving_bank_account_id`, NOW(), NOW()
FROM `tuition_collection_configurations`
LIMIT 1;
