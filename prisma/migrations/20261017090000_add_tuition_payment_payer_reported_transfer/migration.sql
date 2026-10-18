-- Cờ phụ huynh báo đã chuyển khoản trên khoản học phí (tín hiệu cho trung tâm kiểm tra, không phải xác nhận thanh toán).
-- Không backfill: hai cột nullable, dữ liệu cũ mặc định là "chưa báo". Không khóa ghi lâu vì chỉ thêm cột/chỉ mục/FK nullable.
-- User bị xóa thì khoản học phí vẫn giữ (ON DELETE SET NULL).

-- AlterTable
ALTER TABLE `tuition_payments`
  ADD COLUMN `payer_reported_transferred_at` TIMESTAMP(0) NULL,
  ADD COLUMN `payer_reported_transferred_by_user_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `idx_tuition_payments_status_payer_reported` ON `tuition_payments`(`status`, `payer_reported_transferred_at`);

-- AddForeignKey
ALTER TABLE `tuition_payments` ADD CONSTRAINT `tuition_payments_payer_reported_transferred_by_user_id_fkey` FOREIGN KEY (`payer_reported_transferred_by_user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
