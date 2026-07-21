-- CreateTable
CREATE TABLE `sepay_transaction_sync_cursors` (
    `sepay_transaction_sync_cursor_id` INTEGER NOT NULL AUTO_INCREMENT,
    `scope` VARCHAR(100) NOT NULL,
    `last_since_id` CHAR(36) NULL,
    `last_synced_at` TIMESTAMP(0) NULL,
    `last_error_at` TIMESTAMP(0) NULL,
    `last_error_message` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `sepay_transaction_sync_cursors_scope_key`(`scope`),
    PRIMARY KEY (`sepay_transaction_sync_cursor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
