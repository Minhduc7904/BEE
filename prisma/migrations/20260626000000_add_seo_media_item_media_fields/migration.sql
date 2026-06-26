ALTER TABLE `seo_media_items`
  ADD COLUMN `media_type` ENUM('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER') NOT NULL DEFAULT 'IMAGE' AFTER `mime_type`,
  ADD COLUMN `duration` DOUBLE NULL AFTER `height`;

CREATE INDEX `idx_seo_media_items_slot_media_type` ON `seo_media_items`(`slot_id`, `media_type`);
