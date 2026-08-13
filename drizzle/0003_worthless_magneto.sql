CREATE TABLE `channel_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`platform` enum('youtube','telegram') NOT NULL,
	`label` varchar(160) NOT NULL,
	`externalAccountRef` varchar(320),
	`status` enum('disconnected','configured','authorized','error') NOT NULL DEFAULT 'disconnected',
	`scopeSummary` text,
	`lastVerifiedAt` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channel_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `channel_connections_owner_platform_idx` UNIQUE(`ownerId`,`platform`)
);
--> statement-breakpoint
CREATE TABLE `notification_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`publishingRunId` int,
	`channel` enum('telegram') NOT NULL DEFAULT 'telegram',
	`eventType` varchar(120) NOT NULL,
	`deliveryStatus` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`detail` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `publishing_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`mode` enum('human_review','guarded_auto') NOT NULL DEFAULT 'human_review',
	`publicPublishingEnabled` boolean NOT NULL DEFAULT false,
	`killSwitchEnabled` boolean NOT NULL DEFAULT true,
	`requirePrivateCanary` boolean NOT NULL DEFAULT true,
	`minIntervalMinutes` int NOT NULL DEFAULT 10,
	`maxPublicationsPerDay` int NOT NULL DEFAULT 6,
	`lastPublishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publishing_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `publishing_policies_ownerId_unique` UNIQUE(`ownerId`)
);
--> statement-breakpoint
CREATE TABLE `publishing_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int,
	`platform` varchar(80) NOT NULL,
	`status` enum('queued','blocked','private_uploaded','public_uploaded','failed','skipped') NOT NULL DEFAULT 'queued',
	`visibility` enum('private','public') NOT NULL DEFAULT 'private',
	`decisionReason` text NOT NULL,
	`externalVideoId` varchar(160),
	`externalUrl` varchar(1500),
	`initiatedBy` enum('user','system','scheduled_job') NOT NULL DEFAULT 'system',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publishing_runs_id` PRIMARY KEY(`id`)
);
