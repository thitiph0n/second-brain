PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT '2025-11-09T09:56:16.296Z',
	`last_accessed` text DEFAULT '2025-11-09T09:56:16.296Z',
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
	`created_at` text DEFAULT '2025-11-09T09:56:16.299Z',
	`updated_at` text DEFAULT '2025-11-09T09:56:16.299Z',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_coupons`("id", "user_id", "code", "type", "description", "expires_at", "is_used", "used_at", "created_at", "updated_at") SELECT "id", "user_id", "code", "type", "description", "expires_at", "is_used", "used_at", "created_at", "updated_at" FROM `coupons`;--> statement-breakpoint
DROP TABLE `coupons`;--> statement-breakpoint
ALTER TABLE `__new_coupons` RENAME TO `coupons`;--> statement-breakpoint
CREATE TABLE `__new_drawing_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`drawing_id` text NOT NULL,
	`user_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` text NOT NULL,
	`url` text NOT NULL,
	`created_at` text DEFAULT '2025-11-09T09:56:16.301Z',
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
	`created_at` text DEFAULT '2025-11-09T09:56:16.301Z',
	`updated_at` text DEFAULT '2025-11-09T09:56:16.301Z',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_drawings`("id", "title", "description", "user_id", "parent_id", "type", "data", "created_at", "updated_at") SELECT "id", "title", "description", "user_id", "parent_id", "type", "data", "created_at", "updated_at" FROM `drawings`;--> statement-breakpoint
DROP TABLE `drawings`;--> statement-breakpoint
ALTER TABLE `__new_drawings` RENAME TO `drawings`;--> statement-breakpoint
CREATE TABLE `__new_oauth_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`provider_email` text NOT NULL,
	`created_at` text DEFAULT '2025-11-09T09:56:16.296Z',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_oauth_providers`("id", "user_id", "provider", "provider_user_id", "provider_email", "created_at") SELECT "id", "user_id", "provider", "provider_user_id", "provider_email", "created_at" FROM `oauth_providers`;--> statement-breakpoint
DROP TABLE `oauth_providers`;--> statement-breakpoint
ALTER TABLE `__new_oauth_providers` RENAME TO `oauth_providers`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`github_id` integer NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text,
	`created_at` text DEFAULT '2025-11-09T09:56:16.295Z',
	`updated_at` text DEFAULT '2025-11-09T09:56:16.296Z'
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "github_id", "email", "name", "avatar_url", "created_at", "updated_at") SELECT "id", "github_id", "email", "name", "avatar_url", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_github_id_unique` ON `users` (`github_id`);