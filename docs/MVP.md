# AI Layoffs MVP Spec

## Goal
Build the most trustworthy public tracker for layoffs tied to AI, automation, and AI-driven restructuring.

## Non-goals
- generic all-layoffs tracker
- rumor aggregation
- fully automated publishing without review

## Target user
- journalists
- researchers
- workers tracking disruption
- operators/investors watching sector shifts
- curious readers looking for sourced examples

## Homepage

### Hero
- Title: `AI Layoffs Tracker`
- Subtitle: `Track layoffs tied to AI, automation, and AI-driven restructuring — with receipts.`

### Top stats
- total verified entries
- total layoffs tracked
- explicit AI-cited count
- most recent update date

### Filters
- date range
- industry
- geography
- AI relevance
- confidence
- source quality

### Public v1 industries
- Consulting
- Finance
- Government
- Media
- Recruitment
- Technology

### Main list
Columns/cards:
- company
- date
- layoffs count
- industry
- AI relevance
- confidence
- source
- one-line summary

### Charts
- entries by month
- layoffs by month
- entries by industry
- AI relevance breakdown

## Entry page
- headline summary
- company metadata
- layoffs count/date
- AI relevance label
- confidence label
- evidence quote(s)
- source list
- notes
- related entries (same company / same sector)

## Methodology page
- inclusion rules
- exclusion rules
- source rules
- classification definitions
- confidence rules
- update policy

## Admin / internal workflow
### Candidate queue
- title
- url
- source
- published date
- excerpt
- status
- duplicate_of

### Review action
- approve to verified entry
- reject
- mark duplicate
- request more evidence

## Launch dataset target
Seed with 10–20 strong entries:
- explicit AI-cited layoffs first
- then high-confidence AI-adjacent restructuring

## Build order
1. schema and sample data
2. static page / app shell
3. homepage with verified entries
4. detail pages
5. filters
6. charts
7. candidate pipeline
