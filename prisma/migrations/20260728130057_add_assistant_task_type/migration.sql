-- AlterTable
ALTER TABLE `assistant_tasks` ADD COLUMN `task_type` ENUM('BTVN', 'VIDEO', 'BTTL', 'BAI_CHAM') NULL;
