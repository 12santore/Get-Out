# Get Out (V0 Prototype)

Get Out is a full-stack Next.js app that helps Kara beat boredom by recommending context-aware activities and places.

## Stack
- Next.js + React + TypeScript + Tailwind
- Supabase (Postgres + Auth)
- OpenWeather API
- Leaflet (OpenStreetMap)
- Vercel Cron Jobs (hosted daily cache refresh)

## Demo Data Spreadsheet
- Scottsdale activity spreadsheet: `data/scottsdale_activities.csv`
- In demo mode (when Supabase keys are missing), `/api/activities` pulls from this CSV.
- Current seed: 50 restaurants + 50 trails/movement options pulled from OpenStreetMap around Scottsdale.
- Curated municipality/CVB review pull: `data/scottsdale_city_sources_review.csv`
- Spend audit log: `data/spend_audit.csv`

## Production Storage Model
- Supabase is the source of truth for:
  - activity catalog (`activities`)
  - curated cache review items (`cache_review_items`)
  - nearby pull logs (`nearby_pull_events`)
  - city update requests (`city_update_requests`)
  - spend audit (`system_spend_audit`)
- Local CSV files are fallback/dev artifacts only.

## Quick Start
1. Install dependencies:
   `npm install`
2. Copy environment file:
   `cp .env.example .env.local`
3. Fill all env vars in `.env.local`.
4. Run database migration and seed (Supabase CLI):
   - `supabase db push`
   - `psql "$SUPABASE_DB_URL" -f supabase/seed.sql` (or run seed in SQL editor)
5. Start app:
   `npm run dev`

## Scottsdale Source Pulls
- Initial base seed (restaurants + trails from OSM): `npm run pull:scottsdale:seed`
- Municipality/CVB event pull for manual review: `npm run pull:scottsdale:curated`
- Curated pull sources:
  - City of Scottsdale community calendar API (`https://api.withapps.io/api/v2/organizations/16/communities/190/resources/published`)
  - Experience Scottsdale events listing (`https://www.experiencescottsdale.com/events/`) + event detail pages
- Output is intentionally written to a **review CSV** so you can manually curate before merge.
- Main cache review files:
  - `data/scottsdale_activities.csv`
  - `data/scottsdale_city_sources_review.csv`

## Sync CSVs To Google Sheets
This pushes every CSV in `data/` to tabs in a Google Sheet owned by your Google account.

1. Create a new Google Sheet in your `12santore@gmail.com` account.
2. Open [script.new](https://script.new) while signed into that account.
3. Paste the code from `scripts/google_sheets_sync_receiver.gs`.
4. In Apps Script:
   - Go to `Project Settings` -> `Script properties`
   - Add `SYNC_SECRET` with a long random value.
5. Deploy:
   - `Deploy` -> `New deployment`
   - Type: `Web app`
   - Execute as: `Me`
   - Who has access: `Anyone with the link`
   - Copy the web app URL.
6. Fill `.env.local`:
   - `GOOGLE_SHEETS_WEBHOOK_URL` = web app URL
   - `GOOGLE_SHEETS_SYNC_SECRET` = same `SYNC_SECRET` value
   - `GOOGLE_SHEETS_SPREADSHEET_ID` = ID from your sheet URL
7. Run:
   - `npm run sync:google-sheets`

What happens:
- Every file in `data/*.csv` becomes/updates a tab in your sheet.
- Example: `data/scottsdale_activities.csv` -> tab `scottsdale_activities`.

## Sync Supabase Cache To Google Sheets (Production)
- Use this to export hosted/live cache data (no local CSV dependency):
  - `npm run sync:google-sheets:supabase`
- Tabs created/updated:
  - `activities_live`
  - `cache_review_live`
  - `spend_audit_live`

## Supabase Auth Setup
1. In Supabase Dashboard, enable Email provider under `Authentication -> Providers`.
2. Add redirect URL: `http://localhost:3000`.
3. Ensure `NEXT_PUBLIC_APP_URL` in `.env.local` matches the redirect URL.
4. Add one or more invite codes in `.env.local` via `INVITE_CODES=code1,code2`.

## Environment Variables
See `.env.example`:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENWEATHER_API_KEY`
- `INVITE_CODES`
- `NEXT_PUBLIC_DEFAULT_LAT`
- `NEXT_PUBLIC_DEFAULT_LNG`
- `WEATHER_API_ENABLED`
- `WEATHER_NO_CHARGE_MODE`
- `NEARBY_PULLS_ENABLED`
- `NEW_CITY_REQUESTS_ENABLED`
- `DAILY_WEATHER_CALL_LIMIT`
- `DAILY_NEARBY_PULL_LIMIT`
- `DAILY_NEW_CITY_REQUEST_LIMIT`
- `MAX_NEARBY_RADIUS_KM`
- `MAX_NEARBY_RESULTS_PER_CATEGORY`
- `ESTIMATED_WEATHER_CALL_COST_USD`
- `ESTIMATED_NEARBY_PULL_COST_USD`
- `ESTIMATED_RESEND_EMAIL_COST_USD`

## Error Handling Notes
- Missing env vars return explicit API errors (weather) or throw on startup (Supabase client).
- Auth-required routes (`/api/completed`, `/api/favorites`) return `401 Unauthorized` if no Supabase session token is provided.
- Spin flow shows user-facing fallback messages when no activities match filters.
- Login requests fail with `Invalid invite code` until a valid invite code is entered.

## API Endpoints
- `GET /api/activities`: filter activities by category/time/energy/social/distance/time-of-day/weather.
- `POST /api/activities`: add an activity from a URL (AllTrails, Google Maps, Apple Maps, etc.).
- `POST /api/completed`: log completed experience with rating (1-5) and notes.
- `GET /api/completed`: map-ready completed activity pins for authenticated user.
- `GET /api/favorites`: fetch saved activities for authenticated user.
- `POST /api/favorites`: save an activity for authenticated user.
- `GET /api/weather`: fetch weather summary by lat/lng.
- `POST /api/auth/request-link`: invite-code gated magic-link request.
- `POST /api/resources/request`: logs a New City data-pull request for manual approval and sends optional email notification.
- `GET /api/jobs/daily-cache-refresh`: hosted daily cache refresh job endpoint (for Vercel Cron).
- `GET /api/cache/review`: fetch cache review rows from Supabase.

## PWA (Add to Home Screen)
- The app now includes a web app manifest and service worker for installability.
- iPhone: open in Safari, tap Share, then `Add to Home Screen`.
- Android: open in Chrome, tap menu, then `Install app`.

## Add-by-URL Workflow
- Visit `/add` (top-right nav: `Add URL`).
- Paste a place/activity link and optionally adjust category/duration/energy/social context.
- The app parses name/coordinates when available and saves the activity.

## New City Approval Requests
- The `Update to my current city` button now submits a request instead of performing an immediate pull.
- Requests are appended to `data/nearby_requests.csv` with status `pending_approval`.
- Optional email notifications are sent if these env vars are set:
  - `RESEND_API_KEY`
  - `APPROVAL_EMAIL_FROM`
  - `APPROVAL_EMAIL_TO`

## Spend Safeguards
- Kill switches:
  - `WEATHER_NO_CHARGE_MODE=true` guarantees no external weather API calls (demo weather fallback only).
  - `WEATHER_API_ENABLED=false` disables weather API calls.
  - `NEARBY_PULLS_ENABLED=false` disables nearby pull API calls.
  - `NEW_CITY_REQUESTS_ENABLED=false` disables city update requests.
- Hard caps:
  - `DAILY_WEATHER_CALL_LIMIT`
  - `DAILY_NEARBY_PULL_LIMIT`
  - `DAILY_NEW_CITY_REQUEST_LIMIT`
  - `MAX_NEARBY_RADIUS_KM`
  - `MAX_NEARBY_RESULTS_PER_CATEGORY`
- Auditing:
  - Weather calls, nearby pulls, and request-email sends append spend estimates to `data/spend_audit.csv`.
- Client-side weather cache:
  - Weather is cached for 60 minutes in browser storage to reduce API calls when weather API is enabled.

## Hosted Jobs
- `vercel.json` defines a daily cron at `14:00 UTC`:
  - `GET /api/jobs/daily-cache-refresh`
- Job behavior:
  - Pulls Scottsdale seed activities (OSM/Overpass)
  - Pulls curated municipality/CVB review candidates
  - Inserts new seed rows into `activities`
  - Refreshes `cache_review_items` snapshot
  - Appends spend audit entry (`cache_refresh`)
- Configure:
  - `CACHE_REFRESH_ENABLED`
  - `DAILY_CACHE_REFRESH_LIMIT`
  - `CRON_SECRET`
  - `ESTIMATED_CACHE_REFRESH_COST_USD`
