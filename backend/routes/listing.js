const express = require("express");
const router = express.Router();
const db = require("../db");


router.get("/:id", async (req, res) => {

    try {

        const listingId = Number(req.params.id);

        if (!listingId) {
            return res.status(400).json({
                message: "Invalid Listing ID"
            });
        }

        const [rows] = await db.query(
            `SELECT
                l.*,
                c.category_name,
                d.department_name,
                loc.location_name,
                li.image_url AS photo,
                CONCAT(u.first_name, ' ', u.last_name) AS seller_name
             FROM Listing l
             LEFT JOIN User u
                ON u.user_id = l.user_id
             LEFT JOIN Category c
                ON c.category_id = l.category_id
             LEFT JOIN Department d
                ON d.department_id = l.department_id
             LEFT JOIN Location loc
                ON loc.location_id = l.location_id
             LEFT JOIN Listing_image li
                ON li.listing_id = l.listing_id
                AND li.is_primary = TRUE
             WHERE l.listing_id = ?`,
            [listingId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Listing not found."
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Could not load listing."
        });

    }

});
console.log("listing router type:", typeof router);

module.exports = router;