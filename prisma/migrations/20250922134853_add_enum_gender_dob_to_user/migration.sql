/*
  Warnings:

  - You are about to alter the column `scheduled_at` on the `lessons` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `lessons` MODIFY `scheduled_at` DATETIME NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `date_of_birth` DATE NULL,
    ADD COLUMN `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL;
