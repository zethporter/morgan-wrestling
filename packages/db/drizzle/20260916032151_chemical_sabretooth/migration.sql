CREATE TABLE `settings` (
	`id` text PRIMARY KEY,
	`home_content` text,
	`home_content_metadata` text,
	`default_calendar` text,
	CONSTRAINT `fk_settings_default_calendar_calendars_id_fk` FOREIGN KEY (`default_calendar`) REFERENCES `calendars`(`id`)
);
