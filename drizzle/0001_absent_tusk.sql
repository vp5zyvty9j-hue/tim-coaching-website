CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`number` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'CHF' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`issued_date` text NOT NULL,
	`due_date` text,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_number_unique` ON `invoices` (`number`);--> statement-breakpoint
CREATE INDEX `invoices_user_id_idx` ON `invoices` (`user_id`);