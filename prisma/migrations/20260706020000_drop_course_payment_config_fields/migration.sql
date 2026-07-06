ALTER TABLE `courses`
  DROP COLUMN `has_tuition_fee`,
  DROP COLUMN `payment_type`,
  DROP COLUMN `auto_renew`,
  DROP COLUMN `block_unpaid`,
  DROP COLUMN `grace_period_days`;
