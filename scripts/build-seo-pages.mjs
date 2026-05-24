import { mkdir, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const entriesPath = path.join(root, "data", "entries", "index.json");
const entries = JSON.parse(readFileSync(entriesPath, "utf8"));
const siteUrl = "https://www.replacedbyai.com";

const aiLabels = {
  explicit_ai_cited: "Explicit AI cited",
  automation_efficiency_cited: "Automation / efficiency cited",
  ai_adjacent_restructuring: "AI-adjacent restructuring",
  speculative_or_unclear: "Speculative / unclear",
  ai_reorg_or_spend_linked: "AI reorg or spending linked",
  ai_replacement_cited: "AI replacement cited",
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fmtNumber(value) {
  return value == null ? "Unknown" : Number(value).toLocaleString("en-US");
}

function fmtDate(value) {
  if (!value) return "Unknown date";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function pageShell({ title, description, canonicalPath, body }) {
  const canonical = `${siteUrl}${canonicalPath}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <style>
      body { font-family: Arial, sans-serif; max-width: 920px; margin: 40px auto; padding: 0 18px; color: #111; background: #f4f6f8; line-height: 1.55; }
      a { color: #0a58ca; }
      .nav { display: flex; gap: 14px; align-items: center; margin-bottom: 34px; font-size: 14px; }
      .brand { font-family: Consolas, 'SFMono-Regular', Menlo, Monaco, monospace; font-weight: 700; color: #111; text-decoration: none; }
      h1 { font-size: clamp(32px, 5vw, 48px); line-height: 1.05; margin: 0 0 12px; letter-spacing: 0; }
      h2 { margin-top: 34px; }
      .muted { color: #555; }
      .card { background: #fff; border: 1px solid #dde2e8; border-radius: 8px; padding: 18px; margin: 18px 0; }
      .pill { display: inline-block; padding: 5px 9px; border-radius: 999px; background: #f2f4f7; font-size: 13px; margin-right: 6px; }
      .quote { padding: 12px 14px; border-left: 4px solid #ccd3dc; background: #fafafa; }
      .source-list { padding-left: 20px; }
      .footer { margin-top: 34px; font-size: 13px; color: #666; }
    </style>
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: canonical,
      isPartOf: {
        "@type": "WebSite",
        name: "Replaced by AI",
        url: siteUrl,
      },
    })}</script>
  </head>
  <body>
    <nav class="nav">
      <a class="brand" href="/">/replace -ai</a>
      <a href="/about/">Methodology</a>
      <a href="/">Tracker</a>
    </nav>
${body}
    <p class="footer">&copy; <span id="copyrightYear"></span> B Average</p>
    <script>document.getElementById('copyrightYear').textContent = new Date().getFullYear();</script>
  </body>
</html>
`;
}

function entryCard(entry) {
  const sources = (entry.sources || [])
    .map((source) => `<li><a href="${escapeHtml(source.url)}" rel="noreferrer">${escapeHtml(source.name)}</a>${source.publishedDate ? `, ${escapeHtml(source.publishedDate)}` : ""}</li>`)
    .join("");
  return `<article class="card">
      <p class="muted">${escapeHtml(fmtDate(entry.eventDate))}</p>
      <h2>${escapeHtml(entry.company)} AI layoff details</h2>
      <p><span class="pill">${escapeHtml(aiLabels[entry.aiRelevance] || entry.aiRelevance || "Unclassified")}</span><span class="pill">${escapeHtml(entry.sourceQuality || "Unknown source quality")}</span></p>
      <p><strong>Reported layoffs:</strong> ${escapeHtml(fmtNumber(entry.layoffsCount))}</p>
      <p><strong>Industry:</strong> ${escapeHtml(entry.industry || "Unknown")} &middot; <strong>Geography:</strong> ${escapeHtml(entry.geography || "Unknown")}</p>
      <p>${escapeHtml(entry.summary || "")}</p>
      <div class="quote">${escapeHtml(entry.evidenceQuote || "No evidence quote recorded.")}</div>
      ${entry.notes ? `<p>${escapeHtml(entry.notes)}</p>` : ""}
      <h3>Sources</h3>
      <ul class="source-list">${sources}</ul>
    </article>`;
}

const companyGroups = new Map();
for (const entry of entries) {
  const slug = slugify(entry.company);
  if (!slug) continue;
  if (!companyGroups.has(slug)) companyGroups.set(slug, []);
  companyGroups.get(slug).push(entry);
}

await rm(path.join(root, "company"), { recursive: true, force: true });

const sitemapUrls = ["/", "/about/"];
for (const [slug, companyEntries] of companyGroups.entries()) {
  companyEntries.sort((a, b) => String(b.eventDate || "").localeCompare(String(a.eventDate || "")));
  const company = companyEntries[0].company;
  const total = companyEntries.reduce((sum, entry) => sum + Number(entry.layoffsCount || 0), 0);
  const title = `${company} AI layoffs - Replaced by AI tracker`;
  const description = `${company} AI layoff tracker entry with sourced evidence, dates, AI relevance labels, and reported job impact.`;
  const body = `    <main>
      <p class="muted">AI layoff tracker company page</p>
      <h1>${escapeHtml(company)} AI layoffs</h1>
      <p class="muted">${escapeHtml(companyEntries.length)} sourced event${companyEntries.length === 1 ? "" : "s"}${total ? ` · ${escapeHtml(fmtNumber(total))} reported jobs impacted` : ""}</p>
      ${companyEntries.map(entryCard).join("\n")}
    </main>`;
  const dir = path.join(root, "company", slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), pageShell({ title, description, canonicalPath: `/company/${slug}/`, body }));
  sitemapUrls.push(`/company/${slug}/`);
}

const aboutBody = `    <main>
      <p class="muted">Methodology</p>
      <h1>About the AI layoff tracker</h1>
      <p>Replaced by AI tracks public layoff events where AI, automation, or AI-driven restructuring is part of the documented rationale. It is not a generic layoff list.</p>
      <section class="card">
        <h2>Inclusion rules</h2>
        <p>Every entry needs a primary source or reputable reporting source. Weak aggregation and unsourced social posts can be used as leads, but they are not enough for a verified public entry.</p>
      </section>
      <section class="card">
        <h2>Classification rules</h2>
        <p><strong>Explicit AI cited</strong> means the source directly ties layoffs to AI, AI investment, AI replacement, or AI-driven operating changes.</p>
        <p><strong>Automation / efficiency cited</strong> means the source ties cuts to automation, efficiency, or reduced manual work.</p>
        <p><strong>AI-adjacent restructuring</strong> means the layoff is tied to AI-focused strategy, technology investment, or team reallocation, but not direct replacement.</p>
        <p><strong>Speculative / unclear</strong> means the event is included as a lead or weakly related case and should not be read as confirmed AI replacement.</p>
      </section>
      <section class="card">
        <h2>Source quality</h2>
        <p><strong>Primary</strong> sources include company statements, filings, investor materials, or executive memos. <strong>Reputable reporting</strong> includes established business, technology, and labor reporting. <strong>Secondary lead</strong> sources are kept visibly labeled and usually marked for review.</p>
      </section>
      <section class="card">
        <h2>Receipts first</h2>
        <p>The tracker separates facts from interpretation. Each entry includes a source quote, a summary, and notes explaining why the event was included and how strong the AI connection is.</p>
      </section>
    </main>`;

await mkdir(path.join(root, "about"), { recursive: true });
await writeFile(
  path.join(root, "about", "index.html"),
  pageShell({
    title: "About the AI layoff tracker methodology - Replaced by AI",
    description: "Methodology for the Replaced by AI layoff tracker, including inclusion rules, source quality standards, and AI relevance classifications.",
    canonicalPath: "/about/",
    body: aboutBody,
  }),
);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((url) => `  <url><loc>${siteUrl}${url}</loc></url>`).join("\n")}
</urlset>
`;
await writeFile(path.join(root, "sitemap.xml"), sitemap);

console.log(`Generated ${companyGroups.size} company pages, /about/, and sitemap.xml`);
