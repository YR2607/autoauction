CREATE TABLE `admin_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`before_json` text,
	`after_json` text,
	`reason` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `admin_audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_admin_idx` ON `admin_audit_logs` (`admin_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `auction_events` (
	`id` text PRIMARY KEY NOT NULL,
	`auction_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`actor_id` text,
	`reason` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `auction_events_auction_idx` ON `auction_events` (`auction_id`);--> statement-breakpoint
CREATE TABLE `auctions` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`currency` text NOT NULL,
	`starting_price` integer NOT NULL,
	`bid_increment` integer NOT NULL,
	`current_bid` integer,
	`highest_bidder_id` text,
	`bid_count` integer DEFAULT 0 NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`extension_window_sec` integer,
	`extension_duration_sec` integer,
	`winner_user_id` text,
	`winning_bid_id` text,
	`finalized_at` integer,
	`cancel_reason` text,
	`version` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`highest_bidder_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`winner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auctions_vehicle_idx` ON `auctions` (`vehicle_id`);--> statement-breakpoint
CREATE INDEX `auctions_status_ends_idx` ON `auctions` (`status`,`ends_at`);--> statement-breakpoint
CREATE INDEX `auctions_starts_idx` ON `auctions` (`status`,`starts_at`);--> statement-breakpoint
CREATE TABLE `bids` (
	`id` text PRIMARY KEY NOT NULL,
	`auction_id` text NOT NULL,
	`vehicle_id` text NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text NOT NULL,
	`reject_reason` text,
	`idempotency_key` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bids_idem_idx` ON `bids` (`auction_id`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `bids_auction_amount_idx` ON `bids` (`auction_id`,`amount`);--> statement-breakpoint
CREATE INDEX `bids_user_idx` ON `bids` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `favorites` (
	`user_id` text NOT NULL,
	`vehicle_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `vehicle_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `favorites_user_idx` ON `favorites` (`user_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`payload_json` text,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_unread_idx` ON `notifications` (`user_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`auction_id` text,
	`buyer_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text DEFAULT 'PENDING_APPROVAL' NOT NULL,
	`admin_note` text,
	`decided_by_id` text,
	`decided_at` integer,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decided_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `orders_vehicle_idx` ON `orders` (`vehicle_id`);--> statement-breakpoint
CREATE INDEX `orders_buyer_idx` ON `orders` (`buyer_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE TABLE `platform_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`first_name` text,
	`last_name` text,
	`phone` text,
	`address_line` text,
	`city` text,
	`country` text,
	`avatar_url` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'buyer' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `vehicle_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`kind` text DEFAULT 'other' NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vehicle_docs_vehicle_idx` ON `vehicle_documents` (`vehicle_id`);--> statement-breakpoint
CREATE TABLE `vehicle_images` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`url` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_cover` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vehicle_images_vehicle_idx` ON `vehicle_images` (`vehicle_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`lot_number` text NOT NULL,
	`make` text NOT NULL,
	`model` text NOT NULL,
	`trim` text,
	`year` integer NOT NULL,
	`vin` text,
	`vin_visibility` text DEFAULT 'last4' NOT NULL,
	`mileage` integer,
	`body_type` text,
	`fuel_type` text,
	`transmission` text,
	`drivetrain` text,
	`engine_capacity_cc` integer,
	`engine_power_hp` integer,
	`exterior_color` text,
	`interior_color` text,
	`doors` integer,
	`seats` integer,
	`location_country` text,
	`location_city` text,
	`condition_overall` text,
	`accident_history` text,
	`damage_type` text,
	`engine_condition` text,
	`transmission_condition` text,
	`chassis_condition` text,
	`airbag_status` text,
	`flood_damage` integer,
	`starts` integer,
	`drives` integer,
	`keys_available` integer,
	`description` text,
	`seller_notes` text,
	`service_history` text,
	`registration_info` text,
	`sale_type` text NOT NULL,
	`buy_now_price` integer,
	`buy_now_currency` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_by_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_slug_idx` ON `vehicles` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_lot_idx` ON `vehicles` (`lot_number`);--> statement-breakpoint
CREATE INDEX `vehicles_status_saletype_idx` ON `vehicles` (`status`,`sale_type`);--> statement-breakpoint
CREATE INDEX `vehicles_make_model_idx` ON `vehicles` (`make`,`model`);--> statement-breakpoint
CREATE INDEX `vehicles_year_idx` ON `vehicles` (`year`);