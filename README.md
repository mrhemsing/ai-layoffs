# AI Layoffs

A public tracker for layoffs actually tied to AI, automation, and AI-driven restructuring.

## Product direction

This project is **not** a generic layoffs tracker.

It focuses on:
- layoffs where AI or automation is explicitly cited
- layoffs strongly tied to AI strategy or AI-driven restructuring
- evidence-backed entries with reputable sourcing
- clear confidence labels and transparent methodology

## Core principles

- **Receipts first** — every public entry needs a primary source or reputable reporting
- **No rumor laundering** — weak social posts and unsourced aggregation are candidate leads only
- **Separate facts from interpretation** — explicit AI citation vs inferred connection must be labeled clearly
- **Trust over volume** — fewer, better entries beats a noisy database

## MVP

### Public homepage
- headline stats
- latest verified entries
- filters by date, industry, geography, source quality, AI relevance, confidence
- simple trend charts

### Entry detail page
- company
- date
- layoffs count
- industry
- geography
- AI relevance classification
- confidence level
- short summary
- source links
- evidence quote
- notes

### Methodology page
- inclusion rules
- source-quality rules
- classification definitions
- confidence definitions

## Suggested classifications

### AI relevance
- `explicit_ai_cited`
- `automation_efficiency_cited`
- `ai_adjacent_restructuring`
- `speculative_or_unclear`

### Confidence
- `high`
- `medium`
- `low`

### Source quality
- `primary`
- `reputable_reporting`
- `secondary_lead`

## Source policy

Public entries must have either:
1. a **primary source**
2. or at least one **reputable reporting source** with a clear factual basis

Sources that are fine for candidate discovery but not enough alone for publishing:
- random tweets
- Reddit posts
- unsourced newsletters
- SEO blogs
- aggregator sites without original reporting

## Workflow

### 1. Candidate ingestion
Collect candidate stories from:
- major business/tech publications
- company press releases and investor relations pages
- executive statements / LinkedIn posts
- WARN notices and public filings
- search/news queries around layoffs + AI/automation terms

### 2. Review queue
Candidates should be reviewed before publication.

### 3. Verified entry
Only verified entries are published to the public dataset.

## Repo plan

- `docs/` — methodology, product spec
- `data/entries/` — verified public entries
- `data/candidates/` — raw candidate leads
- `schema/` — JSON schema for entries and candidates
- `app/` or framework scaffold — public site + admin workflow

## Next build steps

1. define schemas
2. seed 10–20 high-confidence entries
3. scaffold the public site
4. add filters and charts
5. add candidate review workflow
