-- AlterTable
ALTER TABLE `bank_transfer_transactions` ADD COLUMN `receiving_bank_account_id` INTEGER NULL;

-- Chỉ backfill khi số tài khoản nhận xác định đúng một account nội bộ.
UPDATE `bank_transfer_transactions` AS `transaction`
INNER JOIN (
    SELECT `account_number`, MIN(`receiving_bank_account_id`) AS `receiving_bank_account_id`
    FROM `receiving_bank_accounts`
    GROUP BY `account_number`
    HAVING COUNT(*) = 1
) AS `account`
    ON `account`.`account_number` = `transaction`.`receiving_account_number`
SET `transaction`.`receiving_bank_account_id` = `account`.`receiving_bank_account_id`
WHERE `transaction`.`receiving_bank_account_id` IS NULL;

-- CreateIndex
CREATE INDEX `idx_bank_transfer_transactions_receiving_account` ON `bank_transfer_transactions`(`receiving_bank_account_id`);

-- CreateIndex
CREATE INDEX `idx_receiving_bank_accounts_account_number` ON `receiving_bank_accounts`(`account_number`);

-- AddForeignKey
ALTER TABLE `bank_transfer_transactions` ADD CONSTRAINT `bank_transfer_transactions_receiving_bank_account_id_fkey` FOREIGN KEY (`receiving_bank_account_id`) REFERENCES `receiving_bank_accounts`(`receiving_bank_account_id`) ON DELETE SET NULL ON UPDATE CASCADE;
