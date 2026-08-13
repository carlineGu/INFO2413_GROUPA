-- Seed data for a database created from schema.sql.
-- This file reflects the current persisted app data used during local testing.

USE `campus_marketplace`;

START TRANSACTION;

INSERT INTO `User`
    (`user_id`, `first_name`, `last_name`, `user_role`, `email_addr`, `password_hash`, `account_status`, `department`)
VALUES
    (1, 'Joseph', 'Yang', 'USER', 'joseph.yang@student.kpu.ca', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'SUSPENDED', 'No Department'),
    (2, 'Mary', 'Chen', 'USER', 'mary.chen@student.kpu.ca', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE', 'No Department'),
    (4, 'admin', '', 'ADMIN', 'admin', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE', 'No Department'),
    (5, 'Sua', 'Han', 'USER', 'sua.hanh@student.kpu.ca', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE', 'No Department'),
    (6, 'Martin', 'Freedman', 'USER', 'martin.freedman@kpu.ca', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE', 'No Department'),
    (8, 'Mike', 'Greenwood', 'USER', 'mike.greenwood@student.kpu.ca', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE', 'No Department'),
    (9, 'Cindy', 'Ling', 'USER', 'cindy.ling@kpu.ca', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'SUSPENDED', 'No Department'),
    (10, 'John', 'Smith', 'USER', 'john.smith@student.kpu.ca', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE', 'No Department'),
    (13, 'bloom', 'Willow', 'USER', 'bloom@student.kpu.ca', '$2b$12$1M8dgF/deOVqzpTMjc0pQ.FVEP.2KJOiKrl5QeV7RFb2jYOT/vcX.', 'INACTIVE', 'No Department'),
    (14, 'jenny', 'john', 'USER', 'jenny@student.kpu.ca', '$2b$12$Iec6gFMWa63e5Ivcl16pC.kfaCaN1/S7upoUWI4zZkxsWXoAFBNDy', 'INACTIVE', 'No Department'),
    (16, 'Varleen', 'Jaswal', 'USER', 'varleen.jaswal@student.kpu.ca', '$2b$12$Y7TPX9gzMkrBxTxxsQnTDuc607kZp0ZjFDQpYToWOenO4BlL3YCzK', 'INACTIVE', 'No Department'),
    (17, 'Navneet', 'Grewal', 'USER', 'navneet.grewal7@student.kpu.ca', '$2b$12$dU1VwN8r0/umCErQxC6R4.aeFuWHZfxulc2uvYmd9wbMUrQqNMUfW', 'ACTIVE', 'No Department'),
    (18, 'Natash', 'Rana', 'USER', 'natash.rana@student.kpu.ca', '$2b$10$o3FOIDAKA001Wmtm9xf2feg.NfggGpyXjS3IYh3SuBx1W2qv1SRwS', 'ACTIVE', 'No Department');

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
    (1, 'Computer Science'),
    (2, 'Business'),
    (3, 'General'),
    (16, 'Arts'),
    (17, 'Criminology'),
    (18, 'Nursing'),
    (19, 'Education');

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
    (13, 2, 2, 3, 2, 'Iphone', 'Lightly used phone', 800.00, 'LIKE NEW', 'ACTIVE'),
    (14, 16, 2, 3, 1, 'Laptop', 'Very used laptop. Is functional', 500.00, 'USED', 'REMOVED'),
    (16, 5, 3, 3, 3, 'Dorm Desk', 'Hand-built', 500.00, 'NEW', 'ACTIVE'),
    (17, 16, 1, 3, 1, 'Law 1101 - Notes', 'Hand-made class notes. PDF form', 25.00, 'GOOD', 'ACTIVE'),
    (18, 10, 3, 3, 2, 'Dorm for Rent', 'Dorm for rent near Surrey Campus', 750.00, 'GOOD', 'ACTIVE'),
    (19, 17, 4, 3, 3, 'Outfit Bundle', 'Clothing bundle', 35.00, 'USED', 'ACTIVE'),
    (20, 16, 2, 3, 2, 'Wireless Mouse', 'Cheap mouse, rarely used', 15.00, 'GOOD', 'SOLD'),
    (21, 17, 5, 3, 1, 'Advanced Calculator', '1 semester use', 35.00, 'GOOD', 'ACTIVE'),
    (22, 10, 5, 16, 2, 'Art Student Starter Kit', 'Perfect starter kit for first-year students in Faculty of Arts', 60.00, 'NEW', 'ACTIVE'),
    (23, 8, 5, 18, 1, 'Stethoscope - Lower Hearing', 'Meant for individuals who have lower hearing', 40.00, 'GOOD', 'ACTIVE'),
    (24, 6, 6, 3, 2, 'English Tutor', '5 years experience in English tutoring', 15.00, 'GOOD', 'ACTIVE'),
    (25, 5, 2, 3, 3, 'Retro Typewriter Keyboard', 'Wireless Bluetooth Typewriter', 55.00, 'NEW', 'ACTIVE'),
    (26, 2, 4, 2, 1, 'Excel Cheat Sheet Desk Mat', 'Custom made mat', 15.00, 'GOOD', 'ACTIVE');

INSERT INTO `Listing_image`
    (`image_id`, `listing_id`, `image_url`, `display_order`, `is_primary`)
VALUES
    (1, 1, '/pictures/listing-12-1784533102322.jpg', 1, TRUE),
    (7, 7, '/pictures/physics_textbook.jpg', 1, TRUE),
    (8, 8, '/pictures/law_textbook.jpg', 1, TRUE),
    (13, 13, '/pictures/listing-13-6389cc7b-1ae0-4140-931d-609f42913a65.png', 1, TRUE),
    (14, 14, '/pictures/listing-14-8d0557f4-993a-482b-a285-2ff2520e3e3b.webp', 1, TRUE),
    (16, 16, '/pictures/listing-16-b39d6aa9-ebf3-40af-aafe-bdbf07422f25.jpg', 1, TRUE),
    (17, 17, '/pictures/listing-17-0248bb18-6d41-4cf2-a0cb-fa3912e73fcd.jpg', 1, TRUE),
    (18, 18, '/pictures/listing-18-4aa9c7f8-cee6-415b-9934-e1cf24860670.png', 1, TRUE),
    (19, 19, '/pictures/listing-19-1b007926-7895-4c61-ba21-d83194b77fc4.webp', 1, TRUE),
    (20, 20, '/pictures/listing-20-7b288820-f3e9-424c-b7bb-8d223737567a.webp', 1, TRUE),
    (21, 21, '/pictures/listing-21-b7ffa20c-605a-43e6-ada9-60c445aff94d.webp', 1, TRUE),
    (22, 22, '/pictures/listing-22-efe05cab-63cb-40a4-85f2-f20ea3a99fc0.jpg', 1, TRUE),
    (23, 23, '/pictures/listing-23-ef836134-c849-4ee1-a210-74c94db2d174.jpg', 1, TRUE),
    (24, 24, '/pictures/listing-24-baa6d185-3d98-4f7e-b163-5b4b3b9b7f53.webp', 1, TRUE),
    (25, 25, '/pictures/listing-25-a9aa6fc5-1279-4072-b565-08665e779f43.jpg', 1, TRUE),
    (26, 26, '/pictures/listing-26-d9a8c70b-eafd-4009-8ce5-df0a98575f8b.jpg', 1, TRUE);

INSERT INTO `Listing_reaction` (`listing_id`, `user_id`, `reaction_type`)
VALUES (1, 2, 'THUMBSUP');

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
    (1, 'The listing appears to be posted in the wrong category.', 2, 1, 2);

 
COMMIT;
