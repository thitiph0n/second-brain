PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `trips` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`cover_image_url` text,
	`is_public` integer DEFAULT false,
	`share_token` text,
	`shared_at` text,
	`created_at` text DEFAULT '2025-12-07T00:00:00.000Z',
	`updated_at` text DEFAULT '2025-12-07T00:00:00.000Z',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `trips_user_id_idx` ON `trips` (`user_id`);--> statement-breakpoint
CREATE INDEX `trips_start_date_idx` ON `trips` (`start_date`);--> statement-breakpoint
CREATE INDEX `trips_end_date_idx` ON `trips` (`end_date`);--> statement-breakpoint
CREATE INDEX `trips_share_token_idx` ON `trips` (`share_token`);--> statement-breakpoint
CREATE TABLE `itinerary_items` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`day_number` integer NOT NULL,
	`time` text,
	`place_name` text NOT NULL,
	`location_address` text,
	`location_lat` real,
	`location_lng` real,
	`google_maps_url` text,
	`notes` text,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT '2025-12-07T00:00:00.000Z',
	`updated_at` text DEFAULT '2025-12-07T00:00:00.000Z',
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `itinerary_items_trip_id_idx` ON `itinerary_items` (`trip_id`);--> statement-breakpoint
CREATE INDEX `itinerary_items_trip_day_idx` ON `itinerary_items` (`trip_id`, `day_number`);--> statement-breakpoint
CREATE INDEX `itinerary_items_sort_order_idx` ON `itinerary_items` (`sort_order`);--> statement-breakpoint
CREATE TABLE `itinerary_images` (
	`id` text PRIMARY KEY NOT NULL,
	`itinerary_item_id` text NOT NULL,
	`image_url` text NOT NULL,
	`image_key` text,
	`caption` text,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT '2025-12-07T00:00:00.000Z',
	FOREIGN KEY (`itinerary_item_id`) REFERENCES `itinerary_items`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `itinerary_images_itinerary_item_id_idx` ON `itinerary_images` (`itinerary_item_id`);--> statement-breakpoint
CREATE INDEX `itinerary_images_sort_order_idx` ON `itinerary_images` (`sort_order`);--> statement-breakpoint