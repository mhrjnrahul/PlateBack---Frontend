#!/usr/bin/env bash
# Runs every PlateBack test suite and collects the reports in one folder.
#
#   scripts/run-all-tests.sh            # backend + frontend
#   E2E=1 scripts/run-all-tests.sh      # also the end-to-end checks (API on :5080
#                                       # with fresh demo data, dev server running;
#                                       # E2E_BASE_URL if it is not on :5173)
#
# Layout: this repository's frontend/ next to the backend repository, as in the
# Week 5 ZIP (backend/ beside frontend/). Set BACKEND_DIR if it is elsewhere.
# Reports go to test-artifacts/ (or OUT_DIR): TRX, HTML and JUnit test results,
# HTML coverage reports and the console output of every run.
set -uo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
BACKEND=${BACKEND_DIR:-$ROOT/backend}
FRONTEND=$ROOT/frontend
OUT=${OUT_DIR:-$ROOT/test-artifacts}
mkdir -p "$OUT/backend" "$OUT/frontend"
status=0

echo "== Backend: build, style, domain + application + integration tests with coverage"
if [ -d "$BACKEND" ]; then
  (
    cd "$BACKEND" &&
      dotnet tool restore >/dev/null &&
      dotnet build &&
      dotnet format --verify-no-changes --no-restore &&
      rm -rf tests/*/bin/Debug/net10.0/TestResults &&
      dotnet test --no-build -- --report-xunit-trx --report-xunit-html \
        --coverage --coverage-output-format cobertura --coverage-output coverage.cobertura.xml &&
      dotnet tool run reportgenerator \
        -reports:"tests/*/bin/Debug/net10.0/TestResults/coverage.cobertura.xml" \
        -targetdir:"$OUT/backend/coverage" -reporttypes:"Html;TextSummary" \
        -assemblyfilters:"+PlateBack.*;-PlateBack.*.Tests;-PlateBack.Api.IntegrationTests" \
        -classfilters:"-PlateBack.Infrastructure.Persistence.Migrations.*" >/dev/null
  ) 2>&1 | tee "$OUT/backend/dotnet-test.log"
  [ "${PIPESTATUS[0]}" -eq 0 ] || status=1
  for dir in "$BACKEND"/tests/*/; do
    name=$(basename "$dir")
    mkdir -p "$OUT/backend/$name"
    cp "$dir"bin/Debug/net10.0/TestResults/*.{trx,html} "$OUT/backend/$name/" 2>/dev/null
  done
else
  echo "Backend not found at $BACKEND (set BACKEND_DIR)"; status=1
fi

echo "== Frontend: lint, types, format, unit and full-app tests with coverage, build"
(
  cd "$FRONTEND" &&
    npm run lint &&
    npm run typecheck &&
    npm run format:check &&
    npx vitest run --coverage --coverage.reporter=text-summary --coverage.reporter=html \
      --reporter=default --reporter=junit --outputFile.junit="$OUT/frontend/junit.xml" \
      --coverage.reportsDirectory="$OUT/frontend/coverage" &&
    npm run build
) 2>&1 | tee "$OUT/frontend/vitest.log"
[ "${PIPESTATUS[0]}" -eq 0 ] || status=1

if [ "${E2E:-0}" = "1" ]; then
  echo "== End to end: real Chrome against the running app"
  mkdir -p "$OUT/e2e"
  (cd "$FRONTEND" && npm run e2e) 2>&1 | tee "$OUT/e2e/e2e.log"
  [ "${PIPESTATUS[0]}" -eq 0 ] || status=1
fi

echo
[ $status -eq 0 ] && echo "All suites passed. Reports in $OUT" || echo "Something failed. Logs in $OUT"
exit $status
