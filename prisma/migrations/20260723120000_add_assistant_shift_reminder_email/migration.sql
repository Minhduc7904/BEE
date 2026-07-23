-- Add a public check-in token and an opt-in reminder flag without modifying existing assignments.
ALTER TABLE `assistant_shift_assignments`
  ADD COLUMN `token` VARCHAR(64) NULL,
  ADD COLUMN `should_send_reminder_email` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `idx_assistant_shift_assignments_reminder_token`
  ON `assistant_shift_assignments`(`should_send_reminder_email`, `token`);
