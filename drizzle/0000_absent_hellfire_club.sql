CREATE TABLE `accounts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`package` text DEFAULT 'none' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`start_date` text,
	`end_date` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coach` (
	`key` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coach_user_id_unique` ON `coach` (`user_id`);