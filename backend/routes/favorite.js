const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", async (req, res) => {

    try {

        const { userId, listingId } = req.body;

        await db.query(
            `INSERT IGNORE INTO Favorite
             (user_id, listing_id)
             VALUES (?, ?)`,
            [userId, listingId]
        );

        res.json({
            message: "Added to favorites."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Could not favorite listing."
        });

    }

});

router.delete("/", async (req, res) => {

    try {

        const { userId, listingId } = req.body;

        await db.query(
            `DELETE FROM Favorite
             WHERE user_id = ?
             AND listing_id = ?`,
            [userId, listingId]
        );

        res.json({
            message: "Removed from favorites."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Could not remove favorite."
        });

    }

});


router.get("/:listingId/:userId", async (req, res) => {

    try {

        const [rows] = await db.query(
            `SELECT *
             FROM Favorite
             WHERE listing_id = ?
             AND user_id = ?`,
            [
                req.params.listingId,
                req.params.userId
            ]
        );

        res.json({
            favorited: rows.length > 0
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Could not check favorite status."
        });

    }
});


module.exports = router;
