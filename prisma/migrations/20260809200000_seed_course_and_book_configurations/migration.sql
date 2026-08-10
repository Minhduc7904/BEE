-- Backfill singleton cấu hình nhận tiền mua khóa học nếu dữ liệu cũ chưa có.
-- Ưu tiên bank manual mặc định của học phí; nếu chưa có thì dùng bank active đầu tiên.
INSERT INTO `course_payment_configurations` (
  `scope_key`,
  `receiving_bank_account_id`,
  `created_at`,
  `updated_at`
)
SELECT
  'GLOBAL',
  COALESCE(
    (
      SELECT `default_manual_receiving_bank_account_id`
      FROM `tuition_collection_configurations`
      LIMIT 1
    ),
    (
      SELECT `receiving_bank_account_id`
      FROM `receiving_bank_accounts`
      WHERE `status` = 'ACTIVE'
      ORDER BY `receiving_bank_account_id`
      LIMIT 1
    )
  ),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM `course_payment_configurations`
  WHERE `scope_key` = 'GLOBAL'
)
AND COALESCE(
  (
    SELECT `default_manual_receiving_bank_account_id`
    FROM `tuition_collection_configurations`
    LIMIT 1
  ),
  (
    SELECT `receiving_bank_account_id`
    FROM `receiving_bank_accounts`
    WHERE `status` = 'ACTIVE'
    ORDER BY `receiving_bank_account_id`
    LIMIT 1
  )
) IS NOT NULL;

-- Seed singleton CTA liên hệ bán sách. Catalog sách chỉ bán thủ công, không tạo payment intent/SePay.
INSERT INTO `book_sales_contact_configurations` (
  `scope_key`,
  `phone`,
  `facebook_url`,
  `created_at`,
  `updated_at`
)
SELECT
  'GLOBAL',
  '0901234567',
  'https://www.facebook.com/bee.edu.vn',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM `book_sales_contact_configurations`
  WHERE `scope_key` = 'GLOBAL'
);
