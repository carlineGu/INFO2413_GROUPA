# Campus Marketplace

A campus marketplace for creating listings, saving favorites, viewing seller profiles, messaging, reviewing sellers, and reporting concerns.

## Requirements

- Node.js 18 or newer
- MySQL 8 or newer
- An SMTP account for registration verification emails

## Local setup

1. Create a MySQL database and tables by running `database/schema.sql`.
2. Optionally load the development records in `database/test_values.sql`.
3. Copy `backend/.env.example` to `backend/.env` and replace every placeholder.
4. Install and start the backend:

   ```powershell
   Set-Location backend
   npm install
   npm start
   ```

5. Open `http://localhost:3000`. The Express server also serves the frontend.

Do not commit `backend/.env`, uploaded listing photos, or `backend/node_modules`.

### Existing databases

`database/schema.sql` is for a fresh database; do not run it over an existing one. The application can read both the legacy and current `Listing_image` column layouts. Before changing an existing photo table, run `database/allow photos for listings.sql` as a read-only audit, make a verified backup, and prepare an explicit migration. Restart the server after a photo-schema migration so its cached column capabilities are refreshed.

## Checks

Run the backend syntax suite from `backend`:

```powershell
npm test
```

Check static page references from the project root:

```powershell
node scripts/check-static-links.js
```

The main manual workflow is:

1. Register and verify an account.
2. Log in and create a listing with up to four photos.
3. Browse the listing, favorite it from a different account, and open the seller profile.
4. Start a conversation and send a message.
5. Submit a seller review or listing report from the listing page.

## Code conventions

- MySQL columns use `snake_case`.
- API payloads and JavaScript use `camelCase`.
- DOM IDs and CSS classes use lower kebab-case.
- Frontend requests use relative `/api/...` URLs.

## Project structure

- `backend/server.js` - Express application and route mounts
- `backend/routes/` - API routes
- `database/schema.sql` - clean database definition
- `database/test_values.sql` - optional development seed data
- `frontend/html/` - application pages
- `frontend/js/api.js` - shared API and stored-user adapter
- `frontend/js/navbar.js` - shared navigation, notifications, and menus

## Security note

Email verification is implemented, but this class project currently identifies the signed-in user from browser storage and request `userId` values. Before a real deployment, add server-issued authentication tokens or secure sessions and authorize every write operation from that server-side identity.
