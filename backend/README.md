# Housing Society Backend

The backend is a single Node.js project and Express server. The existing API
uses `/api/...`; the integrated authentication, RBAC, procurement, parking,
visitor, amenities, helpdesk, and related APIs keep their `/api/v1/...` paths.

## Local setup

1. Copy `.env.example` to `.env` and set local PostgreSQL credentials and long,
   private JWT secrets.
2. Run `npm install` from this directory.
3. Run `npm run db:migrate` to apply the combined SQL migration history.
4. Start the API with `npm run dev` or `npm start`.

Never commit `.env` or use a production database for development or testing.

The `vendors` table is shared. Its canonical fields are `legal_name`,
`trade_name`, `user_id`, `contact_email`, and `address_id`. Existing vendor IDs
and foreign keys from asset, AMC, maintenance schedule, and work order records
are retained by the integration migration.
