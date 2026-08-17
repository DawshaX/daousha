CREATE TABLE `assistant_memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`kind` enum('preference','project','rule','decision') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assistant_memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_playbook_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playbookId` int NOT NULL,
	`stepOrder` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`toolName` varchar(120) NOT NULL,
	`inputTemplate` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_playbook_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_playbooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`impact` enum('read','draft','guarded','high') NOT NULL DEFAULT 'draft',
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_playbooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playbook_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`playbookId` int NOT NULL,
	`sessionId` int,
	`status` enum('queued','running','completed','blocked','failed') NOT NULL DEFAULT 'queued',
	`resultSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `playbook_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `assistant_memories_owner_kind_updated_idx` ON `assistant_memories` (`ownerId`,`kind`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `content_playbook_steps_playbook_order_idx` ON `content_playbook_steps` (`playbookId`,`stepOrder`);--> statement-breakpoint
CREATE INDEX `content_playbooks_owner_updated_idx` ON `content_playbooks` (`ownerId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `playbook_runs_owner_created_idx` ON `playbook_runs` (`ownerId`,`createdAt`);