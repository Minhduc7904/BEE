CREATE INDEX `idx_exams_sitemap_published`
  ON `exams`(`visibility`, `updated_at`, `slug`);

CREATE INDEX `idx_documents_sitemap_published`
  ON `documents`(`visibility`, `updated_at`, `slug`);

CREATE INDEX `idx_courses_sitemap_online`
  ON `courses`(`visibility`, `course_type`, `updated_at`, `code`);

CREATE INDEX `idx_news_articles_sitemap_published`
  ON `news_articles`(`visibility`, `updated_at`, `slug`);

CREATE INDEX `idx_teacher_profiles_sitemap_published`
  ON `teacher_profiles`(`visibility`, `updated_at`, `slug`);
