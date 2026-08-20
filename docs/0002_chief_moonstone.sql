CREATE TABLE `publishing_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int NOT NULL,
	`platform` varchar(80) NOT NULL,
	`cronExpression` varchar(80) NOT NULL,
	`timeZone` varchar(80) NOT NULL DEFAULT 'UTC',
	`scheduleCronTaskUid` varchar(65),
	`status` enum('draft','paused','active','needs_approval','failed') NOT NULL DEFAULT 'draft',
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publishing_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_change_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`proposalId` int,
	`category` enum('source','workflow','integration','model','safety_rule','schedule') NOT NULL,
	`summary` varchar(255) NOT NULL,
	`details` text,
	`actorType` enum('user','system','scheduled_job') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `system_change_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `publishing_schedules_task_uid_idx` ON `publishing_schedules` (`scheduleCronTaskUid`);