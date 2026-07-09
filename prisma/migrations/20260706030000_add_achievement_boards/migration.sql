CREATE TABLE `achievement_boards` (
  `achievement_board_id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `competition_name` VARCHAR(255) NOT NULL,
  `academic_year` VARCHAR(50) NULL,
  `description` TEXT NULL,
  `short_description` VARCHAR(500) NULL,
  `target_keyword` VARCHAR(255) NULL,
  `keyword_text` TEXT NULL,
  `meta_title` VARCHAR(255) NULL,
  `meta_description` VARCHAR(500) NULL,
  `og_title` VARCHAR(255) NULL,
  `og_description` VARCHAR(500) NULL,
  `search_intent` VARCHAR(100) NULL,
  `seo_score` INTEGER NULL,
  `visibility` ENUM('DRAFT', 'PRIVATE', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  `is_featured` BOOLEAN NOT NULL DEFAULT false,
  `view_count` INTEGER NOT NULL DEFAULT 0,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_by` INTEGER NULL,
  `updated_by` INTEGER NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL,

  UNIQUE INDEX `achievement_boards_slug_key`(`slug`),
  INDEX `idx_achievement_boards_visibility`(`visibility`),
  INDEX `idx_achievement_boards_competition`(`competition_name`),
  INDEX `idx_achievement_boards_academic_year`(`academic_year`),
  INDEX `idx_achievement_boards_featured_visibility`(`is_featured`, `visibility`),
  INDEX `idx_achievement_boards_sort_order`(`sort_order`),
  FULLTEXT INDEX `ft_achievement_boards_seo`(`title`, `competition_name`, `academic_year`, `description`, `short_description`, `target_keyword`, `keyword_text`, `meta_title`, `meta_description`),
  PRIMARY KEY (`achievement_board_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `achievement_rows` (
  `achievement_row_id` INTEGER NOT NULL AUTO_INCREMENT,
  `achievement_board_id` INTEGER NOT NULL,
  `student_name` VARCHAR(255) NOT NULL,
  `school_name` VARCHAR(255) NULL,
  `grade` TINYINT NULL,
  `score` DECIMAL(10, 2) NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL,

  INDEX `idx_achievement_rows_board_order`(`achievement_board_id`, `sort_order`),
  INDEX `idx_achievement_rows_school`(`school_name`),
  INDEX `idx_achievement_rows_grade`(`grade`),
  PRIMARY KEY (`achievement_row_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `achievement_rows`
  ADD CONSTRAINT `achievement_rows_achievement_board_id_fkey`
  FOREIGN KEY (`achievement_board_id`) REFERENCES `achievement_boards`(`achievement_board_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
