/*
 * Lighthouse performance runs (Week 5 profiling). Runs each page several
 * times on mobile and desktop settings and keeps the median, because single
 * runs vary by 5 to 10 points.
 *
 * Needs a production build served by `npm run preview` (port 4173) with the
 * API running, and Chrome. Usage: node perf/lighthouse.mjs <label> [runs]
 * Writes perf/results/lighthouse-<label>.md
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const label = process.argv[2] ?? "run";
const runs = Number(process.argv[3] ?? 3);
const base = process.env.LH_BASE_URL ?? "http://localhost:4173";
const chrome =
  process.env.CHROME_PATH ??
  ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(existsSync);
const pages = [
  ["Landing", "/"],
  ["Browse", "/browse"],
];

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const rows = [];
for (const [name, path] of pages) {
  for (const formFactor of ["mobile", "desktop"]) {
    const samples = [];
    for (let i = 0; i < runs; i++) {
      const out = join(tmpdir(), `lh-${Date.now()}.json`);
      execFileSync(
        "npx",
        [
          "--yes",
          "lighthouse@12.8.2",
          base + path,
          "--only-categories=performance",
          "--chrome-flags=--headless=new",
          "--output=json",
          `--output-path=${out}`,
          "--quiet",
          ...(formFactor === "desktop" ? ["--preset=desktop"] : []),
        ],
        { env: { ...process.env, CHROME_PATH: chrome }, stdio: "ignore" },
      );
      const report = JSON.parse(readFileSync(out, "utf8"));
      const a = report.audits;
      const scripts = a["network-requests"].details.items.filter(
        (r) => r.resourceType === "Script",
      );
      samples.push({
        score: Math.round(report.categories.performance.score * 100),
        fcp: a["first-contentful-paint"].numericValue,
        lcp: a["largest-contentful-paint"].numericValue,
        tbt: a["total-blocking-time"].numericValue,
        cls: a["cumulative-layout-shift"].numericValue,
        js: scripts.reduce((sum, r) => sum + (r.transferSize ?? 0), 0) / 1024,
      });
    }
    const m = (key) => median(samples.map((s) => s[key]));
    rows.push({
      name,
      formFactor,
      score: m("score"),
      fcp: m("fcp"),
      lcp: m("lcp"),
      tbt: m("tbt"),
      cls: m("cls"),
      js: m("js"),
    });
    const r = rows.at(-1);
    console.log(
      `${name.padEnd(8)} ${formFactor.padEnd(8)} score ${r.score}  FCP ${(r.fcp / 1000).toFixed(1)} s  LCP ${(r.lcp / 1000).toFixed(1)} s  TBT ${Math.round(r.tbt)} ms  CLS ${r.cls.toFixed(3)}  JS ${Math.round(r.js)} kB`,
    );
  }
}

mkdirSync("perf/results", { recursive: true });
writeFileSync(
  `perf/results/lighthouse-${label}.md`,
  [
    `# Lighthouse: ${label}`,
    "",
    `${new Date().toISOString()}, median of ${runs} runs per row, production build at ${base}`,
    "",
    "| Page | Settings | Score | First paint | Largest paint | Blocking time | Layout shift | JavaScript |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows.map(
      (r) =>
        `| ${r.name} | ${r.formFactor} | ${r.score} | ${(r.fcp / 1000).toFixed(1)} s | ${(r.lcp / 1000).toFixed(1)} s | ${Math.round(r.tbt)} ms | ${r.cls.toFixed(3)} | ${Math.round(r.js)} kB |`,
    ),
    "",
  ].join("\n"),
);
console.log(`Saved perf/results/lighthouse-${label}.md`);
