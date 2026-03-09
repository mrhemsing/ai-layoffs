#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";

const candidatesPath = path.resolve("data", "candidates", "index.json");

async function main() {
  const args = process.argv.slice(2);
  const params = Object.fromEntries(args.map((arg) => {
    const [k, ...rest] = arg.replace(/^--/, "").split("=");
    return [k, rest.join("=")];
  }));

  if (!params.title || !params.url || !params.source) {
    console.error("Usage: node scripts/ingest-candidates.mjs --title=... --url=... --source=... [--excerpt=...]");
    process.exit(1);
  }

  let rows = [];
  try {
    rows = JSON.parse(await fs.readFile(candidatesPath, "utf8"));
  } catch {}

  const nextId = `candidate-${String(rows.length + 1).padStart(3, "0")}`;
  const row = {
    id: nextId,
    title: params.title,
    url: params.url,
    source: params.source,
    publishedDate: params.publishedDate || new Date().toISOString().slice(0, 10),
    excerpt: params.excerpt || "",
    status: "new",
    duplicateOf: null,
    notes: params.notes || ""
  };

  rows.unshift(row);
  await fs.mkdir(path.dirname(candidatesPath), { recursive: true });
  await fs.writeFile(candidatesPath, JSON.stringify(rows, null, 2) + "\n");
  console.log(`Added candidate ${row.id}: ${row.title}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
