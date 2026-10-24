# PlateBack

PlateBack lets bakeries, cafes and restaurants list end-of-day surplus food, and lets people nearby reserve it and collect it during a short pickup window with a pickup code. YuvaIntern programme project.

![Browse page](frontend/docs/screenshots/browse.jpg)

The app is two projects that run together:

| Part        | Where                                                                                                | What it is                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Frontend    | [`frontend/`](frontend/) in this repository                                                          | React 19 + TypeScript (Week 2). [README](frontend/README.md)                                                                    |
| Backend     | [Plateback-Backend](https://github.com/mhrjnrahul/Plateback-Backend) (in the Week 4 ZIP: `backend/`) | ASP.NET Core 10 REST API with PostgreSQL and SignalR (Week 3). [README](https://github.com/mhrjnrahul/Plateback-Backend#readme) |
| Integration | [`docs/integration.md`](docs/integration.md)                                                         | How they connect, the problems found when connecting them and how each was solved (Week 4)                                      |

## Week 4 submission

One ZIP with both projects and this README is attached to the [week4 release](https://github.com/mhrjnrahul/PlateBack---Frontend/releases/tag/week4), together with the demo video (`plateback-demo.webm`, also inside the ZIP).

| The Week 4 brief asks for                                       | Where it is                                                                                                                                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Frontend integrated with the backend APIs                       | Every page uses the real API through one client; the mock API is now opt-in ([How it fits together](#how-it-fits-together))                                                                      |
| Dynamic data and real-time interaction                          | Stock, the counter queue and notifications are pushed over SignalR and reach other browsers in about 0.2 seconds ([integration notes](docs/integration.md#data-flow-one-reservation-end-to-end)) |
| Asynchronous data fetching and state management                 | TanStack Query for all server data, invalidated by mutations and by SignalR messages, with polling as a fallback ([state management](docs/integration.md#state-management))                      |
| API endpoints tested from the UI, exceptions handled gracefully | `npm run e2e` drives the main flows of every role in Chrome; every API error reaches the user as a plain sentence ([validation](docs/integration.md#how-the-integration-was-validated))          |
| Seamless data flow, validated as an end user and as a developer | 14 end-to-end checks, 163 backend tests and 123 frontend tests                                                                                                                                   |
| Challenges and solutions documented                             | Eight problems with cause, fix and evidence ([challenges](docs/integration.md#challenges-and-solutions))                                                                                         |
| Instructions to set up and run the whole application locally    | [Run it locally](#run-it-locally) below                                                                                                                                                          |
| Video demonstration                                             | `plateback-demo.webm`, in the ZIP and on the week4 release                                                                                                                                       |
| About 30–35 hours                                               | About 30–35 hours                                                                                                                                                                                |

## Run it locally

### Requirements

- **Node.js 22.22 or newer** and npm (for the frontend)
- **.NET 10 SDK** 10.0.112 or newer (for the API)
- **PostgreSQL 16** on `localhost:5432`
- **Google Chrome or Chromium**, only for `npm run e2e`

### 1. Get the code

From the ZIP: unzip it; it contains `frontend/` and `backend/`. From GitHub:

```bash
git clone https://github.com/mhrjnrahul/PlateBack---Frontend.git
git clone https://github.com/mhrjnrahul/Plateback-Backend.git
```

(The frontend's code is in the `frontend/` folder of its repository.)

### 2. Set up the database and the API (once)

In the backend folder:

```bash
# A database login (as the PostgreSQL superuser)
sudo -u postgres psql -c "CREATE ROLE plateback LOGIN CREATEDB PASSWORD 'plateback';"

# Secrets, stored outside the code
cd src/PlateBack.Api
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=plateback;Username=plateback;Password=plateback"
dotnet user-secrets set "Jwt:Key" "$(openssl rand -base64 48)"
cd ../..

# Create the tables and load the demo data
dotnet run --project src/PlateBack.Api -- seed
```

Details and options are in the [backend README](https://github.com/mhrjnrahul/Plateback-Backend#run-it-locally).

### 3. Install the frontend (once)

In the frontend folder (`frontend/` inside this repository):

```bash
npm ci
```

### 4. Start both

Two terminals:

```bash
# Terminal 1, backend folder: the API on http://localhost:5080
dotnet run --project src/PlateBack.Api

# Terminal 2, frontend folder: the app on http://localhost:5173
npm run dev
```

Open **http://localhost:5173**. The dev server forwards `/api`, `/uploads` and `/hubs` to the API, so nothing else needs configuring.

To start again from the original demo data, stop the API, run `dotnet run --project src/PlateBack.Api -- seed`, and start it again.

### Demo accounts

Every account uses the password **`password123`**.

| Role           | Email                       | Try                                                                                                   |
| -------------- | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| Customer       | maya@example.com            | Browse, reserve and get a pickup code, cancel, notifications                                          |
| Business owner | arjun@sunrisebakery.example | Dashboard, check a pickup code at the counter (Maya's is `K7M2-9QXA`), publish a listing with a photo |
| Admin          | admin@plateback.example     | Review, verify, reject or suspend businesses                                                          |

To see live updates, log in as Maya in one browser and open the same listing, or Arjun's dashboard, in another (or a private window). Reserve, and the other page changes within a fraction of a second.

### Checks

| Where    | Command                             | What it runs                                                                                    |
| -------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| backend  | `dotnet test`                       | 163 tests, 87 of them against the real API and PostgreSQL                                       |
| frontend | `npm run test:run`                  | 123 tests against the mock API                                                                  |
| frontend | `npm run e2e`                       | 14 end-to-end checks in Chrome against the running app (start both first, with fresh demo data) |
| frontend | `npm run lint`, `npm run typecheck` | ESLint with accessibility rules, TypeScript                                                     |

## How it fits together

```
Browser ──> Vite dev server (:5173) ──/api, /uploads, /hubs──> ASP.NET Core API (:5080) ──> PostgreSQL
            serves the React app                                 REST + SignalR hub
```

- **One origin.** The browser only talks to `localhost:5173`, so the refresh-token cookie can stay `SameSite=Strict` and no CORS is needed. Why this and not CORS is in the [integration notes](docs/integration.md#how-the-pieces-connect).
- **REST for data, SignalR for "something changed".** Pages load data through the REST API. When the API commits a change, it tells connected browsers which listings or which business changed, and they refetch exactly those queries. If the live connection drops, pages fall back to polling every 15 seconds and reconnect on their own.
- **Errors.** Every API error is ProblemDetails with a `code`. The frontend turns it into one `ApiError` type and shows the API's own sentence: "Email or password is incorrect.", "You can hold up to 3 active reservations at a time.", "The server is not responding. Try again in a moment."
- **Sessions.** The access token lives in memory for 15 minutes. When it expires, the client refreshes it once through the httpOnly cookie and repeats the request, so the user never notices.

## Development

The frontend can still run without the backend: set `VITE_USE_MOCKS=true` in `frontend/.env` and the Week 2 mock API answers in the browser. All settings are in [`frontend/.env.example`](frontend/.env.example).
