CREATE DATABASE campus_marketplace;

USE campus_marketplace;

CREATE TABLE  User(

    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    user_role ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
    email_addr VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    account_status ENUM('SUSPENDED','ACTIVE','INACTIVE') NOT NULL DEFAULT 'INACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
CREATE TABLE Listing(

    listing_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    department_id INT UNSIGNED NOT NULL,
    location_id INT UNSIGNED NOT NULL,
    listing_title  VARCHAR(100) NOT NULL,
    listing_description TEXT,
    price DECIMAL(10,2) NOT NULL,
    listing_condition ENUM('NEW','LIKE NEW','GOOD','FAIR','USED') NOT NULL,
    listing_status ENUM('ACTIVE', 'SOLD', 'RESERVED', 'REMOVED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (category_id) REFERENCES Category(category_id),
    FOREIGN KEY (department_id) REFERENCES Department(department_id),
    FOREIGN KEY (location_id) REFERENCES Location(location_id)

);
CREATE TABLE Listing_reaction(

    listing_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    reaction_type ENUM('HEART','THUMBSUP','LAUGH','SOB','ANGRY'),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY(listing_id, user_id),
    FOREIGN KEY(user_id) REFERENCES User(user_id),
    FOREIGN KEY(listing_id) REFERENCES Listing(listing_id)

);
CREATE TABLE Category(

    category_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE

);
CREATE TABLE Department(

    department_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE

);
CREATE TABLE Location(

    location_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    location_name VARCHAR(100) NOT NULL UNIQUE

);
CREATE TABLE Listing_image(

    image_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    listing_id INT UNSIGNED NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    display_order SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    FOREIGN KEY (listing_id) REFERENCES Listing(listing_id) ON DELETE CASCADE,
    UNIQUE (listing_id, display_order),
    UNIQUE (listing_id, image_url)

);
CREATE TABLE Review(

    review_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rating TINYINT UNSIGNED NOT NULL,
    comment TEXT,
    reviewer_user_id INT UNSIGNED NOT NULL,
    reviewed_user_id INT UNSIGNED NOT NULL,
    listing_id INT UNSIGNED NOT NULL,
    parent_review_id INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_different_users CHECK (reviewer_user_id <> reviewed_user_id),
    CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_user_id) REFERENCES User(user_id),
    CONSTRAINT fk_review_reviewed_user FOREIGN KEY (reviewed_user_id) REFERENCES User(user_id),
    CONSTRAINT fk_review_listing FOREIGN KEY (listing_id) REFERENCES Listing(listing_id),
    CONSTRAINT fk_review_parent FOREIGN KEY (parent_review_id) REFERENCES Review(review_id) ON DELETE CASCADE,
    UNIQUE (reviewer_user_id,reviewed_user_id,listing_id)

);
CREATE TABLE Conversation(

    conversation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    listing_id INT UNSIGNED NOT NULL,
    buyer_id INT UNSIGNED NOT NULL,
    seller_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_conversation_users CHECK (buyer_id <> seller_id),
    CONSTRAINT fk_conversation_listing FOREIGN KEY (listing_id) REFERENCES Listing(listing_id),
    CONSTRAINT fk_conversation_buyer FOREIGN KEY (buyer_id) REFERENCES User(user_id),
    CONSTRAINT fk_conversation_seller FOREIGN KEY (seller_id) REFERENCES User(user_id),
    CONSTRAINT uq_conversation UNIQUE (listing_id, buyer_id, seller_id)

);
CREATE TABLE Message(

    message_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT UNSIGNED NOT NULL,
    sender_id INT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    message_status ENUM('SENT','DELIVERED','READ') NOT NULL DEFAULT 'SENT',
    CONSTRAINT fk_message_conversation FOREIGN KEY (conversation_id) REFERENCES Conversation(conversation_id) ON DELETE CASCADE,
    CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES User(user_id)


);
CREATE TABLE Report(

    report_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reason TEXT NOT NULL,
    reporter_id INT UNSIGNED NOT NULL,
    target_user_id INT UNSIGNED NULL,
    listing_id INT UNSIGNED NULL,
    report_status ENUM('PENDING','UNDER_REVIEW','RESOLVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_report_target CHECK ( target_user_id IS NOT NULL OR listing_id IS NOT NULL),
    CONSTRAINT chk_reporter_not_target CHECK (target_user_id IS NULL OR reporter_id <> target_user_id),
    CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES User(user_id),
    CONSTRAINT fk_report_target_user FOREIGN KEY (target_user_id) REFERENCES User(user_id),
    CONSTRAINT fk_report_listing FOREIGN KEY (listing_id) REFERENCES Listing(listing_id)

);
CREATE TABLE Transaction(

    transaction_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    listing_id INT UNSIGNED NOT NULL,
    buyer_id INT UNSIGNED NOT NULL,
    seller_id INT UNSIGNED NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    transaction_status ENUM('PENDING','COMPLETED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_transaction_users CHECK (buyer_id <> seller_id),
    CONSTRAINT chk_transaction_price CHECK (price >= 0),
    CONSTRAINT fk_transaction_listing FOREIGN KEY (listing_id) REFERENCES Listing(listing_id),
    CONSTRAINT fk_transaction_buyer FOREIGN KEY (buyer_id) REFERENCES User(user_id),
    CONSTRAINT fk_transaction_seller FOREIGN KEY (seller_id) REFERENCES User(user_id),
    CONSTRAINT uq_transaction_listing UNIQUE (listing_id)

);
CREATE TABLE Favorite(

    user_id INT UNSIGNED NOT NULL,
    listing_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, listing_id),
    CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_favorite_listing FOREIGN KEY (listing_id) REFERENCES Listing(listing_id) ON DELETE CASCADE

);











