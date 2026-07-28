/*
  Warnings:

  - You are about to drop the column `task_type` on the `assistant_tasks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `assistant_task_products` ADD COLUMN `exam_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `assistant_tasks` DROP COLUMN `task_type`,
    ADD COLUMN `task_name` VARCHAR(255) NULL;

-- CreateIndex
CREATE INDEX `idx_assistant_task_products_exam_id` ON `assistant_task_products`(`exam_id`);

-- AddForeignKey
ALTER TABLE `assistant_task_products` ADD CONSTRAINT `assistant_task_products_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON DELETE SET NULL ON UPDATE CASCADE;
