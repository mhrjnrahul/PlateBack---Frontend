/*
 * End-to-end check of the integrated app: real browser, real frontend, real
 * API and database. Drives the main flows of every role through the UI and
 * fails on any step that does not behave, any 5xx and any page crash.
 *
 * Needs the API on :5080 with fresh demo data and the dev server on :5173:
 *   (backend)  dotnet run --project src/PlateBack.Api -- seed
 *              dotnet run --project src/PlateBack.Api
 *   (frontend) npm run dev
 *   then       npm run e2e
 *
 * Uses Google Chrome or Chromium from the system (playwright-core downloads no
 * browser). Set CHROME_PATH if it is somewhere unusual.
 */
import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5173";
const PASSWORD = "password123";
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const chrome = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].find((path) => path && existsSync(path));
if (!chrome) {
  console.error("Chrome not found. Set CHROME_PATH to your Chrome or Chromium executable.");
  process.exit(1);
}

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const failures = [];
const pass = (step) => console.log(`  ok    ${step}`);
const fail = (step) => {
  console.log(`  FAIL  ${step}`);
  failures.push(step);
};
const check = (condition, step, detail = "") =>
  condition ? pass(step) : fail(`${step} ${detail}`);
const text = (page) => page.locator("main").innerText();

/** A fresh browser session; signs in through the login form when given an email. */
async function session(label, email) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("pageerror", (error) => fail(`[${label}] page crashed: ${error.message}`));
  page.on("response", (response) => {
    if (response.url().includes("/api/") && response.status() >= 500)
      fail(`[${label}] ${response.request().method()} ${response.url()} -> ${response.status()}`);
  });
  if (email) {
    await page.goto(`${BASE}/login`);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    const [login] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith("/auth/login")),
      page.getByRole("button", { name: "Log in" }).click(),
    ]);
    page.auth = await login.json();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  }
  return page;
}

/** GET through the page, as the signed-in user. */
const apiGet = (page, path) =>
  page.evaluate(
    async ([p, token]) =>
      (
        await fetch(`/api/v1${p}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      ).json(),
    [path, page.auth?.accessToken],
  );

try {
  console.log("Visitor");
  const visitor = await session("visitor");
  await visitor.goto(`${BASE}/browse`);
  await visitor.locator('a[href^="/listings/"]').first().waitFor();
  pass("browse shows listings from the API");
  const croissant = (await apiGet(visitor, "/listings?q=Croissant")).items[0];
  await visitor.goto(`${BASE}/listings/${croissant.id}`);
  await visitor
    .getByText(/of \d+ left/)
    .first()
    .waitFor();
  const stockBefore = (await text(visitor)).match(/(\d+) of \d+ left/)?.[1];
  pass(`listing page shows live stock (${stockBefore} left)`);

  console.log("Customer");
  const maya = await session("maya", "maya@example.com");
  await maya.goto(`${BASE}/listings/${croissant.id}`);
  const reservedAt = Date.now();
  await maya.getByRole("button", { name: /^Reserve ·/ }).click();
  const dialog = maya.getByRole("dialog");
  await dialog.waitFor();
  const code = (await dialog.innerText()).match(/[A-Z0-9]{4}-[A-Z0-9]{4}/)?.[0];
  check(Boolean(code), `reserve gives a pickup code (${code})`);
  await maya.keyboard.press("Escape");

  // The visitor's page was not touched: the change arrives over SignalR.
  await visitor
    .getByText(`${Number(stockBefore) - 1} of`)
    .first()
    .waitFor({ timeout: 10_000 })
    .then(() => pass(`visitor's stock updated live in ${Date.now() - reservedAt} ms`))
    .catch(() => fail("visitor's stock did not update within 10 s"));

  await maya.goto(`${BASE}/me/reservations`);
  await maya.reload();
  await maya.getByText(croissant.title).first().waitFor();
  check(!maya.url().includes("/login"), "session survives a reload; reservation is listed");

  console.log("Business");
  const arjun = await session("arjun", "arjun@sunrisebakery.example");
  const orgId = arjun.auth.user.memberships[0].organizationId;
  await arjun.goto(`${BASE}/org/${orgId}/pickup`);
  const verify = async (value) => {
    await arjun.getByLabel("Customer's pickup code").fill(value);
    await arjun.getByRole("button", { name: "Verify" }).click();
    await arjun.waitForTimeout(1000);
    return text(arjun);
  };
  check(/collected|hand over/i.test(await verify(code)), "pickup code verified at the counter");
  check(/already/i.test(await verify(code)), "the same code is refused the second time");
  check(
    /no reservation with this code/i.test(await verify("ZZZZ-ZZZZ")),
    "an unknown code is explained",
  );

  await arjun.goto(`${BASE}/org/${orgId}/listings/new`);
  const pad = (n) => String(n).padStart(2, "0");
  const start = new Date(Date.now() + 60 * 60_000);
  const end = new Date(Date.now() + 3 * 60 * 60_000);
  await arjun.getByLabel("Title").fill("End-to-end bread box");
  await arjun.getByLabel("Category").selectOption("Bakery");
  await arjun.getByLabel("Quantity").fill("4");
  await arjun.getByLabel("Description").fill("Three loaves and a few rolls.");
  await arjun
    .locator('input[type="file"]')
    .setInputFiles({ name: "bread.png", mimeType: "image/png", buffer: PNG });
  await arjun.getByLabel("MRP").fill("400");
  await arjun.getByLabel("Selling price").fill("150");
  await arjun
    .getByLabel("Date")
    .fill(`${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`);
  await arjun.getByLabel("From").fill(`${pad(start.getHours())}:${pad(start.getMinutes())}`);
  await arjun.getByLabel("Until").fill(`${pad(end.getHours())}:${pad(end.getMinutes())}`);
  await arjun.getByRole("button", { name: "Use the business address" }).click();
  await arjun.getByLabel("Allergens & notes").fill("Contains gluten.");
  await arjun.getByRole("button", { name: "Publish listing" }).click();
  await arjun
    .waitForURL((url) => !url.pathname.endsWith("/new"), { timeout: 15_000 })
    .catch(() => {});
  const published = (await apiGet(arjun, "/listings?q=End-to-end")).items[0];
  check(Boolean(published?.imageUrl?.startsWith("/uploads/")), "listing published with a photo");
  if (published) {
    await visitor.goto(`${BASE}/listings/${published.id}`);
    await visitor.waitForLoadState("networkidle");
    const photoLoaded = await visitor.evaluate(() =>
      [...document.images].some((img) => img.src.includes("/uploads/") && img.naturalWidth > 0),
    );
    check(photoLoaded, "the photo loads for customers");
  }

  console.log("Customer again");
  const other = (await apiGet(maya, "/listings?pageSize=50")).items.find(
    (l) =>
      l.quantityAvailable > 0 && new Date(l.pickupStart) > new Date() && l.id !== published?.id,
  );
  await maya.goto(`${BASE}/listings/${other.id}`);
  await maya.getByRole("button", { name: /^Reserve ·/ }).click();
  await maya.getByRole("dialog").waitFor();
  await maya.keyboard.press("Escape");
  await maya.goto(`${BASE}/me/reservations`);
  await maya.getByRole("button", { name: "Cancel", exact: true }).first().click();
  await maya.getByRole("button", { name: "Cancel reservation" }).click();
  await maya.waitForTimeout(1000);
  const history = await apiGet(maya, "/reservations/mine?status=history");
  check(
    history.items.some((r) => r.status === "Cancelled"),
    "cancel from My reservations",
  );

  console.log("Admin");
  const admin = await session("admin", "admin@plateback.example");
  await admin.goto(`${BASE}/admin/organizations`);
  const pending = await apiGet(admin, "/admin/organizations?status=Pending");
  await admin
    .getByRole("row", { name: new RegExp(pending.items[0].name) })
    .getByRole("button", { name: "Review" })
    .click();
  await admin
    .getByRole("button", { name: /^Verify/ })
    .first()
    .click();
  const confirm = admin.getByRole("dialog").getByRole("button", { name: /^Verify/ });
  if (await confirm.count()) await confirm.click();
  await admin.waitForTimeout(1000);
  const after = await apiGet(admin, "/admin/organizations?status=Pending");
  check(after.total === pending.total - 1, `admin verifies "${pending.items[0].name}"`);

  console.log("Errors and sign-out");
  const wrong = await session("wrong-password");
  await wrong.goto(`${BASE}/login`);
  await wrong.getByLabel("Email").fill("maya@example.com");
  await wrong.getByLabel("Password").fill("not-the-password");
  await wrong.getByRole("button", { name: "Log in" }).click();
  await wrong
    .getByText("Email or password is incorrect.")
    .waitFor({ timeout: 5000 })
    .then(() => pass("a wrong password is explained"))
    .catch(() => fail("no message for a wrong password"));

  const status = await maya.evaluate(async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    return (await fetch("/api/v1/auth/refresh", { method: "POST" })).status;
  });
  check(status === 401, "log out ends the session (refresh answers 401)");
} catch (error) {
  fail(`stopped early: ${error.message.split("\n")[0]}`);
}

await browser.close();
console.log(failures.length ? `\n${failures.length} failed` : "\nAll end-to-end checks passed");
process.exit(failures.length ? 1 : 0);
