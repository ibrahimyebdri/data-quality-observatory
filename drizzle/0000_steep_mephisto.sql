CREATE TABLE `datasets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`sourceFileKey` varchar(512) NOT NULL,
	`sourceFileUrl` varchar(1024) NOT NULL,
	`rowCount` int NOT NULL DEFAULT 0,
	`columnCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `datasets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quality_findings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`ruleCode` varchar(64) NOT NULL,
	`ruleName` varchar(255) NOT NULL,
	`dimension` enum('completeness','validity','integrity','freshness','consistency') NOT NULL,
	`status` enum('passed','review','failed') NOT NULL,
	`fieldName` varchar(255) NOT NULL,
	`affectedRows` int NOT NULL,
	`evaluatedRows` int NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quality_findings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quality_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`runId` int,
	`kind` enum('run_completed','quality_alert') NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quality_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quality_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`datasetId` int NOT NULL,
	`ownerId` int NOT NULL,
	`status` enum('succeeded','failed') NOT NULL,
	`qualityScore` int NOT NULL,
	`rowsProfiled` int NOT NULL,
	`columnsProfiled` int NOT NULL,
	`durationMs` int NOT NULL,
	`reportJson` text NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quality_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `datasets` ADD CONSTRAINT `datasets_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quality_findings` ADD CONSTRAINT `quality_findings_runId_quality_runs_id_fk` FOREIGN KEY (`runId`) REFERENCES `quality_runs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quality_notifications` ADD CONSTRAINT `quality_notifications_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quality_notifications` ADD CONSTRAINT `quality_notifications_runId_quality_runs_id_fk` FOREIGN KEY (`runId`) REFERENCES `quality_runs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quality_runs` ADD CONSTRAINT `quality_runs_datasetId_datasets_id_fk` FOREIGN KEY (`datasetId`) REFERENCES `datasets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quality_runs` ADD CONSTRAINT `quality_runs_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `datasets_owner_idx` ON `datasets` (`ownerId`);--> statement-breakpoint
CREATE INDEX `quality_findings_run_idx` ON `quality_findings` (`runId`);--> statement-breakpoint
CREATE INDEX `quality_notifications_owner_idx` ON `quality_notifications` (`ownerId`);--> statement-breakpoint
CREATE INDEX `quality_runs_dataset_idx` ON `quality_runs` (`datasetId`);--> statement-breakpoint
CREATE INDEX `quality_runs_owner_idx` ON `quality_runs` (`ownerId`);