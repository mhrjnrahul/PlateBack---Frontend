# Testing and performance (Week 5)

How PlateBack is tested, how to run every suite, what the tests found, and how the application was profiled and made faster. The debugging work behind each fix is written up separately in [debugging.md](debugging.md), and every test is listed with its purpose in [test-catalogue.md](test-catalogue.md).

`fe` commits are in this repository, `be` commits in [Plateback-Backend](https://github.com/mhrjnrahul/Plateback-Backend).

## Contents

- [Strategy](#strategy)
- [Running the tests](#running-the-tests)
- [Coverage](#coverage)
- [What the tests protect](#what-the-tests-protect)
- [End to end](#end-to-end)
- [Test reports and logs](#test-reports-and-logs)
- [Performance](#performance)
- [What was measured and left alone](#what-was-measured-and-left-alone)

## Strategy

Each rule is tested at the lowest layer that can prove it, and only the things that need the real database, the real network or a real browser are tested there.

| Layer                       | Tool                                                             |        Count | What it is for                                                                                                                                                                    |           Time |
| --------------------------- | ---------------------------------------------------------------- | -----------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------: |
| Domain unit                 | xUnit v3, Shouldly                                               |           55 | Business rules in the entities: windows, prices, stock, reliability, retry limits. No database, so a rule fails on its own line.                                                  |            3 s |
| Application unit            | xUnit v3, Shouldly                                               |           24 | Validators and helpers (distance, file types, paging).                                                                                                                            |            3 s |
| API integration             | xUnit v3, `WebApplicationFactory`, PostgreSQL 16                 |          102 | The API over real HTTP against a real database: what only the database can enforce (constraints, row locks, transactions, races), security, error format, jobs, SignalR, logging. |           54 s |
| Frontend unit and component | Vitest, Testing Library                                          |           77 | The API client, formatting, filters, form schemas, pagination, photo checks, the SignalR client.                                                                                  |                |
| Frontend full app           | Vitest, Testing Library, MSW                                     |           72 | The whole app (router, auth, queries) clicked and typed through like a user, against the mock API that follows the same rules as the real one.                                    |  22 s in total |
| End to end                  | playwright-core, Chrome                                          |    14 checks | The real frontend, API and database together, for the main flow of every role.                                                                                                    | under a minute |
| Performance                 | autocannon, dotnet-counters, dotnet-trace, `EXPLAIN`, Lighthouse | 10 scenarios | Throughput and latency under load, and page-load metrics. See [Performance](#performance).                                                                                        |          3 min |

**Rules the suites follow:**

- **Real PostgreSQL, not an in-memory database.** The rules that matter most (stock never below zero, one active reservation per listing, unique pickup codes) are database constraints, and EF Core's in-memory provider ignores constraints, locks and transactions.
- **Tests act like users.** Frontend tests find elements by role and label ("button named Reserve"), as a screen reader would. A test that cannot find a button by its accessible name is also an accessibility bug.
- **Deterministic.** A test clock fixes "now" (2026-10-17 06:00 UTC) and can move forward, the database is reset to the demo data before each integration test, the mock data is reset after each frontend test, and requests to anything unmocked fail the test.
- **Test names are sentences** that say what must stay true, for example `Ten_customers_race_for_the_last_portion_and_exactly_one_gets_it`. The [test catalogue](test-catalogue.md) lists all of them.

## Running the tests

| What                        | Where                  | Command                                                                                                            |
| --------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Everything, with reports    | this repository's root | `scripts/run-all-tests.sh` (add `E2E=1` to include end to end)                                                     |
| Backend: all three projects | backend                | `dotnet test` (PostgreSQL running)                                                                                 |
| Backend with coverage       | backend                | `dotnet test -- --coverage --coverage-output-format cobertura --coverage-output coverage.cobertura.xml`            |
| One backend class           | backend                | `dotnet test --project tests/PlateBack.Api.IntegrationTests -- --filter-class "*ReservationTests"`                 |
| Frontend                    | frontend               | `npm run test:run`                                                                                                 |
| Frontend with coverage      | frontend               | `npm run coverage`                                                                                                 |
| End to end                  | frontend               | `npm run e2e` (API on :5080 with fresh demo data and the dev server running; `E2E_BASE_URL` if it is not on :5173) |
| Load test                   | backend/perf           | see [backend perf/README.md](https://github.com/mhrjnrahul/Plateback-Backend/blob/main/perf/README.md)             |
| Lighthouse, real page loads | frontend               | `node perf/lighthouse.mjs <label>`, `node perf/vitals.mjs <base> <path>`                                           |

`scripts/run-all-tests.sh` expects the backend next to `frontend/`, as in the Week 5 ZIP; set `BACKEND_DIR` otherwise. It writes TRX, HTML and JUnit results, HTML coverage reports and the console output of each run to `test-artifacts/`.

**Continuous integration.** Both repositories run their suites on GitHub Actions on every push. The backend workflow starts a PostgreSQL 16 service, builds with warnings as errors, checks formatting, runs all three test projects with coverage and posts the coverage summary on the run page. The frontend workflow runs lint, the type check, formatting, the tests with coverage and the production build. Both keep their reports as a downloadable artifact. The end-to-end checks need a running API and database, so they run locally.

## Coverage

Measured with the .NET coverage collector and ReportGenerator, and with V8 coverage in Vitest. Generated code (EF Core migrations, the OpenAPI source generator's output) and the mock API are left out.

|                            |    Week 4 |        Week 5 |
| -------------------------- | --------: | ------------: |
| Backend lines              |     84.1% |     **88.0%** |
| Backend branches           |     70.0% |     **72.7%** |
| Backend methods            |     90.1% |     **95.6%** |
| Application layer lines    |     88.0% |     **95.6%** |
| Frontend lines             |     87.1% |     **91.0%** |
| Frontend branches          |     78.8% |     **81.3%** |
| Tests (backend / frontend) | 163 / 123 | **181 / 149** |

The percentage was not the target. The report was used to find **features with no test at all**, and those got tests first:

| Untested before                           |  Coverage | Why it mattered                                                   | Test added                                                 |
| ----------------------------------------- | --------: | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| The business dashboard's listings table   |        0% | Every business uses it                                            | Order, paging, members-only (`ManagementTests`)            |
| Admin removing a listing                  |        0% | Cancels customers' reservations                                   | Cancelled, and customers and staff notified                |
| Editing business details, finding users   |        0% | Owner-only and admin-only actions                                 | Owner can, staff cannot; search by name and email          |
| Suspending accounts                       |       52% | A suspended user must stop at once                                | Their still-valid token can no longer reserve              |
| Outbox retries                            |       38% | Lost or repeated notifications                                    | Five attempts, then set aside, without blocking the others |
| Registering a business (frontend)         |       48% | The only way a business joins                                     | Validation, browser location, the pending result           |
| Location search, pagination, photo checks | 27 to 41% | The landing page's main action, hidden listings, rejected uploads | `LocationSearch`, `Pagination`, `images` tests             |

**Still not covered, on purpose:** the background job runner's loop (it only calls the jobs, which are tested directly, on a timer), the warning SignalR logs if a push fails (it needs a broken connection mid-send), and the mock API's own code (it is the test fixture, and has its own tests for its rules).

## What the tests protect

The full list with a purpose for every file is in [test-catalogue.md](test-catalogue.md). The ones that guard the most:

- **The last portion (goal G1).** Ten customers reserve the last portion at the same moment: exactly one succeeds, nine get `SOLD_OUT`, stock ends at 0. Run against the real database, because the protection is a conditional `UPDATE` there.
- **Search after its rewrite.** The listing search was rewritten for speed this week (see [Performance](#performance)). Its 15 integration tests (distance, filters, text, paging, sold-out last) had to pass unchanged before and after, which is what made the rewrite safe. A new test pins the dashboard listings order, whose sorting also moved into SQL.
- **Security.** Five wrong passwords lock the account; a replayed refresh token ends every session after the 30-second grace window; a removed staff member loses access on their next request; a suspended customer's still-valid token cannot reserve; a pickup code from another business looks unknown.
- **Logging.** One unexpected failure writes exactly one Error entry carrying the trace id the user sees, and expected answers write none. Run against the Week 3 code, the same test finds three.

## End to end

`npm run e2e` drives a real Chrome against the running frontend, API and database. It fails on any check that does not hold, on any 5xx response and on any page crash, and it now stops at once with a clear message if the address it was given is not PlateBack. The 14 checks:

```
Visitor
  ok    browse shows listings from the API
  ok    listing page shows live stock (8 left)
Customer
  ok    reserve gives a pickup code (W4P2-7KP7)
  ok    visitor's stock updated live in 545 ms
  ok    session survives a reload; reservation is listed
Business
  ok    pickup code verified at the counter
  ok    the same code is refused the second time
  ok    an unknown code is explained
  ok    listing published with a photo
  ok    the photo loads for customers
Customer again
  ok    cancel from My reservations
Admin
  ok    admin verifies "Durbar Sweets"
Errors and sign-out
  ok    a wrong password is explained
  ok    log out ends the session (refresh answers 401)
```

## Test reports and logs

The Week 5 ZIP has a `test-artifacts/` folder from a full run on 25 October 2026:

| Path                                                           | What it is                                                                                                                                                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/<project>/*.trx`, `*.html`                            | xUnit results per test project (TRX opens in Visual Studio; HTML in a browser)                                                                                                                  |
| `backend/coverage/index.html`                                  | Backend coverage by assembly, class and line                                                                                                                                                    |
| `backend/dotnet-test.log`                                      | Console output of the backend build, style check and tests                                                                                                                                      |
| `frontend/junit.xml`, `frontend/coverage/index.html`           | Frontend results and coverage                                                                                                                                                                   |
| `frontend/vitest.log`                                          | Console output of lint, type check, tests and build                                                                                                                                             |
| `e2e/e2e.log`                                                  | The end-to-end run above                                                                                                                                                                        |
| `logs/database-down-week3.log`, `logs/database-down-week5.log` | The same failure (wrong database password, one request) with the Week 3 and the Week 5 code: 5 error entries before, 1 after. See [debugging.md](debugging.md#5-one-failure-five-error-entries) |
| `logs/api-e2e.log`                                             | The API's log during the end-to-end run: no errors                                                                                                                                              |
| `performance/`                                                 | Load-test, counter, Lighthouse and real page-load results (also in both repositories' `perf/results/`)                                                                                          |

## Performance

### How it was profiled

The demo data has 14 listings, which hides every scaling problem, so profiling used **`perf/load-data.sql`** (backend): 400 extra businesses, 30,000 listings of which about 6,000 are live, and two years of history (3,650 listings) for Sunrise Bakery. Then, for the API:

1. **Load test** (`perf/load-test.mjs`, autocannon): 10 scenarios, 20 connections, 3 s warm-up and 15 s measured each, against a Release build.
2. **Runtime counters** (`dotnet-counters`): CPU, allocations and garbage collection while the slowest scenario ran.
3. **CPU trace** (`dotnet-trace`): which methods the request threads were in.
4. **Database:** the SQL EF Core logged, run with `EXPLAIN (ANALYZE, BUFFERS)`, and index use from `pg_stat_user_indexes`.

For the frontend: Lighthouse (median of 3 runs, mobile and desktop), real page loads with the same phone throttling applied in Chrome (`perf/vitals.mjs`), a layout-shift observer that records which element moved and by how much, and the CPU an open page uses while idle.

### API: results

The Week 4 code and the Week 5 code, back to back on the same data (`perf/results/before.md`, `after.md`):

| Scenario                                                       |                           Week 4 |                              Week 5 |                                          |
| -------------------------------------------------------------- | -------------------------------: | ----------------------------------: | ---------------------------------------- |
| Search 5 km (the Browse page)                                  |             220 req/s, p50 83 ms |            **601 req/s, p50 32 ms** | 2.7x                                     |
| Search 25 km (largest radius)                                  | 54 req/s, p50 351 ms, p99 685 ms | **342 req/s, p50 57 ms, p99 87 ms** | 6.3x                                     |
| Search 5 km, page 10                                           |                        207 req/s |                       **610 req/s** | 2.9x                                     |
| Search without a location                                      |                        427 req/s |                       **685 req/s** | 1.6x                                     |
| Search text "momo" within 5 km                                 |                        491 req/s |                           490 req/s | same                                     |
| Business listings table (3,650 listings)                       |             87 req/s, p50 224 ms |            **785 req/s, p50 24 ms** | 9x                                       |
| Listing detail, my reservations, dashboard stats, impact stats |                                  |                                     | unchanged, already 1,300 to 18,000 req/s |

During the 25 km search (`perf/results/counters-*.csv`):

|                                    |  Before (49 req/s) |       After (371 req/s) |
| ---------------------------------- | -----------------: | ----------------------: |
| Memory allocated per request       |            21.6 MB |             **0.37 MB** |
| Time paused for garbage collection | 2.7 s of every 5 s | **0.12 s of every 5 s** |
| Gen 2 collections                  |          8 per 5 s |                   **0** |
| Process memory                     |            1.15 GB |              **305 MB** |

### API: what was changed

1. **Listing search pages in PostgreSQL** (be `e43ab70`). With a location, the search loaded every listing in the bounding box with all its columns, about 6,000 rows of 1.5 KB for 25 km, to compute distances in C# and return 20. Distance, filter, sort, count and paging now run in SQL; the distance formula is written so EF Core translates it (`asin(sqrt(power(sin(...` in the logged SQL).
2. **A covering index for live listings** (same commit). After step 1 the database was the bottleneck: it read about 1,800 table pages per query to check every live listing. A partial index on live listings (`status IN ('Active', 'SoldOut')`) that includes every column the search filters, sorts and counts on makes the count and the page index-only scans (0 heap fetches): 15 ms to 5 to 6 ms each. Only the 20 listings on the page are then read in full.
3. **Text search kept fast** (same commit). The first version of step 2 made text search slower (480 to 306 req/s), because `lower(title) LIKE` still read the table for every live listing. Adding the title to the index (live listings only, so it stays small) brought it back to 480. The load test caught this; without measuring every scenario after each change it would have shipped.
4. **An index that was never used, removed** (same commit). `ix_listings_latitude_longitude` had 0 scans after about 100,000 searches, because it covered only `Active` rows while search asks for `Active` or `SoldOut`. It only cost writes.
5. **The dashboard listings table pages in SQL** (be `033f514`). It loaded a business's whole history into memory to show one page.

### Frontend: results and changes

|                                                                     |                          Week 4 |                                        Week 5 |
| ------------------------------------------------------------------- | ------------------------------: | --------------------------------------------: |
| Layout shift, landing (mobile / desktop)                            |                   0.104 / 0.096 |                             **0.000 / 0.022** |
| Layout shift, Browse (mobile)                                       |                           0.117 |                                     **0.000** |
| Real page load on a throttled phone, landing: first / largest paint |                1,856 / 2,684 ms |                          **1,772 / 2,632 ms** |
| Real page load on a throttled phone, Browse: first / largest paint  |                1,748 / 2,448 ms |                          **1,656 / 2,340 ms** |
| Shared `vendor` chunk loaded before first render                    |                 36.2 kB gzipped | **22.3 kB** (SignalR, 14 kB, now loads after) |
| Lighthouse performance score (mobile / desktop)                     | landing 83 / 97, Browse 80 / 99 |               landing 82 / 99, Browse 81 / 99 |

Layout shift above 0.1 is "needs improvement" in Google's Core Web Vitals; all pages are now under it. The changes (fe `5a53119`):

1. **Browse heading.** "Loading listings" (one line) became "1333 listings within 5 km of Thamel, Kathmandu" (two lines on a phone) and moved everything below it 24 px. The loading text now names the same area, so it has the same shape.
2. **Landing stats line.** It appeared only once the numbers arrived and pushed the page down. An invisible line of the same shape now holds the space (it never shows fake numbers).
3. **Headline font.** Headings wrapped differently when Fraunces arrived. A fallback face (Times New Roman, or Liberation Serif on Linux) sized to Fraunces' metrics, measured in Chrome (11.4% wider, ascent 98 and descent 26 per 100 px), now wraps the same way.
4. **Hero skeletons on desktop.** They had the tall card shape while the real cards are compact rows, so the page shrank by about 900 px when the listings arrived. The skeleton now takes the card's layout.
5. **SignalR loads after first render.** The client library was in the shared chunk every page downloads first. It is now its own chunk, imported once the page has rendered.

Lighthouse's simulated mobile run shows the largest paint 0.3 to 0.4 s _later_ after these changes, while real throttled page loads show it slightly _earlier_. Lighthouse simulates the phone from a fast trace and counts the separate SignalR request and the fallback font in the loading chain. The real measurement (`perf/results/vitals.md`) is the one to trust, and both are reported so the difference is visible.

## What was measured and left alone

- **Listing detail, my reservations, dashboard stats, impact stats:** 1,300 to 18,000 requests/s with p99 under 25 ms. They already query by key or aggregate in SQL.
- **Splitting the UI library chunk:** Lighthouse flagged 24 kB of unused UI code on Browse. Letting the bundler split it per page saved only 7 kB of uncompressed JavaScript, because the header already uses most of it (menu, sheet, dialog), and it would have meant 62 files instead of a few long-cached ones. Rejected.
- **Countdown timers:** an open My reservations page with countdowns uses 0.7 ms of script per second, and Browse 0. Not worth changing.
- **First paint on a slow phone:** about 1.7 s in real loads (3 s in Lighthouse's simulation) is mostly the cost of a single-page app downloading 200 kB of JavaScript before it can draw. Pre-rendering the public pages would change that; it belongs with deployment (Week 6).
- **Text search at scale:** it reads every live listing's title from the index. With many more live listings, a trigram index (`pg_trgm`) would be the next step.
