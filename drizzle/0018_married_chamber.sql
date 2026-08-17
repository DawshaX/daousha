CREATE TABLE `telegram_owner_bindings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`chatId` varchar(80),
	`pairingCodeHash` varchar(128),
	`status` enum('pending','paired','revoked') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp,
	`pairedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `telegram_owner_bindings_id` PRIMARY KEY(`id`),
	CONSTRAINT `telegram_owner_bindings_ownerId_unique` UNIQUE(`ownerId`)
);
--> statement-breakpoint
CREATE INDEX `telegram_owner_bindings_chat_status_idx` ON `telegram_owner_bindings` (`chatId`,`status`);