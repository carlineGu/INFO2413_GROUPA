INSERT INTO User(first_name, last_name, user_role, email_addr, password_hash, account_status)
VALUES
('Joseph','Yang','ADMIN','sample@gmail.com','PASSWORD_HASH','ACTIVE');

INSERT INTO Category(category_name)
VALUES
('test_items');

INSERT INTO Department(department_name)
VALUES
('test_department');

INSERT INTO Location(location_name)
VALUES
('test_location');

INSERT INTO Listing (user_id,category_id,department_id,location_id,listing_title,listing_description, price)
VALUES
(1,1,1,1,'Calculus Textbook', 'Used calculus textbook in good condition', 35.00),
(1,1,1,1,'Office Chair', 'Black adjustable office chair', 50.00),
(1,1,1,1,'Gaming Keyboard', 'Mechanical keyboard with blue switches', 40.00);


select * FROM Listing;