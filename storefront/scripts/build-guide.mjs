// Writes GUIDE.md (from lib/help.ts) and SETUP.md (from lib/setup-steps.ts),
// the same text as the dashboard's Help and Setup pages.
// Run: npm run guide
import { writeFileSync } from "fs";
import { HELP } from "../lib/help.ts";
import { DEPLOY_URL, SETUP_STEPS } from "../lib/setup-steps.ts";

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
  "Everything needed to get the shop online, in order: GitHub, Vercel, Supabase and Stripe (with Apple Pay and Google Pay). " +
    "After step 3, the dashboard has a **Setup** page with these same steps and a green check as each one is done.",
  "",
  `[![Deploy with Vercel](https://vercel.com/button)](${DEPLOY_URL})`,
  "",
  "| | Step | Time |",
  "|---|---|---|",
  ...SETUP_STEPS.map((st, i) => `| ${i + 1} | [${st.title}](#${st.id})${st.optional ? " _(optional)_" : ""} | ${st.time} |`),
  "",
];
SETUP_STEPS.forEach((st, i) => {
  setup.push(`<a id="${st.id}"></a>`, `## ${i + 1}. ${st.title}${st.optional ? " (optional)" : ""}`, "");
  for (const b of st.blocks) setup.push(...blockLines(b));
  if (st.links?.length) {
    setup.push(st.links.map((l) => (l.url.startsWith("/") ? `**${l.label}** (in the dashboard: \`${l.url}\`)` : `[${l.label}](${l.url})`)).join(" · "), "");
  }
});
writeFileSync(new URL("../SETUP.md", import.meta.url), setup.join("\n"));
console.log("Wrote SETUP.md");
