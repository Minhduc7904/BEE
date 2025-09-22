/*
  Warnings:

  - You are about to alter the column `scheduled_at` on the `lessons` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `documents` MODIFY `storage_provider` ENUM('LOCAL', 'S3', 'GCS', 'SUPABASE', 'EXTERNAL') NOT NULL DEFAULT 'EXTERNAL';

-- AlterTable
ALTER TABLE `images` MODIFY `storage_provider` ENUM('LOCAL', 'S3', 'GCS', 'SUPABASE', 'EXTERNAL') NOT NULL DEFAULT 'EXTERNAL';

-- AlterTable
ALTER TABLE `lessons` MODIFY `scheduled_at` DATETIME NULL;

-- AlterTable
ALTER TABLE `media_images` MODIFY `storage_provider` ENUM('LOCAL', 'S3', 'GCS', 'SUPABASE', 'EXTERNAL') NOT NULL DEFAULT 'EXTERNAL';

-- AlterTable
ALTER TABLE `question_images` MODIFY `storage_provider` ENUM('LOCAL', 'S3', 'GCS', 'SUPABASE', 'EXTERNAL') NOT NULL DEFAULT 'EXTERNAL';

-- AlterTable
ALTER TABLE `solution_images` MODIFY `storage_provider` ENUM('LOCAL', 'S3', 'GCS', 'SUPABASE', 'EXTERNAL') NOT NULL DEFAULT 'EXTERNAL';
