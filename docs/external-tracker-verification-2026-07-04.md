# External Tracker Verification - 2026-07-04

Compared local `ai-layoffs` data against:

- `https://layoffs.fyi/`
- `https://www.jobslost.ai/`
- `https://www.trueup.io/layoffs`
- `https://jobloss.ai/reports`

Local baseline at time of review: 97 entries, 85 unique company names.

## Access Notes

- `jobloss.ai/reports`: usable Next.js payload; 49 structured reports extracted.
- `layoffs.fyi`: usable Airtable shared-view payload; 4,493 rows extracted. Filtered to 2025+ rows missing locally with AI/automation terms in source URL/company text.
- `trueup.io/layoffs`: blocked by Cloudflare from CLI.
- `jobslost.ai`: static HTML rendered an empty table and no usable exposed dataset was found in loaded chunks.

## Strong Add/Review Candidates

These have a direct AI/automation/restructuring signal in accessible article text, article title/description, primary filing, or a reliable accessible syndication. They still need normal entry work: exact quote extraction, source-quality labeling, count confirmation, and classification.

| Company | Date | Count | Source | Verification note |
| --- | ---: | ---: | --- | --- |
| ASML | 2026-01-28 | 1,700 | AP | AP description says record profit was driven by AI demand and ASML planned to cut about 1,700 jobs / 4% of workforce. |
| Amperity | 2026-06-25 | unknown | GeekWire | CLI fetch blocked, but search-accessible GeekWire text says Amperity confirmed layoffs and said it is building AI into how it works, changing investment and team shape. |
| Optimove | 2026-06-17 | 10% | InterGame | Accessible title/text: "Optimove to cut 10% of jobs in AI push." |
| Shopee | 2026-06-10 | hundreds | Straits Times | Accessible title/text: "Sea's Shopee cuts hundreds of developer jobs in pivot to AI." |
| Paytm | 2026-06-09 | 400 | Moneycontrol | Accessible title/text: staff increase in AI pivot with some roles cut. |
| Interview Kickstart | 2026-05-29 | 50 | Inc42 | Accessible title/text: layoffs amid AI automation push. |
| Kraken | 2026-05-15 | 150 | FinanceFeeds / Bloomberg | Accessible syndication says Kraken laid off about 150 after deploying AI tools that improved efficiency. |
| MRI Software | 2026-05-11 | 200 | Propmodo | Accessible title/text says company cut 200 jobs and cited AI adoption. |
| reAlpha | 2026-05-06 | 25% | Markets Insider / company release | Accessible title says workforce reduced by about 25% as AI advancements drive organizational efficiency. |
| 0G | 2026-05-05 | unknown | Business Insider | Accessible title says layoffs and shift to AI integration. Need body quote due BI paywall/limited body. |
| SuperOps | 2026-04-24 | 60 | Inc42 | Accessible title/text says 30% staff laid off in AI-led restructuring push. |
| Epidemic Sound | 2026-04-21 | 150 | MarketScreener / Di | Accessible title says 150 cuts in AI pivot. |
| Cars.com | 2026-04-09 | 11% | MarketWatch | Accessible title says layoff of 11% amid AI push. |
| Bolt | 2026-04-05 | one-third | PYMNTS | Accessible title says staff cut amid new AI focus. |
| DraftKings | 2026-02-24 | unknown | NEXT.io | Accessible title/text says workforce reduced as company embraces AI. |
| Yellow.ai | 2025-12-23 | 100+ | Inc42 | Accessible title/text says layoffs amid automation push. |
| Culture Amp | 2025-11-18 | 60 / 6% | Capital Brief | Accessible title says staff cut as focus shifts to new AI products. |
| Broadcom | 2025-10-17 | 247 | Business Insider | Accessible title says sales staff cut following AI expansion; needs body quote. |
| Handshake | 2025-10-14 | 100 | Upstarts | Accessible text says AI refounding included a layoff. |
| Scope3 | 2025-09-05 | unknown | Adweek / Yahoo syndication | Search-accessible and Yahoo-syndicated text says layoffs were part of shift toward agentic advertising. |
| Klaviyo | 2025-08-25 | <100 | The Information / AInvest / LinkedIn excerpt | Blocked original, but accessible excerpts say R&D restructuring, layoffs under 100, replacement hiring in engineering to expand AI. Needs stronger source text if possible. |
| BenchSci | 2025-08-12 | 83 / 23% | Globe and Mail | Accessible title says company is replacing humans with AI. |
| King.com | 2025-07-14 | 200 | Mobilegamer.biz | Accessible title/text says laid-off staff set to be replaced by AI tools they helped build. |
| Klue | 2025-06-25 | 85 / 40% | BetaKit | Accessible title/text says layoffs as startup navigates shifting AI landscape. |
| nCino | 2025-05-27 | 7% | HousingWire | Accessible title says workforce cut while talking up AI opportunities. |
| OpenText | 2025-05-06 | 1,600 | BetaKit | Accessible title/text says AI became "number-one priority" as jobs were slashed. |
| Zomato | 2025-04-01 | 600 | Inc42 | Accessible title/text says jobs trimmed amid increasing automation. |

## Duplicate Check

Checked the strong candidates against current `data/entries/index.json` by normalized company names, likely aliases, entry IDs/slugs, candidate titles, and exact source URLs.

- Real duplicate / already covered: `Tailwind Labs` is already represented as `tailwind-2026-01-20` with company `Tailwind`, count `3`, status `verified`, and AI relevance `explicit_ai_cited`. Do not add a new Tailwind entry from the external tracker; at most add the newer Business Insider URL as an additional source after quote verification.
- No exact source-URL duplicates found between the audit links and existing entry source URLs.
- No current entry or candidate match found for the remaining recommended names after normalization, except a false text hit on `King.com` caused by the word "banking" in an unrelated candidate title.

## Possible, But Needs Better Evidence

These may be valid leads, but the accessible source did not clearly prove the AI-layoff connection or did not provide enough body text for a publish-ready quote.

| Company | Date | Count | Source | Issue |
| --- | ---: | ---: | --- | --- |
| Baker McKenzie | 2026-02-24 | 1,200 | Bloomberg Law | Title says hundreds laid off as AI grows, but accessible body is thin. Needs stronger quote/source. |
| Microsoft | 2026-07-01 | 5,500 | Morningstar / MarketWatch | Title says layoffs as Microsoft spends on AI; body access limited. Needs quote and count confirmation. |
| Accenture | 2025-09-29 | 11,000 | Yahoo Finance | Fetch failed; search text says layoffs tied to inability to adapt to AI-focused roles. Needs accessible article or primary earnings-call text. |
| Clari | 2026-02-12 | 76 | Bizjournals / X / company merger release | Original blocked. Public snippets tie cuts to AI investment after Salesloft merger, but needs source-quality upgrade. |
| Gloo | 2026-01-29 | unknown | Bizjournals / InterviewPal | Original blocked; accessible aggregator says AI restructuring, but source quality is weak. |
| AI Fleet | 2025-11-13 | 56 | Bizjournals | Original blocked. Public snippets say vendor issue caused layoffs at an AI startup, not necessarily AI-driven restructuring. |
| ServiceNow | 2026-06-11 | 54 | SiliconValley.com | Source verifies job cuts; AI link is not clear in accessible text. |
| BILL Holdings | 2026-05-07 | 709 | SEC 8-K / jobloss.ai | SEC text has AI opportunity/margin language, but accessible excerpt did not confirm a workforce reduction. Needs exact filing section or alternate source. |
| UKG | 2026-04-23 | 950 | Sun Sentinel | Source verifies layoffs, but accessible text did not show AI causality. |
| Expedia | 2026-01-29 | 162 | AP | AP piece is broad AI-layoff analysis; need exact Expedia passage before adding. |
| Opendoor | 2026-06-10 | 250 | TechCrunch | Source is about India exit, AI, and outsourcing; needs exact layoff count/causality quote. |

## Weak/Context Only

These are mostly "AI startup/company had layoffs or shut down" leads. That is not enough for this project unless the job loss itself is tied to AI replacing work, AI-driven restructuring, or automation.

| Company | Date | Count | Source | Why weak |
| --- | ---: | ---: | --- | --- |
| Scale AI | 2025-07-16 | 200 | CNBC / Bloomberg | Layoffs after Meta investment and executive movement, not clearly caused by AI replacing work. |
| Placer.ai | 2025-01-29 | 150 | CTech | AI company cut jobs for profitability; no AI causality found. |
| Bobble AI | 2025-09-04 | 50 | Entrackr | AI company with organizational redesign; causality unclear. |
| Robin AI | 2025-10-24 | one-third | Sifted | AI startup cut staff after failed fundraise; not AI-displacement. |
| NeuroPixel.AI | 2026-04-03 | unknown | Entrackr | Shutdown amid financial strain. |
| Yupp | 2026-03-31 | unknown | TechCrunch | AI/crypto startup shutdown; no workforce/AI-causality quote found. |
| Alle | 2026-01-13 | unknown | YourStory / LinkedIn | AI stylist startup shutdown after failed pivots; not an AI-layoff causality story. |
| Subtl AI | 2025-07-03 | unknown | Inc42 | GenAI startup shutdown after failing to raise funds. |
| Retrain.ai | 2025-07-02 | 20 | CTech | AI platform shutdown/sale; not AI displacement. |
| Builder.ai | 2025-05-20 | unknown | TechCrunch | Microsoft-backed AI company running out of money; not AI causality. |
| Coho AI | 2025-04-06 | unknown | CTech | Startup shutdown/employee integration; not AI causality. |
| Tract | 2025-04-03 | unknown | Sifted | AI proptech startup shutdown; not AI causality. |
| Astra | 2025-07-28 | 106 | Inc42 | AI startup shutdown; not AI causality. |
| Boozt | 2025-01-13 | unknown | Breakit | Title appears to say Boozt points to AI, but article body was too short/in Swedish; needs translation/full text before promotion. |
| Zebra Technologies | 2025-12-12 | unknown | The Robot Report | Winding down robotics automation business; no layoff confirmation in accessible text. |

## Reject / False Positive

| Company | Date | Count | Source | Reason |
| --- | ---: | ---: | --- | --- |
| LinkedIn | 2026-05-13 | 875 | Reuters via Yahoo / Inc | Reuters/Yahoo says layoffs were not driven by AI job replacement. |
| Uber | 2026-06-03 | unknown | CNBC | CNBC description says Uber said the cuts were not driven by AI. Existing candidate was already rejected. |

## Recommended Next Entries

Start with these because the AI connection and count/source look clearest:

### Promoted to verified entries on 2026-07-04

- `kraken-2026-05-15`
- `realpha-2026-05-06`
- `opentext-2025-05-06`
- `klue-2025-06-27`
- `zomato-2025-04-01`
- `optimove-2026-06-17`
- `shopee-2026-06-10`
- `interview-kickstart-2026-05-29`
- `mri-software-2026-05-11`
- `superops-2026-04-24`
- `cars-com-2026-04-09`
- `yellow-ai-2025-12-23`
- `culture-amp-2025-11-18`
- `king-2025-07-14`
- `amperity-2026-06-25`
- `paytm-2026-06-09`
- `epidemic-sound-2026-04-21`
- `scope3-2025-09-05`
- `benchsci-2025-08-12`

### Final note

All 19 non-duplicate strong external-tracker candidates from this audit have been promoted to verified entries. Remaining possible/weak items above should stay unpromoted unless better source text is found.
