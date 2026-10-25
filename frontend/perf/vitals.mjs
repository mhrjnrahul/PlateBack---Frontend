/*
 * Usage: node perf/vitals.mjs <base-url> <path> [runs]
 * Measures First and Largest Contentful Paint and layout shift in a real
 * Chrome page load (not Lighthouse's simulation), median of several runs.
 */
// Real (not simulated) page-load metrics under phone-like throttling: Slow 4G
// (150 ms, 1.6 Mbps) and 4x CPU slowdown, the same as Lighthouse's mobile preset.
import { existsSync } from "node:fs";
import { chromium } from "playwright-core";
const [base, path, runs = "5"] = process.argv.slice(2);
const chrome =
  process.env.CHROME_PATH ??
  ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(existsSync);
const b = await chromium.launch({ executablePath: chrome, headless: true });
const results = [];
for (let i = 0; i < Number(runs); i++) {
  const ctx = await b.newContext({
    viewport: { width: 412, height: 823 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: 1.6e6 / 8,
    uploadThroughput: 750e3 / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await p.addInitScript(() => {
    window.__v = { lcp: 0, cls: 0, fcp: 0 };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__v.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        if (e.name === "first-contentful-paint") window.__v.fcp = e.startTime;
    }).observe({ type: "paint", buffered: true });
  });
  await p.goto(base + path);
  await p.waitForTimeout(9000);
  results.push(await p.evaluate(() => window.__v));
  await ctx.close();
}
await b.close();
const med = (k) => results.map((r) => r[k]).sort((a, z) => a - z)[Math.floor(results.length / 2)];
console.log(
  `${base}${path}  FCP ${Math.round(med("fcp"))} ms  LCP ${Math.round(med("lcp"))} ms  CLS ${med("cls").toFixed(3)}  (median of ${results.length})`,
);
