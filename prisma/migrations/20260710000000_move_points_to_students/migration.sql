ALTER TABLE `students`
  ADD COLUMN `total_point` INTEGER NOT NULL DEFAULT 0 AFTER `high_school_graduation_year`;

UPDATE `students` s
JOIN `users` u ON u.`user_id` = s.`user_id`
SET s.`total_point` = COALESCE(u.`total_point`, 0);

CREATE TABLE `student_point_logs` (
  `point_log_id` INTEGER NOT NULL AUTO_INCREMENT,
  `student_id` INTEGER NOT NULL,
  `type` ENUM('BONUS', 'PENALTY') NOT NULL,
  `points` INTEGER NOT NULL,
  `source` VARCHAR(50) NOT NULL,
  `reference_type` VARCHAR(50) NULL,
  `reference_id` INTEGER NULL,
  `note` VARCHAR(255) NULL,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

  INDEX `idx_student_point_logs_student_created`(`student_id`, `created_at`),
  INDEX `idx_student_point_logs_student_type`(`student_id`, `type`),
  INDEX `idx_student_point_logs_source`(`source`),
  INDEX `idx_student_point_logs_ref`(`reference_type`, `reference_id`),
  UNIQUE INDEX `uq_student_point_logs_student_source_ref`(`student_id`, `source`, `reference_type`, `reference_id`),
  PRIMARY KEY (`point_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `student_point_logs` (
  `student_id`,
  `type`,
  `points`,
  `source`,
  `reference_type`,
  `reference_id`,
  `note`,
  `metadata`,
  `created_at`
)
SELECT
  s.`student_id`,
  upl.`type`,
  upl.`points`,
  upl.`source`,
  upl.`reference_type`,
  upl.`reference_id`,
  upl.`note`,
  upl.`metadata`,
  upl.`created_at`
FROM `user_point_logs` upl
JOIN `students` s ON s.`user_id` = upl.`user_id`;

INSERT INTO `student_point_logs` (
  `student_id`,
  `type`,
  `points`,
  `source`,
  `note`,
  `created_at`
)
SELECT
  spl.`studentId`,
  spl.`type`,
  spl.`points`,
  spl.`source`,
  spl.`note`,
  spl.`createdAt`
FROM `StudentPointLog` spl;

ALTER TABLE `student_point_logs`
  ADD CONSTRAINT `student_point_logs_student_id_fkey`
  FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE `user_point_logs`;
DROP TABLE `StudentPointLog`;

ALTER TABLE `users`
  DROP COLUMN `total_point`;
