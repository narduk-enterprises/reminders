-- Categories table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `name` text NOT NULL,
  `color` text NOT NULL DEFAULT '#6366f1',
  `icon` text,
  `created_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Reminders table
CREATE TABLE IF NOT EXISTS `reminders` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `category_id` text,
  `title` text NOT NULL,
  `description` text,
  `priority` text NOT NULL DEFAULT 'medium',
  `status` text NOT NULL DEFAULT 'pending',
  `due_date` text,
  `completed_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
);
