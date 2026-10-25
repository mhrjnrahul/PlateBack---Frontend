# Test catalogue

Every automated test in PlateBack, by file, with why the file exists. The test names are sentences saying what they check, so they are the rationale for each case. Generated from the source on 25 October 2026.

## Backend (xUnit v3): 148 test methods, 181 cases with the [Theory] data rows

### Domain (no database)

**`tests/PlateBack.Domain.Tests/ListingTests.cs`** (12). Listing rules (window 15 min to 12 h, price at most MRP, quantity never below what is reserved). Pure C#, no database, so each rule is checked in milliseconds and in isolation.

- A new listing is active with all stock available
- The pickup window must last 15 minutes to 12 hours
- The window must end in the future
- Price cannot be above the original price
- Titles must be 3 to 80 characters
- Reserving more than is left is sold out
- Reserving after the window ended is window closed
- Editing cannot drop quantity below what is reserved
- Editing to exactly what is reserved sells out
- Expiry happens only once the window has ended
- Cancelled and expired listings stay that way
- Removing needs a reason

**`tests/PlateBack.Domain.Tests/OrganizationTests.cs`** (5). Business lifecycle: only verified businesses publish, and the last owner cannot leave. Getting these wrong would let unchecked businesses sell food.

- A new business is pending and cannot publish
- Verifying allows publishing
- Rejecting needs a reason
- Only verified businesses can be suspended
- The last owner cannot be removed

**`tests/PlateBack.Domain.Tests/OutboxMessageTests.cs`** (3). Week 5. Retry rules for notification delivery (38% covered before): a bug here loses or repeats notifications.

- A failed message stays pending and counts the attempt
- After the last attempt the message is given up and keeps its error
- A very long error is cut to fit its column

**`tests/PlateBack.Domain.Tests/PickupCodeAndTokenTests.cs`** (4). Pickup codes avoid look-alike characters and normalise what staff type; refresh tokens rotate. Both are what stands between a customer and someone else's food or account.

- Generated codes use the unambiguous alphabet
- Normalizes what people type
- A rotated token is inactive and marked as replaced
- Expires after its lifetime

**`tests/PlateBack.Domain.Tests/ReservationTests.cs`** (9). Reservation states: cancel, collect, no-show and late-cancel penalties, each applied once. These decide reliability scores, which limit how much a customer may reserve.

- A new reservation expires when the pickup window ends
- Cancelling before the window opens is free
- Cancelling once the window has opened is late
- Cannot cancel once the window has ended
- A collected reservation cannot be cancelled
- A code cannot be used twice
- A cancelled reservation cannot be collected
- Becomes a no show only after the window and only once
- Collected reservations never become no shows

**`tests/PlateBack.Domain.Tests/UserTests.cs`** (7). Reliability score stays between 0 and 100 and lowers the reservation limit below 60.

- New users start fully reliable
- Rejects names that are too short
- Collecting adds two but never passes 100
- A no show takes twenty but never goes below zero
- A late cancellation takes five
- Low reliability allows one active reservation
- Suspending needs a reason

### Application (no database)

**`tests/PlateBack.Application.Tests/HelperTests.cs`** (5). Distance formula, bounding box, file-type detection and paging defaults: small functions every request depends on.

- Thamel to Jhamsikhel is about four kilometres
- The bounding box contains the whole circle
- Recognises real image signatures
- A text file is not an image
- Uses the API defaults and limits

**`tests/PlateBack.Application.Tests/ValidatorTests.cs`** (8). Request validation: the first line of defence, and the source of the field errors forms show.

- A complete listing is valid
- Price above MRP is reported on the price field
- Unknown categories are rejected
- Image urls must be uploads or web addresses
- Registration rules
- Customers reserve one or two units
- Business type must be one of the known types
- Search needs both coordinates or neither

### API integration (real HTTP and PostgreSQL)

**`tests/PlateBack.Api.IntegrationTests/AuthTests.cs`** (13). Login, lockout, token expiry, refresh rotation, reuse detection and the 30-second grace window, through real HTTP and PostgreSQL.

- Register signs the new customer in with a safe refresh cookie
- Register reports every invalid field
- An email can only be registered once
- A wrong password is 401
- Five wrong passwords lock the account even for the right one
- Protected endpoints need a token
- An expired access token says so
- Refresh rotates the token and reusing an old one ends every session
- Two refreshes with the same cookie at once keep the session
- Logout revokes the refresh token
- The profile shows business memberships
- Users can change their display name
- A tampered token is rejected

**`tests/PlateBack.Api.IntegrationTests/JobTests.cs`** (4). Background jobs: no-shows applied exactly once, notifications delivered through the outbox, and a broken message retried five times without blocking others.

- After the window ends reservations become no shows exactly once
- Notifications are delivered by the outbox job
- Marking notifications read updates the unread count
- A broken outbox message is retried five times without blocking the others

**`tests/PlateBack.Api.IntegrationTests/ListingTests.cs`** (15). Search (distance, filters, text, paging, sold-out last), publishing and editing. Search was rewritten in Week 5, and these tests had to pass unchanged before and after.

- Search returns live listings from verified businesses with sold out last
- Search by location keeps to the radius and sorts by distance
- A wider radius finds more
- Search pages the results
- Bad search parameters are 400
- Listing detail has stock and the per person limit
- An unknown listing is 404
- A verified business can publish and it appears in search
- A pending business cannot publish
- Only members can publish for a business
- A ten minute window is rejected on the end field
- Price above MRP is rejected
- Editing cannot drop quantity below what is reserved
- Cancelling a listing cancels its reservations and tells the customers
- Impact numbers count only real data

**`tests/PlateBack.Api.IntegrationTests/LiveUpdateTests.cs`** (4). SignalR: who hears which change. A leak here would tell strangers about a business's queue.

- Visitors hear when stock changes
- Only the business staff hear about its queue
- Customers cannot watch a business they do not belong to
- Customers hear about new notifications once the outbox delivers them

**`tests/PlateBack.Api.IntegrationTests/LoggingTests.cs`** (2). One error log entry per failure, carrying the trace id the client sees; none for expected answers. Fails on the Week 3 code (3 entries).

- An unexpected failure is logged once with the trace id the client sees
- Expected failures are not logged as errors

**`tests/PlateBack.Api.IntegrationTests/ManagementTests.cs`** (14). Week 5. Endpoints the coverage report showed untested: the dashboard listings table (order and paging after its rewrite), business details, admin listing removal and account suspension, notifications read state.

- The dashboard lists upcoming listings soonest first then past ones newest first
- The dashboard listings page and count agree
- Customers cannot read a business listings table
- An unknown status filter is a validation error not a crash
- Members see the businesses they belong to
- Owners can edit their business details
- Staff cannot edit business details
- Removing a listing cancels its reservations and tells customers and staff
- Removing a listing needs a reason
- Admins find accounts by name or exact email
- Suspending an account ends its sessions and blocks reserving with the token it still holds
- A restored account can log in again
- Mark all read clears the unread count
- Nobody can mark someone elses notification read

**`tests/PlateBack.Api.IntegrationTests/OrganizationTests.cs`** (15). Registering a business, staff management, dashboard numbers in the business's time zone, and the admin review queue.

- A new business starts pending with the caller as owner
- An unknown business type is rejected
- Pending businesses are hidden from strangers
- Dashboard stats count real collections in the business time zone
- Only members see a business dashboard
- Owners add staff who can then hand over food
- The last owner cannot leave
- Removed staff lose access immediately
- Customers cannot use admin endpoints
- The review queue is oldest first with owner details
- Verifying lets the business publish and tells the owner
- Rejecting needs a reason
- Suspending a business takes its listings down
- A suspended account cannot log in
- Every decision lands in the audit log

**`tests/PlateBack.Api.IntegrationTests/ReservationTests.cs`** (18). The core promise (goal G1): ten customers racing for one portion get exactly one reservation; limits, cancels and pickup codes.

- Reserving returns a pickup code and takes the stock
- Ten customers race for the last portion and exactly one gets it
- One customer double clicking gets one reservation
- The same listing cannot be reserved twice
- A customer can hold three active reservations
- Below 60 reliability only one active reservation is allowed
- More than two units is a validation error
- Asking for more than is left is sold out
- An ended listing is closed
- Cancelling before the window is free and returns the stock
- Cancelling after the window opened costs five reliability
- Two parallel cancels return the stock only once
- Staff hand over food with the code and the customer gains reliability
- A code works once
- A code from another business looks unknown
- Other people cannot see a reservation
- My reservations split into active and history
- The counter queue shows todays pickups waiting first

**`tests/PlateBack.Api.IntegrationTests/UploadAndErrorTests.cs`** (10). Photo uploads (type checked from bytes), the ProblemDetails format for every error, rate limits and the OpenAPI document.

- A photo is stored and served
- A text file renamed to jpg is rejected
- Uploading needs an account
- Unknown routes answer with problem details
- Malformed json is a 400 not a 500
- A non guid id does not match any route
- Every response carries a correlation id
- Health reports the database
- The OpenAPI document describes every endpoint
- Too many login attempts from one address get 429

## Frontend (Vitest and Testing Library): 137 tests, 149 cases with the it.each rows

**`src/app/layout/MobileNav.test.tsx`** (5). The phone menu opens, traps focus and closes: the only navigation on small screens.

- opens a menu with the role's links and sign-up actions
- navigates and closes when a link is chosen
- closes on Escape and returns focus to the menu button
- shows the customer's tabs and marks the current one
- is not shown to visitors

**`src/app/layout/SiteFooter.test.tsx`** (1). Demo tools stay inside a dialog so they cannot reset data by accident.

- keeps the demo reset inside a Demo tools dialog

**`src/app/layout/SiteHeader.test.tsx`** (5). Each role sees the right navigation, and the current page is marked for screen readers.

- shows visitor links and log in when signed out
- shows the links for %s
- marks the current page link
- shows the unread count on the bell
- logs out from the account menu

**`src/app/layout/SkipLink.test.tsx`** (1). Keyboard users can jump to the content.

- is the first thing focused and moves focus to the main content

**`src/app/providers/LiveUpdates.test.tsx`** (3). SignalR client: joins the business group and refetches exactly what a message names; falls back to polling.

- connects and joins the user's business group
- refetches whatever the API says has changed
- falls back to polling when the hub cannot be reached

**`src/app/router/RouteErrorPage.test.tsx`** (1). A crashing page shows a recovery screen, not a blank page.

- shows a friendly message with a way out when a page crashes

**`src/app/router/routes.test.tsx`** (9). Route guards: signed-out, customers, staff and admins each reach only their pages.

- %s shows its heading
- sets the tab title per page
- has exactly one main landmark and one h1 per page
- an unknown listing shows the 404 page
- sends signed-out visitors to log in, then back
- lets a customer see their reservations
- shows 403 for another role's page
- shows 403 for another business's dashboard
- opens the dashboard for its own staff and the review page for admins

**`src/features/admin/pages/AdminOrganizationsPage.test.tsx`** (2). Admin review: tabs with counts, and rejecting needs a reason.

- verifies a pending business (US6)
- requires a reason to reject

**`src/features/auth/pages/auth-pages.test.tsx`** (5). Login, register, field errors from the API, and safe redirects (no open redirect to other sites).

- shows an error for a wrong password
- logs in with a demo account and returns to the page that asked
- ignores redirects to other sites
- creates an account and continues to business details from 'List your surplus'
- shows the server's error next to the email field

**`src/features/listings/browse-filters.test.ts`** (6). Browse filters survive the URL round trip, so links and the back button work.

- reads defaults from an empty URL and ignores invalid values
- round-trips through the URL, writing only non-defaults
- only accepts the rupee price steps
- turns filters into API parameters
- lists non-default filters as removable chips
- is empty with the defaults

**`src/features/listings/components/ListingCard.test.tsx`** (4). A card is one link named by its title, and shows stock and price correctly.

- is one link named by the listing title
- shows the stock left, urgent at 2 or fewer, and sold out
- keeps the illustration and drops a photo that fails to load
- draws the illustration when there is no photo

**`src/features/listings/components/LocationSearch.test.tsx`** (4). Week 5. The landing page's main action, including refused and missing browser location (41% covered before).

- searches the chosen area
- searches around the browser's location, rounded to about 10 m
- explains a refused location and stays on the page
- explains a browser without location support

**`src/features/listings/components/Pagination.test.tsx`** (4). Week 5. Page counts and Previous/Next limits; an off-by-one hides listings (40% covered before).

- is hidden when everything fits on one page
- counts a partly filled last page
- disables Previous on the first page and Next on the last
- asks for the neighbouring page

**`src/features/listings/pages/BrowsePage.test.tsx`** (6). Search results, filters and the heading that keeps its shape while loading (Week 5 layout-shift fix).

- lists nearby listings for the chosen area
- names the search area while still counting, so the line does not change shape
- filters by category and keeps the filter in the URL
- searches as you type
- shows an empty state with a way to widen the search
- shows active filters as chips that remove themselves

**`src/features/listings/pages/CreateListingPage.test.tsx`** (6). Publishing a listing, its validation, the price preview and the optional photo.

- shows field errors linked to their inputs
- rejects a selling price above the MRP
- publishes a listing and returns to the dashboard (US3)
- shows the discount customers will see while pricing
- uploads an optional photo and shows it in the preview
- explains why a file cannot be used as a photo

**`src/features/listings/pages/ListingDetailPage.test.tsx`** (5). Reserving, including the sold-out conflict and the limit message.

- shows details, allergens and asks visitors to log in to reserve
- shows the selling price, the MRP and what you save, in rupees
- reserves a quantity and shows the pickup code (US1)
- explains a conflict when someone else got the last unit (US2)
- disables reserving when sold out

**`src/features/listings/schemas/listing-form.test.ts`** (4). Form rules that mirror the API's, so mistakes are caught before sending.

- accepts a valid listing
- applies the business rules
- takes whole rupees only, and 0 as free
- checks the pickup window length

**`src/features/notifications/pages/NotificationsPage.test.tsx`** (1). Notifications list and marking as read.

- lists notifications and marks them all read

**`src/features/organizations/pages/CreateOrganizationPage.test.tsx`** (6). Week 5. Registering a business, which had no test (48% covered): validation, location, and the pending result.

- explains every missing field before sending anything
- rejects a phone number that cannot be dialled but allows leaving it empty
- submits a business, which starts pending, and opens its dashboard
- can use the browser's location instead of an area
- says so when location is refused, and the areas still work
- sends people who already run a business to its dashboard

**`src/features/organizations/pages/OrgDashboardPage.test.tsx`** (6). Business dashboard: numbers, the chart by keyboard, the counter and cancelling a listing.

- shows KPIs, listings and today's queue
- verifies a pickup code at the counter (US4)
- rejects an unknown code and changes nothing
- explains that a pending business must wait for verification (US3)
- has a standalone pickup page for staff at the counter
- reads the meals chart one day at a time with the arrow keys

**`src/features/reservations/pages/MyReservationsPage.test.tsx`** (3). Pickup codes and countdowns, and the late-cancel warning before it costs reliability.

- shows active reservations with their pickup codes, impact and reliability
- cancels after confirming, and the reservation leaves the active list
- lists past reservations in the History tab

**`src/shared/api-client/client.test.ts`** (12). The one network client: errors become ApiError, expired tokens refresh once, cancellations pass through, and a proxy 502 reads as plain words.

- returns parsed JSON on success
- builds the query string and leaves out empty values
- sends a JSON body
- adds the bearer token when signed in
- returns undefined for 204 No Content
- turns a ProblemDetails response into an ApiError
- keeps field errors from a validation error
- handles an error response that is not JSON
- explains a proxy error when the API is down
- reports a network failure as status 0
- passes cancellations through unchanged
- refreshes once and repeats the request

**`src/shared/lib/areas.test.ts`** (3). Week 5. Area lookup used by search and registration.

- finds an area by id and ignores unknown or missing ids
- starts in Thamel, where most demo businesses are
- keeps every area inside the Kathmandu valley, where the search radius makes sense

**`src/shared/lib/format.test.ts`** (3). Dates, times and countdown text.

- names nearby days
- formats countdowns, durations and distances
- formats relative times

**`src/shared/lib/images.test.ts`** (3). Week 5. Which photos may be uploaded, and that a photo the browser cannot decode is sent unchanged (27% covered before).

- %s of %i bytes: %s
- keeps the original when the browser cannot decode images
- keeps the original when decoding fails

**`src/shared/lib/money.test.ts`** (3). Rupees with Indian digit grouping, and Free for 0.

- formats rupees with Indian grouping and no decimals for whole numbers
- calls zero Free, except where an amount is required
- floors the discount and never goes negative

**`src/shared/lib/people.test.ts`** (2). Initials for avatars.

- takes up to two initials
- builds map links from coordinates

**`src/shared/mocks/handlers/handlers.test.ts`** (17). The mock API follows the same business rules as the real one, so UI tests mean something.

- returns only open listings from verified businesses, available first
- filters by radius and sorts by distance
- filters by category, max price and search text, and pages
- returns a listing's detail, or 404
- reserves stock and returns a pickup code
- gives the last unit to exactly one customer (goal G1)
- enforces the per-listing and active-reservation limits
- rejects bad quantities and signed-out users
- returns stock on cancel; a late cancel costs 5 reliability
- lets staff verify a code once, and only for their own business
- expires listings and marks no-shows when the window has passed (job E)
- publishes a valid listing and reports field errors
- blocks businesses that are not verified yet
- logs in with the demo password and rejects a wrong one
- registers a new customer and refuses a duplicate email
- counts and clears unread notifications
- lets only admins verify a business; rejecting needs a reason

**`src/shared/mocks/mocks.test.ts`** (7). Mock data stays consistent (stock, codes, windows relative to now).

- only references rows that exist
- only has listings from verified organizations
- keeps listing stock and windows valid (design doc 5.4 constraints)
- uses unique pickup codes from the unambiguous alphabet (no 0, 1, I, L, O)
- has upcoming listings relative to now, so the data never goes stale
- resets to the seed after changes
- answers unmocked endpoints with a 501 problem through the real client

## End to end (`npm run e2e`)

14 checks in a real Chrome against the running frontend, API and database; see [testing.md](testing.md#end-to-end).
