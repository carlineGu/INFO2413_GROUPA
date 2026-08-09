
ALTER TABLE Listing_image MODIFY COLUMN image_url LONGTEXT;

SHOW INDEX FROM Listing_image;

-- Step 1: Ignore foreign key checks while we swap tables
SET FOREIGN_KEY_CHECKS = 0;

-- Step 2: Drop the troublesome table entirely
DROP TABLE IF EXISTS Listing_image;

-- Step 3: Create the table fresh with LONGTEXT and a proper key length constraint
CREATE TABLE Listing_image (
    listing_id INT NOT NULL,
    image_url LONGTEXT NOT NULL,
    is_primary TINYINT(1) DEFAULT 0,
    -- Specifying (255) tells MySQL to only index the first 255 characters of the base64 string
    PRIMARY KEY (listing_id, image_url(255))
);

-- Step 4: Re-apply your original Foreign Key constraint cleanly
-- (Adjust 'Listings' if your parent table is named 'listing' singular)
ALTER TABLE Listing_image 
ADD CONSTRAINT listing_image_ibfk_1 
FOREIGN KEY (listing_id) REFERENCES Listing(listing_id) 
ON DELETE CASCADE;

-- Step 5: Turn checks back on
SET FOREIGN_KEY_CHECKS = 1;

-- Step 1: Alter the column in listing_image to be UNSIGNED to match the parent table
ALTER TABLE `listing_image` 
MODIFY COLUMN `listing_id` INT UNSIGNED NOT NULL;

-- Step 2: Now add the foreign key constraint safely
ALTER TABLE `listing_image` 
ADD CONSTRAINT `listing_image_ibfk_1` 
FOREIGN KEY (`listing_id`) REFERENCES `Listing` (`listing_id`) 
ON DELETE CASCADE;
