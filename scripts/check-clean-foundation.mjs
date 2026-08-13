import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignored = new Set([".git", ".next", ".vercel", "node_modules"]);
const textExtensions = new Set([".js", ".mjs", ".ts", ".tsx", ".json", ".md"]);
const excludedFiles = new Set([
  path.join(root, "README.md"),
  path.join(root, "scripts", "check-clean-foundation.mjs"),
]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(absolute)));
    else if (textExtensions.has(path.extname(entry.name)) && !excludedFiles.has(absolute)) {
      files.push(absolute);
    }
  }

  return files;
}

const files = await collectFiles(root);
const corpus = (
  await Promise.all(files.map(async (file) => `${file}\n${await readFile(file, "utf8")}`))
).join("\n");

assert.doesNotMatch(corpus, /PROBE_TOKEN/i, "legacy probe token reference found");
assert.doesNotMatch(corpus, /runProbe|<Probe\b|lib\/probe/i, "legacy client probe found");
assert.doesNotMatch(corpus, /pracownia-wnetrz\.example/i, "placeholder domain found");
assert.doesNotMatch(
  corpus,
  /NEXT_PUBLIC_[A-Z0-9_]*(?:TDS|PROBE|PALLADIUM)/i,
  "TDS data must never be exposed through NEXT_PUBLIC variables",
);

const clientDirectories = ["app", "components", "public"].map((directory) =>
  path.join(root, directory),
);
const clientFiles = (
  await Promise.all(clientDirectories.map((directory) => collectFiles(directory)))
).flat();
const clientCorpus = (
  await Promise.all(
    clientFiles.map(async (file) => `${file}\n${await readFile(file, "utf8")}`),
  )
).join("\n");
assert.doesNotMatch(
  clientCorpus,
  /api\.studiadesi\.site|TDS_SHARED_SECRET|TDS_EVENT_URL/i,
  "server-side TDS integration referenced from browser code",
);

const routingFiles = [
  path.join(root, "proxy.ts"),
  ...(await collectFiles(path.join(root, "lib", "tds"))),
];
const routingCorpus = (
  await Promise.all(
    routingFiles.map(async (file) => `${file}\n${await readFile(file, "utf8")}`),
  )
).join("\n");
assert.doesNotMatch(
  routingCorpus,
  /user-agent|googlebot|adsbot|cf-connecting-ip|x-forwarded-for/i,
  "routing must not depend on crawler, browser, or client-IP fingerprints",
);

console.log(`Clean-foundation checks passed across ${files.length} files.`);
