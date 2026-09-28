CREATE TABLE `trivia_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`answer` text NOT NULL,
	`is_correct` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `trivia_questions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "trivia_answers_is_correct_0_1" CHECK("trivia_answers"."is_correct" IN (0,1))
);
--> statement-breakpoint
CREATE INDEX `trivia_answers_question_idx` ON `trivia_answers` (`question_id`);--> statement-breakpoint
CREATE TABLE `trivia_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`selected_answer_id` text NOT NULL,
	`is_correct` integer NOT NULL,
	`points_earned` integer DEFAULT 0 NOT NULL,
	`response_time_ms` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `trivia_questions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`selected_answer_id`) REFERENCES `trivia_answers`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "trivia_attempts_response_time_range" CHECK("trivia_attempts"."response_time_ms" IS NULL OR "trivia_attempts"."response_time_ms" BETWEEN 0 AND 600000),
	CONSTRAINT "trivia_attempts_points_non_negative" CHECK("trivia_attempts"."points_earned" >= 0)
);
--> statement-breakpoint
CREATE INDEX `trivia_attempts_user_created_idx` ON `trivia_attempts` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `trivia_attempts_question_idx` ON `trivia_attempts` (`question_id`);--> statement-breakpoint
CREATE TABLE `trivia_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trivia_categories_slug_unique` ON `trivia_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `trivia_daily_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `trivia_questions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "trivia_daily_date_format" CHECK("trivia_daily_schedules"."scheduled_date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trivia_daily_question_date_unique` ON `trivia_daily_schedules` (`question_id`,`scheduled_date`);--> statement-breakpoint
CREATE INDEX `trivia_daily_date_order_idx` ON `trivia_daily_schedules` (`scheduled_date`,`sort_order`);--> statement-breakpoint
CREATE TABLE `trivia_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`question` text NOT NULL,
	`difficulty` text DEFAULT 'MEDIUM' NOT NULL,
	`explanation` text,
	`points` integer DEFAULT 10 NOT NULL,
	`image_url` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `trivia_categories`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "trivia_questions_difficulty_check" CHECK("trivia_questions"."difficulty" IN ('EASY','MEDIUM','HARD','EXPERT')),
	CONSTRAINT "trivia_questions_points_positive" CHECK("trivia_questions"."points" > 0)
);
--> statement-breakpoint
CREATE INDEX `trivia_questions_category_idx` ON `trivia_questions` (`category_id`);--> statement-breakpoint
CREATE INDEX `trivia_questions_difficulty_idx` ON `trivia_questions` (`difficulty`);--> statement-breakpoint
CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`xp_reward` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "achievements_xp_non_negative" CHECK("achievements"."xp_reward" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `achievements_slug_unique` ON `achievements` (`slug`);--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`user_id` text NOT NULL,
	`achievement_id` text NOT NULL,
	`unlocked_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`user_id`, `achievement_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_achievements_achievement_idx` ON `user_achievements` (`achievement_id`);--> statement-breakpoint
CREATE TABLE `battle_predictions` (
	`battle_id` text NOT NULL,
	`prediction_id` text NOT NULL,
	PRIMARY KEY(`battle_id`, `prediction_id`),
	FOREIGN KEY (`battle_id`) REFERENCES `battles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prediction_id`) REFERENCES `predictions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `battle_predictions_prediction_idx` ON `battle_predictions` (`prediction_id`);--> statement-breakpoint
CREATE TABLE `battles` (
	`id` text PRIMARY KEY NOT NULL,
	`host_id` text NOT NULL,
	`guest_id` text NOT NULL,
	`event_id` text NOT NULL,
	`host_score` integer DEFAULT 0 NOT NULL,
	`guest_score` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`guest_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "battles_distinct_users" CHECK("battles"."host_id" <> "battles"."guest_id"),
	CONSTRAINT "battles_scores_non_negative" CHECK("battles"."host_score" >= 0 AND "battles"."guest_score" >= 0)
);
--> statement-breakpoint
CREATE INDEX `battles_host_idx` ON `battles` (`host_id`);--> statement-breakpoint
CREATE INDEX `battles_guest_idx` ON `battles` (`guest_id`);--> statement-breakpoint
CREATE INDEX `battles_event_idx` ON `battles` (`event_id`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`parent_id` text,
	`body` text NOT NULL,
	`status` text DEFAULT 'VISIBLE' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "comments_entity_type_check" CHECK("comments"."entity_type" IN ('ARTICLE','FIGHT','EVENT','PREDICTION')),
	CONSTRAINT "comments_status_check" CHECK("comments"."status" IN ('VISIBLE','PENDING','HIDDEN','DELETED')),
	CONSTRAINT "comments_body_not_blank" CHECK(length(trim("comments"."body")) > 0)
);
--> statement-breakpoint
CREATE INDEX `comments_entity_idx` ON `comments` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `comments_user_idx` ON `comments` (`user_id`);--> statement-breakpoint
CREATE INDEX `comments_parent_idx` ON `comments` (`parent_id`);--> statement-breakpoint
CREATE TABLE `follows` (
	`user_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`user_id`, `target_type`, `target_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "follows_target_type_check" CHECK("follows"."target_type" IN ('FIGHTER','EVENT'))
);
--> statement-breakpoint
CREATE INDEX `follows_target_idx` ON `follows` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`payload` text,
	`read_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_unread_idx` ON `notifications` (`user_id`,`read_at`);--> statement-breakpoint
CREATE INDEX `notifications_user_created_idx` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `prediction_reactions` (
	`prediction_id` text NOT NULL,
	`user_id` text NOT NULL,
	`kind` text DEFAULT 'UPVOTE' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`prediction_id`, `user_id`, `kind`),
	FOREIGN KEY (`prediction_id`) REFERENCES `predictions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "prediction_reactions_kind_check" CHECK("prediction_reactions"."kind" IN ('UPVOTE','DOWNVOTE','INSIGHTFUL'))
);
--> statement-breakpoint
CREATE INDEX `prediction_reactions_user_idx` ON `prediction_reactions` (`user_id`);--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`width` integer,
	`height` integer,
	`alt` text,
	`uploaded_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "media_assets_byte_size_non_negative" CHECK("media_assets"."byte_size" >= 0),
	CONSTRAINT "media_assets_dimensions_valid" CHECK(("media_assets"."width" IS NULL OR "media_assets"."width" > 0) AND ("media_assets"."height" IS NULL OR "media_assets"."height" > 0))
);
--> statement-breakpoint
CREATE INDEX `media_assets_object_key_idx` ON `media_assets` (`object_key`);--> statement-breakpoint
CREATE INDEX `media_assets_uploaded_by_idx` ON `media_assets` (`uploaded_by`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`reason` text NOT NULL,
	`details` text,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`resolved_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "reports_status_check" CHECK("reports"."status" IN ('OPEN','REVIEWING','RESOLVED','DISMISSED'))
);
--> statement-breakpoint
CREATE INDEX `reports_status_idx` ON `reports` (`status`);--> statement-breakpoint
CREATE INDEX `reports_entity_idx` ON `reports` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `reports_reporter_idx` ON `reports` (`reporter_id`);