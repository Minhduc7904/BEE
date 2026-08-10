-- Dong bo du lieu cu theo rule: meta title cua tai lieu luon giong title.
-- Idempotent: chi ghi cac row dang thieu hoac khac gia tri mong muon.
UPDATE `documents`
SET `meta_title` = `title`
WHERE `meta_title` IS NULL OR `meta_title` <> `title`;
