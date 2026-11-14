CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pwd_reset_user_idx` ON `password_reset_tokens` (`user_id`);--> statement-breakpoint
DROP INDEX `bids_idem_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `bids_idem_idx` ON `bids` (`auction_id`,`user_id`,`idempotency_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_pending_vehicle_idx` ON `orders` (`vehicle_id`) WHERE "orders"."status" = 'PENDING_APPROVAL';