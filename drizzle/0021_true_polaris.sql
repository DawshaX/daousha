CREATE TABLE `dawsha_engine_monitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`status` enum('active','paused','error') NOT NULL DEFAULT 'paused',
	`lastRunAt` timestamp,
	`lastProjectId` int,
	`lastSignalTitle` varchar(255),
	`lastSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dawsha_engine_monitors_id` PRIMARY KEY(`id`),
	CONSTRAINT `dawsha_engine_monitors_ownerId_unique` UNIQUE(`ownerId`)
);
--> statement-breakpoint
CREATE INDEX `dawsha_engine_monitors_task_uid_idx` ON `dawsha_engine_monitors` (`scheduleCronTaskUid`);