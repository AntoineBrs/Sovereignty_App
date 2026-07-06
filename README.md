# Sovereignty Explorer — POC

Search-and-compare platform for the **digital sovereignty** of technology suppliers, built for the **EU EIDH** (European Digital Innovation Hubs) offer by Bull / Eviden AI Consulting.

An SME can search suppliers by service and filters, read each supplier's **structural sovereignty score** (governance, jurisdiction, R&D), and drill into every **product/service** it offers to compare product-level sovereignty across six themes.

## Features
- Company search + filters (country, service type, sovereignty level, sort).
- Company cards (3 per row): monogram, country, overall structural score, radar chart (3 themes), score detail, summary comment.
- Product/service accordion per company with its own radar (6 themes), scores and comment.
- "View questionnaire" modal showing the **filled questionnaire**: every question, its guidance, and the selected scoring level (L0/L1/L2).
- All scores are **derived at runtime** from questionnaire answers — the same way the live app will consume real data.

## Scoring model
Each question is answered on a 0–2 scale (Level 0 = non-sovereign … Level 2 = fully sovereign).
- **Theme score** = average of its questions' levels, normalised to 0–100.
- **Overall score** = average of all levels, normalised to 0–100.
- Questionnaires: 1 *structural* (company) + 3 *product typologies* (Hosting & Cloud, SaaS & Software, Agency & Service), transcribed from `Sovereignty_Questionnaire_EN.xlsx`.

## Tech stack
Pure static site — **HTML / CSS / vanilla JavaScript**, zero dependencies, zero build step. Radar charts are hand-rendered as inline SVG so the demo works fully offline. Visual identity follows the European Commission / EDIH guidelines.

## Project structure
```
index.html          Page shell (header, search, filters, results, modal)
css/styles.css       European Commission / EDIH design system
js/schema.js         Questionnaire definitions (themes, questions, levels)
js/data.js           Demo companies + answers (fictional-but-realistic)
js/scoring.js        Derives sovereignty scores from answers
js/radar.js          Dependency-free SVG radar chart renderer
js/emblem.js         EU 12-star emblem
js/app.js            Search, filters, cards, accordion, questionnaire modal
```

## Run locally
Any static file server works, e.g. from this folder:
```bash
# Python
python -m http.server 8123
# Node
npx serve .
```
Then open `http://localhost:8123`. You can also open `index.html` directly in a browser.

## Disclaimer
Proof of concept. The sovereignty assessments are **indicative demonstration data** and do not constitute an official evaluation of the companies mentioned.
