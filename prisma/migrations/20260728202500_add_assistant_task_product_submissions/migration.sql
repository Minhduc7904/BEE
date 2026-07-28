-- Add product ownership first so existing rows can be backfilled safely.
ALTER TABLE `assistant_task_products`
    ADD COLUMN `assistant_id` INTEGER NULL;

UPDATE `assistant_task_products` AS `product`
LEFT JOIN `exams` AS `exam`
    ON `exam`.`exam_id` = `product`.`exam_id`
LEFT JOIN `assistant_tasks` AS `task`
    ON `task`.`assistant_task_id` = `product`.`assistant_task_id`
SET `product`.`assistant_id` = COALESCE(`exam`.`created_by`, `task`.`assistant_id`);

-- Create the explicit many-to-many relation and retain existing one-to-many links.
CREATE TABLE `assistant_task_product_submissions` (
    `assistant_task_product_submission_id` INTEGER NOT NULL AUTO_INCREMENT,
    `assistant_task_id` INTEGER NOT NULL,
    `assistant_task_product_id` INTEGER NOT NULL,
    `submitted_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_assistant_task_product_submissions_task_submitted_at`(`assistant_task_id`, `submitted_at`),
    INDEX `idx_assistant_task_product_submissions_product_submitted_at`(`assistant_task_product_id`, `submitted_at`),
    UNIQUE INDEX `unique_assistant_task_product_submission`(`assistant_task_id`, `assistant_task_product_id`),
    PRIMARY KEY (`assistant_task_product_submission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `assistant_task_product_submissions` (
    `assistant_task_id`,
    `assistant_task_product_id`,
    `submitted_at`,
    `created_at`,
    `updated_at`
)
SELECT
    `assistant_task_id`,
    `assistant_task_product_id`,
    `updated_at`,
    `created_at`,
    `updated_at`
FROM `assistant_task_products`
WHERE `assistant_task_id` IS NOT NULL;

-- Fail explicitly if a legacy product has no exam owner and no task assignee.
ALTER TABLE `assistant_task_products`
    MODIFY `assistant_id` INTEGER NOT NULL;

ALTER TABLE `assistant_task_products`
    DROP FOREIGN KEY `assistant_task_products_assistant_task_id_fkey`;

DROP INDEX `idx_assistant_task_products_task_id`
    ON `assistant_task_products`;

ALTER TABLE `assistant_task_products`
    DROP COLUMN `assistant_task_id`;

CREATE INDEX `idx_assistant_task_products_assistant_created_at`
    ON `assistant_task_products`(`assistant_id`, `created_at`);

ALTER TABLE `assistant_task_products`
    ADD CONSTRAINT `assistant_task_products_assistant_id_fkey`
    FOREIGN KEY (`assistant_id`) REFERENCES `admins`(`admin_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `assistant_task_product_submissions`
    ADD CONSTRAINT `assistant_task_product_submissions_assistant_task_id_fkey`
    FOREIGN KEY (`assistant_task_id`) REFERENCES `assistant_tasks`(`assistant_task_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `assistant_task_product_submissions`
    ADD CONSTRAINT `assistant_task_product_submissions_assistant_task_product_i_fkey`
    FOREIGN KEY (`assistant_task_product_id`) REFERENCES `assistant_task_products`(`assistant_task_product_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
