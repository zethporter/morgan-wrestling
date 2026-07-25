CREATE TABLE `calendar_event_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL UNIQUE,
	`calendar_id` text NOT NULL,
	`icon_type` text DEFAULT 'NONE' NOT NULL,
	`icon` text,
	`color` text,
	CONSTRAINT `fk_calendar_event_types_calendar_id_calendars_id_fk` FOREIGN KEY (`calendar_id`) REFERENCES `calendars`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`title` text NOT NULL,
	`description` text,
	`location` text,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`all_day` integer DEFAULT false NOT NULL,
	`calendar_id` text NOT NULL,
	`event_type_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`created_by` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()),
	`updated_by` text NOT NULL,
	CONSTRAINT `fk_calendar_events_calendar_id_calendars_id_fk` FOREIGN KEY (`calendar_id`) REFERENCES `calendars`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_calendar_events_event_type_id_calendar_event_types_id_fk` FOREIGN KEY (`event_type_id`) REFERENCES `calendar_event_types`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `calendars` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE,
	`color` text,
	`created_at` integer DEFAULT (unixepoch()),
	`created_by` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()),
	`updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quick_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`created_by` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()),
	`updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`team_id` text NOT NULL,
	`title` text NOT NULL,
	`sequence_number` integer NOT NULL,
	`content` text,
	`created_at` integer DEFAULT (unixepoch()),
	`created_by` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()),
	`updated_by` text NOT NULL,
	CONSTRAINT `fk_team_pages_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `team_quick_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`team_id` text,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`created_by` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()),
	`updated_by` text NOT NULL,
	CONSTRAINT `fk_team_quick_links_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`home_content` text,
	`default_calendar_id` text,
	CONSTRAINT `fk_teams_default_calendar_id_calendars_id_fk` FOREIGN KEY (`default_calendar_id`) REFERENCES `calendars`(`id`) ON DELETE SET NULL
);
