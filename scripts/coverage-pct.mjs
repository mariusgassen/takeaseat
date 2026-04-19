#!/usr/bin/env node
// Read one or more Vitest/Istanbul coverage-summary.json files, sum their
// totals, and print the combined lines percentage (integer) to stdout.
//
// Usage: node scripts/coverage-pct.mjs path/to/coverage-summary.json [...]

import { readFileSync } from "node:fs";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: coverage-pct.mjs <coverage-summary.json> [...]");
  process.exit(2);
}

let covered = 0;
let total = 0;

for (const f of files) {
  const json = JSON.parse(readFileSync(f, "utf8"));
  const t = json.total?.lines;
  if (!t) {
    console.error(`no total.lines in ${f}`);
    process.exit(2);
  }
  covered += t.covered ?? 0;
  total += t.total ?? 0;
}

const pct = total === 0 ? 0 : (covered / total) * 100;
process.stdout.write(String(Math.round(pct)));
