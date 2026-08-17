CREATE TABLE `source_health_monitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`scheduleCronTaskUid` varchar(65) NOT NULL,
	`status` enum('unknown','healthy','degraded') NOT NULL DEFAULT 'unknown',
	`lastCheckedAt` timestamp,
	`lastSummary` text,
	`lastNotifiedStatus` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `source_health_monitors_id` PRIMARY KEY(`id`),
	CONSTRAINT `source_health_monitors_scheduleCronTaskUid_unique` UNIQUE(`scheduleCronTaskUid`)
);
--> statement-breakpoint
CREATE INDEX `source_health_monitors_owner_status_idx` ON `source_health_monitors` (`ownerId`,`status`);