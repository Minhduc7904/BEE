-- AlterTable
ALTER TABLE `receiving_bank_accounts` ADD COLUMN `sepay_status` ENUM('UNKNOWN', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'UNKNOWN';
