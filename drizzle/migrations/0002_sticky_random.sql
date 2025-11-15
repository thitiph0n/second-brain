PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT '2025-11-15T18:28:23.493Z',
	`last_accessed` text DEFAULT '2025-11-15T18:28:23.493Z',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_auth_sessions`("id", "user_id", "token_hash", "expires_at", "created_at", "last_accessed") SELECT "id", "user_id", "token_hash", "expires_at", "created_at", "last_accessed" FROM `auth_sessions`;--> statement-breakpoint
DROP TABLE `auth_sessions`;--> statement-breakpoint
ALTER TABLE `__new_auth_sessions` RENAME TO `auth_sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`code` text NOT NULL,
	`type` text DEFAULT 'food' NOT NULL,
	`description` text,
	`expires_at` text,
	`is_used` integer DEFAULT false,
	`used_at` text,
	`created_at` text DEFAULT '2025-11-15T18:28:23.496Z',
	`updated_at` text DEFAULT '2025-11-15T18:28:23.496Z',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_coupons`("id", "user_id", "code", "type", "description", "expires_at", "is_used", "used_at", "created_at", "updated_at") SELECT "id", "user_id", "code", "type", "description", "expires_at", "is_used", "used_at", "created_at", "updated_at" FROM `coupons`;--> statement-breakpoint
DROP TABLE `coupons`;--> statement-breakpoint
ALTER TABLE `__new_coupons` RENAME TO `coupons`;--> statement-breakpoint
CREATE TABLE `__new_daily_summaries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`total_calories` real DEFAULT 0,
	`total_protein_g` real DEFAULT 0,
	`total_carbs_g` real DEFAULT 0,
	`total_fat_g` real DEFAULT 0,
	`meal_count` integer DEFAULT 0,
	`target_calories` real,
	`created_at` text DEFAULT '2025-11-15T18:28:23.502Z',
	`updated_at` text DEFAULT '2025-11-15T18:28:23.502Z',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_daily_summaries`("id", "user_id", "date", "total_calories", "total_protein_g", "total_carbs_g", "total_fat_g", "meal_count", "target_calories", "created_at", "updated_at") SELECT "id", "user_id", "date", "total_calories", "total_protein_g", "total_carbs_g", "total_fat_g", "meal_count", "target_calories", "created_at", "updated_at" FROM `daily_summaries`;--> statement-breakpoint
DROP TABLE `daily_summaries`;--> statement-breakpoint
ALTER TABLE `__new_daily_summaries` RENAME TO `daily_summaries`;--> statement-breakpoint
CREATE TABLE `__new_drawing_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`drawing_id` text NOT NULL,
	`user_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` text NOT NULL,
	`url` text NOT NULL,
	`created_at` text DEFAULT '2025-11-15T18:28:23.499Z',
	FOREIGN KEY (`drawing_id`) REFERENCES `drawings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_drawing_assets`("id", "drawing_id", "user_id", "file_name", "file_type", "file_size", "url", "created_at") SELECT "id", "drawing_id", "user_id", "file_name", "file_type", "file_size", "url", "created_at" FROM `drawing_assets`;--> statement-breakpoint
DROP TABLE `drawing_assets`;--> statement-breakpoint
ALTER TABLE `__new_drawing_assets` RENAME TO `drawing_assets`;--> statement-breakpoint
CREATE TABLE `__new_drawings` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`user_id` text NOT NULL,
	`parent_id` text,
	`type` text DEFAULT 'drawing' NOT NULL,
	`data` text,
	`created_at` text DEFAULT '2025-11-15T18:28:23.499Z',
	`updated_at` text DEFAULT '2025-11-15T18:28:23.499Z',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_drawings`("id", "title", "description", "user_id", "parent_id", "type", "data", "created_at", "updated_at") SELECT "id", "title", "description", "user_id", "parent_id", "type", "data", "created_at", "updated_at" FROM `drawings`;--> statement-breakpoint
DROP TABLE `drawings`;--> statement-breakpoint
ALTER TABLE `__new_drawings` RENAME TO `drawings`;--> statement-breakpoint
CREATE TABLE `__new_favorite_foods` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`food_name` text NOT NULL,
	`calories` real NOT NULL,
	`protein_g` real DEFAULT 0,
	`carbs_g` real DEFAULT 0,
	`fat_g` real DEFAULT 0,
	`serving_size` text,
	`serving_unit` text,
	`category` text,
	`usage_count` integer DEFAULT 0,
	`last_used_at` text,
	`created_at` text DEFAULT '2025-11-15T18:28:23.502Z',
	`updated_at` text DEFAULT '2025-11-15T18:28:23.502Z',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_favorite_foods`("id", "user_id", "food_name", "calories", "protein_g", "carbs_g", "fat_g", "serving_size", "serving_unit", "category", "usage_count", "last_used_at", "created_at", "updated_at") SELECT "id", "user_id", "food_name", "calories", "protein_g", "carbs_g", "fat_g", "serving_size", "serving_unit", "category", "usage_count", "last_used_at", "created_at", "updated_at" FROM `favorite_foods`;--> statement-breakpoint
DROP TABLE `favorite_foods`;--> statement-breakpoint
ALTER TABLE `__new_favorite_foods` RENAME TO `favorite_foods`;--> statement-breakpoint
CREATE TABLE `__new_foods` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`calories_per_100g` real NOT NULL,
	`protein_per_100g` real DEFAULT 0,
	`carbs_per_100g` real DEFAULT 0,
	`fat_per_100g` real DEFAULT 0,
	`serving_size_g` real,
	`serving_description` text,
	`category` text,
	`created_at` text DEFAULT '2025-11-15T18:28:23.502Z'
);
--> statement-breakpoint
INSERT INTO `__new_foods`("id", "name", "brand", "calories_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g", "serving_size_g", "serving_description", "category", "created_at") SELECT "id", "name", "brand", "calories_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g", "serving_size_g", "serving_description", "category", "created_at" FROM `foods`;--> statement-breakpoint
DROP TABLE `foods`;--> statement-breakpoint
ALTER TABLE `__new_foods` RENAME TO `foods`;--> statement-breakpoint
CREATE TABLE `__new_meal_streaks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`current_streak` integer DEFAULT 0,
	`longest_streak` integer DEFAULT 0,
	`last_logged_date` text,
	`freeze_credits` integer DEFAULT 2,
	`total_logged_days` integer DEFAULT 0,
	`created_at` text DEFAULT '2025-11-15T18:28:23.502Z',
	`updated_at` text DEFAULT '2025-11-15T18:28:23.502Z',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_meal_streaks`("id", "user_id", "current_streak", "longest_streak", "last_logged_date", "freeze_credits", "total_logged_days", "created_at", "updated_at") SELECT "id", "user_id", "current_streak", "longest_streak", "last_logged_date", "freeze_credits", "total_logged_days", "created_at", "updated_at" FROM `meal_streaks`;--> statement-breakpoint
DROP TABLE `meal_streaks`;--> statement-breakpoint
ALTER TABLE `__new_meal_streaks` RENAME TO `meal_streaks`;--> statement-breakpoint
CREATE TABLE `__new_meals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`meal_type` text NOT NULL,
	`food_name` text NOT NULL,
	`calories` real NOT NULL,
	`protein_g` real DEFAULT 0,
	`carbs_g` real DEFAULT 0,
	`fat_g` real DEFAULT 0,
	`serving_size` text,
	`serving_unit` text,
	`image_url` text,
	`notes` text,
	`logged_at` text DEFAULT '2025-11-15T18:28:23.502Z',
	`created_at` text DEFAULT '2025-11-15T18:28:23.502Z',
	`updated_at` text DEFAULT '2025-11-15T18:28:23.502Z',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_meals`("id", "user_id", "meal_type", "food_name", "calories", "protein_g", "carbs_g", "fat_g", "serving_size", "serving_unit", "image_url", "notes", "logged_at", "created_at", "updated_at") SELECT "id", "user_id", "meal_type", "food_name", "calories", "protein_g", "carbs_g", "fat_g", "serving_size", "serving_unit", "image_url", "notes", "logged_at", "created_at", "updated_at" FROM `meals`;--> statement-breakpoint
DROP TABLE `meals`;--> statement-breakpoint
ALTER TABLE `__new_meals` RENAME TO `meals`;--> statement-breakpoint
CREATE TABLE `__new_oauth_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`provider_email` text NOT NULL,
	`created_at` text DEFAULT '2025-11-15T18:28:23.493Z',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_oauth_providers`("id", "user_id", "provider", "provider_user_id", "provider_email", "created_at") SELECT "id", "user_id", "provider", "provider_user_id", "provider_email", "created_at" FROM `oauth_providers`;--> statement-breakpoint
DROP TABLE `oauth_providers`;--> statement-breakpoint
ALTER TABLE `__new_oauth_providers` RENAME TO `oauth_providers`;--> statement-breakpoint
CREATE TABLE `__new_user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`age` integer NOT NULL,
	`weight_kg` real NOT NULL,
	`height_cm` real NOT NULL,
	`gender` text NOT NULL,
	`activity_level` text NOT NULL,
	`goal` text NOT NULL,
	`tdee` real NOT NULL,
	`target_calories` real NOT NULL,
	`target_protein_g` real NOT NULL,
	`target_carbs_g` real NOT NULL,
	`target_fat_g` real NOT NULL,
	`timezone` text,
	`created_at` text DEFAULT '2025-11-15T18:28:23.502Z',
	`updated_at` text DEFAULT '2025-11-15T18:28:23.502Z',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_profiles`("id", "user_id", "age", "weight_kg", "height_cm", "gender", "activity_level", "goal", "tdee", "target_calories", "target_protein_g", "target_carbs_g", "target_fat_g", "timezone", "created_at", "updated_at") SELECT "id", "user_id", "age", "weight_kg", "height_cm", "gender", "activity_level", "goal", "tdee", "target_calories", "target_protein_g", "target_carbs_g", "target_fat_g", "timezone", "created_at", "updated_at" FROM `user_profiles`;--> statement-breakpoint
DROP TABLE `user_profiles`;--> statement-breakpoint
ALTER TABLE `__new_user_profiles` RENAME TO `user_profiles`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`github_id` integer NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text,
	`created_at` text DEFAULT '2025-11-15T18:28:23.492Z',
	`updated_at` text DEFAULT '2025-11-15T18:28:23.493Z'
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "github_id", "email", "name", "avatar_url", "created_at", "updated_at") SELECT "id", "github_id", "email", "name", "avatar_url", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_github_id_unique` ON `users` (`github_id`);