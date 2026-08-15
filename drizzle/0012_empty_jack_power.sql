CREATE TABLE `upload_metadata_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int NOT NULL,
	`assetId` int NOT NULL,
	`platform` enum('youtube') NOT NULL DEFAULT 'youtube',
	`visibility` enum('private') NOT NULL DEFAULT 'private',
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`tagsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upload_metadata_drafts_id` PRIMARY KEY(`id`),
	CONSTRAINT `upload_metadata_drafts_owner_project_asset_idx` UNIQUE(`ownerId`,`projectId`,`assetId`)
);
