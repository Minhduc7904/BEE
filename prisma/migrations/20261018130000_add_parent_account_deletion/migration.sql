ALTER TABLE `users`
  ADD COLUMN `deleted_at` TIMESTAMP(0) NULL;

CREATE TABLE `deleted_parent_accounts` (
  `deletion_id` INTEGER NOT NULL AUTO_INCREMENT,
  `phone_lookup_hash` VARCHAR(64) NOT NULL,
  `anonymous_user_id` INTEGER NOT NULL,
  `source` ENUM('APP', 'WEB') NOT NULL,
  `deleted_at` TIMESTAMP(0) NOT NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

  UNIQUE INDEX `uq_deleted_parent_accounts_phone_hash`(`phone_lookup_hash`),
  UNIQUE INDEX `uq_deleted_parent_accounts_anonymous_user`(`anonymous_user_id`),
  PRIMARY KEY (`deletion_id`),
  CONSTRAINT `deleted_parent_accounts_anonymous_user_id_fkey`
    FOREIGN KEY (`anonymous_user_id`) REFERENCES `users`(`user_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
