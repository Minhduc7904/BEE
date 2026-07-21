-- DropForeignKey
ALTER TABLE `tuition_grade_receiving_bank_accounts` DROP FOREIGN KEY `tuition_grade_receiving_bank_accounts_receiving_bank_accoun_fkey`;

-- AlterTable
ALTER TABLE `tuition_grade_receiving_bank_accounts` MODIFY `receiving_bank_account_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `tuition_grade_receiving_bank_accounts` ADD CONSTRAINT `tuition_grade_receiving_bank_accounts_receiving_bank_accoun_fkey` FOREIGN KEY (`receiving_bank_account_id`) REFERENCES `receiving_bank_accounts`(`receiving_bank_account_id`) ON DELETE SET NULL ON UPDATE CASCADE;
