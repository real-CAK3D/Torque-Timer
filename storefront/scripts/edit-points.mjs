// Lists every "EDIT-POINT" marker in the code with its file and line.
// Run: npm run edit-points
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

const root = new URL("..", import.meta.url).pathname;
const skip = new Set(["node_modules", ".next", ".data", "public", "scripts"]);
const hits = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    if (skip.has(f) || f.startsWith(".")) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|css|mjs)$/.test(f)) {
      readFileSync(p, "utf8").split("\n").forEach((line, i, all) => {
        const m = line.match(/EDIT-POINT: ([A-Z-]+)/);
        if (m && !line.includes("EDIT-POINT: NAME")) hits.push({ name: m[1], at: `${relative(root, p)}:${i + 1}`, note: (all[i + 1] || "").replace(/^[\s*/{]+/, "").trim() });
      });
    }
  }
})(root);
hits.sort((a, b) => a.name.localeCompare(b.name));
const w = Math.max(...hits.map((h) => h.name.length));
for (const h of hits) console.log(`${h.name.padEnd(w)}  ${h.at}\n${" ".repeat(w)}  ${h.note}\n`);
console.log(`${hits.length} edit points.`);
