CREATE TABLE `analytics_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int,
	`platform` varchar(80) NOT NULL,
	`views` int NOT NULL DEFAULT 0,
	`engagements` int NOT NULL DEFAULT 0,
	`retentionRate` int NOT NULL DEFAULT 0,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`assetKind` enum('video','audio','image','document','other') NOT NULL,
	`storageKey` varchar(1024),
	`storageUrl` varchar(1500),
	`sourceUrl` varchar(1500),
	`licenseType` varchar(160) NOT NULL,
	`licenseUrl` varchar(1500),
	`attribution` text,
	`licenseStatus` enum('pending','approved','held','rejected') NOT NULL DEFAULT 'pending',
	`safetyStatus` enum('clear','review','blocked') NOT NULL DEFAULT 'review',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`url` varchar(1000) NOT NULL,
	`sourceKind` enum('trend','asset','audio','reference') NOT NULL,
	`language` enum('ar','en','both') NOT NULL DEFAULT 'both',
	`trustStatus` enum('proposed','approved','held','rejected') NOT NULL DEFAULT 'proposed',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `development_proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`proposalKind` enum('source','workflow','integration','model','safety_rule') NOT NULL,
	`title` varchar(255) NOT NULL,
	`rationale` text NOT NULL,
	`referenceUrl` varchar(1500),
	`state` enum('proposed','approved','rejected') NOT NULL DEFAULT 'proposed',
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `development_proposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`assetId` int NOT NULL,
	`clipRole` enum('primary','broll','audio','reference') NOT NULL DEFAULT 'broll',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`brief` text,
	`targetLanguage` enum('ar','en','both') NOT NULL DEFAULT 'both',
	`status` enum('idea','research','script','production','review','approved','scheduled','published','blocked') NOT NULL DEFAULT 'idea',
	`scriptArabic` text,
	`scriptEnglish` text,
	`humanApprovedAt` timestamp,
	`scheduledAt` timestamp,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int,
	`taskKind` enum('trend_scan','script','translation','rights_check','safety_check','render','publish') NOT NULL,
	`status` enum('queued','running','needs_review','completed','failed','blocked') NOT NULL DEFAULT 'queued',
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflow_tasks_id` PRIMARY KEY(`id`)
);
