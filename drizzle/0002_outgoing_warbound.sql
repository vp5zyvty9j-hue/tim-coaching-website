CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`avatar` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workout_results` (
	`workout_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`score` integer NOT NULL,
	`rpe` integer NOT NULL,
	`distance_m` integer DEFAULT 0 NOT NULL,
	`shoe_id` text,
	`body` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shoes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`initial_m` integer NOT NULL,
	`limit_m` integer NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workout_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`sport` text NOT NULL,
	`body` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`sport` text NOT NULL,
	`body` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `workouts_user_date` ON `workouts` (`user_id`,`date`);