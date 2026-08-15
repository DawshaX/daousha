CREATE TABLE `connection_health_monitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`platform` enum('youtube','facebook','instagram','tiktok') NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`status` enum('healthy','degraded','disconnected') NOT NULL DEFAULT 'degraded',
	`lastNotifiedStatus` enum('healthy','degraded','disconnected'),
	`lastCheckedAt` timestamp,
	`lastNotificationAt` timestamp,
	`lastDetail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connection_health_monitors_id` PRIMARY KEY(`id`),
	CONSTRAINT `connection_health_monitors_owner_platform_idx` UNIQUE(`ownerId`,`platform`)
);
--> statement-breakpoint
CREATE INDEX `connection_health_monitors_task_uid_idx` ON `connection_health_monitors` (`scheduleCronTaskUid`);