-- Seed data for a database created from schema.sql.
-- All three sample accounts use the password: Campus123!

USE `campus_marketplace`;

START TRANSACTION;

INSERT INTO `User`
    (`user_id`, `first_name`, `last_name`, `user_role`, `email_addr`, `password_hash`, `account_status`)
VALUES
    (1, 'Joseph', 'Yang', 'ADMIN', 'sample@gmail.com', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE'),
    (2, 'Mary', 'Chen', 'USER', 'mary@example.com', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE'),
    (3, 'Varleen', 'Singh', 'USER', 'varleen@example.com', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE');

INSERT INTO `Category` (`category_id`, `category_name`)
VALUES
    (1, 'Books & Textbooks'),
    (2, 'Electronics'),
    (3, 'Dorm & Furniture');

INSERT INTO `Department` (`department_id`, `department_name`)
VALUES
    (1, 'Computer Science'),
    (2, 'Business'),
    (3, 'General');

INSERT INTO `Location` (`location_id`, `location_name`)
VALUES
    (1, 'Richmond Campus'),
    (2, 'Surrey Campus'),
    (3, 'Langley Campus');

INSERT INTO `Listing`
    (`listing_id`, `user_id`, `category_id`, `department_id`, `location_id`,
     `listing_title`, `listing_description`, `price`, `listing_condition`, `listing_status`)
VALUES
    (1, 1, 1, 1, 1, 'Calculus Textbook', 'Used calculus textbook in good condition.', 35.00, 'GOOD', 'ACTIVE'),
    (2, 1, 3, 3, 2, 'Office Chair', 'Black adjustable office chair.', 50.00, 'USED', 'ACTIVE'),
    (3, 1, 2, 1, 1, 'Gaming Keyboard', 'Mechanical keyboard with blue switches.', 40.00, 'LIKE NEW', 'ACTIVE');

INSERT INTO `Listing_image`
    (`image_id`, `listing_id`, `image_url`, `display_order`, `is_primary`)
VALUES
    (1, 1, '/pictures/listing-12-1784533102322.jpg', 1, TRUE),
    (2, 3, '/pictures/listing-13-1784533129275.jpg', 1, TRUE);

INSERT INTO `Listing_reaction` (`listing_id`, `user_id`, `reaction_type`)
VALUES (1, 3, 'THUMBSUP');

INSERT INTO `Favorite` (`user_id`, `listing_id`)
VALUES (2, 1);

INSERT INTO `Review`
    (`review_id`, `rating`, `comment`, `reviewer_user_id`, `reviewed_user_id`, `listing_id`)
VALUES
    (1, 5, 'The item matched the description and pickup was easy.', 2, 1, 1);

INSERT INTO `Conversation`
    (`conversation_id`, `listing_id`, `buyer_id`, `seller_id`)
VALUES
    (1, 1, 2, 1);

INSERT INTO `Message`
    (`message_id`, `conversation_id`, `sender_id`, `content`, `message_status`)
VALUES
    (1, 1, 2, 'Hi, is the textbook still available?', 'READ'),
    (2, 1, 1, 'Yes, it is still available.', 'DELIVERED');

INSERT INTO `Report`
    (`report_id`, `reason`, `reporter_id`, `target_user_id`, `listing_id`)
VALUES
    (1, 'The listing appears to be posted in the wrong category.', 3, 1, 2);

COMMIT;
