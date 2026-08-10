-- Add support chat tables to an existing Campus Marketplace database.
-- This migration is additive and does not change listing conversations or messages.

USE `campus_marketplace`;

CREATE TABLE IF NOT EXISTS `Support_conversation` (
    `support_conversation_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `support_status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_support_conversation_user` FOREIGN KEY (`user_id`)
        REFERENCES `User` (`user_id`),
    CONSTRAINT `uq_support_conversation_user` UNIQUE (`user_id`),
    INDEX `idx_support_conversation_status_updated` (`support_status`, `updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Support_message` (
    `support_message_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `support_conversation_id` INT UNSIGNED NOT NULL,
    `sender_id` INT UNSIGNED NOT NULL,
    `content` VARCHAR(2000) NOT NULL,
    `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `read_at` TIMESTAMP NULL DEFAULT NULL,

    CONSTRAINT `fk_support_message_conversation` FOREIGN KEY (`support_conversation_id`)
        REFERENCES `Support_conversation` (`support_conversation_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_support_message_sender` FOREIGN KEY (`sender_id`)
        REFERENCES `User` (`user_id`),
    INDEX `idx_support_message_conversation_sent`
        (`support_conversation_id`, `sent_at`, `support_message_id`),
    INDEX `idx_support_message_read`
        (`read_at`, `support_conversation_id`, `sender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CREATE TABLE IF NOT EXISTS does not add new indexes to an existing table.
-- Add the read-state index separately when upgrading an earlier support schema.
SET @support_read_index_exists = (
    SELECT COUNT(*)
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'Support_message'
       AND index_name = 'idx_support_message_read'
);
SET @support_read_index_sql = IF(
    @support_read_index_exists = 0,
    'CREATE INDEX `idx_support_message_read` ON `Support_message` (`read_at`, `support_conversation_id`, `sender_id`)',
    'SELECT 1'
);
PREPARE support_read_index_statement FROM @support_read_index_sql;
EXECUTE support_read_index_statement;
DEALLOCATE PREPARE support_read_index_statement;

-- Verify both table definitions after the migration completes.
SHOW CREATE TABLE `Support_conversation`;
SHOW CREATE TABLE `Support_message`;
