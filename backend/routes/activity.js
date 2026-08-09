router.get("/activity", async (req, res) => {
  try {

    const [[users]] = await db.query(`
      SELECT COUNT(*) AS totalUsers
      FROM User
    `);

    const [[listings]] = await db.query(`
      SELECT COUNT(*) AS totalListings
      FROM Listing
      WHERE listing_status = 'ACTIVE'
    `);

    const avgListings =
      users.totalUsers > 0
        ? listings.totalListings / users.totalUsers
        : 0;

    const [categories] = await db.query(`
      SELECT
        c.category_name,
        COUNT(*) AS total
      FROM Listing l
      JOIN Category c
        ON c.category_id = l.category_id
      WHERE l.listing_status = 'ACTIVE'
      GROUP BY c.category_name
    `);

    const [sellers] = await db.query(`
      SELECT
        u.first_name,
        u.last_name,
        u.email_addr,
        COUNT(*) AS listings
      FROM Listing l
      JOIN User u
        ON u.user_id = l.user_id
      WHERE l.listing_status = 'ACTIVE'
      GROUP BY u.user_id
      ORDER BY listings DESC
      LIMIT 5
    `);

    res.json({
      totalUsers: users.totalUsers,
      totalListings: listings.totalListings,
      avgListings: avgListings.toFixed(1),
      categories,
      sellers
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Could not load activity report."
    });
  }
});

module.exports = router;