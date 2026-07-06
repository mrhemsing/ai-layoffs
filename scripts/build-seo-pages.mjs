import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { evidenceTierOf } from "./lib/evidence.mjs";

const root = process.cwd();
const entriesPath = path.join(root, "data", "entries", "index.json");
const entries = JSON.parse(readFileSync(entriesPath, "utf8"));
const siteUrl = "https://www.replacedbyai.app";

function assertNoMojibake(value, context) {
  if (/[ÃÂâ][\s\S]?|�/.test(String(value || ""))) {
    throw new Error(`Possible mojibake detected in ${context}: ${value}`);
  }
}

for (const entry of entries) {
  assertNoMojibake(entry.company, `company ${entry.id}`);
  assertNoMojibake(entry.summary, `summary ${entry.id}`);
  assertNoMojibake(entry.evidenceQuote, `evidenceQuote ${entry.id}`);
  for (const source of entry.sources || []) assertNoMojibake(source.quote, `source quote ${entry.id}`);
}

const aiLabels = {
  explicit_ai_cited: "Explicit AI cited",
  automation_efficiency_cited: "Automation / efficiency cited",
  ai_adjacent_restructuring: "AI-adjacent restructuring",
  speculative_or_unclear: "Speculative / unclear",
  ai_reorg_or_spend_linked: "AI reorg or spending linked",
  ai_replacement_cited: "AI replacement cited",
};

const aiDefinitions = {
  explicit_ai_cited: "The source directly ties layoffs to AI, AI investment, AI replacement, or AI-driven operating changes.",
  automation_efficiency_cited: "The source ties cuts to automation, efficiency, or reduced manual work.",
  ai_adjacent_restructuring: "The layoff is tied to AI-focused strategy, technology investment, or team reallocation, but not direct replacement.",
  speculative_or_unclear: "The event is a weaker AI-related lead and should not be read as confirmed AI replacement.",
  ai_reorg_or_spend_linked: "The source ties the layoff to AI reorganization, AI investment, or shifting spend toward AI.",
  ai_replacement_cited: "The source directly says work or roles were replaced by AI.",
};

const relevanceSlugs = {
  explicit_ai_cited: "explicitly-ai-cited",
  automation_efficiency_cited: "automation-efficiency-cited",
  ai_adjacent_restructuring: "ai-adjacent-restructuring",
  speculative_or_unclear: "speculative-or-unclear",
  ai_reorg_or_spend_linked: "ai-reorg-or-spend-linked",
  ai_replacement_cited: "ai-replacement-cited",
};

const tipMailto = "mailto:tips@replacedbyai.app?subject=AI%20layoff%20tip&body=Company%3A%0ADate%3A%0ASource%20link%3A%0ASource%20quote%3A";

const fontPreloads = `    <link rel="preload" href="/fonts/ibm-plex-sans-latin-400.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/ibm-plex-mono-latin-400.woff2" as="font" type="font/woff2" crossorigin />`;

const fontFaces = `      @font-face { font-family: "IBM Plex Sans"; src: url("/fonts/ibm-plex-sans-latin-400.woff2") format("woff2"); font-style: normal; font-weight: 400; font-display: swap; }
      @font-face { font-family: "IBM Plex Sans"; src: url("/fonts/ibm-plex-sans-latin-600.woff2") format("woff2"); font-style: normal; font-weight: 600; font-display: swap; }
      @font-face { font-family: "IBM Plex Sans"; src: url("/fonts/ibm-plex-sans-latin-700.woff2") format("woff2"); font-style: normal; font-weight: 700; font-display: swap; }
      @font-face { font-family: "IBM Plex Mono"; src: url("/fonts/ibm-plex-mono-latin-400.woff2") format("woff2"); font-style: normal; font-weight: 400; font-display: swap; }
      @font-face { font-family: "IBM Plex Mono"; src: url("/fonts/ibm-plex-mono-latin-500.woff2") format("woff2"); font-style: normal; font-weight: 500; font-display: swap; }
      @font-face { font-family: "IBM Plex Serif"; src: url("/fonts/ibm-plex-serif-latin-400-italic.woff2") format("woff2"); font-style: italic; font-weight: 400; font-display: swap; }`;

const tokenBlock = `      :root {
        --paper: #FCFCFA;
        --ink: #17191D;
        --ink-2: #50555D;
        --rule: #E5E4DF;
        --redline: #B3202F;
        --redline-tint: #F8E9EA;
        --redline-text: #8C1523;
        --neutral-tint: #EFEEE9;
        --graphite: #7A7F87;
        --white: #FFFFFF;
        --hover: rgba(0, 0, 0, 0.025);
      }`;

function evidenceTierLabel(entry) {
  return evidenceTierOf(entry.aiRelevance) === "strong"
    ? "strong evidence"
    : evidenceTierOf(entry.aiRelevance) === "weak"
      ? "weak evidence"
      : "medium evidence";
}

const industrySlugs = {
  Technology: "tech",
  Finance: "finance",
  Consulting: "consulting",
  Government: "government",
  Media: "media",
  Recruitment: "recruitment",
  Other: "other",
};

const industryTitles = {
  Technology: "Tech AI Layoffs",
  Finance: "Finance AI Layoffs",
  Consulting: "Consulting AI Layoffs",
  Government: "Government AI Layoffs",
  Media: "Media AI Layoffs",
  Recruitment: "Recruitment AI Layoffs",
  Other: "Other AI Layoffs",
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

function fmtLayoffs(value) {
  return value == null ? "Not disclosed" : Number(value).toLocaleString("en-US");
}

function fmtLayoffsLedger(value) {
  return value == null ? "n/d" : Number(value).toLocaleString("en-US");
}

function fmtPercent(value) {
  return `${Math.round(value)}%`;
}

function fmtDateShortYear(value) {
  if (!value) return "Unknown date";
  return new Date(`${dateOnly(value)}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function fmtDateMedium(value) {
  if (!value) return "Unknown date";
  return new Date(`${dateOnly(value)}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function compactNumber(value) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 0 }).format(Number(value || 0)).toLowerCase();
}

function attr(value = "") {
  return escapeHtml(value).replaceAll("\n", " ");
}

function receiptLabel(entry) {
  const count = Array.isArray(entry.sources) ? entry.sources.length : 0;
  return `${count} receipt${count === 1 ? "" : "s"}`;
}

function industrySlug(industry) {
  return industrySlugs[industry] || slugify(industry);
}

function industryTitle(industry) {
  return industryTitles[industry] || `${industry} AI Layoffs`;
}

function xmlEscape(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function csvEscape(value = "") {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
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

function fmtDateShort(value) {
  if (!value) return "Unknown date";
  return new Date(`${dateOnly(value)}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function fmtDateCompact(value) {
  if (!value) return "Unknown date";
  const date = new Date(`${dateOnly(value)}T00:00:00Z`);
  return `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCFullYear()).slice(-2)}`;
}

function dateOnly(value) {
  return String(value || "").slice(0, 10);
}

function entryFreshnessDate(entry) {
  return entry?.updatedAt || entry?.createdAt || entry?.eventDate || "";
}

function maxUpdatedAt(items) {
  const newest = items
    .map(entryFreshnessDate)
    .map(dateOnly)
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort()
    .at(-1);
  return newest || dateOnly(new Date().toISOString());
}

function fmtAiRelevanceShort(value) {
  if (value === "explicit_ai_cited") return "explicit AI";
  if (value === "automation_efficiency_cited") return "automation";
  if (value === "ai_adjacent_restructuring") return "AI restructure";
  if (value === "speculative_or_unclear") return "unclear";
  if (value === "ai_reorg_or_spend_linked") return "AI reorg";
  if (value === "ai_replacement_cited") return "AI replacement";
  return String(value || "").replaceAll("_", " ");
}

function pillHtml(aiRelevance) {
  const label = aiLabels[aiRelevance] || aiRelevance || "Unclassified";
  const tier = evidenceTierOf(aiRelevance);
  const definition = aiDefinitions[aiRelevance] || "";
  return `<span class="pill ${escapeHtml(tier)}" data-tier="${escapeHtml(tier)}" data-definition="${attr(definition)}" title="${attr(definition)}">${escapeHtml(label)}</span>`;
}

function receiptStack(entry) {
  const sources = Array.isArray(entry.sources) && entry.sources.length ? entry.sources : [{}];
  const tier = evidenceTierOf(entry.aiRelevance);
  const verdict = `Evidence: ${aiLabels[entry.aiRelevance] || fmtAiRelevanceShort(entry.aiRelevance) || "unclassified"}`;
  return `<div class="receipt-stack" aria-label="${escapeHtml(entry.company || "Entry")} receipts">
        ${sources.map((source, index) => {
          const quote = source.quote || entry.evidenceQuote || "No evidence quote recorded.";
          const name = source.name || "Source";
          const date = source.publishedDate || entry.eventDate || "";
          return `<article class="receipt-slip">
          <div class="receipt-head"><a href="${escapeHtml(source.url || "#")}" target="_blank" rel="noreferrer">${escapeHtml(name.toUpperCase())}</a><time datetime="${escapeHtml(date)}">${escapeHtml(date || "n/a")}</time></div>
          <hr class="receipt-rule" />
          <div class="receipt-quote">${escapeHtml(quote)}</div>
          <hr class="receipt-rule" />
          <div class="receipt-foot" data-tier="${escapeHtml(tier)}"><span>${escapeHtml(verdict.toUpperCase())}</span>${sources.length > 1 ? `<span>${index + 1} OF ${sources.length}</span>` : ""}</div>
        </article>`;
        }).join("\n        ")}
      </div>`;
}

function fmtGeography(value) {
  return value === "United Kingdom" ? "UK" : (value || "-");
}

function pageShell({ title, description, canonicalPath, body, schema }) {
  const canonical = `${siteUrl}${canonicalPath}`;
  const schemaItems = [
    {
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
    },
    ...(Array.isArray(schema) ? schema : schema ? [schema] : []),
  ];
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
${fontPreloads}
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <style>
${fontFaces}
${tokenBlock}
      *, *::before, *::after { box-sizing: border-box; }
      body { max-width: 1100px; margin: 20px auto 40px; padding: 0 16px; color: var(--ink); background: var(--paper); font-family: "IBM Plex Sans", sans-serif; font-size: 16px; line-height: 1.55; overflow-x: hidden; }
      a { color: var(--ink); text-decoration-thickness: 1px; text-underline-offset: 2px; }
      a:hover { color: var(--redline); }
      a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, summary:focus-visible, [tabindex]:focus-visible { outline: 2px solid var(--redline); outline-offset: 2px; }
      .top-nav { display: flex; gap: 14px; align-items: center; justify-content: flex-end; margin-bottom: 22px; font-size: 14px; }
      .top-nav a { text-decoration: none; }
      .top-nav a:hover { text-decoration: underline; }
      .hero { margin-bottom: 20px; }
      .logo-link { display: inline-flex; color: inherit; text-decoration: none; }
      .prompt-title { display: inline-flex; align-items: center; gap: 10px; padding: 12px 15px; background: var(--ink); color: var(--paper); border-radius: 6px; font-family: "IBM Plex Mono", monospace; font-size: clamp(28px, 5vw, 42px); line-height: 1.1; letter-spacing: -0.02em; }
      .prompt-symbol { color: #7CFF6B; }
      .prompt-text { white-space: nowrap; }
      .prompt-cursor { display: inline-block; width: 0.65ch; height: 1.05em; background: #7CFF6B; vertical-align: -0.12em; animation: blink 1s steps(1, end) infinite; }
      @keyframes blink { 50% { opacity: 0; } }
      @media (prefers-reduced-motion: reduce) { .prompt-cursor { animation: none; } }
      h1 { font-size: clamp(30px, 5vw, 48px); line-height: 1.05; margin: 0 0 12px; letter-spacing: -0.02em; font-weight: 700; }
      h2 { margin-top: 34px; font-weight: 600; letter-spacing: 0; }
      h3 { font-weight: 600; }
      .muted { color: var(--ink-2); }
      .card { background: var(--paper); border: 1px solid var(--rule); border-radius: 6px; padding: 18px; margin: 18px 0; }
      .pill { display: inline-block; padding: 5px 8px; border-radius: 999px; font-family: "IBM Plex Mono", monospace; font-size: 11px; line-height: 1.2; font-variant-numeric: tabular-nums; }
      .pill[data-tier="strong"], .pill.strong { color: var(--redline-text); background: var(--redline-tint); border: 1px solid rgba(179,32,47,0.25); }
      .pill[data-tier="medium"], .pill.medium { color: var(--ink-2); background: var(--neutral-tint); border: 1px solid var(--rule); }
      .pill[data-tier="weak"], .pill.weak { color: var(--graphite); background: transparent; border: 1px dashed var(--graphite); }
      .source-list { padding-left: 20px; }
      .footer { margin-top: 34px; font-family: "IBM Plex Mono", monospace; font-size: 12px; color: var(--ink-2); }
      .receipt-stack { display: grid; gap: 10px; margin-top: 12px; }
      .receipt-slip { max-width: 560px; background: var(--white); border: 1px solid var(--rule); border-bottom: 0; padding: 12px 14px 18px; position: relative; transform: translate(2px, 0); }
      .receipt-slip::after { content: ""; position: absolute; left: -1px; right: -1px; bottom: -8px; height: 8px; background: linear-gradient(135deg, var(--white) 25%, transparent 25%) 0 0 / 12px 8px repeat-x, linear-gradient(225deg, var(--white) 25%, transparent 25%) 0 0 / 12px 8px repeat-x; border-top: 1px solid var(--rule); }
      .receipt-head, .receipt-foot { display: flex; justify-content: space-between; gap: 12px; font-family: "IBM Plex Mono", monospace; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-2); }
      .receipt-rule { border: 0; border-top: 1px dashed var(--rule); margin: 10px 0; }
      .receipt-quote { font-family: "IBM Plex Serif", serif; font-style: italic; font-size: 15px; line-height: 1.6; color: var(--ink); }
      .receipt-foot[data-tier="strong"] { color: var(--redline-text); }
      .receipt-foot[data-tier="medium"] { color: var(--ink-2); }
      .receipt-foot[data-tier="weak"] { color: var(--graphite); }
      @media (max-width: 800px) { body { font-size: 15px; } .top-nav { justify-content: flex-start; flex-wrap: wrap; } }
    </style>
    ${schemaItems.map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`).join("\n    ")}
  </head>
  <body>
    <nav class="top-nav" aria-label="Site navigation">
      <a href="/about/">Methodology</a>
      <a href="/company/">Companies</a>
      <a href="/industries/">Industries</a>
    </nav>
    <div class="hero">
      <a class="logo-link" href="/" aria-label="Replaced by AI">
        <span class="prompt-title"><span class="prompt-symbol">&gt;</span><span class="prompt-text">/replaced -ai</span><span class="prompt-cursor" aria-hidden="true"></span></span>
      </a>
    </div>
${body}
    <p class="footer">&copy; <span id="copyrightYear"></span> B Average · <a href="/sitemap.xml">Sitemap</a> · <a href="/feed.xml">RSS</a></p>
    <script>document.getElementById('copyrightYear').textContent = new Date().getFullYear();</script>
    <script defer src="https://cdn.vercel-insights.com/v1/script.js"></script>
  </body>
</html>
`;
}

function entryCard(entry) {
  return `<article class="card">
      <p class="muted"><time datetime="${escapeHtml(entry.eventDate || "")}">${escapeHtml(fmtDate(entry.eventDate))}</time></p>
      <h2>${escapeHtml(entry.company)} AI layoff details</h2>
      <p>${pillHtml(entry.aiRelevance)} <span class="pill medium" data-tier="medium">${escapeHtml(entry.sourceQuality || "Unknown source quality")}</span></p>
      <p><strong>Reported layoffs:</strong> ${escapeHtml(fmtLayoffs(entry.layoffsCount))}</p>
      <p><strong>Industry:</strong> ${escapeHtml(entry.industry || "Unknown")} &middot; <strong>Geography:</strong> ${escapeHtml(entry.geography || "Unknown")}</p>
      <p>${escapeHtml(entry.summary || "")}</p>
      ${receiptStack(entry)}
      ${entry.notes ? `<p>${escapeHtml(entry.notes)}</p>` : ""}
    </article>`;
}

function articleSchema(entry, canonicalPath) {
  const source = (entry.sources || [])[0];
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${entry.company} AI layoffs`,
    description: entry.summary || `${entry.company} AI layoffs entry in the Replaced by AI tracker.`,
    datePublished: entry.eventDate || undefined,
    dateModified: entry.updatedAt || entry.createdAt || entry.eventDate || undefined,
    mainEntityOfPage: `${siteUrl}${canonicalPath}`,
    author: {
      "@type": "Organization",
      name: "Replaced by AI",
    },
    publisher: {
      "@type": "Organization",
      name: "Replaced by AI",
    },
    citation: source?.url,
    keywords: ["ai layoffs", "ai layoff tracker", `${entry.company} ai layoffs`],
  };
}

function entryList(items) {
  return `<ul class="source-list">
          ${items
            .map((entry) => `<li><a href="/company/${slugify(entry.company)}/">${escapeHtml(entry.company)} AI layoffs</a> - <time datetime="${escapeHtml(entry.eventDate || "")}">${escapeHtml(fmtDate(entry.eventDate))}</time>${entry.layoffsCount == null ? "" : `, ${escapeHtml(fmtNumber(entry.layoffsCount))} reported jobs impacted`}</li>`)
            .join("\n          ")}
        </ul>`;
}

function itemListSchema(items, canonicalPath) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AI layoff companies",
    url: `${siteUrl}${canonicalPath}`,
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${entry.company} AI layoffs`,
      url: `${siteUrl}/company/${slugify(entry.company)}/`,
    })),
  };
}

function homepageEntryRows(items) {
  return items.map((entry) => {
    const receipts = receiptLabel(entry);
    const receiptCount = Array.isArray(entry.sources) ? entry.sources.length : 0;
    const tier = evidenceTierOf(entry.aiRelevance);
    return `          <tr data-entry-id="${escapeHtml(entry.id || "")}" aria-expanded="false" aria-controls="details-${escapeHtml(entry.id || "")}" tabindex="0">
            <td data-label="Company"><span class="company-line"><b><a href="/company/${slugify(entry.company)}/">${escapeHtml(entry.company)}</a></b></span><br><span class="muted geography">${escapeHtml(entry.geography || "Unknown")}</span></td>
            <td data-label="Date"><time datetime="${escapeHtml(entry.eventDate || "")}">${escapeHtml(fmtDateMedium(entry.eventDate))}</time><br><span class="receipt-count">${escapeHtml(receipts)}</span></td>
            <td data-label="Layoffs" class="${entry.layoffsCount == null ? "is-undisclosed" : "is-disclosed"}">${escapeHtml(fmtLayoffsLedger(entry.layoffsCount))}</td>
            <td data-label="Industry">${escapeHtml(entry.industry || "Unknown")}</td>
            <td data-label="AI relevance">${pillHtml(entry.aiRelevance)}<span class="mobile-row-meta" aria-hidden="true">${escapeHtml(fmtDateShort(entry.eventDate))} · ${escapeHtml(entry.industry || "Unknown")} · ${receiptCount} receipt${receiptCount === 1 ? "" : "s"}</span><span class="mobile-chevron" aria-hidden="true">⌄</span></td>
          </tr>`;
  }).join("\n");
}

function buildIndustryLinks() {
  return [...industryGroups.entries()]
    .sort((a, b) => {
      if (a[0] === "Other") return 1;
      if (b[0] === "Other") return -1;
      return a[0].localeCompare(b[0]);
    })
    .map(([industry, items]) => `<a href="/industries/${industrySlug(industry)}/">${escapeHtml(industry)} (${items.length})</a>`)
    .join("\n        ");
}

function buildYearLinks() {
  return [...yearGroups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, items]) => `<a href="/${escapeHtml(year)}/">${escapeHtml(year)} (${items.length})</a>`)
    .join("\n        ");
}

function buildLegend() {
  return `<a class="label-help" href="/about/">What do these labels mean?</a>`;
}

function monthKey(value) {
  return String(value || "").slice(0, 7);
}

function monthLabel(value) {
  const [year, month] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function monthRange(items) {
  const months = items.map((entry) => monthKey(entry.eventDate)).filter((value) => /^\d{4}-\d{2}$/.test(value)).sort();
  const start = months[0];
  const end = months.at(-1);
  if (!start || !end) return [];
  const [startYear, startMonth] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);
  const out = [];
  for (let year = startYear, month = startMonth; year < endYear || (year === endYear && month <= endMonth); month += 1) {
    if (month === 13) {
      month = 1;
      year += 1;
    }
    out.push(`${year}-${String(month).padStart(2, "0")}`);
  }
  return out;
}

function buildTrendChart(items) {
  const disclosed = items
    .filter((entry) => entry.layoffsCount != null && entry.eventDate)
    .slice()
    .sort((a, b) => String(a.eventDate).localeCompare(String(b.eventDate)));
  const width = 920;
  const height = 220;
  const padLeft = 54;
  const padRight = 118;
  const padBottom = 34;
  const padTop = 18;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;
  let cumulative = 0;
  const points = disclosed.map((entry, index) => {
    cumulative += Number(entry.layoffsCount || 0);
    return { entry, index, total: cumulative };
  });
  const max = Math.max(1, cumulative);
  const xFor = (index) => padLeft + (points.length <= 1 ? 0 : (index / (points.length - 1)) * chartWidth);
  const yFor = (value) => padTop + chartHeight - (value / max) * chartHeight;
  const pathParts = [];
  points.forEach((point, index) => {
    const x = xFor(index);
    const y = yFor(point.total);
    if (index === 0) {
      pathParts.push(`M ${padLeft} ${yFor(0).toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)}`);
    } else {
      const prevX = xFor(index - 1);
      pathParts.push(`L ${x.toFixed(1)} ${yFor(points[index - 1].total).toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)}`);
      pathParts.push(`<title>${escapeHtml(point.entry.company)} · ${escapeHtml(fmtDateMedium(point.entry.eventDate))} · ${escapeHtml(fmtNumber(point.entry.layoffsCount))} jobs</title>`);
    }
  });
  const linePath = pathParts.filter((part) => !part.startsWith("<title>")).join(" ");
  const areaPath = `${linePath} L ${padLeft + chartWidth} ${padTop + chartHeight} L ${padLeft} ${padTop + chartHeight} Z`;
  const eventTitles = points.map((point, index) => {
    const x = xFor(index);
    const y = yFor(point.total);
    return `<circle class="trend-hit" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8"><title>${escapeHtml(point.entry.company)} · ${escapeHtml(fmtDateMedium(point.entry.eventDate))} · ${escapeHtml(fmtNumber(point.entry.layoffsCount))} jobs</title></circle>`;
  }).join("\n              ");
  const years = [...new Set(disclosed.map((entry) => String(entry.eventDate).slice(0, 4)))];
  const labels = years.map((year) => {
    const index = points.findIndex((point) => String(point.entry.eventDate).startsWith(year));
    return `<text x="${xFor(Math.max(0, index)).toFixed(1)}" y="${height - 10}" text-anchor="middle">${escapeHtml(year)}</text>`;
  }).join("\n              ");
  const yLabels = [0.25, 0.5, 0.75, 1].map((tick) => {
    const value = Math.round(max * tick);
    const y = yFor(value);
    return `<line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${padLeft + chartWidth}" y2="${y.toFixed(1)}" class="trend-grid"></line><text x="8" y="${(y + 4).toFixed(1)}">${escapeHtml(compactNumber(value))}</text>`;
  }).join("\n              ");
  const startLabel = disclosed[0] ? fmtDateShortYear(disclosed[0].eventDate) : "Unknown";
  const endLabel = disclosed.at(-1) ? fmtDateShortYear(disclosed.at(-1).eventDate) : "present";
  const endX = xFor(Math.max(0, points.length - 1));
  const endY = yFor(cumulative);
  return `<section class="card trend-section" aria-labelledby="trendTitle">
        <h2 id="trendTitle">Jobs impacted, running total</h2>
        <svg class="trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Cumulative disclosed jobs impacted by tracked AI layoffs">
          <line x1="${padLeft}" y1="${padTop + chartHeight}" x2="${padLeft + chartWidth}" y2="${padTop + chartHeight}" class="trend-axis"></line>
          <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${padTop + chartHeight}" class="trend-axis"></line>
          <g class="trend-y-label">
              ${yLabels}
          </g>
          <path class="trend-area" d="${areaPath}"></path>
          <path class="trend-line" d="${linePath}"></path>
          <g>${eventTitles}</g>
          <g class="trend-labels">
              ${labels}
          </g>
          <g class="trend-terminal">
            <text x="${(endX + 14).toFixed(1)}" y="${Math.max(18, endY - 3).toFixed(1)}">${escapeHtml(fmtNumber(cumulative))}</text>
            <text x="${(endX + 14).toFixed(1)}" y="${Math.max(34, endY + 14).toFixed(1)}">jobs and counting</text>
          </g>
        </svg>
        <p class="muted trend-caption">Cumulative disclosed job losses across tracked events, ${escapeHtml(startLabel)} to ${escapeHtml(endLabel)}. Excludes events with undisclosed counts.</p>
      </section>`;
}

function homepageCss() {
  return `<style>
${fontFaces}
${tokenBlock}
      *, *::before, *::after { box-sizing: border-box; }
      body { max-width: 1120px; margin: 20px auto 40px; padding: 0 16px; color: var(--ink); background: var(--paper); font-family: "IBM Plex Sans", sans-serif; font-size: 16px; line-height: 1.55; overflow-x: hidden; }
      a { color: var(--ink); text-decoration-thickness: 1px; text-underline-offset: 2px; }
      a:hover { color: var(--redline); }
      a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, summary:focus-visible, tr:focus-visible { outline: 2px solid var(--redline); outline-offset: 2px; }
      .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
      .top-nav { display: flex; gap: 14px; align-items: center; justify-content: flex-end; margin-bottom: 20px; font-size: 14px; }
      .top-nav a { text-decoration: none; }
      .top-nav a:hover { text-decoration: underline; }
      .hero { margin-bottom: 16px; }
      .prompt-title { display: inline-flex; align-items: center; gap: 10px; padding: 12px 15px; background: var(--ink); color: var(--paper); border-radius: 6px; font-family: "IBM Plex Mono", monospace; font-size: clamp(28px, 5vw, 42px); line-height: 1.1; letter-spacing: -0.02em; }
      .prompt-symbol, .prompt-cursor { background: transparent; color: #7CFF6B; }
      .prompt-text { white-space: nowrap; }
      .prompt-cursor { display: inline-block; width: 0.65ch; height: 1.05em; background: #7CFF6B; vertical-align: -0.12em; animation: blink 1s steps(1, end) infinite; }
      @keyframes blink { 50% { opacity: 0; } }
      @media (prefers-reduced-motion: reduce) { .prompt-cursor { animation: none; } }
      .seo-heading { margin: 18px 0 8px; font-size: clamp(32px, 5vw, 48px); line-height: 1.05; letter-spacing: -0.02em; font-weight: 700; }
      h2 { margin: 0 0 12px; font-size: 20px; font-weight: 600; }
      .muted { color: var(--ink-2); }
      .dek { max-width: 760px; margin: 0 0 18px; font-size: 18px; }
      .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 18px 0 8px; }
      .card { background: var(--paper); border: 1px solid var(--rule); border-radius: 6px; padding: 16px; margin: 18px 0; }
      .stat-card { min-height: 92px; }
      .stat-value { font-family: "IBM Plex Mono", monospace; font-size: 30px; font-weight: 500; line-height: 1; font-variant-numeric: tabular-nums; }
      #statLayoffs { color: var(--redline); }
      .stat-label { margin-top: 8px; font-size: 13px; color: var(--ink-2); }
      .stat-sub { margin-top: 4px; font-family: "IBM Plex Mono", monospace; font-size: 12px; color: var(--ink-2); }
      .last-updated { margin: 0 0 18px; text-align: right; font-family: "IBM Plex Mono", monospace; font-size: 12px; color: var(--ink-2); }
      .trend-section { margin: 16px 0 20px; }
      .trend-chart { width: 100%; height: 220px; display: block; }
      .trend-axis, .trend-grid { stroke: var(--rule); stroke-width: 1; }
      .trend-line { fill: none; stroke: var(--redline); stroke-width: 1.5; }
      .trend-area { fill: var(--redline); opacity: 0.08; }
      .trend-hit { fill: transparent; stroke: transparent; }
      .trend-labels text, .trend-y-label text, .trend-terminal text { font-family: "IBM Plex Mono", monospace; font-size: 11px; fill: var(--ink-2); font-variant-numeric: tabular-nums; }
      .trend-terminal text:first-child { fill: var(--redline); font-size: 18px; font-weight: 500; }
      .trend-caption { margin: 10px 0 0; font-family: "IBM Plex Mono", monospace; font-size: 12px; }
      .list-card { padding: 0; overflow: visible; }
      .filters-head, .toolbar, .filter-bar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
      .filters-head { justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--rule); }
      .filters-toggle { display: none; }
      .toolbar { padding: 14px 16px 6px; position: sticky; top: 0; z-index: 4; background: var(--paper); border-bottom: 1px solid var(--rule); }
      select, input, button { min-height: 36px; border: 1px solid var(--rule); border-radius: 6px; background: var(--paper); color: var(--ink); font: 13px "IBM Plex Sans", sans-serif; padding: 7px 10px; }
      input[type="search"] { flex: 1 1 220px; min-width: 220px; }
      #resultSummary, #resultJobsImpacted { font-family: "IBM Plex Mono", monospace; font-size: 12px; color: var(--ink-2); }
      .label-help { display: inline-block; padding: 0 16px 12px; font-size: 13px; color: var(--ink-2); }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--rule); vertical-align: middle; }
      th { position: sticky; top: 64px; z-index: 3; background: var(--paper); font-size: 12px; font-weight: 600; color: var(--ink-2); }
      th:nth-child(1), td:nth-child(1) { width: 27%; }
      th:nth-child(2), td:nth-child(2) { width: 17%; }
      th:nth-child(3), td:nth-child(3) { width: 13%; text-align: right; }
      th:nth-child(4), td:nth-child(4) { width: 16%; }
      th:nth-child(5), td:nth-child(5) { width: 27%; }
      tbody tr[data-entry-id] { height: 44px; cursor: pointer; }
      tbody tr[data-entry-id]:hover { background: var(--hover); }
      tbody tr[data-entry-id].selected { background: var(--hover); }
      td[data-label="Date"], td[data-label="Layoffs"], .receipt-count { font-family: "IBM Plex Mono", monospace; font-size: 13px; font-variant-numeric: tabular-nums; }
      td.is-disclosed { color: var(--redline); font-weight: 500; }
      td.is-undisclosed { color: var(--graphite); }
      .company-line { display: inline-block; font-weight: 600; }
      .company-line a { color: inherit; }
      .geography { display: block; margin-top: 2px; font-size: 12px; }
      .pill { position: relative; display: inline-block; padding: 5px 8px; border-radius: 999px; font-family: "IBM Plex Mono", monospace; font-size: 11px; line-height: 1.2; font-variant-numeric: tabular-nums; }
      .pill[data-tier="strong"], .pill.strong { color: var(--redline-text); background: var(--redline-tint); border: 1px solid rgba(179,32,47,0.25); }
      .pill[data-tier="medium"], .pill.medium { color: var(--ink-2); background: var(--neutral-tint); border: 1px solid var(--rule); }
      .pill[data-tier="weak"], .pill.weak { color: var(--graphite); background: transparent; border: 1px dashed var(--graphite); }
      .pill:hover::after, .pill:focus::after { content: attr(data-definition); position: absolute; left: 0; bottom: calc(100% + 8px); z-index: 8; width: min(320px, 80vw); padding: 8px 10px; border: 1px solid var(--rule); background: var(--white); color: var(--ink); border-radius: 6px; font-family: "IBM Plex Sans", sans-serif; font-size: 12px; line-height: 1.4; }
      .mobile-row-meta, .mobile-chevron { display: none; }
      .detail-row, .detail-row:hover { background: var(--paper); cursor: default; }
      .detail-cell { padding: 0; border-bottom: 1px solid var(--rule); }
      .detail-panel { border-left: 2px solid var(--redline); padding: 14px 18px 18px; }
      .details { display: grid; gap: 10px; max-width: 800px; }
      .definition-line { font-family: "IBM Plex Mono", monospace; font-size: 12px; color: var(--ink-2); }
      .receipt-stack { display: grid; gap: 10px; margin-top: 4px; }
      .receipt-slip { max-width: 560px; background: var(--white); border: 1px solid var(--rule); border-bottom: 0; padding: 12px 14px 18px; position: relative; transform: translate(2px, 0); }
      .receipt-slip::after { content: ""; position: absolute; left: -1px; right: -1px; bottom: -8px; height: 8px; background: linear-gradient(135deg, var(--white) 25%, transparent 25%) 0 0 / 12px 8px repeat-x, linear-gradient(225deg, var(--white) 25%, transparent 25%) 0 0 / 12px 8px repeat-x; border-top: 1px solid var(--rule); }
      .receipt-head, .receipt-foot { display: flex; justify-content: space-between; gap: 12px; font-family: "IBM Plex Mono", monospace; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-2); }
      .receipt-rule { border: 0; border-top: 1px dashed var(--rule); margin: 10px 0; }
      .receipt-quote { font-family: "IBM Plex Serif", serif; font-style: italic; font-size: 15px; line-height: 1.6; color: var(--ink); }
      .receipt-foot[data-tier="strong"] { color: var(--redline-text); }
      .receipt-foot[data-tier="medium"] { color: var(--ink-2); }
      .receipt-foot[data-tier="weak"] { color: var(--graphite); }
      .section-link-grid { display: flex; flex-wrap: wrap; gap: 10px; }
      .footer-note, .data-note-text { color: var(--ink-2); }
      .ba-badge { display: inline-block; font-family: "IBM Plex Sans", sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 2.16px; text-transform: uppercase; text-decoration: none; padding: 4px 8px; background: var(--ink); color: var(--paper); }
      @media (max-width: 800px) {
        body { font-size: 15px; padding: 0 12px; }
        .top-nav { justify-content: flex-start; flex-wrap: wrap; }
        .stats { grid-template-columns: 1fr; }
        .stat-card { min-height: auto; }
        .trend-chart { height: 150px; }
        .filters-head { align-items: center; padding: 10px 0; }
        .filters-toggle { display: inline-flex; align-items: center; justify-content: center; margin-left: auto; width: 92px; }
        .toolbar { position: static; padding: 8px 0; border-bottom: 0; }
        .list-card[data-filters-open="false"] .toolbar select, .list-card[data-filters-open="false"] .toolbar #sortBy { display: none; }
        .list-card { border: 0; padding: 0; }
        .label-help { padding: 0 0 8px; }
        table, thead, tbody, tr, th, td { display: block; width: 100%; }
        thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
        tbody tr[data-entry-id] { position: relative; display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 2px 10px; min-height: 68px; height: auto; padding: 12px 14px; border-bottom: 1px solid var(--rule); }
        tbody tr[data-entry-id] td { padding: 0; border: 0; }
        tbody tr[data-entry-id] td::before { content: none; }
        tbody tr[data-entry-id] td:nth-child(1) { grid-column: 1; grid-row: 1; }
        tbody tr[data-entry-id] td:nth-child(2), tbody tr[data-entry-id] td:nth-child(4) { display: none; }
        tbody tr[data-entry-id] td:nth-child(3) { grid-column: 2; grid-row: 1; align-self: start; text-align: right; font-size: 16px; }
        tbody tr[data-entry-id] td:nth-child(5) { grid-column: 1 / -1; grid-row: 2 / span 2; display: grid; gap: 6px; }
        .company-line { font-size: 16px; }
        .geography, .receipt-count { display: none; }
        .mobile-row-meta { display: block; padding-right: 28px; font-family: "IBM Plex Mono", monospace; font-size: 12px; color: var(--ink-2); }
        .mobile-chevron { display: block; position: absolute; right: 14px; top: 33px; font-family: "IBM Plex Mono", monospace; transition: transform 160ms ease; }
        tr[aria-expanded="true"] .mobile-chevron { transform: rotate(180deg); }
        .pill { width: fit-content; font-size: 11px; text-transform: uppercase; }
        .pill:hover::after, .pill:focus::after { content: none; }
        .detail-cell { display: block; padding: 0; }
        .detail-panel { padding: 12px 14px 18px; }
      }
    </style>`;
}

function replaceRegion(html, name, content, fallbackPattern) {
  const start = `<!-- seo:${name}:start -->`;
  const end = `<!-- seo:${name}:end -->`;
  const marked = new RegExp(`${start}[\\s\\S]*?${end}\\r?\\n*`);
  const replacement = `${start}\n${content}\n${end}\n`;
  if (marked.test(html)) return html.replace(marked, replacement);
  return html.replace(fallbackPattern, replacement);
}

function replaceEntriesBody(html, content) {
  const start = "<!-- seo:entries:start -->";
  const end = "<!-- seo:entries:end -->";
  const replacement = `<tbody id="entriesBody">\n        ${start}\n${content}\n        ${end}\n        </tbody>`;
  const pattern = /<tbody id="entriesBody">[\s\S]*?<\/tbody>|<!-- seo:entries:start -->[\s\S]*?<!-- seo:entries:end -->/;
  return html.replace(pattern, replacement);
}

function replaceJsonLd(html, type, value) {
  const json = JSON.stringify(value, null, 8)
    .split("\n")
    .map((line, index) => index === 0 ? line : `      ${line}`)
    .join("\n");
  const block = `    <script type="application/ld+json">\n      ${json}\n    </script>`;
  const pattern = new RegExp(`    <script type="application/ld\\+json">(?:(?!</script>)[\\s\\S])*?"@type"\\s*:\\s*"${type}"(?:(?!</script>)[\\s\\S])*?</script>`);
  if (pattern.test(html)) return html.replace(pattern, block);
  return html.replace(/    <script>\r?\n      let allEntries = \[\];/, `${block}\n    <script>\n      let allEntries = [];`);
}

function replaceHomepageScript(html, scriptContent) {
  return html.replace(/    <script>\r?\n      let allEntries = \[\];[\s\S]*?    <\/script>\r?\n    <script defer src="https:\/\/cdn\.vercel-insights\.com\/v1\/script\.js"><\/script>/, `    <script>\n${scriptContent}\n    </script>\n    <script defer src="https://cdn.vercel-insights.com/v1/script.js"></script>`);
}

function buildClientScript() {
  return `      let allEntries = [];
      let selectedEntryId = null;
      let pendingAnchorId = null;

      function parseEntryDate(v) {
        const m = String(v || '').match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
        if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        return v ? new Date(v) : null;
      }

      function fmtDate(v) {
        if (!v) return 'Unknown date';
        const d = parseEntryDate(v);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      }

      function fmtDateShort(v) {
        if (!v) return 'Unknown date';
        const d = parseEntryDate(v);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        return \`\${mm}/\${dd}/\${yy}\`;
      }

      function fmtDateMobileCompact(v) {
        if (!v) return 'n/a';
        const d = parseEntryDate(v);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return \`\${mm}/\${dd}\`;
      }

      function fmtDateMedium(v) {
        if (!v) return 'Unknown date';
        const d = parseEntryDate(v);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      }

      function entryFreshnessDate(entry) {
        return entry?.updatedAt || entry?.createdAt || entry?.eventDate || '';
      }

      function fmtNumber(v) {
        return Number(v || 0).toLocaleString();
      }

      function fmtLayoffs(v) {
        return v == null ? 'n/d' : fmtNumber(v);
      }

      function receiptLabel(entry) {
        const count = Array.isArray(entry.sources) ? entry.sources.length : 0;
        return \`\${count} receipt\${count === 1 ? '' : 's'}\`;
      }

      function animateCount(el, target) {
        if (!el) return;
        el.textContent = fmtNumber(target);
      }

      function labelize(v) {
        return String(v || '').replaceAll('_', ' ');
      }

      function fmtAiRelevance(v) {
        if (v === 'explicit_ai_cited') return 'Explicit AI cited';
        if (v === 'automation_efficiency_cited') return 'Automation / efficiency cited';
        if (v === 'ai_adjacent_restructuring') return 'AI-adjacent restructuring';
        if (v === 'speculative_or_unclear') return 'Speculative / unclear';
        if (v === 'ai_reorg_or_spend_linked') return 'AI reorg or spending linked';
        if (v === 'ai_replacement_cited') return 'AI replacement cited';
        return labelize(v);
      }

      function aiDefinition(v) {
        if (v === 'explicit_ai_cited') return 'The source directly ties layoffs to AI, AI investment, AI replacement, or AI-driven operating changes.';
        if (v === 'automation_efficiency_cited') return 'The source ties cuts to automation, efficiency, or reduced manual work.';
        if (v === 'ai_adjacent_restructuring') return 'The layoff is tied to AI-focused strategy, technology investment, or team reallocation, but not direct replacement.';
        if (v === 'speculative_or_unclear') return 'The event is a weaker AI-related lead and should not be read as confirmed AI replacement.';
        if (v === 'ai_reorg_or_spend_linked') return 'The source ties the layoff to AI reorganization, AI investment, or shifting spend toward AI.';
        if (v === 'ai_replacement_cited') return 'The source directly says work or roles were replaced by AI.';
        return '';
      }

      function evidenceTierOf(v) {
        if (v === 'ai_replacement_cited' || v === 'explicit_ai_cited') return 'strong';
        if (v === 'speculative_or_unclear') return 'weak';
        return 'medium';
      }

      function pillHtml(v) {
        const label = fmtAiRelevance(v);
        const tier = evidenceTierOf(v);
        const definition = aiDefinition(v);
        return \`<span class="pill \${tier}" data-tier="\${tier}" data-definition="\${definition}" title="\${definition}">\${label}</span>\`;
      }

      function fmtGeography(v) {
        return v === 'United Kingdom' ? 'UK' : (v || 'Unknown');
      }

      function fmtAiRelevanceShort(v) {
        if (v === 'explicit_ai_cited') return 'explicit AI';
        if (v === 'automation_efficiency_cited') return 'automation';
        if (v === 'ai_adjacent_restructuring') return 'AI restructure';
        if (v === 'speculative_or_unclear') return 'unclear';
        if (v === 'ai_reorg_or_spend_linked') return 'AI reorg';
        if (v === 'ai_replacement_cited') return 'AI replacement';
        return labelize(v);
      }

      function receiptStack(entry) {
        const sources = Array.isArray(entry.sources) && entry.sources.length ? entry.sources : [{}];
        const tier = evidenceTierOf(entry.aiRelevance);
        const verdict = \`Evidence: \${fmtAiRelevance(entry.aiRelevance)}\`.toUpperCase();
        return \`<div class="receipt-stack" aria-label="\${entry.company || 'Entry'} receipts">\${sources.map((source, index) => {
          const quote = source.quote || entry.evidenceQuote || 'No evidence quote recorded.';
          const name = source.name || 'Source';
          const date = source.publishedDate || entry.eventDate || '';
          return \`<article class="receipt-slip">
            <div class="receipt-head"><a href="\${source.url || '#'}" target="_blank" rel="noreferrer">\${String(name).toUpperCase()}</a><time datetime="\${date}">\${date || 'n/a'}</time></div>
            <hr class="receipt-rule" />
            <div class="receipt-quote">\${quote}</div>
            <hr class="receipt-rule" />
            <div class="receipt-foot" data-tier="\${tier}"><span>\${verdict}</span>\${sources.length > 1 ? \`<span>\${index + 1} OF \${sources.length}</span>\` : ''}</div>
          </article>\`;
        }).join('')}</div>\`;
      }

      function companySlug(value) {
        return String(value || '')
          .normalize('NFKD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toLowerCase()
          .replace(/&/g, ' and ')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      function updateStats(entries) {
        const total = entries.length;
        const layoffsTotal = entries.reduce((sum, e) => sum + Number(e.layoffsCount || 0), 0);
        const explicit = entries.filter((e) => e.aiRelevance === 'explicit_ai_cited').length;
        const share = total ? Math.round((explicit / total) * 100) : 0;
        document.getElementById('statEntries').textContent = String(total);
        const layoffsEl = document.getElementById('statLayoffs');
        if (layoffsEl) animateCount(layoffsEl, layoffsTotal);
        const explicitEl = document.getElementById('statExplicit');
        if (explicitEl) explicitEl.textContent = String(explicit);
        document.getElementById('statExplicitShare').textContent = \`\${share}%\`;
        const freshest = entries.slice().sort((a, b) => String(entryFreshnessDate(b)).localeCompare(String(entryFreshnessDate(a))))[0];
        const freshness = entryFreshnessDate(freshest);
        const freshnessDate = document.getElementById('freshnessDate');
        if (freshnessDate && freshness) {
          freshnessDate.dateTime = freshness;
          freshnessDate.textContent = String(freshness).slice(0, 10);
        }
      }

      function fillIndustryOptions(entries) {
        const sel = document.getElementById('filterIndustry');
        const industries = [...new Set(entries.map((e) => e.industry).filter(Boolean))]
          .sort((a, b) => {
            if (a === 'Other') return 1;
            if (b === 'Other') return -1;
            return String(a).localeCompare(String(b));
          });
        industries.forEach((industry) => {
          const opt = document.createElement('option');
          opt.value = industry;
          opt.textContent = industry;
          sel.appendChild(opt);
        });
      }

      function fillYearOptions(entries) {
        const sel = document.getElementById('filterYear');
        const years = [...new Set(entries.map((e) => String(e.eventDate || '').slice(0, 4)).filter((v) => /^\\d{4}$/.test(v)))].sort().reverse();
        years.forEach((year) => {
          const opt = document.createElement('option');
          opt.value = year;
          opt.textContent = year;
          sel.appendChild(opt);
        });
      }

      function applyUrlState() {
        const params = new URLSearchParams(window.location.search);
        const map = {
          q: 'filterSearch',
          relevance: 'filterRelevance',
          industry: 'filterIndustry',
          year: 'filterYear',
          sort: 'sortBy',
        };
        Object.entries(map).forEach(([key, id]) => {
          const el = document.getElementById(id);
          const value = params.get(key);
          if (el && value != null) el.value = value;
        });
      }

      function updateUrlState() {
        const params = new URLSearchParams();
        const values = {
          q: document.getElementById('filterSearch').value.trim(),
          relevance: document.getElementById('filterRelevance').value,
          industry: document.getElementById('filterIndustry').value,
          year: document.getElementById('filterYear').value,
          sort: document.getElementById('sortBy').value === 'newest' ? '' : document.getElementById('sortBy').value,
        };
        Object.entries(values).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });
        const query = params.toString();
        history.replaceState(null, '', query ? \`\${location.pathname}?\${query}\` : location.pathname);
      }

      function getFilteredEntries() {
        const relevance = document.getElementById('filterRelevance').value;
        const industry = document.getElementById('filterIndustry').value;
        const year = document.getElementById('filterYear').value;
        const sortBy = document.getElementById('sortBy').value;
        const search = document.getElementById('filterSearch').value.trim().toLowerCase();

        const filtered = allEntries.filter((entry) => {
          if (relevance && entry.aiRelevance !== relevance) return false;
          if (industry && entry.industry !== industry) return false;
          if (year && String(entry.eventDate || '').slice(0, 4) !== year) return false;
          if (search) {
            const haystack = [entry.company, entry.geography, entry.summary, entry.notes, entry.industry]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();
            if (!haystack.includes(search)) return false;
          }
          return true;
        });

        const sourceOrder = (entry) => {
          const i = allEntries.indexOf(entry);
          return i === -1 ? Number.MAX_SAFE_INTEGER : i;
        };
        const newestFirst = (a, b) => String(b.eventDate).localeCompare(String(a.eventDate)) || sourceOrder(a) - sourceOrder(b);

        if (sortBy === 'largest') {
          return filtered.sort((a, b) => (Number(b.layoffsCount) || -1) - (Number(a.layoffsCount) || -1) || newestFirst(a, b));
        }
        if (sortBy === 'company') {
          return filtered.sort((a, b) => String(a.company).localeCompare(String(b.company)) || String(b.eventDate).localeCompare(String(a.eventDate)));
        }
        return filtered.sort(newestFirst);
      }

      function renderDetailPanel(entry) {
        return \`
          <div class="detail-panel" id="details-\${entry.id}" role="region" aria-label="\${entry.company} source details">
            <div class="details">
              <div class="definition-line">\${fmtAiRelevance(entry.aiRelevance)}: \${aiDefinition(entry.aiRelevance)}</div>
              <div><strong>Country:</strong> \${entry.geography || 'Unknown'}</div>
              <div>\${entry.summary || ''}</div>
              \${receiptStack(entry)}
              <div class="detail-notes">\${entry.notes || ''}</div>
            </div>
          </div>
        \`;
      }

      function render() {
        const entries = getFilteredEntries();
        const body = document.getElementById('entriesBody');
        const empty = document.getElementById('emptyState');
        const summary = document.getElementById('resultSummary');
        const anchorBeforeTop = pendingAnchorId
          ? document.querySelector(\`tr[data-entry-id="\${pendingAnchorId}"]\`)?.getBoundingClientRect().top
          : null;
        body.innerHTML = '';
        empty.style.display = entries.length ? 'none' : 'block';
        summary.textContent = \`\${entries.length} matching entries out of \${allEntries.length} total\`;
        document.getElementById('resultJobsImpacted').textContent = \`(\${fmtNumber(entries.reduce((sum, e) => sum + Number(e.layoffsCount || 0), 0))} jobs impacted)\`;

        if (!entries.some((entry) => entry.id === selectedEntryId)) {
          selectedEntryId = null;
        }

        entries.forEach((entry) => {
          const tr = document.createElement('tr');
          tr.dataset.entryId = entry.id;
          tr.tabIndex = 0;
          tr.setAttribute('aria-controls', \`details-\${entry.id}\`);
          const isSelected = entry.id === selectedEntryId;
          const receiptCount = Array.isArray(entry.sources) ? entry.sources.length : 0;
          if (isSelected) tr.classList.add('selected');
          tr.setAttribute('aria-expanded', isSelected ? 'true' : 'false');
          tr.innerHTML = \`
            <td data-label="Company"><span class="company-line"><b><a href="/company/\${companySlug(entry.company)}/">\${entry.company}</a></b></span><br><span class="muted geography">\${entry.geography || 'Unknown'}</span></td>
            <td data-label="Date"><time datetime="\${entry.eventDate || ''}">\${fmtDateMedium(entry.eventDate)}</time><br><span class="receipt-count">\${receiptLabel(entry)}</span></td>
            <td data-label="Layoffs" class="\${entry.layoffsCount == null ? 'is-undisclosed' : 'is-disclosed'}">\${fmtLayoffs(entry.layoffsCount)}</td>
            <td data-label="Industry">\${entry.industry || 'Unknown'}</td>
            <td data-label="AI relevance">\${pillHtml(entry.aiRelevance)}<span class="mobile-row-meta" aria-hidden="true">\${fmtDateShort(entry.eventDate)} · \${entry.industry || 'Unknown'} · \${receiptCount} receipt\${receiptCount === 1 ? '' : 's'}</span><span class="mobile-chevron" aria-hidden="true">⌄</span></td>
          \`;
          const toggle = (event) => {
            const clickedLink = event.target instanceof Element ? event.target.closest('a') : null;
            if (clickedLink) {
              event.stopPropagation();
              return;
            }
            pendingAnchorId = entry.id;
            selectedEntryId = isSelected ? null : entry.id;
            render();
          };
          tr.addEventListener('click', toggle);
          tr.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggle(event);
            }
          });
          body.appendChild(tr);

          if (isSelected) {
            const detailRow = document.createElement('tr');
            detailRow.className = 'detail-row';
            detailRow.innerHTML = \`<td class="detail-cell" colspan="5">\${renderDetailPanel(entry)}</td>\`;
            body.appendChild(detailRow);
          }
        });

        updateUrlState();
        [...document.querySelectorAll('th[aria-sort]')].forEach((th) => th.setAttribute('aria-sort', 'none'));
        const activeSort = document.getElementById('sortBy').value;
        const sortHeader = activeSort === 'largest' ? document.querySelector('th[data-sort-header="layoffs"]') : activeSort === 'company' ? document.querySelector('th[data-sort-header="company"]') : document.querySelector('th[data-sort-header="date"]');
        if (sortHeader) sortHeader.setAttribute('aria-sort', activeSort === 'company' ? 'ascending' : 'descending');

        if (pendingAnchorId) {
          requestAnimationFrame(() => {
            const anchorAfter = document.querySelector(\`tr[data-entry-id="\${pendingAnchorId}"]\`);
            if (anchorAfter && anchorBeforeTop != null) {
              const anchorAfterTop = anchorAfter.getBoundingClientRect().top;
              window.scrollBy({ top: anchorAfterTop - anchorBeforeTop, left: 0, behavior: 'auto' });
            }
            pendingAnchorId = null;
          });
        }
      }

      async function init() {
        document.getElementById('copyrightYear').textContent = new Date().getFullYear();
        const resp = await fetch('./data/entries/index.json');
        allEntries = await resp.json();
        updateStats(allEntries);
        fillIndustryOptions(allEntries);
        fillYearOptions(allEntries);
        applyUrlState();
        ['filterSearch', 'filterRelevance', 'filterIndustry', 'filterYear', 'sortBy'].forEach((id) => {
          document.getElementById(id).addEventListener(id === 'filterSearch' ? 'input' : 'change', render);
        });
        const listCard = document.querySelector('.list-card');
        const filtersToggle = document.getElementById('filtersToggle');
        const setFiltersOpen = (open) => {
          if (!listCard || !filtersToggle) return;
          listCard.setAttribute('data-filters-open', open ? 'true' : 'false');
          filtersToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
          filtersToggle.textContent = open ? 'Hide filters' : 'Filters';
        };
        const mobile = window.matchMedia('(max-width: 800px)').matches;
        setFiltersOpen(!mobile);
        filtersToggle?.addEventListener('click', () => {
          const isOpen = listCard?.getAttribute('data-filters-open') === 'true';
          setFiltersOpen(!isOpen);
        });
        render();
      }

      init().catch((err) => {
        console.error(err);
        document.getElementById('entriesBody').innerHTML = '<tr><td colspan="5" class="muted">Failed to load entries.</td></tr>';
      });`;
}

async function prerenderHomepage() {
  const indexPath = path.join(root, "index.html");
  let html = await readFile(indexPath, "utf8");
  const sortedEntries = entries.slice().sort((a, b) => String(b.eventDate || "").localeCompare(String(a.eventDate || "")));
  const maxUpdated = maxUpdatedAt(entries);
  const totalJobs = entries.reduce((sum, entry) => sum + Number(entry.layoffsCount || 0), 0);
  const explicitCount = entries.filter((entry) => entry.aiRelevance === "explicit_ai_cited").length;
  const explicitShare = entries.length ? Math.round((explicitCount / entries.length) * 100) : 0;
  const lastUpdatedLabel = fmtDateShortYear(maxUpdated);
  const dek = `A public tracker of layoffs tied to AI and automation. ${entries.length} verified events, ${fmtNumber(totalJobs)} workers, every entry sourced with receipts.`;
  const faqItems = [
    {
      question: "What counts as an AI layoff on this site?",
      answer: "An entry is included when AI, automation, AI replacement, or AI-driven restructuring is part of the documented rationale for the layoff.",
    },
    {
      question: "How are entries verified?",
      answer: "Each verified entry needs a primary source or reputable reporting, plus a source quote that supports the AI connection.",
    },
    {
      question: "How are AI-cited layoffs different from ordinary layoffs?",
      answer: "The tracker separates layoffs explicitly tied to AI from ordinary cost cuts where AI is only background context or company strategy.",
    },
    {
      question: "Does every entry prove workers were replaced by AI?",
      answer: "No. The relevance labels show whether the evidence points to direct AI replacement, automation, AI-focused restructuring, or a weaker connection.",
    },
  ];

  const legacySiteUrl = `https://www.replacedbyai.${"com"}`;
  html = html.replaceAll(legacySiteUrl, siteUrl);
  html = html.replace(/<html>/, `<html lang="en">`);
  html = html.replace(/    <style>[\s\S]*?    <\/style>/, `    ${homepageCss()}`);
  html = html.replace(/\r?\n    <div class="ambient-bg" aria-hidden="true">[\s\S]*?    <\/div>\r?\n(?=    <nav class="top-nav")/, "\n");
  if (!/ibm-plex-sans-latin-400\.woff2/.test(html)) {
    html = html.replace(/(    <link rel="icon"[^>]+>\r?\n)/, `$1${fontPreloads}\n`);
  }
  html = html.replace(`AI Layoff Tracker ${"\u2014"} Verified Cases with Receipts | Replaced by AI`, "AI Layoff Tracker: Verified Cases with Receipts | Replaced by AI");
  html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="AI Layoff Tracker: Verified Cases with Receipts | Replaced by AI" />`);
  html = html.replace(/<meta name="twitter:card" content="[^"]*" \/>/, `<meta name="twitter:card" content="summary_large_image" />`);
  if (!/<meta property="og:image"/.test(html)) {
    html = html.replace(/(    <meta property="og:url" content="[^"]+" \/>\r?\n)/, `$1    <meta property="og:image" content="${siteUrl}/og-image.png" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta name="twitter:image" content="${siteUrl}/og-image.png" />\n`);
  } else {
    html = html.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${siteUrl}/og-image.png" />`);
    html = html.replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${siteUrl}/og-image.png" />`);
    if (!/<meta property="og:image:width"/.test(html)) {
      html = html.replace(/(<meta property="og:image" content="[^"]*" \/>\r?\n)/, `$1    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n`);
    }
  }
  if (!/<link rel="alternate"[^>]+application\/rss\+xml/.test(html)) {
    html = html.replace(/(    <link rel="canonical" href="https:\/\/www\.replacedbyai\.app\/" \/>\r?\n)/, `$1    <link rel="alternate" type="application/rss+xml" title="Replaced by AI feed" href="${siteUrl}/feed.xml" />\n`);
  }
  html = html.replace(/<a href="\/industries\/tech\/">Industries<\/a>\r?\n\s*<a href="\/sitemap\.xml">Sitemap<\/a>/, `<a href="/industries/">Industries</a>`);
  html = html.replace(/<a href="\/industries\/tech\/">Industries<\/a>/, `<a href="/industries/">Industries</a>`);
  if (!/<link rel="canonical" href="https:\/\/www\.replacedbyai\.app\/" \/>/.test(html)) {
    html = html.replace(/(    <meta name="description" content="[^"]+" \/>\r?\n)/, `$1    <link rel="canonical" href="${siteUrl}/" />\n`);
  }
  html = html.replace(new RegExp(`That skepticism is noted where relevant ${"\u2014"} the receipts are included so you can judge for yourself\\.`, "g"), "That skepticism is noted where relevant. The receipts are included so you can judge for yourself.");
  html = html.replaceAll("mailto:?subject=AI%20layoff%20tip&body=Company%3A%0ADate%3A%0ASource%20link%3A%0ASource%20quote%3A", tipMailto);
  html = html.replace(/      \/\* seo:homepage-improvements:start \*\/[\s\S]*?      \/\* seo:homepage-improvements:end \*\/\r?\n/, "");
  html = html.replace(/    <p class="muted tagline"[\s\S]*?<\/p>\r?\n/, "");
  html = html.replace(/    <p class="muted freshness">[\s\S]*?<\/p>/, `    <p class="last-updated">last updated <time id="freshnessDate" datetime="${escapeHtml(maxUpdated)}">${escapeHtml(maxUpdated)}</time></p>`);
  html = html.replace(/    <div class="stats">[\s\S]*?    <\/div>\r?\n\r?\n(?=<!-- seo:quote-stat:start -->)/, `    <div class="stats">
      <div class="card stat-card"><div class="stat-value" id="statEntries">${entries.length}</div><div class="stat-label">verified cases</div></div>
      <div class="card stat-card"><div class="stat-value" id="statLayoffs">${fmtNumber(totalJobs)}</div><div class="stat-label">jobs impacted</div></div>
      <div class="card stat-card"><div class="stat-value" id="statExplicitShare">${escapeHtml(fmtPercent(explicitShare))}</div><div class="stat-label" id="statExplicitShareLabel">explicitly cite AI</div><div class="stat-sub"><span id="statExplicit">${explicitCount}</span> of ${entries.length} events</div></div>
    </div>

`);
  html = html.replace(/<time id="freshnessDate" datetime="[^"]*">[\s\S]*?<\/time>/, `<time id="freshnessDate" datetime="${escapeHtml(maxUpdated)}">${escapeHtml(lastUpdatedLabel)}</time>`);
  html = html.replace(/<div class="muted" id="resultSummary">[\s\S]*?<\/div>/, `<div class="muted" id="resultSummary">${entries.length} matching entries out of ${entries.length} total</div>`);
  html = html.replace(/<div class="muted" id="resultJobsImpacted">[\s\S]*?<\/div>/, `<div class="muted" id="resultJobsImpacted">(${escapeHtml(fmtNumber(totalJobs))} jobs impacted)</div>`);
  html = html.replace(/<th>Receipts<\/th>/, `<th data-sort-header="date" aria-sort="descending">Date</th>`);
  html = html.replace(/<th>Company<\/th>/, `<th data-sort-header="company" aria-sort="none">Company</th>`);
  html = html.replace(/<th>Layoffs<\/th>/, `<th data-sort-header="layoffs" aria-sort="none">Layoffs</th>`);
  html = html.replace("Company A–Z", "Company A-Z");
  html = html.replace(/\r?\n\s*<caption class="visually-hidden">Verified AI layoff tracker entries with dates, job impact, industry, and AI relevance labels\.<\/caption>/g, "");
  html = html.replace(/<table>/, `<table>\n        <caption class="visually-hidden">Verified AI layoff tracker entries with dates, job impact, industry, and AI relevance labels.</caption>`);
  html = html.replace(/\r?\n    <section class="card" style="margin-top:20px;">\r?\n      <h2>By Industry<\/h2>[\s\S]*?    <\/section>\r?\n(?=\r?\n<!-- seo:faq:start -->)/, "\n");

  html = replaceRegion(
    html,
    "intro",
    `    <p class="dek">${escapeHtml(dek)}</p>`,
    /(?=    <p class="muted freshness">)/,
  );
  html = replaceRegion(
    html,
    "quote-stat",
    "",
    /(?=    <div class="card list-card")/,
  );
  html = replaceRegion(
    html,
    "legend",
    `      ${buildLegend()}`,
    /(?=      <table>)/,
  );
  html = replaceEntriesBody(html, homepageEntryRows(sortedEntries));
  html = replaceRegion(
    html,
    "trend",
    `    ${buildTrendChart(entries)}`,
    /(?=    <div class="card list-card")/,
  );
  html = replaceRegion(
    html,
    "links",
    `    <section class="card link-section" aria-labelledby="browseTitle">
      <h2 id="browseTitle">Browse the tracker</h2>
      <h3>By Industry</h3>
      <div class="section-link-grid">
        ${buildIndustryLinks()}
      </div>
      <h3>By Year</h3>
      <div class="section-link-grid">
        ${buildYearLinks()}
      </div>
    </section>`,
    /(?=    <div class="card" style="margin-top:20px;">\r?\n      <h2>Methodology<\/h2>)/,
  );
  html = replaceRegion(
    html,
    "data",
    `    <section class="card data-section" aria-labelledby="dataTitle">
      <h2 id="dataTitle">Data</h2>
      <p><a href="/data/export/ai-layoffs.csv">Download CSV</a> · <a href="/data/entries/index.json">View JSON index</a> · <a href="${tipMailto}">Submit a tip</a></p>
      <p class="muted">Free to use with attribution. Cite as: Replaced by AI, AI Layoff Tracker, replacedbyai.app.</p>
    </section>`,
    /(?=    <div class="card" style="margin-top:20px;">\r?\n      <h2>Methodology<\/h2>)/,
  );
  html = replaceRegion(
    html,
    "faq",
    `    <section class="card faq-section" style="margin-top:20px;">
      <h2>AI Layoff Tracker FAQ</h2>
      ${faqItems.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join("\n      ")}
    </section>`,
    /(?=    <div class="card" style="margin-top:20px;">\r?\n      <h2>Methodology<\/h2>)/,
  );
  html = html.replace(/<p class="footer-note" style="margin-top: 20px; display: inline-flex; align-items: center; gap: 8px;"><span>© <span id="copyrightYear"><\/span><\/span><a class="ba-badge" href="https:\/\/www\.b-average\.com\/" target="_blank" rel="noreferrer">B AVERAGE<\/a><\/p>/, `<p class="footer-note" style="margin-top: 20px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px;"><span>© <span id="copyrightYear"></span></span><a class="ba-badge" href="https://www.b-average.com/" target="_blank" rel="noreferrer">B AVERAGE</a><a href="/sitemap.xml">Sitemap</a><a href="/feed.xml">RSS</a><a href="${tipMailto}">Submit a tip</a></p>`);
  html = replaceHomepageScript(html, buildClientScript());

  html = replaceJsonLd(html, "WebSite", {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Replaced by AI",
    url: `${siteUrl}/`,
    description: "Track layoffs tied to AI and automation. Verified cases with sourced receipts from primary statements and reporting.",
    keywords: ["ai layoffs", "ai layoff tracker", "companies replacing workers with ai", "automation layoffs"],
  });
  html = replaceJsonLd(html, "Dataset", {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Replaced by AI Layoff Tracker",
    description: "A sourced AI layoff tracker dataset covering layoffs tied to AI, automation, AI replacement, and AI-driven restructuring.",
    url: `${siteUrl}/`,
    dateModified: maxUpdated,
    keywords: ["ai layoffs", "ai layoff tracker", "ai replacement layoffs", "automation layoffs"],
    isAccessibleForFree: true,
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: `${siteUrl}/data/export/ai-layoffs.csv`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${siteUrl}/data/entries/index.json`,
      },
    ],
  });
  html = replaceJsonLd(html, "FAQPage", {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  });

  await writeFile(indexPath, html);
}

async function writeCsvExport() {
  const dir = path.join(root, "data", "export");
  await mkdir(dir, { recursive: true });
  const rows = [
    ["company", "eventDate", "layoffsCount", "industry", "geography", "aiRelevance", "status", "sourceQuality", "primary source URL"],
    ...entries
      .slice()
      .sort((a, b) => String(b.eventDate || "").localeCompare(String(a.eventDate || "")))
      .map((entry) => [
        entry.company,
        entry.eventDate,
        entry.layoffsCount == null ? "" : entry.layoffsCount,
        entry.industry,
        entry.geography,
        entry.aiRelevance,
        entry.status,
        entry.sourceQuality,
        entry.sources?.[0]?.url || "",
      ]),
  ];
  const csv = `${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`;
  await writeFile(path.join(dir, "ai-layoffs.csv"), csv);
}

async function writeFeed() {
  const recent = entries
    .slice()
    .sort((a, b) => String(b.eventDate || "").localeCompare(String(a.eventDate || "")))
    .slice(0, Math.min(20, entries.length));
  const items = recent.map((entry) => {
    const url = `${siteUrl}/company/${slugify(entry.company)}/`;
    const title = `${entry.company} AI layoffs, ${fmtDate(entry.eventDate)}`;
    const description = `${entry.company}: ${fmtLayoffs(entry.layoffsCount)} layoffs. ${aiLabels[entry.aiRelevance] || fmtAiRelevanceShort(entry.aiRelevance)}. ${entry.summary || ""}`;
    return `    <item>
      <title>${xmlEscape(title)}</title>
      <link>${xmlEscape(url)}</link>
      <guid>${xmlEscape(`${url}#${entry.id}`)}</guid>
      <pubDate>${new Date(`${dateOnly(entry.eventDate)}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${xmlEscape(description)}</description>
    </item>`;
  }).join("\n");
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Replaced by AI Layoff Tracker</title>
    <link>${siteUrl}/</link>
    <description>Recent sourced AI layoff tracker entries.</description>
    <lastBuildDate>${new Date(`${maxUpdatedAt(entries)}T00:00:00Z`).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  await writeFile(path.join(root, "feed.xml"), feed);
}

async function writeOgImage() {
  const totalJobs = entries.reduce((sum, entry) => sum + Number(entry.layoffsCount || 0), 0);
  const explicitCount = entries.filter((entry) => entry.aiRelevance === "explicit_ai_cited").length;
  const explicitShare = entries.length ? Math.round((explicitCount / entries.length) * 100) : 0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FCFCFA"/>
  <rect x="72" y="72" width="1056" height="486" rx="6" fill="#FCFCFA" stroke="#E5E4DF"/>
  <rect x="112" y="118" width="428" height="86" rx="6" fill="#17191D"/>
  <text x="140" y="173" font-family="monospace" font-size="42" font-weight="700" fill="#FCFCFA">&gt; /replaced -ai</text>
  <path d="M112 452 L290 410 L438 430 L594 366 L752 392 L1016 292" fill="none" stroke="#B3202F" stroke-width="7"/>
  <text x="112" y="284" font-family="sans-serif" font-size="70" font-weight="700" fill="#17191D">AI Layoff Tracker</text>
  <text x="112" y="342" font-family="sans-serif" font-size="30" fill="#50555D">Verified cases with receipts</text>
  <g font-family="monospace">
    <text x="112" y="515" font-size="54" font-weight="700" fill="#B3202F">${fmtNumber(totalJobs)}</text>
    <text x="112" y="548" font-size="24" fill="#50555D">jobs impacted across ${entries.length} verified events · ${fmtPercent(explicitShare)} explicitly cite AI</text>
  </g>
</svg>
`;
  await writeFile(path.join(root, "og-image.svg"), svg);
}

const companyGroups = new Map();
for (const entry of entries) {
  const slug = slugify(entry.company);
  if (!slug) continue;
  if (!companyGroups.has(slug)) companyGroups.set(slug, []);
  companyGroups.get(slug).push(entry);
}

await rm(path.join(root, "company"), { recursive: true, force: true });

const allEntriesLastmod = maxUpdatedAt(entries);
const sitemapUrls = [
  { url: "/", lastmod: allEntriesLastmod },
  { url: "/about/", lastmod: allEntriesLastmod },
  { url: "/company/", lastmod: allEntriesLastmod },
  { url: "/industries/", lastmod: allEntriesLastmod },
  { url: "/data/export/ai-layoffs.csv", lastmod: allEntriesLastmod },
  { url: "/feed.xml", lastmod: allEntriesLastmod },
  { url: "/og-image.png", lastmod: allEntriesLastmod },
];
for (const [slug, companyEntries] of companyGroups.entries()) {
  companyEntries.sort((a, b) => String(b.eventDate || "").localeCompare(String(a.eventDate || "")));
  const company = companyEntries[0].company;
  const total = companyEntries.reduce((sum, entry) => sum + Number(entry.layoffsCount || 0), 0);
  const relatedIndustry = entries
    .filter((entry) => entry.company !== company && entry.industry === companyEntries[0].industry)
    .slice(0, 6);
  const relatedYear = entries
    .filter((entry) => entry.company !== company && String(entry.eventDate || "").slice(0, 4) === String(companyEntries[0].eventDate || "").slice(0, 4))
    .slice(0, 6);
  const relatedBlocks = [
    relatedIndustry.length ? `<h3>Other ${escapeHtml(companyEntries[0].industry || "industry")} AI layoffs</h3>${entryList(relatedIndustry)}` : "",
    relatedYear.length ? `<h3>Other AI layoffs from ${escapeHtml(String(companyEntries[0].eventDate || "").slice(0, 4))}</h3>${entryList(relatedYear)}` : "",
  ].filter(Boolean).join("\n        ");
  const title = `${company} AI layoffs - AI Layoff Tracker with Receipts`;
  const description = `${company} AI layoffs page in the Replaced by AI layoff tracker, with sourced receipts, dates, AI relevance labels, and reported job impact.`;
  const body = `    <main>
      <p class="muted">AI layoff tracker company page</p>
      <h1>${escapeHtml(company)} AI layoffs</h1>
      <p class="muted">Last updated <time datetime="${escapeHtml(maxUpdatedAt(companyEntries))}">${escapeHtml(fmtDate(maxUpdatedAt(companyEntries)))}</time></p>
      <p class="muted">${escapeHtml(companyEntries.length)} sourced AI layoff event${companyEntries.length === 1 ? "" : "s"}${total ? ` · ${escapeHtml(fmtNumber(total))} reported jobs impacted` : ""}</p>
      ${companyEntries.map(entryCard).join("\n")}
      <section class="card">
        <h2>Related AI layoffs</h2>
        ${relatedBlocks}
      </section>
    </main>`;
  const dir = path.join(root, "company", slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), pageShell({ title, description, canonicalPath: `/company/${slug}/`, body, schema: companyEntries.map((entry) => articleSchema(entry, `/company/${slug}/`)) }));
  sitemapUrls.push({ url: `/company/${slug}/`, lastmod: maxUpdatedAt(companyEntries) });
}

if (companyGroups.has("nestle")) {
  const aliasDir = path.join(root, "company", "nestla");
  await mkdir(aliasDir, { recursive: true });
  await writeFile(path.join(aliasDir, "index.html"), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Nestlé AI layoffs - moved</title>
    <link rel="canonical" href="${siteUrl}/company/nestle/" />
    <meta http-equiv="refresh" content="0; url=/company/nestle/" />
  </head>
  <body>
    <p><a href="/company/nestle/">Nestlé AI layoffs moved to /company/nestle/.</a></p>
  </body>
</html>
`);
}

const companyListBody = `    <main>
      <p class="muted">Company index</p>
      <h1>AI layoffs by company</h1>
      <p>This index lists every company currently tracked in the Replaced by AI layoff tracker. Each company page is built as static HTML for long-tail searches such as company name plus AI layoffs.</p>
      <section class="card">
        <h2>Company pages</h2>
        <ul class="source-list">
          ${[...companyGroups.entries()]
            .sort((a, b) => a[1][0].company.localeCompare(b[1][0].company))
            .map(([slug, companyEntries]) => `<li><a href="/company/${slug}/">${escapeHtml(companyEntries[0].company)} AI layoffs</a></li>`)
            .join("\n          ")}
        </ul>
      </section>
    </main>`;

await mkdir(path.join(root, "company"), { recursive: true });
await writeFile(
  path.join(root, "company", "index.html"),
  pageShell({
    title: "AI layoffs by company - Replaced by AI tracker",
    description: "Browse AI layoffs by company with static, indexable pages for every company in the Replaced by AI layoff tracker.",
    canonicalPath: "/company/",
    body: companyListBody,
  }),
);

await rm(path.join(root, "industries"), { recursive: true, force: true });
await rm(path.join(root, "relevance"), { recursive: true, force: true });

const industryGroups = new Map();
const yearGroups = new Map();
const relevanceGroups = new Map();
for (const entry of entries) {
  const industry = entry.industry || "Other";
  const year = String(entry.eventDate || "").slice(0, 4);
  if (!industryGroups.has(industry)) industryGroups.set(industry, []);
  industryGroups.get(industry).push(entry);
  if (/^\d{4}$/.test(year)) {
    if (!yearGroups.has(year)) yearGroups.set(year, []);
    yearGroups.get(year).push(entry);
  }
  if (entry.aiRelevance) {
    if (!relevanceGroups.has(entry.aiRelevance)) relevanceGroups.set(entry.aiRelevance, []);
    relevanceGroups.get(entry.aiRelevance).push(entry);
  }
}

for (const [industry, items] of industryGroups.entries()) {
  items.sort((a, b) => String(b.eventDate || "").localeCompare(String(a.eventDate || "")));
  const slug = industrySlug(industry);
  const title = `${industryTitle(industry)} - Replaced by AI`;
  const description = `Track ${String(industryTitle(industry)).toLowerCase()} with sourced receipts, company pages, dates, and AI relevance labels.`;
  const body = `    <main>
      <p class="muted">Industry landing page</p>
      <h1>${escapeHtml(industryTitle(industry))}</h1>
      <p>${escapeHtml(description)}</p>
      <section class="card">
        <h2>Recent AI Layoffs</h2>
        ${entryList(items)}
      </section>
    </main>`;
  const dir = path.join(root, "industries", slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), pageShell({ title, description, canonicalPath: `/industries/${slug}/`, body, schema: itemListSchema(items, `/industries/${slug}/`) }));
  sitemapUrls.push({ url: `/industries/${slug}/`, lastmod: maxUpdatedAt(items) });
}

const industryIndexBody = `    <main>
      <p class="muted">Industry index</p>
      <h1>AI layoffs by industry</h1>
      <p>Browse every industry represented in the Replaced by AI layoff tracker, with counts generated from the current dataset.</p>
      <section class="card">
        <h2>Industry pages</h2>
        <ul class="source-list">
          ${[...industryGroups.entries()]
            .sort((a, b) => {
              if (a[0] === "Other") return 1;
              if (b[0] === "Other") return -1;
              return a[0].localeCompare(b[0]);
            })
            .map(([industry, items]) => `<li><a href="/industries/${industrySlug(industry)}/">${escapeHtml(industry)} AI layoffs</a> (${items.length})</li>`)
            .join("\n          ")}
        </ul>
      </section>
    </main>`;

await mkdir(path.join(root, "industries"), { recursive: true });
await writeFile(
  path.join(root, "industries", "index.html"),
  pageShell({
    title: "AI layoffs by industry - Replaced by AI tracker",
    description: "Browse AI layoffs by industry with static, indexable pages and current counts from the Replaced by AI layoff tracker.",
    canonicalPath: "/industries/",
    body: industryIndexBody,
    schema: itemListSchema(entries, "/industries/"),
  }),
);

const customerSupportEntries = entries.filter((entry) => /support|customer|service|moderation|contractor/i.test([entry.company, entry.summary, entry.notes, entry.industry].filter(Boolean).join(" ")));
const customerSupportBody = `    <main>
      <p class="muted">Topical landing page</p>
      <h1>AI Layoffs in Customer Support</h1>
      <p>Customer support, moderation, contractor, and service roles are a recurring theme in AI layoffs and automation-driven restructuring.</p>
      <section class="card">
        <h2>Related AI layoffs</h2>
        ${entryList(customerSupportEntries.length ? customerSupportEntries : entries.slice(0, 12))}
      </section>
    </main>`;
await mkdir(path.join(root, "industries", "customer-support"), { recursive: true });
await writeFile(
  path.join(root, "industries", "customer-support", "index.html"),
  pageShell({
    title: "AI Layoffs in Customer Support - Replaced by AI",
    description: "Track AI layoffs in customer support, service, moderation, and contractor work with sourced receipts.",
    canonicalPath: "/industries/customer-support/",
    body: customerSupportBody,
    schema: itemListSchema(customerSupportEntries.length ? customerSupportEntries : entries.slice(0, 12), "/industries/customer-support/"),
  }),
);
sitemapUrls.push({ url: "/industries/customer-support/", lastmod: maxUpdatedAt(customerSupportEntries.length ? customerSupportEntries : entries.slice(0, 12)) });

for (const [year, items] of yearGroups.entries()) {
  items.sort((a, b) => String(b.eventDate || "").localeCompare(String(a.eventDate || "")));
  const title = `AI Layoffs ${year} - Replaced by AI Tracker`;
  const description = `AI layoffs in ${year}, with verified cases, sourced receipts, company pages, job counts, and AI relevance labels.`;
  const body = `    <main>
      <p class="muted">Year landing page</p>
      <h1>AI Layoffs ${escapeHtml(year)}</h1>
      <p>${escapeHtml(description)}</p>
      <section class="card">
        <h2>Recent AI Layoffs</h2>
        ${entryList(items)}
      </section>
    </main>`;
  const dir = path.join(root, year);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), pageShell({ title, description, canonicalPath: `/${year}/`, body }));
  sitemapUrls.push({ url: `/${year}/`, lastmod: maxUpdatedAt(items) });
}

for (const [relevance, items] of relevanceGroups.entries()) {
  items.sort((a, b) => String(b.eventDate || "").localeCompare(String(a.eventDate || "")));
  const slug = relevanceSlugs[relevance] || slugify(relevance);
  const label = aiLabels[relevance] || relevance;
  const title = `${label} AI layoffs - Replaced by AI Tracker`;
  const description = `Track ${label.toLowerCase()} AI layoffs with sourced receipts, company pages, dates, job counts, and methodology notes.`;
  const body = `    <main>
      <p class="muted">AI relevance landing page</p>
      <h1>${escapeHtml(label)} AI layoffs</h1>
      <p>${escapeHtml(description)}</p>
      <section class="card">
        <h2>Recent AI Layoffs</h2>
        ${entryList(items)}
      </section>
    </main>`;
  const dir = path.join(root, slug === "explicitly-ai-cited" ? slug : path.join("relevance", slug));
  const canonicalPath = slug === "explicitly-ai-cited" ? "/explicitly-ai-cited/" : `/relevance/${slug}/`;
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), pageShell({ title, description, canonicalPath, body }));
  sitemapUrls.push({ url: canonicalPath, lastmod: maxUpdatedAt(items) });
}

const aboutBody = `    <main>
      <p class="muted">Methodology</p>
      <h1>About the AI layoff tracker</h1>
      <p>Replaced by AI tracks public AI layoffs where AI, automation, AI replacement, or AI-driven restructuring is part of the documented rationale. It is not a generic layoff list.</p>
      <section class="card">
        <h2>Inclusion rules</h2>
        <p>Every entry needs a primary source or reputable reporting source. Weak aggregation and unsourced social posts can be used as leads, but they are not enough for a verified public entry.</p>
      </section>
      <section class="card">
        <h2>Classification rules</h2>
        ${Object.entries(aiLabels).map(([key, label]) => `<p id="${escapeHtml(relevanceSlugs[key] || slugify(key))}"><strong>${escapeHtml(label)}</strong>: ${escapeHtml(aiDefinitions[key])}</p>`).join("\n        ")}
      </section>
      <section class="card">
        <h2>Source quality</h2>
        <p><strong>Primary</strong> sources include company statements, filings, investor materials, or executive memos. <strong>Reputable reporting</strong> includes established business, technology, and labor reporting. <strong>Secondary lead</strong> sources are kept visibly labeled and usually marked for review.</p>
      </section>
      <section class="card">
        <h2>Receipts first</h2>
        <p>The AI layoff tracker separates facts from interpretation. Each entry includes a source quote, a summary, and notes explaining why the event was included and how strong the AI connection is.</p>
      </section>
    </main>`;

await mkdir(path.join(root, "about"), { recursive: true });
await writeFile(
  path.join(root, "about", "index.html"),
  pageShell({
    title: "About the AI layoff tracker methodology - Replaced by AI",
    description: "Methodology for the Replaced by AI layoff tracker, including AI layoffs inclusion rules, source quality standards, and AI relevance classifications.",
    canonicalPath: "/about/",
    body: aboutBody,
  }),
);

await writeCsvExport();
await writeFeed();
await writeOgImage();
await prerenderHomepage();

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(({ url, lastmod }) => `  <url><loc>${siteUrl}${url}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n")}
</urlset>
`;
await writeFile(path.join(root, "sitemap.xml"), sitemap);

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
await writeFile(path.join(root, "robots.txt"), robots);

console.log(`Generated ${companyGroups.size} company pages, /company/, /about/, robots.txt, and sitemap.xml`);
