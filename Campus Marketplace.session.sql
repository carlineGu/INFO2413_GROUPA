

-- SELECT * FROM report;


-- SELECT * From user WHERE user_id = 24;


-- UPDATE `user`
-- SET `password_hash`='$2b$12$TQ/2PqdPQ9UZ7Xdu0oH7meacFJ8dNWxzPGb1z9bBeZ9XSLA6zXdxy'
-- WHERE `email_addr`='sample@gmail.com';

INSERT INTO User (
    user_id,
    first_name,
    last_name,
    user_role,
    email_addr,
    password_hash,
    account_status
)
VALUES (
    2,
    'Admin',
    '',
    'ADMIN',
    'admin',
    '$2b$12$TQ/2PqdPQ9UZ7Xdu0oH7meacFJ8dNWxzPGb1z9bBeZ9XSLA6zXdxy',
    'ACTIVE'
);