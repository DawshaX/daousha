CREATE TABLE `assistant_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`sessionId` int NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`url` varchar(700) NOT NULL,
	`filename` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assistant_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assistant_knowledge_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`category` enum('identity','rights','safety','workflow','distribution') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`sourceUrl` varchar(700),
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assistant_knowledge_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `assistant_attachments_session_created_idx` ON `assistant_attachments` (`sessionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `assistant_attachments_owner_created_idx` ON `assistant_attachments` (`ownerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `assistant_knowledge_owner_category_updated_idx` ON `assistant_knowledge_items` (`ownerId`,`category`,`updatedAt`);