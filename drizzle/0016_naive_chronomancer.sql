CREATE TABLE `telegram_webhook_updates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`updateId` int NOT NULL,
	`ownerId` int NOT NULL,
	`chatId` varchar(80) NOT NULL,
	`status` enum('received','completed','ignored','failed') NOT NULL DEFAULT 'received',
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `telegram_webhook_updates_id` PRIMARY KEY(`id`),
	CONSTRAINT `telegram_webhook_updates_updateId_unique` UNIQUE(`updateId`)
);
--> statement-breakpoint
CREATE INDEX `telegram_webhook_updates_owner_created_idx` ON `telegram_webhook_updates` (`ownerId`,`createdAt`);