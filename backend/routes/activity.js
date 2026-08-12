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
        COUNT(l.listing_id) AS total
      FROM Category c
      LEFT JOIN Listing l
        ON l.category_id = c.category_id
       AND l.listing_status = 'ACTIVE'
      GROUP BY c.category_id, c.category_name
      ORDER BY
        CASE c.category_name
          WHEN 'Books & Textbooks' THEN 1
          WHEN 'Electronics' THEN 2
          WHEN 'Dorm & Furniture' THEN 3
          WHEN 'Clothing & Accessories' THEN 4
          WHEN 'School Supplies' THEN 5
          WHEN 'Services' THEN 6
          ELSE 99
        END,
        c.category_name ASC
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