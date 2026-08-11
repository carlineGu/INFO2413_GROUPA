INSERT INTO `Listing`
    (`listing_id`, `user_id`, `category_id`, `department_id`, `location_id`,
     `listing_title`, `listing_description`, `price`, `listing_condition`, `listing_status`)
VALUES
    (7, 6, 1, 1, 1, 'Physics Textbook', 'Used physics textbook in good condition.', 35.00, 'GOOD', 'ACTIVE'),
    (8, 8, 1, 3, 2, 'Law Textbook', 'Used law textbook in good condition.', 25.00, 'GOOD', 'ACTIVE'),
    (9, 9, 1, 1, 1, 'None Title Textbook', 'hgfjlkdsfef.', 40000.00, 'NEW', 'ACTIVE');


    INSERT INTO `Listing_image`
    (`image_id`, `listing_id`, `image_url`, `display_order`, `is_primary`)
VALUES
    (7, 7, '/pictures/physics_textbook.jpg', 1, TRUE),
    (8, 8, '/pictures/law_textbook.jpg', 1, TRUE),
    (9, 9, '/pictures/none_title_textbook.jpg', 1, TRUE);