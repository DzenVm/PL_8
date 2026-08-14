import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const staticDirectory = path.join(root, ".next", "static");
const markers = [
  process.env.TDS_SHARED_SECRET,
  process.env.TDS_DECISION_URL,
  process.env.TDS_TARGET_URL,
].filter(Boolean);

assert.ok(markers.length > 0, "at least one server-only TDS marker is required");
await access(staticDirectory);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(absolute)));
    else files.push(absolute);
  }
  return files;
}

const staticFiles = await collectFiles(staticDirectory);
for (const file of staticFiles) {
  const contents = await readFile(file);
  for (const marker of markers) {
    assert.equal(
      contents.includes(Buffer.from(marker)),
      false,
      `server-only TDS data found in browser asset: ${path.relative(root, file)}`,
    );
  }
}

console.log(`Client-bundle secret check passed across ${staticFiles.length} assets.`);
