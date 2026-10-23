# Integration notes (Week 4)

How the React frontend and the ASP.NET Core API were connected, what broke when they first ran together, and how each problem was found and fixed. Commit ids are given so every fix can be read in full: `fe` is this repository, `be` is [Plateback-Backend](https://github.com/mhrjnrahul/Plateback-Backend).

## Contents

- [How the pieces connect](#how-the-pieces-connect)
- [Checking the integration points](#checking-the-integration-points)
- [Data flow: one reservation, end to end](#data-flow-one-reservation-end-to-end)
- [State management](#state-management)
- [Challenges and solutions](#challenges-and-solutions)
- [How the integration was validated](#how-the-integration-was-validated)
- [Performance](#performance)

## How the pieces connect

```
Browser (React app on http://localhost:5173)
   |  /api/v1/*   REST calls (fetch, JSON, Bearer token)
   |  /uploads/*  listing photos
   |  /hubs/live  SignalR (WebSocket)
   v
Vite dev server  -- proxies those three paths -->  ASP.NET Core API (http://localhost:5080)
                                                        |
                                                        v
                                                  PostgreSQL 16 (localhost:5432)
```

The browser only ever talks to one origin, `localhost:5173`. The Vite dev server forwards API, photo and SignalR traffic to the API (`vite.config.ts`, `server.proxy`). Three alternatives were considered:

| Option                                          | Problem                                                                                                                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Call `http://localhost:5080` directly with CORS | The refresh token cookie is `SameSite=Strict`. Ports do not change the "site", so it would work locally, but every request would need a CORS preflight and credentials, and production would need the same setup. |
| Relax the cookie to `SameSite=None`             | Weakens the CSRF protection the cookie was designed for in Week 3.                                                                                                                                                |
| **Proxy (chosen)**                              | One origin: no CORS, the cookie stays strict, and relative URLs (`/api/v1`, `/uploads/...`) work the same way behind a single host in production.                                                                 |

The mock API from Week 2 is still there for working on the UI without a backend, but it is now opt-in (`VITE_USE_MOCKS=true`). The tests keep using it whatever the local `.env` says (`vite.config.ts`, `test.env`).

## Checking the integration points

The backend was built in Week 3 from the same contract as the frontend's mock API (design document section 6), so the types in `src/shared/types/api.ts` and the C# DTOs were expected to match. That was checked rather than assumed:

1. **Shapes.** Every DTO in the backend's `Application/Features/*/…Dtos.cs` was compared field by field with the TypeScript types: listings, reservations (with their listing), the counter queue, organizations, stats, notifications, `AuthResponse` and ProblemDetails. They matched, including camelCase names, enum strings (`"SoldOut"`) and paging (`{ items, page, pageSize, total }`).
2. **Behaviour.** Every page was opened as every role in Chrome against the real API, recording every response with status 400 or above. This found the problems below, which shape comparison could not.

The one contract difference was the photo URL: the API returned `http://localhost:5080/uploads/….png`, the mock returned a relative path. See challenge 5.

## Data flow: one reservation, end to end

What happens when Maya presses **Reserve · Rs 150** on the Croissant trio while a visitor has the same listing open in another browser:

1. `ReservePanel` calls `useReserve(listingId)`, a React Query mutation, which sends `POST /api/v1/listings/{id}/reservations` with `{ "quantity": 1 }` and her access token.
2. The API's `ReserveListingHandler` locks her user row, checks her limits and takes the stock with one conditional `UPDATE`, then saves the reservation, an audit row and two outbox messages in one transaction.
3. After the commit, it calls `ILiveUpdates`, which sends `ListingsChanged { listingIds: [id] }` to every connected browser and `OrganizationChanged` to Sunrise Bakery's staff.
4. The API answers `201` with the reservation. Maya's dialog shows her pickup code, and her mutation invalidates `["listings"]`, `["reservations"]` and `["notifications"]`.
5. In the visitor's browser, `LiveUpdates` receives `ListingsChanged` and invalidates `["listings"]`. React Query refetches `GET /listings/{id}` and the stock bar changes from "8 of 12 left" to "7 of 12 left". Measured: **180 ms** after the reservation request was sent. Before SignalR this took up to 15 seconds.
6. Arjun's dashboard gets `OrganizationChanged` and refetches its queue and numbers.
7. Within 10 seconds the outbox job writes the notifications and sends `NotificationsChanged` to Maya and the staff, so their bells update.

If two people want the last portion, the second `UPDATE` changes no rows and the API answers `409 SOLD_OUT`. The client turns that into an `ApiError`, the panel shows "Someone else reserved the last portions just before you. The stock figure has been refreshed.", and `onSettled` refetches the stock either way.

## State management

| State                                                      | Where it lives                                                                                               | Why                                                                                                                                                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server data (listings, reservations, queue, notifications) | TanStack Query cache, one query key family per feature (`listingKeys`, `organizationKeys`, …)                | One source of truth for data that belongs to the API. Pages never copy it into component state.                                                                                                                  |
| Freshness                                                  | Invalidation after each mutation, on each SignalR message, and once after a reconnect; polling as a fallback | A page shows a change the moment the API reports it. If the hub is down, polling every 15 seconds takes over automatically (`livePollInterval`); while it is up, polling slows to once a minute as a safety net. |
| Access token                                               | A module variable in `AuthProvider`, never `localStorage`                                                    | A script injected into the page cannot read it later (design doc 4.6).                                                                                                                                           |
| Refresh token                                              | httpOnly cookie set by the API                                                                               | JavaScript cannot read it at all.                                                                                                                                                                                |
| Session restore                                            | A "signed in on this device" hint in `localStorage`, then `POST /auth/refresh`                               | Visitors who never logged in don't send a refresh request on every page load.                                                                                                                                    |
| Filters and paging                                         | The URL (`/browse?category=Bakery&radius=10`)                                                                | Shareable, and the back button works.                                                                                                                                                                            |

All requests go through one client (`src/shared/api-client/client.ts`). It adds the token, turns every failure into one `ApiError` type with a `code`, and when a request fails with `TOKEN_EXPIRED` it refreshes once and repeats the request.

## Challenges and solutions

Each one was found by running the two halves together. None of them showed up in the Week 2 tests (mock API) or the Week 3 tests (API only).

### 1. Cancelled requests were logged as server crashes

- **Symptom.** The first browser run reported `GET /api/v1/stats/impact -> 500` on the landing page, and the API log had errors with an `OperationCanceledException` for that endpoint and for `GET /api/v1/listings`.
- **Cause.** React Query cancels requests it no longer needs: when a page changes, when filters change, and twice per load in development because React mounts effects twice. ASP.NET Core then cancels the request, and the API's exception handler treated that as an unknown error. Worse, the output cache on `/stats/impact` makes a second identical request wait for the first and share its result. When the first was cancelled, the waiting request failed too, with a real 500.
- **Fix.** A request the client cancelled now answers 499 and is logged as Information. Locking is off for that cache policy. (be `1c7a542`)

### 2. Reloading the page signed people out

- **Symptom.** In development, reloading My reservations sometimes ended at the login page.
- **How it was found.** Recording the network calls on reload showed two `POST /auth/refresh` calls with the same cookie. When both reached the API before the first one's new cookie came back, the second presented a token that had just been rotated.
- **Cause.** The Week 3 reuse detection does what it was built to do: a rotated token used again looks stolen, so every session of the account is ended. The duplicate came from React's double mount; two tabs restoring a session together do the same.
- **Fix, on both sides.** The frontend now shares one refresh request between all callers (fe `ce3eb35`). The API accepts a token rotated less than 30 seconds ago, answering with an access token only and leaving the browser's newer cookie alone (be `d2563a6`, decision 10). Reuse after 30 seconds still ends every session, and a test covers both cases.
- **Evidence it works.** With tokens set to last one minute, five requests hit `401 TOKEN_EXPIRED` at the same moment; the network log then shows exactly one `POST /auth/refresh 200` and all five requests repeated with 200.

### 3. A quick double reload also signed people out

- **Symptom.** Pressing reload twice quickly logged the user out even after fix 2.
- **Cause.** The first page's refresh request was aborted by the second reload. The browser reports that as a network error, and the frontend treated any refresh failure as "session ended" and removed its signed-in hint, so the next page did not even try to restore the session.
- **Fix.** Only a 401 from the API ends the session; a failed connection leaves the hint for the next load to try again (fe `ce3eb35`).

### 4. Duplicate error logging (feedback on the Week 3 report)

- **Symptom.** With the database password set wrong on purpose, one `GET /api/v1/listings` wrote **five** `ERR` entries with four copies of the same stack trace: two from EF Core, one from ASP.NET Core's exception middleware, one from the API's own handler and one from the request log. The handler's entry did not even carry the trace id.
- **Fix.** The request log is now the only entry per request. It has the method, path, status, duration, exception and the same trace id the client receives. EF Core's and the middleware's copies are turned off (be `0eae8e5`). The same request now logs:

  ```
  [08:29:11 ERR] HTTP GET /api/v1/listings responded 500 in 432.7543 ms 0HNPGLU1TK782:00000001
  Npgsql.PostgresException (0x80004005): 28P01: password authentication failed for user "plateback"
  ```

  and the browser gets `"traceId": "0HNPGLU1TK782:00000001"`, so a user's error report leads straight to that line.

- **Test.** `LoggingTests` replaces photo storage with one that throws "No space left on device" and asserts exactly one Error entry with that trace id. Run against the old code, the same test finds three.

### 5. Photo URLs pointed at the API's own address

- **Symptom.** Uploaded photos showed, but the listing in the database held `http://localhost:5080/uploads/….png`.
- **Cause.** The upload endpoint built an absolute URL from the request's host. Behind the proxy that is the API's internal address, which would break on any other host or in deployment.
- **Fix.** The API returns `/uploads/….png`, and the dev server proxies `/uploads` (be `2a1bd1b`).

### 6. "Bad Gateway" shown to users

- **Symptom.** With the API stopped, Browse said "Could not load listings. Bad Gateway." and the heading still said "Loading listings".
- **Cause.** When the API is down, the proxy answers 502 with no ProblemDetails, so the client fell back to the HTTP status text.
- **Fix.** 502, 503 and 504 now read "The server is not responding. Try again in a moment.", and the heading says "Listings unavailable". **Try again** reloads once the API is back (fe `8b0cdbd`).

### 7. SignalR details

- **Authentication.** Browsers cannot set headers on a WebSocket, so the SignalR client sends the access token as `?access_token=`. The API reads it there for `/hubs/live` only. The request log records paths without query strings, so the token never reaches the logs (checked: `grep access_token` over the API log finds nothing).
- **Reconnecting.** By default SignalR stops retrying after four attempts (about 40 seconds), and it never retries a connection that failed on the first try. Both now retry every 30 seconds for as long as the page is open. Checked by stopping and restarting the API with a page open: the label went from "stock updates instantly" to "every 15 seconds" and back about 5 seconds after the API returned.
- **Console noise.** Leaving a page while it was still connecting printed SignalR errors in the console. They are expected (the app falls back to polling), so SignalR's own logging is off.

### 8. Tests depended on the developer's `.env`

- **Symptom.** After switching the local `.env` to the real API, three frontend tests failed.
- **Cause.** Vitest reads `.env`, and those tests expect the mock API's demo tools.
- **Fix.** `vite.config.ts` sets `VITE_USE_MOCKS=true` for tests, so they pass on any machine (fe `1e8fb73`).

## How the integration was validated

**As a developer:**

- Backend: 163 tests, including 87 against the real API and PostgreSQL. The Week 4 additions cover the refresh grace window, the SignalR hub (who hears what, and who may join a business's group) and logging.
- Frontend: 123 tests, including `LiveUpdates.test.tsx` (joins the business group, invalidates the right queries for each message, falls back when the hub is unreachable) and the client's handling of a proxy 502.
- Type checks, lint and formatting are clean in both projects, and warnings fail the backend build.

**As an end user:** `npm run e2e` (in `frontend/`) drives a real Chrome against the running frontend, API and database and fails on any step that misbehaves, any 5xx and any page crash. It covers:

- a visitor browsing and opening a listing;
- Maya reserving and getting a pickup code, while the visitor's page updates live without a reload;
- her session surviving a reload;
- Arjun checking the code at the counter, then the same code a second time, then a wrong one;
- publishing a listing with a photo, and the photo loading for customers;
- Maya cancelling a reservation;
- the admin verifying a business;
- a wrong password;
- logging out ending the session.

All 14 checks pass, and the API log shows no errors afterwards.

Done by hand: an API outage and recovery, an expired access token during navigation (with tokens shortened to one minute), the reservation limit message, and the duplicate email message on sign-up.

## Performance

Measured on the development laptop, through the dev server proxy as the browser sees it. Each request was run 200 times after 10 warm-up calls:

| Request                                           | Median | 95th percentile |
| ------------------------------------------------- | ------ | --------------- |
| `GET /listings` (5 km around Thamel, by distance) | 5.8 ms | 6.9 ms          |
| `GET /listings/{id}`                              | 4.7 ms | 5.8 ms          |
| `GET /reservations/mine` (signed in)              | 7.4 ms | 8.8 ms          |
| `GET /stats/impact` (output cache)                | 3.3 ms | 3.7 ms          |

| Other measures                             | Result                                                                                                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Live stock update reaching another browser | about 180 ms after the reservation request                                                                                                                                                 |
| Requests while a page is open              | One every minute per live query while SignalR is connected, instead of every 15 seconds                                                                                                    |
| Production JavaScript                      | Split into cached library chunks (React 68 kB, forms 36 kB, router 32 kB, UI 31 kB, query 11 kB, other libraries including SignalR 36 kB, gzipped) plus small per-page chunks of 2 to 5 kB |
