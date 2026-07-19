-- Preserve existing integer scores while allowing default fractional scores.
ALTER TABLE `questions` MODIFY `points_origin` DECIMAL(10, 2) NULL;
ALTER TABLE `temp_questions` MODIFY `points_origin` DECIMAL(10, 2) NULL;
