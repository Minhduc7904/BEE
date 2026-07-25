-- CreateTable
CREATE TABLE `action_approval_requests` (
    `action_approval_request_id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('ASSISTANT_SHIFT_SWAP', 'ASSISTANT_SHIFT_TRANSFER') NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'ACCEPTED', 'DECLINED', 'CANCELED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `requester_user_id` INTEGER NOT NULL,
    `recipient_user_id` INTEGER NOT NULL,
    `payload` JSON NOT NULL,
    `active_dedup_key` CHAR(64) NULL,
    `dedup_key` CHAR(64) NOT NULL,
    `action_token_hash` CHAR(64) NOT NULL,
    `expires_at` TIMESTAMP(0) NOT NULL,
    `cooldown_until` TIMESTAMP(0) NULL,
    `email_sent_at` TIMESTAMP(0) NULL,
    `responded_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `uq_action_approval_requests_active_dedup_key`(`active_dedup_key`),
    UNIQUE INDEX `uq_action_approval_requests_action_token_hash`(`action_token_hash`),
    INDEX `idx_action_approval_requests_requester_created`(`requester_user_id`, `created_at`),
    INDEX `idx_action_approval_requests_recipient_created`(`recipient_user_id`, `created_at`),
    INDEX `idx_action_approval_requests_dedup_created`(`dedup_key`, `created_at`),
    INDEX `idx_action_approval_requests_status_expires`(`status`, `expires_at`),
    PRIMARY KEY (`action_approval_request_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `action_approval_requests`
    ADD CONSTRAINT `action_approval_requests_requester_user_id_fkey`
    FOREIGN KEY (`requester_user_id`) REFERENCES `users`(`user_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `action_approval_requests`
    ADD CONSTRAINT `action_approval_requests_recipient_user_id_fkey`
    FOREIGN KEY (`recipient_user_id`) REFERENCES `users`(`user_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
