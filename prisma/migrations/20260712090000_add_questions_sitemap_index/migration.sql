CREATE INDEX `idx_questions_sitemap_published`
  ON `questions`(`visibility`, `updated_at`, `slug`);
