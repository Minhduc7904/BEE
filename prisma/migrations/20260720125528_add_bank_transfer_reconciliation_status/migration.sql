-- AlterTable
ALTER TABLE `bank_transfer_transactions` ADD COLUMN `reconciliation_status` ENUM('UNRECONCILED', 'AUTOMATIC', 'ADMIN') NOT NULL DEFAULT 'UNRECONCILED';
