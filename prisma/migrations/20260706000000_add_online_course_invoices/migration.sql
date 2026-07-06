CREATE TABLE `online_course_invoices` (
  `invoice_id` INTEGER NOT NULL AUTO_INCREMENT,
  `invoice_code` VARCHAR(50) NOT NULL,
  `buyer_user_id` INTEGER NOT NULL,
  `student_id` INTEGER NOT NULL,
  `status` ENUM('PENDING_PAYMENT', 'PAID', 'PAYMENT_FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING_PAYMENT',
  `currency` VARCHAR(3) NOT NULL DEFAULT 'VND',
  `subtotal_amount` INTEGER NOT NULL DEFAULT 0,
  `discount_amount` INTEGER NOT NULL DEFAULT 0,
  `total_amount` INTEGER NOT NULL DEFAULT 0,
  `paid_amount` INTEGER NOT NULL DEFAULT 0,
  `refunded_amount` INTEGER NOT NULL DEFAULT 0,
  `payment_provider` ENUM('VNPAY', 'MOMO', 'ZALOPAY', 'PAYOS', 'STRIPE', 'BANK_TRANSFER', 'OTHER') NULL,
  `provider_order_id` VARCHAR(120) NULL,
  `checkout_url` TEXT NULL,
  `qr_code_url` TEXT NULL,
  `expires_at` TIMESTAMP(0) NULL,
  `paid_at` TIMESTAMP(0) NULL,
  `canceled_at` TIMESTAMP(0) NULL,
  `refunded_at` TIMESTAMP(0) NULL,
  `cancel_reason` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

  UNIQUE INDEX `online_course_invoices_invoice_code_key`(`invoice_code`),
  INDEX `idx_online_course_invoices_buyer_status`(`buyer_user_id`, `status`),
  INDEX `idx_online_course_invoices_student_status`(`student_id`, `status`),
  INDEX `idx_online_course_invoices_status_created`(`status`, `created_at`),
  INDEX `idx_online_course_invoices_provider_order`(`provider_order_id`),
  PRIMARY KEY (`invoice_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `online_course_invoice_items` (
  `invoice_item_id` INTEGER NOT NULL AUTO_INCREMENT,
  `invoice_id` INTEGER NOT NULL,
  `course_id` INTEGER NULL,
  `enrollment_id` INTEGER NULL,
  `course_code` VARCHAR(50) NULL,
  `course_title` VARCHAR(200) NOT NULL,
  `unit_price_amount` INTEGER NOT NULL DEFAULT 0,
  `quantity` INTEGER NOT NULL DEFAULT 1,
  `discount_amount` INTEGER NOT NULL DEFAULT 0,
  `total_amount` INTEGER NOT NULL DEFAULT 0,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

  INDEX `idx_online_course_invoice_items_invoice`(`invoice_id`),
  INDEX `idx_online_course_invoice_items_course`(`course_id`),
  INDEX `idx_online_course_invoice_items_enrollment`(`enrollment_id`),
  PRIMARY KEY (`invoice_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `online_course_payment_attempts` (
  `attempt_id` INTEGER NOT NULL AUTO_INCREMENT,
  `attempt_code` VARCHAR(80) NOT NULL,
  `invoice_id` INTEGER NOT NULL,
  `provider` ENUM('VNPAY', 'MOMO', 'ZALOPAY', 'PAYOS', 'STRIPE', 'BANK_TRANSFER', 'OTHER') NOT NULL,
  `status` ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
  `amount` INTEGER NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'VND',
  `qr_content` TEXT NULL,
  `provider_order_id` VARCHAR(120) NOT NULL,
  `provider_transaction_id` VARCHAR(120) NULL,
  `provider_response_code` VARCHAR(50) NULL,
  `provider_message` VARCHAR(255) NULL,
  `provider_bank_code` VARCHAR(50) NULL,
  `provider_bank_tran_no` VARCHAR(120) NULL,
  `provider_card_type` VARCHAR(50) NULL,
  `provider_pay_date` VARCHAR(14) NULL,
  `checkout_url` TEXT NULL,
  `qr_code_url` TEXT NULL,
  `request_payload` JSON NULL,
  `response_payload` JSON NULL,
  `callback_payload` JSON NULL,
  `paid_at` TIMESTAMP(0) NULL,
  `failed_at` TIMESTAMP(0) NULL,
  `canceled_at` TIMESTAMP(0) NULL,
  `expired_at` TIMESTAMP(0) NULL,
  `cancel_reason` VARCHAR(255) NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

  UNIQUE INDEX `online_course_payment_attempts_attempt_code_key`(`attempt_code`),
  UNIQUE INDEX `uq_online_payment_attempts_provider_order`(`provider`, `provider_order_id`),
  INDEX `idx_online_payment_attempts_invoice_status`(`invoice_id`, `status`),
  INDEX `idx_online_payment_attempts_provider_txn`(`provider_transaction_id`),
  PRIMARY KEY (`attempt_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `online_course_invoices`
  ADD CONSTRAINT `online_course_invoices_buyer_user_id_fkey`
  FOREIGN KEY (`buyer_user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `online_course_invoices`
  ADD CONSTRAINT `online_course_invoices_student_id_fkey`
  FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `online_course_invoice_items`
  ADD CONSTRAINT `online_course_invoice_items_invoice_id_fkey`
  FOREIGN KEY (`invoice_id`) REFERENCES `online_course_invoices`(`invoice_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `online_course_invoice_items`
  ADD CONSTRAINT `online_course_invoice_items_course_id_fkey`
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `online_course_invoice_items`
  ADD CONSTRAINT `online_course_invoice_items_enrollment_id_fkey`
  FOREIGN KEY (`enrollment_id`) REFERENCES `courses_enrollments`(`enrollment_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `online_course_payment_attempts`
  ADD CONSTRAINT `online_course_payment_attempts_invoice_id_fkey`
  FOREIGN KEY (`invoice_id`) REFERENCES `online_course_invoices`(`invoice_id`) ON DELETE CASCADE ON UPDATE CASCADE;
