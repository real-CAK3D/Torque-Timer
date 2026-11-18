// Writes GUIDE.md (from lib/help.ts) and SETUP.md (from lib/setup-steps.ts),
// the same text as the dashboard's Help and Setup pages.
// Run: npm run guide
import { writeFileSync } from "fs";
import { HELP } from "../lib/help.ts";
import { DEPLOY_URL, PHASES, SETUP_STEPS } from "../lib/setup-steps.ts";

function blockLines(b) {
  if ("p" in b) return [b.p, ""];
  if ("h" in b) return [`#### ${b.h}`, ""];
  if ("tip" in b) return [`> **Tip:** ${b.tip}`, ""];
  if ("list" in b) return [...b.list.map((x) => `- ${x}`), ""];
  return [...b.steps.map((x, i) => `${i + 1}. ${x}`), ""];
}

const out = [
  "# Shop guide",
  "",
  "<!-- Generated from lib/help.ts by `npm run guide`. Edit that file, not this one. -->",
  "",
  "How each part of the site works. The same guide is in the dashboard under the ? button.",
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
    for (const b of t.blocks) out.push(...blockLines(b));
  }
}
writeFileSync(new URL("../GUIDE.md", import.meta.url), out.join("\n"));
console.log("Wrote GUIDE.md");

const setup = [
  "# Setting up the shop",
  "",
  "<!-- Generated from lib/setup-steps.ts by `npm run guide`. Edit that file, not this one. -->",
  "",
  "Getting the shop online, in order: GitHub, Vercel, Supabase, then Stripe (which also handles Apple Pay and Google Pay). " +
    "Once you can log in (step 3), the dashboard has a Setup page with the same list that checks steps off as you finish them.",
  "",
  `[![Deploy with Vercel](https://vercel.com/button)](${DEPLOY_URL})`,
  "",
];
const num = new Map(SETUP_STEPS.map((st, i) => [st.id, i + 1]));
for (const ph of PHASES) {
  setup.push(`**${ph.title}**`, "");
  for (const id of ph.steps) {
    const st = SETUP_STEPS.find((x) => x.id === id);
    setup.push(`${num.get(id)}. [${st.title}](#${st.id})${st.optional ? " (optional)" : ""}, ${st.time}`);
  }
  setup.push("");
}
let lastPhase = "";
SETUP_STEPS.forEach((st, i) => {
  const ph = PHASES.find((p) => p.steps.includes(st.id));
  if (ph && ph.id !== lastPhase) {
    setup.push(`## ${ph.title}`, "");
    lastPhase = ph.id;
  }
  setup.push(`<a id="${st.id}"></a>`, `### ${i + 1}. ${st.title}${st.optional ? " (optional)" : ""}`, "");
  for (const b of st.blocks) setup.push(...blockLines(b));
  if (st.links?.length) {
    setup.push("Links: " + st.links.map((l) => (l.url.startsWith("/") ? `${l.label} (dashboard, \`${l.url}\`)` : `[${l.label}](${l.url})`)).join(", "), "");
  }
});
writeFileSync(new URL("../SETUP.md", import.meta.url), setup.join("\n"));
console.log("Wrote SETUP.md");
