CREATE TABLE `auth_handoffs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codeHash` varchar(64) NOT NULL,
	`openId` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auth_handoffs_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_handoffs_codeHash_unique` UNIQUE(`codeHash`)
);
--> statement-breakpoint
CREATE INDEX `auth_handoffs_expiry_idx` ON `auth_handoffs` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `auth_handoffs_user_idx` ON `auth_handoffs` (`openId`);