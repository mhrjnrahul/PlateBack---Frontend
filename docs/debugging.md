# Debugging process and lessons learned (Week 5)

How problems were found and fixed this week, written up one by one: what was seen, which tool showed the cause, the cause itself, the fix and what now guards against it coming back. Testing and the performance numbers are in [testing.md](testing.md). Week 4's integration bugs are in [integration.md](integration.md#challenges-and-solutions).

`fe` commits are in this repository, `be` commits in [Plateback-Backend](https://github.com/mhrjnrahul/Plateback-Backend).

## The process

Every problem below went through the same steps:

1. **Reproduce it on demand.** A problem that cannot be triggered cannot be confirmed fixed. Several needed a setup first: 30,000 listings, a wrong database password, phone throttling.
2. **Measure before guessing.** A number (requests per second, megabytes per request, a layout-shift score) or an exact log line, not "it feels slow".
3. **Narrow it down** with the tool that sees one layer: runtime counters for the process, a trace for the methods, `EXPLAIN` for the database, a layout-shift observer for the page.
4. **Explain the cause** in one sentence before changing anything.
5. **Make the smallest fix**, then repeat the same measurement. Every scenario, not only the one being fixed (see 3).
6. **Guard it** with a test that fails on the old code where possible.
7. **Write it down**, here and in the commit message.

| Tool                                                  | Used for                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| autocannon load test (`backend/perf/load-test.mjs`)   | Throughput and latency per endpoint, before and after               |
| `dotnet-counters`                                     | CPU, memory allocated, garbage-collection pauses of the running API |
| `dotnet-trace` (sampled thread time)                  | Which methods request threads spend time in                         |
| EF Core SQL logging, `EXPLAIN (ANALYZE, BUFFERS)`     | The exact SQL, and how PostgreSQL runs it                           |
| `pg_stat_user_indexes`                                | Whether an index is ever used                                       |
| Serilog with trace ids, a capturing log sink in tests | What the API writes when something fails                            |
| Lighthouse, Chrome DevTools Protocol throttling       | Page-load metrics, simulated and real                               |
| `PerformanceObserver` for `layout-shift`              | Which element moved, from where to where                            |
| Playwright request log                                | The order and timing of requests during a page load                 |
| Stack traces, `ss -ltnp`, small comparison scripts    | Test failures, port conflicts, contract drift                       |

## Reports

### 1. 21.6 MB of memory for every search

- **Seen.** With 30,000 listings, the 25 km search managed 49 requests/s with a median of 381 ms; everything else answered in 1 to 11 ms.
- **Narrowed down.** `dotnet-counters` during that load: 6.8 CPU cores busy, **5.3 GB allocated every 5 seconds**, 2.7 s of every 5 s paused for garbage collection, 1.15 GB of memory. So the time was in .NET, not waiting for the database. `dotnet-trace` put the request threads in EF Core's `ToListAsync`, loading entities; the distance maths hardly showed. `EXPLAIN ANALYZE` of the logged SQL: the query itself took 16 ms but **returned 6,021 rows of about 1.5 KB**.
- **Cause.** The search loaded every listing in the bounding box, with descriptions and all, then computed distances, sorted and paged in C#, keeping 20 of 6,021.
- **Fix.** Distance, filter, sort, count and paging in SQL, then load only the page's 20 listings (be `e43ab70`).
- **Verified.** Same load: 0.37 MB per request, 0.12 s of GC pauses per 5 s, 305 MB of memory. Final numbers: 54 to 342 requests/s at 25 km.
- **Guard.** The 15 search integration tests passed unchanged before and after the rewrite.

### 2. An index with zero scans

- **Seen.** After the fix above, `EXPLAIN` showed PostgreSQL reading about 1,800 table pages per search. There was a location index, so why was it not used?
- **Narrowed down.** `SELECT indexrelname, idx_scan FROM pg_stat_user_indexes`: after about 100,000 searches, `ix_listings_latitude_longitude` had **0 scans**.
- **Cause.** It was a partial index on `status = 'Active'`, while the search asks for `status IN ('Active', 'SoldOut')` (sold-out listings are shown last). The planner can never use it for that, and it still cost a write on every listing change.
- **Fix.** Replaced by a covering partial index of live listings that holds every column the search filters, sorts and counts on (be `e43ab70`). The count and the page became index-only scans with 0 heap fetches, 15 ms to 5 to 6 ms each.
- **Lesson.** An index that looks right can be useless; ask the database, it keeps count.

### 3. The fix that made text search slower

- **Seen.** After adding the covering index, the load test reran **all ten scenarios**: the target searches were 2 to 9 times faster, but text search had dropped from 480 to 306 requests/s.
- **Cause.** The text filter is `lower(title) LIKE`, and the title was not in the new index. The new query shape read the table twice (once to count, once for the page) instead of once.
- **Fix.** The title added to the index. It covers live listings only (about 6,000 rows), so it stays small. Text search is back at 490 requests/s.
- **Lesson.** Measure every scenario after every change, not only the one being optimised. Without the full rerun this regression would have shipped.

### 4. A dashboard that slowed down with age

- **Seen.** While reading the handlers for the slow search, `GetOrganizationListingsHandler` stood out: it called `ToListAsync()` on all of a business's listings and paged the list in memory. With the demo data it answered 3,000 requests/s, because Sunrise Bakery has six listings.
- **Reproduced.** `load-data.sql` gives Sunrise Bakery two years of history, five listings a day (3,650). The same endpoint fell to **57 requests/s, p50 333 ms**.
- **Fix.** Sorted and paged in SQL with the same order (upcoming first, soonest first, then past, newest first) (be `033f514`). 785 requests/s, p50 24 ms in the final run.
- **Guard.** New tests pin the order and check that page 2 and the total agree with the full list.
- **Lesson.** Demo data hides growth problems. Test with the volume a real user reaches after a year or two.

### 5. One failure, five error entries

The Week 3 report's feedback pointed to a problem with error logging. It was fixed in Week 4 (be `0eae8e5`); this week the before and after were captured as real logs for the record (`test-artifacts/logs/`).

- **Reproduced.** The API started with a wrong database password, one `GET /api/v1/listings` sent.
- **Before** (Week 3 code), five Error entries for one request, most of them carrying their own copy of the same exception (129 stack-trace lines in the file, against 29 after):

  ```
  [11:24:17 ERR] An error occurred using the connection to database 'plateback' on server 'tcp://localhost:5432'.
  [11:24:17 ERR] An exception occurred while iterating over the results of a query for context type 'PlateBack.Infrastructure.Persistence.AppDbContext'.
  [11:24:17 ERR] HTTP GET /api/v1/listings responded 500 in 479.9130 ms 0HNPIB97888T7:00000001
  [11:24:17 ERR] Unhandled exception for GET /api/v1/listings
  [11:24:17 ERR] An unhandled exception has occurred while executing the request.
  ```

- **After**, one entry, with the trace id the user receives in the error response:

  ```
  [11:24:34 ERR] HTTP GET /api/v1/listings responded 500 in 797.9429 ms 0HNPIB9C2FADJ:00000001
  ```

  ```json
  { "code": "INTERNAL_ERROR", "traceId": "0HNPIB9C2FADJ:00000001", ... }
  ```

- **Guard.** `LoggingTests` makes photo storage throw "No space left on device" and asserts exactly one Error entry with that trace id, and none for expected 4xx answers. Run against the old code, it finds three.

### 6. Pages that jumped while loading

- **Seen.** Lighthouse: layout shift 0.104 on the landing page and 0.117 on Browse (on mobile), 0.096 on the landing page on desktop. Above 0.1 counts as poor.
- **Narrowed down.** A `PerformanceObserver` for `layout-shift`, injected before the page loads, records each shift with the elements that moved and their position before and after. It found four separate causes:

  | Shift                             | What moved                                     | Cause                                                                                                                                                    |
  | --------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | 0.117 at 2.96 s, Browse, phone    | Filters, search box, Live label: down 24 px    | "Loading listings" (1 line) became "1333 listings within 5 km of Thamel, Kathmandu" (2 lines)                                                            |
  | 0.043 at 2.86 s, landing, phone   | "Last call" section: down 90 px                | The stats line appeared only when its numbers arrived                                                                                                    |
  | 0.032 at 3.08 s, landing, phone   | Location form and everything below: down 40 px | The headline wrapped onto another line when the Fraunces font arrived                                                                                    |
  | 0.101 at 0.63 s, landing, desktop | "Last call" pulled up into view                | Measured section heights over time: the hero column went from 1,426 px to 530 px; its skeletons had the tall card shape, the real cards are compact rows |

- **Fix** (fe `5a53119`). Loading text with the same shape; an invisible placeholder line; a fallback font sized to Fraunces' metrics (measured in Chrome: 11.4% wider, ascent 98, descent 26 per 100 px); the skeleton takes the card's layout.
- **Verified.** 0.000 on both pages on mobile, 0.022 on the landing page on desktop.
- **Guard.** A Browse test checks that the heading names the search area while it is still counting.

### 7. When the measuring tool disagrees with itself

- **Seen.** After the frontend changes, Lighthouse's mobile run showed the largest paint 0.3 to 0.4 s later than before, although the changes removed work from the first load.
- **Narrowed down.** Lighthouse simulates a slow phone from a fast trace. To check it, both builds (Week 4 on port 4174, Week 5 on 4173) were loaded in Chrome with the same throttling **applied for real** (`perf/vitals.mjs`), five cold loads each: the Week 5 build painted **earlier** on both pages (landing 2,684 to 2,632 ms, Browse 2,448 to 2,340 ms).
- **Cause.** The simulation counts the SignalR chunk, now a separate later request, and the fallback font in its loading chain.
- **Lesson.** Check a tool's surprising result with a second, independent measurement before acting on it, and report both.

### 8. An unhandled error after a passing test

- **Seen.** The new landing-page tests passed, but Vitest reported "Unhandled error: FormData constructor: Argument 1 could not be converted" after "searches the chosen area".
- **Narrowed down.** The stack trace ended in React DOM's form-action code: when a form submit starts a transition (React Router's `navigate` does), React calls `new FormData(form, submitter)`.
- **Cause.** The test setup replaces `FormData` with Node's version, so that photo uploads work with Node's `fetch`. Node's `FormData` cannot be built from a form element. A browser has only one `FormData`, so the app itself was fine.
- **Fix.** The test `FormData` reads a form with jsdom's version and copies the entries into Node's (fe `ca54a90`).
- **Lesson.** "Passed, with an unhandled error" is a failure; the next test might be the one it breaks.

### 9. Error codes the frontend did not know

- **Found by** a small script comparing every enum and error code between the C# source and `src/shared/types/api.ts`. All enums matched, but the frontend's `ErrorCode` type lacked `FORBIDDEN`, `INVALID_STATE` and `CONFLICT`, added to the API in Week 3.
- **Impact.** None visible (no UI logic branches on those three), but the type promised something false.
- **Fix.** Added to the type (fe `ca54a90`).

### 10. A test that passed for the wrong reason

- **Seen.** After the Browse heading fix (report 6), "lists nearby listings for the chosen area" failed: it expected "11 listings within 25 km" and got "Finding listings within 25 km".
- **Cause.** The test found the heading by `/listings? within/`, which the new loading text also matches, so it read the heading before the count arrived. Before the fix, it had only worked because the loading text did not match.
- **Fix.** The helper waits for a heading that starts with a number.

### 11. A benchmark that measured the warm-up

- **Seen.** In the first back-to-back run, the Week 4 code's 5 km search gave 62 requests/s, where earlier runs gave about 200.
- **Cause.** It was the first scenario after starting the API, so it paid for JIT compilation and the connection pool starting up.
- **Fix.** Every scenario now gets 3 s of unrecorded warm-up; both versions were measured again (220 and 601 requests/s).

### 12. End-to-end checks against the wrong application

- **Seen.** `npm run e2e` timed out on its first step, waiting 30 s for listing cards.
- **Narrowed down.** `curl localhost:5173/api/v1/listings` returned an HTML page titled "Merchant Portal", and `ss -ltnp` showed another project's dev server on port 5173. PlateBack's dev server had exited at start because the port was taken.
- **Fix.** The script now checks that the address answers like PlateBack's API before starting, and stops with "No PlateBack API behind http://localhost:5173/api/v1 (got 200 text/html)" (fe `737296e`). The run used port 5175 with `E2E_BASE_URL`.

## Lessons learned

1. **Profile with realistic data.** Three of the four performance problems were invisible with 14 demo listings and obvious with 30,000.
2. **Find out which layer is slow before optimising.** The counters said ".NET, not the database" for the search, and the plan said "the database" after the first fix. Each answer led to a different fix.
3. **Rerun every measurement after every change.** The text-search regression (3) was caused by the fix for another scenario.
4. **Ask the system, not your assumptions.** The unused index (2) looked correct in the code.
5. **Distrust a single tool.** Lighthouse's simulation and real loads disagreed (7); the real one was right.
6. **A test is only as good as what it waits for.** Report 10's test passed by luck for weeks.
7. **Coverage is a map, not a score.** Its value was pointing at whole features with no test (the dashboard listings table, account suspension, registering a business), not the percentage.
8. **Write it down while it is fresh.** The commit messages and these reports were written as each problem was solved, which is why the numbers here are exact.
