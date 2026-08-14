CREATE TABLE `domain_monitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`domain` varchar(253) NOT NULL,
	`status` enum('pending','delegated') NOT NULL DEFAULT 'pending',
	`lastNotifiedStatus` enum('pending','delegated'),
	`scheduleCronTaskUid` varchar(65),
	`lastCheckedAt` timestamp,
	`lastDetail` text,
	`lastNotificationAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `domain_monitors_id` PRIMARY KEY(`id`),
	CONSTRAINT `domain_monitors_ownerId_unique` UNIQUE(`ownerId`)
);
--> statement-breakpoint
CREATE INDEX `domain_monitors_task_uid_idx` ON `domain_monitors` (`scheduleCronTaskUid`);