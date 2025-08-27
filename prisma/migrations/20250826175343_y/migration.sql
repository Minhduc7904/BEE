/*
  Warnings:

  - You are about to drop the column `high_school` on the `students` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `idx_students_grade_school` ON `students`;

-- AlterTable
ALTER TABLE `admins` MODIFY `subject` VARCHAR(120) NULL;

-- AlterTable
ALTER TABLE `students` DROP COLUMN `high_school`,
    ADD COLUMN `school` VARCHAR(120) NULL,
    MODIFY `student_phone` VARCHAR(15) NULL;

-- CreateIndex
CREATE INDEX `idx_students_grade_school` ON `students`(`grade`, `school`);
