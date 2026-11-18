// Writes GUIDE.md from lib/help.ts (the same text as the dashboard's Help page).
// Run: npm run guide
import { writeFileSync } from "fs";
import { HELP } from "../lib/help.ts";

const out = [
  "# Shop guide",
  "",
  "<!-- Generated from lib/help.ts by `npm run guide`. Edit that file, not this one. -->",
  "",
  "Everything the site does and how to use it. The same guide is inside the dashboard: tap the **?** icon at the top of any page.",
  "",
  "## Contents",
  "",
];
for (const g of HELP) {
  out.push(`**${g.title}**`, "");
  for (const t of g.topics) out.push(`- [${t.title}](#${t.id}): ${t.summary}`);
  out.push("");
}
for (const g of HELP) {
  out.push(`## ${g.title}`, "");
  for (const t of g.topics) {
    out.push(`<a id="${t.id}"></a>`, `### ${t.title}`, "", `_${t.summary}_`, "");
    for (const b of t.blocks) {
      if ("p" in b) out.push(b.p, "");
      else if ("h" in b) out.push(`#### ${b.h}`, "");
      else if ("tip" in b) out.push(`> **Tip:** ${b.tip}`, "");
      else if ("list" in b) out.push(...b.list.map((x) => `- ${x}`), "");
      else if ("steps" in b) out.push(...b.steps.map((x, i) => `${i + 1}. ${x}`), "");
    }
  }
}
writeFileSync(new URL("../GUIDE.md", import.meta.url), out.join("\n"));
console.log("Wrote GUIDE.md");
