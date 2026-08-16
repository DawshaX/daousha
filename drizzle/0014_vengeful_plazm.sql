CREATE TABLE `assistant_action_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`sessionId` int NOT NULL,
	`summary` text NOT NULL,
	`impact` enum('read','draft','guarded','high') NOT NULL,
	`requiresApproval` boolean NOT NULL DEFAULT false,
	`status` enum('proposed','approved','executing','completed','blocked','failed') NOT NULL DEFAULT 'proposed',
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assistant_action_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assistant_action_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`planId` int NOT NULL,
	`stepOrder` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`toolName` varchar(120) NOT NULL,
	`inputSummary` text,
	`resultSummary` text,
	`status` enum('pending','running','completed','blocked','failed','skipped') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assistant_action_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assistant_audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`sessionId` int,
	`planId` int,
	`stepId` int,
	`actor` enum('user','assistant','system') NOT NULL,
	`action` varchar(160) NOT NULL,
	`target` varchar(255),
	`decision` enum('allowed','approved','blocked','completed','failed') NOT NULL,
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assistant_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assistant_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`ownerId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`displayKind` enum('message','plan','tool_result','notice') NOT NULL DEFAULT 'message',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assistant_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assistant_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`origin` enum('web','telegram') NOT NULL DEFAULT 'web',
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assistant_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `assistant_action_plans_session_created_idx` ON `assistant_action_plans` (`sessionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `assistant_action_plans_owner_status_idx` ON `assistant_action_plans` (`ownerId`,`status`);--> statement-breakpoint
CREATE INDEX `assistant_action_steps_plan_order_idx` ON `assistant_action_steps` (`planId`,`stepOrder`);--> statement-breakpoint
CREATE INDEX `assistant_action_steps_owner_status_idx` ON `assistant_action_steps` (`ownerId`,`status`);--> statement-breakpoint
CREATE INDEX `assistant_audit_events_owner_created_idx` ON `assistant_audit_events` (`ownerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `assistant_audit_events_session_created_idx` ON `assistant_audit_events` (`sessionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `assistant_messages_session_created_idx` ON `assistant_messages` (`sessionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `assistant_messages_owner_created_idx` ON `assistant_messages` (`ownerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `assistant_sessions_owner_updated_idx` ON `assistant_sessions` (`ownerId`,`updatedAt`);