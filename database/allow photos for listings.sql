-- Legacy Listing_image migration audit
--
-- Fresh installations already receive the final Listing_image definition from
-- schema.sql and should not run a photo migration. This file intentionally makes
-- no schema or data changes: the previous version disabled foreign-key checks,
-- dropped the table, and could permanently lose listing photos.
--
-- Before migrating an existing database:
--   1. Make and verify a database backup.
--   2. Run the checks below. Every stored image_url must be an application path
--      of 255 characters or fewer, not a base64 data URL.
--   3. Create a separate Listing_image_new table using the definition in
--      schema.sql, copy and verify the rows, then schedule the table swap.
--   4. Do not drop or rename the existing table until row counts and image paths
--      have been checked in the application.

USE `campus_marketplace`;

SELECT
    `COLUMN_NAME`,
    `COLUMN_TYPE`,
    `IS_NULLABLE`,
    `COLUMN_DEFAULT`,
    `COLUMN_KEY`
FROM `information_schema`.`COLUMNS`
WHERE `TABLE_SCHEMA` = DATABASE()
  AND `TABLE_NAME` = 'Listing_image'
ORDER BY `ORDINAL_POSITION`;

SELECT
    COUNT(*) AS `total_image_rows`,
    SUM(CHAR_LENGTH(`image_url`) > 255) AS `urls_over_255_chars`,
    SUM(`image_url` LIKE 'data:image/%') AS `embedded_data_urls`
FROM `Listing_image`;

SELECT
    `listing_id`,
    `image_url`,
    COUNT(*) AS `duplicate_count`
FROM `Listing_image`
GROUP BY `listing_id`, `image_url`
HAVING COUNT(*) > 1;

SELECT
    `li`.`listing_id`,
    COUNT(*) AS `orphaned_image_rows`
FROM `Listing_image` AS `li`
LEFT JOIN `Listing` AS `l` ON `l`.`listing_id` = `li`.`listing_id`
WHERE `l`.`listing_id` IS NULL
GROUP BY `li`.`listing_id`;

SELECT
    `listing_id`,
    SUM(`is_primary` = TRUE) AS `primary_image_count`
FROM `Listing_image`
GROUP BY `listing_id`
HAVING SUM(`is_primary` = TRUE) <> 1;

SELECT
    `listing_id`,
    `is_primary`,
    COUNT(*) AS `invalid_primary_flag_rows`
FROM `Listing_image`
WHERE `is_primary` IS NULL
   OR `is_primary` NOT IN (FALSE, TRUE)
GROUP BY `listing_id`, `is_primary`;

-- Older tables may not have display_order. Use a conditional, read-only query
-- so this audit still completes and clearly reports that migration requirement.
SET @has_display_order = (
    SELECT COUNT(*)
    FROM `information_schema`.`COLUMNS`
    WHERE `TABLE_SCHEMA` = DATABASE()
      AND `TABLE_NAME` = 'Listing_image'
      AND `COLUMN_NAME` = 'display_order'
);

SET @display_order_audit = IF(
    @has_display_order = 1,
    'SELECT `listing_id`, `display_order`, COUNT(*) AS `row_count` FROM `Listing_image` GROUP BY `listing_id`, `display_order` HAVING `display_order` < 1 OR `display_order` IS NULL OR COUNT(*) > 1',
    'SELECT ''display_order is missing; migrate this table before deploying the integrated application.'' AS `audit_warning`'
);

PREPARE display_order_statement FROM @display_order_audit;
EXECUTE display_order_statement;
DEALLOCATE PREPARE display_order_statement;
