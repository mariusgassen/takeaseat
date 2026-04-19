#!/usr/bin/env node
// Pure-Node SVG badge generator. No npm deps.
//
// Emits a shields.io-style "flat" badge to stdout or a file.
//
// Usage:
//   node scripts/make-badge.mjs --label coverage --value 92% --color brightgreen [--out path.svg]
//   node scripts/make-badge.mjs --label build --status passing [--out path.svg]
//
// Colors: brightgreen, green, yellowgreen, yellow, orange, red, blue, lightgrey.
// Or a literal #rrggbb.
//
// If --value looks like a percentage ("92%" or "92"), --color is auto-derived
// from coverage thresholds when --color is omitted:
//   >= 90 brightgreen, >= 80 green, >= 70 yellowgreen, >= 60 yellow,
//   >= 50 orange, else red.

import { writeFileSync } from "node:fs";

const args = parseArgs(process.argv.slice(2));
const label = args.label ?? "badge";
const rawValue = args.value ?? args.status ?? "unknown";
const value = String(rawValue);
const color = args.color ?? pickColor(value, args.status);
const out = args.out;

const svg = renderBadge(label, value, resolveColor(color));
if (out) {
  writeFileSync(out, svg);
} else {
  process.stdout.write(svg);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    }
  }
  return out;
}

function pickColor(value, status) {
  const pct = /^(\d+(?:\.\d+)?)%?$/.exec(String(value));
  if (pct) {
    const n = Number(pct[1]);
    if (n >= 90) return "brightgreen";
    if (n >= 80) return "green";
    if (n >= 70) return "yellowgreen";
    if (n >= 60) return "yellow";
    if (n >= 50) return "orange";
    return "red";
  }
  if (status) {
    const s = String(status).toLowerCase();
    if (["passing", "success", "ok", "ready"].includes(s)) return "brightgreen";
    if (["failing", "failure", "error"].includes(s)) return "red";
    if (["pending", "running"].includes(s)) return "yellow";
  }
  return "lightgrey";
}

function resolveColor(c) {
  const named = {
    brightgreen: "#4c1",
    green: "#97ca00",
    yellowgreen: "#a4a61d",
    yellow: "#dfb317",
    orange: "#fe7d37",
    red: "#e05d44",
    blue: "#007ec6",
    lightgrey: "#9f9f9f",
    grey: "#555",
  };
  if (typeof c !== "string") return named.lightgrey;
  if (c.startsWith("#")) return c;
  return named[c] ?? named.lightgrey;
}

// Rough text-width measurement. Verdana 11px averages ~7px per char; we
// bias a little for wide characters and shrink for narrow ones.
function measure(text) {
  let w = 0;
  for (const ch of text) {
    if ("WMmw".includes(ch)) w += 10;
    else if ("iIl.,:;|".includes(ch)) w += 3;
    else if (ch === " ") w += 4;
    else if (ch >= "0" && ch <= "9") w += 7;
    else if (ch === ch.toUpperCase() && ch !== ch.toLowerCase()) w += 8;
    else w += 6.5;
  }
  return Math.round(w);
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderBadge(label, value, color) {
  const padding = 10;
  const labelW = measure(label) + padding * 2;
  const valueW = measure(value) + padding * 2;
  const totalW = labelW + valueW;
  const height = 20;
  const labelMid = labelW / 2;
  const valueMid = labelW + valueW / 2;
  const l = escapeXml(label);
  const v = escapeXml(value);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${height}" role="img" aria-label="${l}: ${v}">
  <title>${l}: ${v}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalW}" height="${height}" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="${height}" fill="#555"/>
    <rect x="${labelW}" width="${valueW}" height="${height}" fill="${color}"/>
    <rect width="${totalW}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelMid}" y="15" fill="#010101" fill-opacity=".3">${l}</text>
    <text x="${labelMid}" y="14">${l}</text>
    <text x="${valueMid}" y="15" fill="#010101" fill-opacity=".3">${v}</text>
    <text x="${valueMid}" y="14">${v}</text>
  </g>
</svg>
`;
}
