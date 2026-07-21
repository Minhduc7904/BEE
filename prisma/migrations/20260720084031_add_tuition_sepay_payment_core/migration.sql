-- CreateTable
CREATE TABLE `receiving_bank_accounts` (
    `receiving_bank_account_id` INTEGER NOT NULL AUTO_INCREMENT,
    `bank_code` VARCHAR(30) NOT NULL,
    `account_number` VARCHAR(50) NOT NULL,
    `account_holder` VARCHAR(150) NOT NULL,
    `display_name` VARCHAR(150) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `sepay_bank_account_id` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_receiving_bank_accounts_status`(`status`),
    UNIQUE INDEX `uq_receiving_bank_accounts_bank_account`(`bank_code`, `account_number`),
    PRIMARY KEY (`receiving_bank_account_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tuition_grade_receiving_bank_accounts` (
    `tuition_grade_receiving_bank_account_id` INTEGER NOT NULL AUTO_INCREMENT,
    `grade` TINYINT NOT NULL,
    `receiving_bank_account_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `tuition_grade_receiving_bank_accounts_grade_key`(`grade`),
    INDEX `idx_tuition_grade_bank_account`(`receiving_bank_account_id`),
    PRIMARY KEY (`tuition_grade_receiving_bank_account_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tuition_collection_configurations` (
    `tuition_collection_configuration_id` INTEGER NOT NULL AUTO_INCREMENT,
    `collection_mode` ENUM('AUTOMATIC', 'MANUAL_FALLBACK') NOT NULL DEFAULT 'AUTOMATIC',
    `default_manual_receiving_bank_account_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `tuition_collection_configurations_default_manual_receiving_b_key`(`default_manual_receiving_bank_account_id`),
    PRIMARY KEY (`tuition_collection_configuration_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_intents` (
    `payment_intent_id` INTEGER NOT NULL AUTO_INCREMENT,
    `tuition_payment_id` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'VND',
    `status` ENUM('PENDING', 'PAID', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `expires_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `payment_intents_tuition_payment_id_key`(`tuition_payment_id`),
    INDEX `idx_payment_intents_status_expires`(`status`, `expires_at`),
    PRIMARY KEY (`payment_intent_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_attempts` (
    `payment_attempt_id` INTEGER NOT NULL AUTO_INCREMENT,
    `payment_intent_id` INTEGER NOT NULL,
    `attempt_code` VARCHAR(32) NOT NULL,
    `receiving_bank_account_id` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'VND',
    `bank_selection_source` ENUM('GRADE_MAPPING', 'MANUAL_DEFAULT') NOT NULL,
    `confirmation_mode` ENUM('AUTOMATIC', 'MANUAL_FALLBACK') NOT NULL,
    `status` ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `qr_code_url` TEXT NULL,
    `expires_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `payment_attempts_attempt_code_key`(`attempt_code`),
    INDEX `idx_payment_attempts_intent_status`(`payment_intent_id`, `status`),
    INDEX `idx_payment_attempts_bank_status`(`receiving_bank_account_id`, `status`),
    PRIMARY KEY (`payment_attempt_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_transfer_transactions` (
    `bank_transfer_transaction_id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider` ENUM('SEPAY') NOT NULL,
    `provider_transaction_id` VARCHAR(120) NOT NULL,
    `payment_attempt_id` INTEGER NULL,
    `amount` INTEGER NOT NULL,
    `transaction_at` TIMESTAMP(0) NOT NULL,
    `receiving_account_number` VARCHAR(50) NULL,
    `content` TEXT NULL,
    `reference` VARCHAR(120) NULL,
    `raw_payload` JSON NULL,
    `processing_status` ENUM('RECEIVED', 'MATCHED', 'UNMATCHED', 'AMOUNT_MISMATCH', 'IGNORED', 'ERROR') NOT NULL DEFAULT 'RECEIVED',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_bank_transfer_transactions_status_time`(`processing_status`, `transaction_at`),
    INDEX `idx_bank_transfer_transactions_attempt`(`payment_attempt_id`),
    UNIQUE INDEX `uq_bank_transfer_transactions_provider_txn`(`provider`, `provider_transaction_id`),
    PRIMARY KEY (`bank_transfer_transaction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tuition_grade_receiving_bank_accounts` ADD CONSTRAINT `tuition_grade_receiving_bank_accounts_receiving_bank_accoun_fkey` FOREIGN KEY (`receiving_bank_account_id`) REFERENCES `receiving_bank_accounts`(`receiving_bank_account_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tuition_collection_configurations` ADD CONSTRAINT `tuition_collection_configurations_default_manual_receiving__fkey` FOREIGN KEY (`default_manual_receiving_bank_account_id`) REFERENCES `receiving_bank_accounts`(`receiving_bank_account_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_intents` ADD CONSTRAINT `payment_intents_tuition_payment_id_fkey` FOREIGN KEY (`tuition_payment_id`) REFERENCES `tuition_payments`(`payment_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_attempts` ADD CONSTRAINT `payment_attempts_payment_intent_id_fkey` FOREIGN KEY (`payment_intent_id`) REFERENCES `payment_intents`(`payment_intent_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_attempts` ADD CONSTRAINT `payment_attempts_receiving_bank_account_id_fkey` FOREIGN KEY (`receiving_bank_account_id`) REFERENCES `receiving_bank_accounts`(`receiving_bank_account_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_transfer_transactions` ADD CONSTRAINT `bank_transfer_transactions_payment_attempt_id_fkey` FOREIGN KEY (`payment_attempt_id`) REFERENCES `payment_attempts`(`payment_attempt_id`) ON DELETE SET NULL ON UPDATE CASCADE;
