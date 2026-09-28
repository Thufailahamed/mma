CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_logs_actor_idx` ON `audit_logs` (`actor_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`user_agent` text,
	`ip` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bio` text,
	`country` text,
	`favorite_fighter_id` text,
	`prediction_accuracy` integer DEFAULT 0 NOT NULL,
	`total_predictions` integer DEFAULT 0 NOT NULL,
	`correct_predictions` integer DEFAULT 0 NOT NULL,
	`trivia_xp` integer DEFAULT 0 NOT NULL,
	`prediction_points` integer DEFAULT 0 NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "user_profiles_accuracy_range" CHECK("user_profiles"."prediction_accuracy" BETWEEN 0 AND 100),
	CONSTRAINT "user_profiles_correct_le_total" CHECK("user_profiles"."correct_predictions" <= "user_profiles"."total_predictions")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_user_unique` ON `user_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_profiles_favorite_fighter_idx` ON `user_profiles` (`favorite_fighter_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`password_hash` text NOT NULL,
	`avatar_url` text,
	`role` text DEFAULT 'USER' NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "users_role_check" CHECK("users"."role" IN ('USER','EDITOR','ADMIN')),
	CONSTRAINT "users_xp_non_negative" CHECK("users"."xp" >= 0),
	CONSTRAINT "users_level_positive" CHECK("users"."level" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `xp_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source` text NOT NULL,
	`amount` integer NOT NULL,
	`reference_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `xp_events_user_created_idx` ON `xp_events` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `xp_events_source_idx` ON `xp_events` (`source`);--> statement-breakpoint
CREATE TABLE `divisions` (
	`id` text PRIMARY KEY NOT NULL,
	`promotion_id` text NOT NULL,
	`name` text NOT NULL,
	`gender` text NOT NULL,
	`weight_limit` integer NOT NULL,
	`slug` text NOT NULL,
	FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "divisions_gender_check" CHECK("divisions"."gender" IN ('MALE','FEMALE')),
	CONSTRAINT "divisions_weight_limit_positive" CHECK("divisions"."weight_limit" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `divisions_promotion_slug_unique` ON `divisions` (`promotion_id`,`slug`);--> statement-breakpoint
CREATE INDEX `divisions_promotion_idx` ON `divisions` (`promotion_id`);--> statement-breakpoint
CREATE TABLE `fighters` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`full_name` text NOT NULL,
	`nickname` text,
	`slug` text NOT NULL,
	`country` text,
	`date_of_birth` integer,
	`height_cm` integer,
	`reach_cm` integer,
	`stance` text,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`draws` integer DEFAULT 0 NOT NULL,
	`no_contests` integer DEFAULT 0 NOT NULL,
	`ko_wins` integer DEFAULT 0 NOT NULL,
	`submission_wins` integer DEFAULT 0 NOT NULL,
	`decision_wins` integer DEFAULT 0 NOT NULL,
	`image_url` text,
	`bio` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "fighters_stance_check" CHECK("fighters"."stance" IS NULL OR "fighters"."stance" IN ('ORTHODOX','SOUTHPAW','SWITCH')),
	CONSTRAINT "fighters_height_range" CHECK("fighters"."height_cm" IS NULL OR "fighters"."height_cm" BETWEEN 100 AND 250),
	CONSTRAINT "fighters_reach_range" CHECK("fighters"."reach_cm" IS NULL OR "fighters"."reach_cm" BETWEEN 100 AND 250),
	CONSTRAINT "fighters_record_non_negative" CHECK("fighters"."wins" >= 0 AND "fighters"."losses" >= 0 AND "fighters"."draws" >= 0 AND "fighters"."no_contests" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fighters_slug_unique` ON `fighters` (`slug`);--> statement-breakpoint
CREATE INDEX `fighters_full_name_idx` ON `fighters` (`full_name`);--> statement-breakpoint
CREATE INDEX `fighters_country_idx` ON `fighters` (`country`);--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo_url` text,
	`website` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `promotions_slug_unique` ON `promotions` (`slug`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`promotion_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`event_date` integer NOT NULL,
	`venue` text,
	`city` text,
	`country` text,
	`status` text DEFAULT 'UPCOMING' NOT NULL,
	`poster_url` text,
	`description` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "events_status_check" CHECK("events"."status" IN ('UPCOMING','LIVE','COMPLETED','CANCELLED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_unique` ON `events` (`slug`);--> statement-breakpoint
CREATE INDEX `events_promotion_idx` ON `events` (`promotion_id`);--> statement-breakpoint
CREATE INDEX `events_date_idx` ON `events` (`event_date`);--> statement-breakpoint
CREATE INDEX `events_status_date_idx` ON `events` (`status`,`event_date`);--> statement-breakpoint
CREATE TABLE `fight_rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`fight_id` text NOT NULL,
	`round_number` integer NOT NULL,
	`duration_seconds` integer,
	`fighter_a_score` integer,
	`fighter_b_score` integer,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`fight_id`) REFERENCES `fights`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "fight_rounds_number_valid" CHECK("fight_rounds"."round_number" BETWEEN 1 AND 5),
	CONSTRAINT "fight_rounds_score_range" CHECK(("fight_rounds"."fighter_a_score" IS NULL OR "fight_rounds"."fighter_a_score" BETWEEN 6 AND 10) AND ("fight_rounds"."fighter_b_score" IS NULL OR "fight_rounds"."fighter_b_score" BETWEEN 6 AND 10))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fight_rounds_fight_round_unique` ON `fight_rounds` (`fight_id`,`round_number`);--> statement-breakpoint
CREATE INDEX `fight_rounds_fight_idx` ON `fight_rounds` (`fight_id`);--> statement-breakpoint
CREATE TABLE `fight_statistics` (
	`id` text PRIMARY KEY NOT NULL,
	`fight_id` text NOT NULL,
	`round_number` integer,
	`fighter_id` text NOT NULL,
	`significant_strikes` integer DEFAULT 0 NOT NULL,
	`total_strikes` integer DEFAULT 0 NOT NULL,
	`head_strikes` integer DEFAULT 0 NOT NULL,
	`body_strikes` integer DEFAULT 0 NOT NULL,
	`leg_strikes` integer DEFAULT 0 NOT NULL,
	`takedowns` integer DEFAULT 0 NOT NULL,
	`takedown_attempts` integer DEFAULT 0 NOT NULL,
	`submission_attempts` integer DEFAULT 0 NOT NULL,
	`reversals` integer DEFAULT 0 NOT NULL,
	`control_seconds` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`fight_id`) REFERENCES `fights`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`fighter_id`) REFERENCES `fighters`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "fight_stats_non_negative" CHECK("fight_statistics"."significant_strikes" >= 0 AND "fight_statistics"."total_strikes" >= 0 AND "fight_statistics"."takedowns" >= 0 AND "fight_statistics"."control_seconds" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fight_stats_fight_round_fighter_unique` ON `fight_statistics` (`fight_id`,`round_number`,`fighter_id`);--> statement-breakpoint
CREATE INDEX `fight_stats_fight_idx` ON `fight_statistics` (`fight_id`);--> statement-breakpoint
CREATE INDEX `fight_stats_fighter_idx` ON `fight_statistics` (`fighter_id`);--> statement-breakpoint
CREATE TABLE `fights` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`fighter_a_id` text NOT NULL,
	`fighter_b_id` text NOT NULL,
	`division_id` text NOT NULL,
	`fight_order` integer NOT NULL,
	`is_main_event` integer DEFAULT false NOT NULL,
	`is_title_fight` integer DEFAULT false NOT NULL,
	`scheduled_rounds` integer DEFAULT 3 NOT NULL,
	`status` text DEFAULT 'SCHEDULED' NOT NULL,
	`result` text,
	`winner_id` text,
	`method` text,
	`finish_round` integer,
	`finish_time` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`fighter_a_id`) REFERENCES `fighters`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`fighter_b_id`) REFERENCES `fighters`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`winner_id`) REFERENCES `fighters`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "fights_distinct_fighters" CHECK("fights"."fighter_a_id" <> "fights"."fighter_b_id"),
	CONSTRAINT "fights_status_check" CHECK("fights"."status" IN ('SCHEDULED','LIVE','COMPLETED','CANCELLED')),
	CONSTRAINT "fights_rounds_valid" CHECK("fights"."scheduled_rounds" IN (1,2,3,5)),
	CONSTRAINT "fights_finish_round_valid" CHECK("fights"."finish_round" IS NULL OR "fights"."finish_round" BETWEEN 1 AND 5),
	CONSTRAINT "fights_finish_time_format" CHECK("fights"."finish_time" IS NULL OR "fights"."finish_time" GLOB '[0-9]:[0-5][0-9]')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fights_event_order_unique` ON `fights` (`event_id`,`fight_order`);--> statement-breakpoint
CREATE INDEX `fights_event_idx` ON `fights` (`event_id`);--> statement-breakpoint
CREATE INDEX `fights_fighter_a_idx` ON `fights` (`fighter_a_id`);--> statement-breakpoint
CREATE INDEX `fights_fighter_b_idx` ON `fights` (`fighter_b_id`);--> statement-breakpoint
CREATE INDEX `fights_division_idx` ON `fights` (`division_id`);--> statement-breakpoint
CREATE INDEX `fights_status_idx` ON `fights` (`status`);--> statement-breakpoint
CREATE INDEX `fights_winner_idx` ON `fights` (`winner_id`);--> statement-breakpoint
CREATE TABLE `judge_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`fight_id` text NOT NULL,
	`judge_name` text NOT NULL,
	`fighter_a_score` integer NOT NULL,
	`fighter_b_score` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`fight_id`) REFERENCES `fights`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "judge_scores_range" CHECK("judge_scores"."fighter_a_score" BETWEEN 6 AND 10 AND "judge_scores"."fighter_b_score" BETWEEN 6 AND 10)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `judge_scores_fight_judge_unique` ON `judge_scores` (`fight_id`,`judge_name`);--> statement-breakpoint
CREATE INDEX `judge_scores_fight_idx` ON `judge_scores` (`fight_id`);--> statement-breakpoint
CREATE TABLE `rankings` (
	`id` text PRIMARY KEY NOT NULL,
	`promotion_id` text NOT NULL,
	`division_id` text NOT NULL,
	`fighter_id` text NOT NULL,
	`rank` integer DEFAULT 0 NOT NULL,
	`is_champion` integer DEFAULT false NOT NULL,
	`ranking_date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`fighter_id`) REFERENCES `fighters`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "rankings_rank_valid" CHECK("rankings"."rank" >= 0),
	CONSTRAINT "rankings_champion_rank_zero" CHECK(("rankings"."is_champion" = 1 AND "rankings"."rank" = 0) OR ("rankings"."is_champion" = 0 AND "rankings"."rank" >= 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rankings_division_date_fighter_unique` ON `rankings` (`division_id`,`ranking_date`,`fighter_id`);--> statement-breakpoint
CREATE INDEX `rankings_promotion_division_date_idx` ON `rankings` (`promotion_id`,`division_id`,`ranking_date`);--> statement-breakpoint
CREATE INDEX `rankings_fighter_idx` ON `rankings` (`fighter_id`);