# Berzowanley Online Library System

The application supports a local demo mode and a Supabase-backed live mode. Live mode uses Supabase Auth and PostgreSQL; successful reads are cached in the browser so catalogue and account data can be viewed offline. Borrowing, returns, reservations, fine-payment recording, and staff changes require a connection.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Keep `VITE_DEMO_MODE=true` to run with the built-in mock data, or configure Supabase as described below.
4. Start the app with `npm run dev`. Run `npm run lint` and `npm run build` to validate it.

## Configure Supabase

1. In the Supabase SQL Editor for your project, run [`supabase/migrations/20261113_initial_library_schema.sql`](./supabase/migrations/20261113_initial_library_schema.sql).
2. Add the project URL and **publishable/anon key** to `.env.local`:

   ```dotenv
   VITE_DEMO_MODE=false
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   ```

   Never put a `service_role` key in a `VITE_` variable or in browser code.
3. Restart the local server. In Vercel, add the same three `VITE_` variables to the project’s Environment Variables and redeploy.
4. Configure Supabase Auth’s site URL and redirect URLs for the local app and deployed domain. Keep email confirmation enabled so existing member profiles are only linked after the member proves control of their email.
5. To give a staff account access, first create/sign up the account, then promote its matching profile from the Supabase SQL Editor:

   ```sql
   update public.profiles
   set role = 'super_admin'
   where lower(email) = lower('staff@example.com');
   ```

   Repeat with `role = 'librarian'` for a librarian account. Do not expose role changes through the member-facing app.

The migration also creates a public `book-covers` Storage bucket. Staff can select a JPEG, PNG, or WebP cover in the book form; uploaded files are stored under `categories/<category_id>/` and the public URL is saved with the book. Images are limited to 5 MB each and 50 per category, enforced by Storage policies. In demo mode, cover images can be set using a URL instead.

In live mode, staff can use **Import demo covers** in Manage Books to transfer the 15 demo book covers into Storage and link them to matching live books. Matching books and categories must already exist in Supabase; existing custom covers are left unchanged.

## Existing SQLite data

The Supabase schema starts empty; running the migration does not copy data from `backend/library.db`. Export books, categories, authors, members, loans, reservations, and fines from the existing SQLite database and import them in dependency order using the Supabase dashboard or a trusted one-time migration script. Do not import SQLite password hashes as Supabase credentials. Members must register or use Supabase password recovery; signup links an existing profile by email when available.

Review and back up the target Supabase project before importing production records. Fine payments are recorded by staff, not members.

## Offline behavior

Production builds register a service worker to cache the app shell and static assets. The browser’s IndexedDB cache stores successful API reads; when Supabase is unreachable, the app uses saved reads and falls back to demo data for resources that support it. The portal displays an offline/fallback notice. Writes are never queued or reported as successful offline.

The educational schema explorer is available to staff through a restricted RPC. Direct SQL execution is disabled in live mode. The legacy OOP test and code-bundle endpoints still require `VITE_API_BASE_URL`.
