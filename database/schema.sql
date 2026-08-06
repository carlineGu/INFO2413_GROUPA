-- Campus Marketplace database schema
-- This script is intended for a fresh database. It never drops an existing database.

CREATE DATABASE IF NOT EXISTS `campus_marketplace`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `campus_marketplace`;

-- Independent tables must be created before tables that reference them.
CREATE TABLE `User` (
    `user_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `user_role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `email_addr` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `account_status` ENUM('SUSPENDED', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'INACTIVE',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Category` (
    `category_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `category_name` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Department` (
    `department_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `department_name` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Location` (
    `location_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `location_name` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Listing` (
    `listing_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `category_id` INT UNSIGNED NOT NULL,
    `department_id` INT UNSIGNED NOT NULL,
    `location_id` INT UNSIGNED NOT NULL,
    `listing_title` VARCHAR(100) NOT NULL,
    `listing_description` TEXT,
    `price` DECIMAL(10, 2) NOT NULL,
    `listing_condition` ENUM('NEW', 'LIKE NEW', 'GOOD', 'FAIR', 'USED') NOT NULL,
    `listing_status` ENUM('ACTIVE', 'SOLD', 'RESERVED', 'REMOVED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `chk_listing_price` CHECK (`price` > 0),
    CONSTRAINT `fk_listing_user` FOREIGN KEY (`user_id`) REFERENCES `User` (`user_id`),
    CONSTRAINT `fk_listing_category` FOREIGN KEY (`category_id`) REFERENCES `Category` (`category_id`),
    CONSTRAINT `fk_listing_department` FOREIGN KEY (`department_id`) REFERENCES `Department` (`department_id`),
    CONSTRAINT `fk_listing_location` FOREIGN KEY (`location_id`) REFERENCES `Location` (`location_id`),
    CONSTRAINT `uq_listing_owner` UNIQUE (`listing_id`, `user_id`),
    INDEX `idx_listing_status_created` (`listing_status`, `created_at`),
    INDEX `idx_listing_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Listing_image` (
    `image_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `listing_id` INT UNSIGNED NOT NULL,
    `image_url` VARCHAR(255) NOT NULL,
    `display_order` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT `chk_listing_image_display_order` CHECK (`display_order` >= 1),
    CONSTRAINT `chk_listing_image_primary_flag` CHECK (`is_primary` IN (FALSE, TRUE)),
    CONSTRAINT `fk_listing_image_listing` FOREIGN KEY (`listing_id`)
        REFERENCES `Listing` (`listing_id`) ON DELETE CASCADE,
    CONSTRAINT `uq_listing_image_order` UNIQUE (`listing_id`, `display_order`),
    CONSTRAINT `uq_listing_image_url` UNIQUE (`listing_id`, `image_url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Listing_reaction` (
    `listing_id` INT UNSIGNED NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    `reaction_type` ENUM('HEART', 'THUMBSUP', 'LAUGH', 'SOB', 'ANGRY') NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`listing_id`, `user_id`),
    CONSTRAINT `fk_listing_reaction_listing` FOREIGN KEY (`listing_id`)
        REFERENCES `Listing` (`listing_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_listing_reaction_user` FOREIGN KEY (`user_id`)
        REFERENCES `User` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Review` (
    `review_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `rating` TINYINT UNSIGNED NOT NULL,
    `comment` TEXT,
    `reviewer_user_id` INT UNSIGNED NOT NULL,
    `reviewed_user_id` INT UNSIGNED NOT NULL,
    `listing_id` INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `chk_review_rating` CHECK (`rating` BETWEEN 1 AND 5),
    CONSTRAINT `chk_review_different_users` CHECK (`reviewer_user_id` <> `reviewed_user_id`),
    CONSTRAINT `fk_review_reviewer` FOREIGN KEY (`reviewer_user_id`) REFERENCES `User` (`user_id`),
    CONSTRAINT `fk_review_reviewed_user` FOREIGN KEY (`reviewed_user_id`) REFERENCES `User` (`user_id`),
    CONSTRAINT `fk_review_listing_seller` FOREIGN KEY (`listing_id`, `reviewed_user_id`)
        REFERENCES `Listing` (`listing_id`, `user_id`) ON DELETE CASCADE,
    CONSTRAINT `uq_review_once_per_listing` UNIQUE (`reviewer_user_id`, `reviewed_user_id`, `listing_id`),
    INDEX `idx_review_reviewed_created` (`reviewed_user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Conversation` (
    `conversation_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `listing_id` INT UNSIGNED NOT NULL,
    `buyer_id` INT UNSIGNED NOT NULL,
    `seller_id` INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `chk_conversation_different_users` CHECK (`buyer_id` <> `seller_id`),
    CONSTRAINT `fk_conversation_listing` FOREIGN KEY (`listing_id`)
        REFERENCES `Listing` (`listing_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_conversation_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `User` (`user_id`),
    CONSTRAINT `fk_conversation_seller` FOREIGN KEY (`seller_id`) REFERENCES `User` (`user_id`),
    CONSTRAINT `uq_conversation_participants` UNIQUE (`listing_id`, `buyer_id`, `seller_id`),
    INDEX `idx_conversation_buyer` (`buyer_id`),
    INDEX `idx_conversation_seller` (`seller_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Message` (
    `message_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `conversation_id` INT UNSIGNED NOT NULL,
    `sender_id` INT UNSIGNED NOT NULL,
    `content` TEXT NOT NULL,
    `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `message_status` ENUM('SENT', 'DELIVERED', 'READ') NOT NULL DEFAULT 'SENT',

    CONSTRAINT `fk_message_conversation` FOREIGN KEY (`conversation_id`)
        REFERENCES `Conversation` (`conversation_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_message_sender` FOREIGN KEY (`sender_id`) REFERENCES `User` (`user_id`),
    INDEX `idx_message_conversation_sent` (`conversation_id`, `sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Report` (
    `report_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `reason` TEXT NOT NULL,
    `reporter_id` INT UNSIGNED NOT NULL,
    `target_user_id` INT UNSIGNED NULL,
    `listing_id` INT UNSIGNED NULL,
    `report_status` ENUM('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `chk_report_has_target` CHECK (`target_user_id` IS NOT NULL OR `listing_id` IS NOT NULL),
    CONSTRAINT `chk_reporter_not_target` CHECK (`target_user_id` IS NULL OR `reporter_id` <> `target_user_id`),
    CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `User` (`user_id`),
    CONSTRAINT `fk_report_target_user` FOREIGN KEY (`target_user_id`) REFERENCES `User` (`user_id`),
    CONSTRAINT `fk_report_listing` FOREIGN KEY (`listing_id`) REFERENCES `Listing` (`listing_id`),
    CONSTRAINT `fk_report_listing_seller` FOREIGN KEY (`listing_id`, `target_user_id`)
        REFERENCES `Listing` (`listing_id`, `user_id`),
    INDEX `idx_report_status_created` (`report_status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Transaction` (
    `transaction_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `listing_id` INT UNSIGNED NOT NULL,
    `buyer_id` INT UNSIGNED NOT NULL,
    `seller_id` INT UNSIGNED NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `transaction_status` ENUM('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `chk_transaction_different_users` CHECK (`buyer_id` <> `seller_id`),
    CONSTRAINT `chk_transaction_price` CHECK (`price` >= 0),
    CONSTRAINT `fk_transaction_listing` FOREIGN KEY (`listing_id`) REFERENCES `Listing` (`listing_id`),
    CONSTRAINT `fk_transaction_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `User` (`user_id`),
    CONSTRAINT `fk_transaction_seller` FOREIGN KEY (`seller_id`) REFERENCES `User` (`user_id`),
    CONSTRAINT `uq_transaction_listing` UNIQUE (`listing_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Favorite` (
    `user_id` INT UNSIGNED NOT NULL,
    `listing_id` INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`user_id`, `listing_id`),
    CONSTRAINT `fk_favorite_user` FOREIGN KEY (`user_id`)
        REFERENCES `User` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_favorite_listing` FOREIGN KEY (`listing_id`)
        REFERENCES `Listing` (`listing_id`) ON DELETE CASCADE,
    INDEX `idx_favorite_listing` (`listing_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
