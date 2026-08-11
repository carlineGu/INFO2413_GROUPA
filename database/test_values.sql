-- Seed data for a database created from schema.sql.
-- This file reflects the current persisted app data used during local testing.

USE `campus_marketplace`;

START TRANSACTION;

INSERT INTO `User`
    (`user_id`, `first_name`, `last_name`, `user_role`, `email_addr`, `password_hash`, `account_status`, `department`)
VALUES
    (1, 'Joseph', 'Yang', 'ADMIN', 'sample@gmail.com', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'SUSPENDED', 'No Department'),
    (2, 'Mary', 'Chen', 'USER', 'mary@example.com', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE', 'No Department'),
    (3, 'Varleen', 'Kaur', 'USER', 'varleen@example.com', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE', 'No Department'),
    (4, 'admin', '', 'ADMIN', 'admin', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE', 'No Department'),
    (5, 'Sua', 'Han', 'USER', 'sua.hanh@student.kpu.ca', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE', 'No Department'),
    (6, 'Martin', 'Freedman', 'USER', 'martin.freedman@kpu.ca', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE', 'No Department'),
    (8, 'Mike', 'Greenwood', 'USER', 'mike.greenwood@student.kpu.ca', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE', 'No Department'),
    (9, 'Cindy', 'Ling', 'USER', 'cindy.ling@kpu.ca', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'SUSPENDED', 'No Department'),
    (10, 'John', 'Smith', 'USER', 'john.smith@student.kpu.ca', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE', 'No Department'),
    (13, 'bloom', 'gloom', 'USER', 'bloom@student.kpu.ca', '$2b$12$1M8dgF/deOVqzpTMjc0pQ.FVEP.2KJOiKrl5QeV7RFb2jYOT/vcX.', 'INACTIVE', 'No Department'),
    (14, 'jenny', 'john', 'USER', 'jenny@student.kpu.ca', '$2b$12$Iec6gFMWa63e5Ivcl16pC.kfaCaN1/S7upoUWI4zZkxsWXoAFBNDy', 'INACTIVE', 'No Department'),
    (16, 'Varleen', 'Jaswal', 'USER', 'varleen.jaswal@student.kpu.ca', '$2b$12$Y7TPX9gzMkrBxTxxsQnTDuc607kZp0ZjFDQpYToWOenO4BlL3YCzK', 'INACTIVE', 'No Department'),
    (17, 'Navneet', 'Grewal', 'USER', 'navneet.grewal7@student.kpu.ca', '$2b$12$dU1VwN8r0/umCErQxC6R4.aeFuWHZfxulc2uvYmd9wbMUrQqNMUfW', 'ACTIVE', 'No Department');

INSERT INTO `Category` (`category_id`, `category_name`)
VALUES
    (1, 'Books & Textbooks'),
    (2, 'Electronics'),
    (3, 'Dorm & Furniture'),
    (4, 'Clothing & Accessories'),
    (5, 'School Supplies'),
    (6, 'Services');

INSERT INTO `Department` (`department_id`, `department_name`)
VALUES
    (1, 'Business'),
    (2, 'Nursing'),
    (3, 'Criminology'),
    (4, 'Computing Science'),
    (5, 'Arts'),
    (6, 'Health Sciences'),
    (7, 'Trades & Technology'),
    (8, 'Design'),
    (9, 'Education');

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
    (2, 1, 3, 3, 2, 'Office Chair', 'Black adjustable office chair.', 50.00, 'USED', 'REMOVED'),
    (3, 1, 2, 1, 1, 'Gaming Keyboard', 'Mechanical keyboard with blue switches.', 40.00, 'LIKE NEW', 'REMOVED'),
    (7, 6, 1, 1, 1, 'Physics Textbook', 'Used physics textbook in good condition.', 35.00, 'GOOD', 'ACTIVE'),
    (8, 8, 1, 3, 2, 'Law Textbook', 'Used law textbook in good condition.', 25.00, 'GOOD', 'ACTIVE'),
    (9, 9, 1, 1, 1, 'None Title Textbook', 'hgfjlkdsfef.', 40000.00, 'NEW', 'REMOVED'),
    (10, 4, 2, 1, 1, 'Used Laptop', 'Pretty new laptop.', 1000.00, 'LIKE NEW', 'REMOVED'),
    (11, 3, 2, 1, 3, 'Used IPhone', 'Brand new iphone, never been unboxed', 1600.00, 'NEW', 'REMOVED'),
    (12, 8, 1, 3, 3, 'Principles of Economics', 'Rarely used course textbook for PHIL 3303', 30.00, 'LIKE NEW', 'REMOVED'),
    (13, 3, 2, 3, 2, 'Iphone', 'Lightly used phone', 800.00, 'LIKE NEW', 'ACTIVE'),
    (14, 3, 2, 3, 1, 'Laptop', 'Very used laptop. Is functional', 500.00, 'USED', 'ACTIVE'),
    (15, 3, 1, 2, 1, 'Principles of Economics', 'Lightly used textbook', 45.00, 'NEW', 'ACTIVE'),
    (16, 3, 3, 3, 3, 'Dorm Desk', 'Hand-built', 500.00, 'NEW', 'ACTIVE'),
    (17, 3, 1, 3, 1, 'Law 1101 - Notes', 'Hand-made class notes. PDF form', 25.00, 'GOOD', 'ACTIVE'),
    (18, 3, 3, 3, 2, 'Dorm for Rent', 'Dorm for rent near Surrey Campus', 750.00, 'GOOD', 'ACTIVE'),
    (19, 3, 4, 3, 3, 'Outfit Bundle', 'Clothing bundle', 35.00, 'USED', 'ACTIVE');

INSERT INTO `Listing_image`
    (`image_id`, `listing_id`, `image_url`, `display_order`, `is_primary`)
VALUES
    (1, 1, '/pictures/listing-12-1784533102322.jpg', 1, TRUE),
    (2, 3, '/pictures/listing-13-1784533129275.jpg', 1, TRUE),
    (7, 7, '/pictures/physics_textbook.jpg', 1, TRUE),
    (8, 8, '/pictures/law_textbook.jpg', 1, TRUE),
    (9, 9, '/pictures/none_title_textbook.jpg', 1, TRUE),
    (10, 10, '/pictures/listing-10-8a293972-8fef-4a96-ad4d-3ac2ceb6001d.webp', 1, TRUE),
    (11, 11, '/pictures/listing-11-a379bef5-d74d-4f54-9e99-6b5e236c7e36.png', 1, TRUE),
    (12, 12, '/pictures/listing-12-131e3072-23a7-4cc2-b5d7-a41e8d9a413a.webp', 1, TRUE),
    (13, 13, '/pictures/listing-13-6389cc7b-1ae0-4140-931d-609f42913a65.png', 1, TRUE),
    (14, 14, '/pictures/listing-14-8d0557f4-993a-482b-a285-2ff2520e3e3b.webp', 1, TRUE),
    (15, 15, '/pictures/listing-15-42d2f376-9288-4cbe-82c4-ec682e32f0c7.webp', 1, TRUE),
    (16, 16, '/pictures/listing-16-b39d6aa9-ebf3-40af-aafe-bdbf07422f25.jpg', 1, TRUE),
    (17, 17, '/pictures/listing-17-0248bb18-6d41-4cf2-a0cb-fa3912e73fcd.jpg', 1, TRUE),
    (18, 18, '/pictures/listing-18-4aa9c7f8-cee6-415b-9934-e1cf24860670.png', 1, TRUE),
    (19, 19, '/pictures/listing-19-1b007926-7895-4c61-ba21-d83194b77fc4.webp', 1, TRUE);

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
