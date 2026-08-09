-- CreateTable
CREATE TABLE `book_categories` (
    `book_category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(180) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `book_categories_slug_key`(`slug`),
    INDEX `idx_book_categories_active_order`(`is_active`, `sort_order`),
    PRIMARY KEY (`book_category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `books` (
    `book_id` INTEGER NOT NULL AUTO_INCREMENT,
    `sku` VARCHAR(80) NOT NULL,
    `isbn` VARCHAR(32) NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `short_description` VARCHAR(500) NULL,
    `content` LONGTEXT NULL,
    `author` VARCHAR(255) NULL,
    `publisher` VARCHAR(255) NULL,
    `price_vnd` INTEGER NOT NULL,
    `visibility` ENUM('DRAFT', 'PRIVATE', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `target_keyword` VARCHAR(255) NULL,
    `keyword_text` TEXT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` VARCHAR(500) NULL,
    `og_title` VARCHAR(255) NULL,
    `og_description` VARCHAR(500) NULL,
    `canonical_url` VARCHAR(1000) NULL,
    `search_intent` VARCHAR(100) NULL,
    `seo_score` TINYINT NULL,
    `structured_data` JSON NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `books_sku_key`(`sku`),
    UNIQUE INDEX `books_isbn_key`(`isbn`),
    UNIQUE INDEX `books_slug_key`(`slug`),
    INDEX `idx_books_public_featured_updated`(`visibility`, `is_featured`, `updated_at`),
    INDEX `idx_books_sitemap_published`(`visibility`, `updated_at`, `slug`),
    FULLTEXT INDEX `ft_books_seo`(`title`, `short_description`, `author`, `publisher`, `target_keyword`, `keyword_text`, `meta_title`, `meta_description`),
    PRIMARY KEY (`book_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_category_books` (
    `book_id` INTEGER NOT NULL,
    `book_category_id` INTEGER NOT NULL,

    INDEX `idx_book_category_books_category_book`(`book_category_id`, `book_id`),
    PRIMARY KEY (`book_id`, `book_category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_sales_contact_configurations` (
    `book_sales_contact_configuration_id` INTEGER NOT NULL AUTO_INCREMENT,
    `scope_key` VARCHAR(20) NOT NULL DEFAULT 'GLOBAL',
    `phone` VARCHAR(20) NOT NULL,
    `facebook_url` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `book_sales_contact_configurations_scope_key_key`(`scope_key`),
    PRIMARY KEY (`book_sales_contact_configuration_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `book_category_books` ADD CONSTRAINT `book_category_books_book_id_fkey`
FOREIGN KEY (`book_id`) REFERENCES `books`(`book_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_category_books` ADD CONSTRAINT `book_category_books_book_category_id_fkey`
FOREIGN KEY (`book_category_id`) REFERENCES `book_categories`(`book_category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
