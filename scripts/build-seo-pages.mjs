import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const entriesPath = path.join(root, "data", "entries", "index.json");
const entries = JSON.parse(readFileSync(entriesPath, "utf8"));
const siteUrl = "https://www.replacedbyai.app";

const aiLabels = {
  explicit_ai_cited: "Explicit AI cited",
  automation_efficiency_cited: "Automation / efficiency cited",
  ai_adjacent_restructuring: "AI-adjacent restructuring",
  speculative_or_unclear: "Speculative / unclear",
  ai_reorg_or_spend_linked: "AI reorg or spending linked",
  ai_replacement_cited: "AI replacement cited",
};

const relevanceSlugs = {
  explicit_ai_cited: "explicitly-ai-cited",
  automation_efficiency_cited: "automation-efficiency-cited",
  ai_adjacent_restructuring: "ai-adjacent-restructuring",
  speculative_or_unclear: "speculative-or-unclear",
  ai_reorg_or_spend_linked: "ai-reorg-or-spend-linked",
  ai_replacement_cited: "ai-replacement-cited",
};

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
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta name="twitter:card" content="summary" />
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 1100px;
        margin: 20px auto 40px;
        padding: 0 16px;
        color: #111;
        background:
          radial-gradient(circle at top, rgba(255,255,255,0.72), rgba(255,255,255,0.36) 30%, rgba(229,233,239,0.68) 58%, rgba(214,220,228,0.92) 100%),
          #e1e6ed;
        line-height: 1.55;
        position: relative;
        overflow-x: hidden;
      }
      body > * {
        position: relative;
        z-index: 1;
      }
      .ambient-bg {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
        opacity: 1;
      }
      .ambient-shape {
        position: absolute;
        border-radius: 28px;
        border: 2px solid rgba(53, 70, 92, 0.28);
        background: rgba(255,255,255,0.14);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 30px rgba(34,44,60,0.08);
        will-change: transform, opacity;
      }
      .ambient-shape.one {
        width: 420px;
        height: 420px;
        top: 5%;
        left: -40px;
        transform: rotate(18deg);
        animation: geoOne 20s ease-in-out infinite alternate;
      }
      .ambient-shape.two {
        width: 300px;
        height: 300px;
        top: 22%;
        right: 10px;
        transform: rotate(34deg);
        animation: geoTwo 24s ease-in-out infinite alternate;
      }
      .ambient-shape.three {
        width: 240px;
        height: 240px;
        bottom: 10%;
        left: 40px;
        transform: rotate(12deg);
        animation: geoThree 18s ease-in-out infinite alternate;
      }
      .ambient-shape.four {
        width: 200px;
        height: 200px;
        bottom: 16%;
        right: 80px;
        transform: rotate(46deg);
        animation: geoFour 26s ease-in-out infinite alternate;
      }
      @keyframes geoOne {
        0% { transform: translate3d(0, 0, 0) rotate(18deg); opacity: 0.34; }
        100% { transform: translate3d(46px, 24px, 0) rotate(26deg); opacity: 0.2; }
      }
      @keyframes geoTwo {
        0% { transform: translate3d(0, 0, 0) rotate(34deg); opacity: 0.26; }
        100% { transform: translate3d(-38px, 34px, 0) rotate(22deg); opacity: 0.16; }
      }
      @keyframes geoThree {
        0% { transform: translate3d(0, 0, 0) rotate(12deg); opacity: 0.2; }
        100% { transform: translate3d(24px, -16px, 0) rotate(20deg); opacity: 0.12; }
      }
      @keyframes geoFour {
        0% { transform: translate3d(0, 0, 0) rotate(46deg); opacity: 0.18; }
        100% { transform: translate3d(-18px, -26px, 0) rotate(56deg); opacity: 0.1; }
      }
      a { color: #0a58ca; }
      .top-nav { display: flex; gap: 12px; align-items: center; justify-content: flex-end; margin-bottom: 0; font-size: 14px; }
      .top-nav a { color: #111; text-decoration: none; }
      .top-nav a:hover { text-decoration: underline; }
      .hero { margin-bottom: 8px; }
      .logo-link { display: inline-flex; color: inherit; text-decoration: none; }
      .prompt-title {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 18px;
        background: #111;
        color: #f5f5f5;
        border-radius: 12px;
        font-family: Consolas, 'SFMono-Regular', Menlo, Monaco, monospace;
        font-size: clamp(28px, 5vw, 42px);
        line-height: 1.1;
        letter-spacing: -0.02em;
        box-shadow: 0 10px 30px rgba(0,0,0,0.12);
      }
      .prompt-symbol { color: #7CFF6B; }
      .prompt-text { white-space: nowrap; }
      .prompt-cursor {
        display: inline-block;
        width: 0.65ch;
        height: 1.05em;
        background: #7CFF6B;
        vertical-align: -0.12em;
        animation: blink 1s steps(1, end) infinite;
      }
      @keyframes blink { 50% { opacity: 0; } }
      h1 { font-size: clamp(32px, 5vw, 48px); line-height: 1.05; margin: 0 0 12px; letter-spacing: 0; }
      h2 { margin-top: 34px; }
      .muted { color: #555; }
      .card { background: #fff; border: 1px solid #dde2e8; border-radius: 8px; padding: 18px; margin: 18px 0; }
      .pill { display: inline-block; padding: 5px 9px; border-radius: 999px; background: #f2f4f7; font-size: 13px; margin-right: 6px; }
      .quote { padding: 12px 14px; border-left: 4px solid #ccd3dc; background: #fafafa; }
      .source-list { padding-left: 20px; }
      .footer { margin-top: 34px; font-size: 13px; color: #666; }
      @media (max-width: 800px) {
        .top-nav { justify-content: flex-start; flex-wrap: wrap; margin-bottom: 18px; }
        .prompt-title { font-size: clamp(29.5px, 5.2vw, 43.7px); }
        body {
          background:
            radial-gradient(circle at top, rgba(255,255,255,0.94), rgba(255,255,255,0.84) 36%, rgba(255,255,255,0.96) 66%),
            linear-gradient(to bottom, #eceff3 0%, #ffffff 360px);
        }
        .ambient-shape.one { width: 220px; height: 220px; top: 10%; left: -70px; }
        .ambient-shape.two { width: 180px; height: 180px; top: 34%; right: -60px; }
        .ambient-shape.three { width: 150px; height: 150px; bottom: 10%; left: 6%; }
        .ambient-shape.four { width: 120px; height: 120px; bottom: 22%; right: 4%; }
      }
    </style>
    ${schemaItems.map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`).join("\n    ")}
  </head>
  <body>
    <div class="ambient-bg" aria-hidden="true">
      <div class="ambient-shape one"></div>
      <div class="ambient-shape two"></div>
      <div class="ambient-shape three"></div>
      <div class="ambient-shape four"></div>
    </div>
    <nav class="top-nav" aria-label="Site navigation">
      <a href="/about/">Methodology</a>
      <a href="/company/">Companies</a>
      <a href="/industries/tech/">Industries</a>
      <a href="/sitemap.xml">Sitemap</a>
    </nav>
    <div class="hero">
      <a class="logo-link" href="/" aria-label="Replaced by AI">
        <span class="prompt-title"><span class="prompt-symbol">&gt;</span><span class="prompt-text">/replaced -ai</span><span class="prompt-cursor" aria-hidden="true"></span></span>
      </a>
    </div>
${body}
    <p class="footer">&copy; <span id="copyrightYear"></span> B Average</p>
    <script>document.getElementById('copyrightYear').textContent = new Date().getFullYear();</script>
    <script defer src="https://cdn.vercel-insights.com/v1/script.js"></script>
  </body>
</html>
`;
}

function entryCard(entry) {
  const sources = (entry.sources || [])
    .map((source) => `<li><a href="${escapeHtml(source.url)}" rel="noreferrer">${escapeHtml(source.name)}</a>${source.publishedDate ? `, ${escapeHtml(source.publishedDate)}` : ""}</li>`)
    .join("");
  return `<article class="card">
      <p class="muted"><time datetime="${escapeHtml(entry.eventDate || "")}">${escapeHtml(fmtDate(entry.eventDate))}</time></p>
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
  return items.map((entry, index) => {
    const source = (entry.sources && entry.sources[0]) || null;
    const selected = index === 0;
    const row = `          <tr data-entry-id="${escapeHtml(entry.id || "")}"${selected ? ` class="selected" aria-expanded="true"` : ` aria-expanded="false"`}>
            <td><span class="company-line"><b><a href="/company/${slugify(entry.company)}/">${escapeHtml(entry.company)}</a></b></span><br><span class="muted"><span class="desktop-date">${escapeHtml(entry.geography || "-")}</span><span class="mobile-date">${escapeHtml(fmtGeography(entry.geography))}</span></span></td>
            <td>${source ? `<a class="date-link" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer"><span class="desktop-date">${escapeHtml(fmtDate(entry.eventDate))}</span><span class="mobile-date">${escapeHtml(fmtDateCompact(entry.eventDate))}</span></a>` : `<span class="desktop-date">${escapeHtml(fmtDate(entry.eventDate))}</span><span class="mobile-date">${escapeHtml(fmtDateCompact(entry.eventDate))}</span>`}</td>
            <td>${entry.layoffsCount == null ? "-" : escapeHtml(fmtNumber(entry.layoffsCount))}</td>
            <td>${escapeHtml(entry.industry || "-")}</td>
            <td><span class="pill ${escapeHtml(entry.aiRelevance || "")}">${escapeHtml(aiLabels[entry.aiRelevance] || entry.aiRelevance || "Unclassified")}</span></td>
          </tr>`;
    if (!selected) return row;
    const whyIncluded = entry.aiRelevance === "explicit_ai_cited"
      ? "Included because the source explicitly ties the layoffs to AI."
      : entry.aiRelevance === "automation_efficiency_cited"
        ? "Included because the source ties the cuts to automation or AI-driven efficiency."
        : entry.aiRelevance === "ai_adjacent_restructuring"
          ? "Included because the layoffs are tied to an AI-focused restructuring or reallocation."
          : "Included as a more tentative AI-related lead.";
    return `${row}
          <tr class="detail-row"><td class="detail-cell" colspan="5">
          <div class="detail-panel">
            <div class="details">
              <div class="quote-meta">
                <span class="source-chip">${source ? `Source: <a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.name)}</a>` : "Source unavailable"}</span>
                <span class="pill ${escapeHtml(entry.aiRelevance || "")} mobile-only">${escapeHtml(fmtAiRelevanceShort(entry.aiRelevance))}</span>
              </div>
              <div class="quote">${escapeHtml(entry.evidenceQuote || "No evidence quote recorded.")}</div>
              <div class="why-included">${escapeHtml(whyIncluded)}</div>
              <div class="detail-notes">${escapeHtml(entry.notes || "")}</div>
            </div>
          </div>
        </td></tr>`;
  }).join("\n");
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

async function prerenderHomepage() {
  const indexPath = path.join(root, "index.html");
  let html = await readFile(indexPath, "utf8");
  const sortedEntries = entries.slice().sort((a, b) => String(b.eventDate || "").localeCompare(String(a.eventDate || "")));
  const maxUpdated = maxUpdatedAt(entries);
  const totalJobs = entries.reduce((sum, entry) => sum + Number(entry.layoffsCount || 0), 0);
  const explicitCount = entries.filter((entry) => entry.aiRelevance === "explicit_ai_cited").length;
  const lastUpdatedLabel = fmtDateShort(maxUpdated);
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
  html = html.replace("AI Layoff Tracker — Verified Cases with Receipts | Replaced by AI", "AI Layoff Tracker: Verified Cases with Receipts | Replaced by AI");
  if (!/<link rel="canonical" href="https:\/\/www\.replacedbyai\.app\/" \/>/.test(html)) {
    html = html.replace(/(    <meta name="description" content="[^"]+" \/>\r?\n)/, `$1    <link rel="canonical" href="${siteUrl}/" />\n`);
  }
  html = html.replace(/<div class="stat-value" id="statEntries">[\s\S]*?<\/div>/, `<div class="stat-value" id="statEntries">${entries.length}</div>`);
  html = html.replace(/<div class="stat-value" id="statLayoffs">[\s\S]*?<\/div>/, `<div class="stat-value" id="statLayoffs">${fmtNumber(totalJobs)}</div>`);
  html = html.replace(/<div class="stat-value" id="statExplicit">[\s\S]*?<\/div>/, `<div class="stat-value" id="statExplicit">${explicitCount}</div>`);
  html = html.replace(/<div class="stat-value" id="statUpdated">[\s\S]*?<\/div>/, `<div class="stat-value" id="statUpdated"><span class="desktop-date">${escapeHtml(lastUpdatedLabel)}</span><span class="mobile-date">${escapeHtml(fmtDateCompact(maxUpdated).slice(0, 5))}</span></div>`);
  html = html.replace(/<div class="stat-label" id="statUpdatedLabel">[\s\S]*?<\/div>/, `<div class="stat-label" id="statUpdatedLabel">last updated on ${escapeHtml(fmtDateCompact(maxUpdated))}</div>`);
  html = html.replace(/<time id="freshnessDate" datetime="[^"]*">[\s\S]*?<\/time>/, `<time id="freshnessDate" datetime="${escapeHtml(maxUpdated)}">${escapeHtml(lastUpdatedLabel)}</time>`);
  html = html.replace(/<div class="muted" id="resultSummary">[\s\S]*?<\/div>/, `<div class="muted" id="resultSummary">${entries.length} matching entries out of ${entries.length} total</div>`);
  html = html.replace(/<div class="muted" id="resultJobsImpacted">[\s\S]*?<\/div>/, `<div class="muted" id="resultJobsImpacted">(${escapeHtml(fmtNumber(totalJobs))} jobs impacted)</div>`);

  html = replaceRegion(
    html,
    "intro",
    `    <p class="muted intro-copy">Replaced by AI is a public AI layoff tracker. It documents layoffs tied to AI and automation, with every entry sourced to a primary statement or reputable reporting.</p>`,
    /(?=    <p class="muted freshness">)/,
  );
  html = replaceEntriesBody(html, homepageEntryRows(sortedEntries));
  html = replaceRegion(
    html,
    "faq",
    `    <section class="card faq-section" style="margin-top:20px;">
      <h2>AI Layoff Tracker FAQ</h2>
      ${faqItems.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join("\n      ")}
    </section>`,
    /(?=    <div class="card" style="margin-top:20px;">\r?\n      <h2>Methodology<\/h2>)/,
  );

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
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${siteUrl}/data/entries/index.json`,
    },
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
  const slug = industrySlugs[industry] || slugify(industry);
  const title = `${industryTitles[industry] || `${industry} AI Layoffs`} - Replaced by AI`;
  const description = `Track ${String(industryTitles[industry] || `${industry} AI layoffs`).toLowerCase()} with sourced receipts, company pages, dates, and AI relevance labels.`;
  const body = `    <main>
      <p class="muted">Industry landing page</p>
      <h1>${escapeHtml(industryTitles[industry] || `${industry} AI Layoffs`)}</h1>
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
