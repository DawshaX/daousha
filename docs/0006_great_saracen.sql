ALTER TABLE `publishing_policies` ADD `dailyShortTarget` int DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE `publishing_policies` ADD `dailyLongTarget` int DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE `video_projects` ADD `contentFormat` enum('short','long') DEFAULT 'short' NOT NULL;--> statement-breakpoint
ALTER TABLE `video_projects` ADD `parentProjectId` int;