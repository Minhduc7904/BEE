ALTER TABLE `attendances`
  ADD COLUMN `attendance_type` ENUM('REGULAR', 'MAKEUP') NOT NULL DEFAULT 'REGULAR' AFTER `status`;

UPDATE `attendances`
SET `attendance_type` = 'MAKEUP',
    `status` = 'PRESENT'
WHERE `status` = 'MAKEUP';

ALTER TABLE `attendances`
  MODIFY COLUMN `status` ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL;
