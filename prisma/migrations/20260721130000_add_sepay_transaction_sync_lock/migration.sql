-- Liên kết idempotent transaction UUID từ SePay API v2 với giao dịch đã nhận qua webhook.
ALTER TABLE `bank_transfer_transactions`
  ADD COLUMN `sepay_v2_transaction_id` CHAR(36) NULL,
  ADD UNIQUE INDEX `uq_bank_transfer_transactions_sepay_v2_id`(`sepay_v2_transaction_id`),
  ADD INDEX `idx_bank_transfer_transactions_provider_reference_match`(`provider`, `reference`, `amount`, `receiving_account_number`);

-- Lease độc quyền cho từng background job, dùng chung giữa API thủ công và scheduler.
CREATE TABLE `background_job_locks` (
  `background_job_id` INTEGER NOT NULL,
  `lock_token` CHAR(36) NOT NULL,
  `worker_id` VARCHAR(100) NOT NULL,
  `locked_at` DATETIME(0) NOT NULL,
  `lease_expires_at` DATETIME(0) NOT NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` DATETIME(0) NOT NULL,

  INDEX `idx_background_job_locks_lease`(`lease_expires_at`),
  PRIMARY KEY (`background_job_id`),
  CONSTRAINT `background_job_locks_background_job_id_fkey`
    FOREIGN KEY (`background_job_id`) REFERENCES `background_jobs`(`background_job_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
