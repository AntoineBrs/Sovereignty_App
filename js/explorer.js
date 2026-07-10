// ============================================================================
// Explore view — anonymised supplier list + company detail page
// ----------------------------------------------------------------------------
// Two views share the same data:
//  - LIST  : anonymous cards. By default one card per company (label, origin,
//            keywords, plain-language description — no sovereignty yet). When a
//            product type is selected, cards become expandable product/service
//            labels instead. Clicking a card opens the company detail page.
//  - DETAIL: a single company's sovereignty profile — structural assessment
//            (governance, explanation, radar, comment, questionnaire) followed
//            by its products/services as expandable sovereignty panels.
// Ranking is driven by the selected criteria: each criterion is the sum of its
// questionnaire answer levels (0/1/2); several criteria are averaged. No number
// is ever shown — ties are conveyed with matching colours only.
// ============================================================================

const explore = {
  query: "", country: "all", type: "all", gov: "all",
  sortCats: [],   // [id, ...] — criteria that drive the ranking (max 3)
  bound: false
};

const MAX_SORT_CATS = 3;

// Canonical sort criteria = the 9 sovereignty sub-categories (schema themes).
// `scope` selects where the answers come from; `themes` lists the theme name(s)
// that map to this criterion (Security is named differently across schemas).
// `desc` feeds the criterion "i" tooltip.
const SORT_CATEGORIES = [
  { id: "eu_footprint",     label: "European Footprint",                   scope: "structural", themes: ["European Footprint"],
    desc: "Where the company generates revenue, who ultimately owns it and where its governance is anchored." },
  { id: "extraterritorial", label: "Independence from Extraterritorial Law", scope: "structural", themes: ["Independence from Extraterritorial Law"],
    desc: "Exposure to foreign jurisdiction (e.g. US Cloud Act) and independent sovereignty certifications." },
  { id: "research_oss",     label: "Research & Open Source",               scope: "structural", themes: ["Research & Open Source"],
    desc: "Location of R&D, ownership of the core technology and contribution to open source." },
  { id: "legal",            label: "Legal Framework & Compliance",         scope: "product",    themes: ["Legal Framework & Compliance"],
    desc: "Applicable law, contractual guarantees and compliance certifications for the offering." },
  { id: "data_control",     label: "Data Location & Control",              scope: "product",    themes: ["Data Location & Control"],
    desc: "Where data is stored and who controls access and the encryption keys." },
  { id: "security",         label: "Security & Encryption",                scope: "product",    themes: ["Security & Encryption", "Security"],
    desc: "Protection measures, encryption strength and key management." },
  { id: "tech_indep",       label: "Technological Independence",           scope: "product",    themes: ["Technological Independence"],
    desc: "Reliance on non-EU technologies, components and infrastructure." },
  { id: "transparency",     label: "Transparency & Audit",                 scope: "product",    themes: ["Transparency & Audit"],
    desc: "Auditability, sub-processor disclosure and reporting." },
  { id: "reversibility",    label: "Reversibility & Exit",                 scope: "product",    themes: ["Reversibility & Exit"],
    desc: "Ability to migrate away from the offering without lock-in." }
];

const SORT_CAT_GROUPS = [
  { key: "structural", title: "Company (structural)" },
  { key: "product",    title: "Products & services" }
];

function initExplore() {
  if (explore.bound) return;
  buildExploreFilters();
  bindExploreControls();
  renderSortCatsPanel();
  explore.bound = true;
}

function buildExploreFilters() {
  const countries = Array.from(new Set(APP.companies.map(c => c.country).filter(Boolean))).sort();
  const countrySel = document.getElementById("filter-country");
  countrySel.length = 1;
  countries.forEach(c => countrySel.add(new Option(c, c)));

  const typeGroup = document.getElementById("filter-type-products");
  typeGroup.innerHTML = "";
  Object.keys(PRODUCT_TYPES).forEach(t => typeGroup.appendChild(new Option(t, t)));
}

// ---------------------------------------------------------------------------
// European governance band — derived from structural question 2 (index 1)
// ---------------------------------------------------------------------------
function governanceLevel(company) {
  return company.structural.answers[1];
}

function governanceLabel(level) {
  if (level >= 2) return "≥ 90%";
  if (level === 1) return "50–89%";
  return "< 50%";
}

function governanceClass(level) {
  if (level >= 2) return "gov-high";
  if (level === 1) return "gov-mid";
  return "gov-low";
}

// ---------------------------------------------------------------------------
// Sort-criteria scope, gated by the "Service type" filter
// ---------------------------------------------------------------------------
// Rule:
// - "All types" → every criterion is allowed (the list shows companies; there
//   is no single product context to narrow criteria against).
// - A specific product type (e.g. SaaS) → structural criteria remain allowed
//   (the company's structural answers still apply), PLUS only the product
//   criteria whose theme actually exists in that product type's schema — this
//   is what keeps "Technological Independence" unavailable for Agency/Service.
function isCriterionAllowed(cat) {
  if (explore.type === "all") return true;
  if (cat.scope === "structural") return true;
  const schemaKey = PRODUCT_TYPES[explore.type] && PRODUCT_TYPES[explore.type].schema;
  const schema = schemaKey && SCHEMAS[schemaKey];
  if (!schema) return false;
  return schema.themes.some(t => cat.themes.includes(t.name));
}

// Drop any selected criteria that fall outside what's now allowed by the
// "Service type" filter (e.g. switching to "Agency" clears "Technological
// Independence").
function pruneSortCatsForType() {
  explore.sortCats = explore.sortCats.filter(id => {
    const cat = SORT_CATEGORIES.find(c => c.id === id);
    return cat && isCriterionAllowed(cat);
  });
}

function bindExploreControls() {
  document.getElementById("search").addEventListener("input", e => { explore.query = e.target.value.trim().toLowerCase(); renderExplore(); });
  document.getElementById("filter-country").addEventListener("change", e => { explore.country = e.target.value; renderExplore(); });
  document.getElementById("filter-type").addEventListener("change", e => {
    explore.type = e.target.value;
    pruneSortCatsForType();
    renderSortCatsPanel();
    renderExplore();
  });
  document.getElementById("filter-gov").addEventListener("change", e => { explore.gov = e.target.value; renderExplore(); });
  document.getElementById("reset-filters").addEventListener("click", () => {
    Object.assign(explore, { query: "", country: "all", type: "all", gov: "all", sortCats: [] });
    document.getElementById("search").value = "";
    ["country", "type", "gov"].forEach(k => document.getElementById("filter-" + k).value = "all");
    renderSortCatsPanel();
    renderExplore();
  });

  document.getElementById("back-to-list").addEventListener("click", showList);

  document.getElementById("sort-cats-help").addEventListener("click", e => {
    e.stopPropagation();
    toggleCriteriaHelp();
  });
  // Close the "how does ranking work" popup when clicking outside it.
  document.addEventListener("click", e => {
    const wrap = document.querySelector(".sort-cats-help-wrap");
    if (wrap && !wrap.contains(e.target)) toggleCriteriaHelp(false);
  });
}

function toggleCriteriaHelp(force) {
  const popup = document.getElementById("sort-cats-help-popup");
  if (!popup) return;
  popup.hidden = force != null ? !force : !popup.hidden;
}

// ---------------------------------------------------------------------------
// Criteria ranking — based directly on questionnaire answer levels (0/1/2)
// ---------------------------------------------------------------------------

// Products a company counts towards a product-scoped criterion: all of them by
// default, or only those matching the selected "Service type" filter.
function referenceProducts(company) {
  return explore.type !== "all"
    ? company.products.filter(p => p.type === explore.type)
    : company.products;
}

// Sum of the raw answer levels of a criterion's theme, or null if absent.
function themeLevelsSum(schemaKey, answers, cat) {
  const themes = computeAssessment(schemaKey, answers).themes;
  const theme = themes.find(t => cat.themes.includes(t.name));
  if (!theme) return null;
  return theme.levels.reduce((a, l) => a + l, 0);
}

// Value of a company for one criterion: the summed answer levels (structural),
// or the average of the per-product sums (product scope). Null if N/A.
function criterionValue(company, cat) {
  if (cat.scope === "structural") {
    return themeLevelsSum("structural", company.structural.answers, cat);
  }
  const sums = [];
  referenceProducts(company).forEach(p => {
    const schemaKey = PRODUCT_TYPES[p.type] && PRODUCT_TYPES[p.type].schema;
    if (!schemaKey) return;
    const s = themeLevelsSum(schemaKey, p.answers, cat);
    if (s != null) sums.push(s);
  });
  if (!sums.length) return null;
  return sums.reduce((a, b) => a + b, 0) / sums.length;
}

// Overall ranking value = average of the selected criteria (missing = 0).
function relevanceValue(company) {
  const vals = explore.sortCats.map(id => {
    const cat = SORT_CATEGORIES.find(c => c.id === id);
    if (!cat) return 0;
    const v = criterionValue(company, cat);
    return v == null ? 0 : v;
  });
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// Stable key used to detect equal-ranked (tied) companies without exposing figures.
function relevanceKey(company) {
  return relevanceValue(company).toFixed(4);
}

// ---------------------------------------------------------------------------
// Criteria panel — every criterion is always visible and toggled in place.
// ---------------------------------------------------------------------------
function toggleSortCat(id) {
  const cat = SORT_CATEGORIES.find(c => c.id === id);
  if (!cat) return;
  if (explore.sortCats.includes(id)) {
    explore.sortCats = explore.sortCats.filter(x => x !== id);
  } else {
    if (explore.sortCats.length >= MAX_SORT_CATS) return;
    if (!isCriterionAllowed(cat)) return;
    explore.sortCats.push(id);
  }
  renderSortCatsPanel();
  renderExplore();
}

function renderSortCatsPanel() {
  const panel = document.getElementById("sort-cats-panel");
  if (!panel) return;
  panel.innerHTML = "";
  const atMax = explore.sortCats.length >= MAX_SORT_CATS;

  SORT_CAT_GROUPS.forEach(g => {
    const items = SORT_CATEGORIES.filter(c => c.scope === g.key);
    if (!items.length) return;

    const group = el("div", "sort-toggle-group");
    group.appendChild(el("div", "sort-toggle-group-title", escapeHtml(g.title)));
    const row = el("div", "sort-toggle-row");

    items.forEach(c => {
      const selected = explore.sortCats.includes(c.id);
      const allowed = isCriterionAllowed(c);
      const capped = !selected && atMax;             // can't add more than MAX
      const blocked = !allowed || capped;

      const btn = el("button", "sort-toggle"
        + (selected ? " selected" : "")
        + (!selected && blocked ? " disabled" : ""));
      btn.type = "button";
      btn.setAttribute("aria-pressed", String(selected));
      btn.appendChild(el("span", "sort-toggle-label", escapeHtml(c.label)));

      const info = el("span", "sort-toggle-info", "i");
      info.title = c.desc + " Ranking is based on the questionnaire answers.";
      info.setAttribute("aria-hidden", "true");
      btn.appendChild(info);

      if (selected) {
        btn.title = "Selected — click to remove";
      } else if (!allowed) {
        btn.title = "Not available for the current service-type filter.";
      } else if (capped) {
        btn.title = "You can select up to " + MAX_SORT_CATS + " criteria.";
      }

      if (selected || allowed) {
        btn.addEventListener("click", ev => {
          if (ev.target.classList.contains("sort-toggle-info")) return;
          toggleSortCat(c.id);
        });
      }
      if (!selected && blocked) btn.disabled = true;

      row.appendChild(btn);
    });

    group.appendChild(row);
    panel.appendChild(group);
  });
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------
function filteredCompanies() {
  let list = APP.companies.filter(c => {
    if (explore.query) {
      const hay = [c.sector, c.country, c.description, ...c.products.map(p => p.type + " " + (p.description || ""))]
        .join(" ").toLowerCase();
      if (!hay.includes(explore.query)) return false;
    }
    if (explore.country !== "all" && c.country !== explore.country) return false;
    // A specific product type keeps only companies that offer a matching product/service.
    if (explore.type !== "all" && !c.products.some(p => p.type === explore.type)) return false;
    // Governance filter is a threshold: ≥ 50% (level ≥ 1) or ≥ 90% (level ≥ 2).
    if (explore.gov !== "all" && governanceLevel(c) < Number(explore.gov)) return false;
    return true;
  });

  // Selected criteria drive the ranking; without any, keep natural order.
  if (explore.sortCats.length > 0) {
    list = list.slice().sort((a, b) => {
      const diff = relevanceValue(b) - relevanceValue(a);
      if (Math.abs(diff) > 1e-9) return diff;
      return 0;   // equal rank → keep stable (they are shown as tied)
    });
  }
  return list;
}

// Distinct colours, one per tied group, so equal-ranked suppliers can be
// visually matched to each other (no numbers are ever shown).
const TIE_PALETTE = ["#7C3AED", "#0EA5E9", "#F59E0B", "#DB2777", "#059669", "#EA580C", "#4F46E5", "#B91C1C"];

// Map relevanceKey → colour, only for groups with more than one company,
// ordered by rank (best-ranked tied group gets the first colour).
function computeTieColors(list) {
  const counts = {};
  list.forEach(c => { const k = relevanceKey(c); counts[k] = (counts[k] || 0) + 1; });
  const tiedKeys = Object.keys(counts)
    .filter(k => counts[k] > 1)
    .sort((a, b) => parseFloat(b) - parseFloat(a));
  const map = {};
  tiedKeys.forEach((k, i) => { map[k] = TIE_PALETTE[i % TIE_PALETTE.length]; });
  return map;
}

// ---------------------------------------------------------------------------
// View switching (list ⇄ company detail)
// ---------------------------------------------------------------------------
function showList() {
  APP.view = "list";
  document.getElementById("view-company").hidden = true;
  document.getElementById("view-explore").hidden = false;
  window.scrollTo(0, 0);
}

function showCompanyDetail(company) {
  APP.view = "company";
  renderCompanyDetail(company);
  document.getElementById("view-explore").hidden = true;
  document.getElementById("view-company").hidden = false;
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------------------
// List rendering
// ---------------------------------------------------------------------------
function renderExplore() {
  const list = filteredCompanies();
  const results = document.getElementById("results");
  const isProductView = explore.type !== "all";

  document.getElementById("result-count").textContent =
    list.length === 0 ? "No supplier matches your criteria."
                      : `${list.length} supplier${list.length > 1 ? "s" : ""} found`;

  const sortNote = document.getElementById("result-sort-note");
  if (sortNote) sortNote.hidden = explore.sortCats.length === 0;

  // Identify tied ranks (only meaningful when criteria are active).
  const tieColors = explore.sortCats.length > 0 ? computeTieColors(list) : {};

  results.className = "results-grid";
  results.innerHTML = "";
  if (list.length === 0) {
    results.innerHTML = `<p class="empty">Try broadening your search or resetting the filters.</p>`;
    return;
  }

  if (isProductView) {
    // Same card layout as the company list: one label per matching offering,
    // three per row, with description upfront and detail/company access from
    // this very view (no accordion — a company never offers more than one
    // product per category).
    list.forEach(c => {
      c.products.filter(p => p.type === explore.type).forEach(p => {
        results.appendChild(productLabelCard(c, p));
      });
    });
  } else {
    // One anonymous company label per supplier.
    list.forEach(c => results.appendChild(companyLabelCard(c, tieColors[relevanceKey(c)] || null)));
  }
}

// Anonymous company label — the default list card. No sovereignty content:
// just the anonymised name, origin, keywords and a plain-language description.
// The whole card opens the company's sovereignty profile.
function companyLabelCard(company, tieColor) {
  const card = el("article", "card company-card");
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");

  if (tieColor) {
    card.style.borderTopColor = tieColor;
    const badge = el("div", "tie-badge");
    badge.style.setProperty("--tie-color", tieColor);
    badge.innerHTML = `<span class="tie-dot"></span>Ex æquo — equal ranking`;
    card.appendChild(badge);
  }

  card.appendChild(el("h3", "card-title", escapeHtml(companyLabel(company))));

  const meta = el("div", "card-meta");
  meta.innerHTML = `
    <span class="pill">${escapeHtml(company.countryCode || "")} · ${escapeHtml(company.country || "")}</span>
    <span class="card-sector">${escapeHtml(company.sector || "")}</span>`;
  card.appendChild(meta);

  card.appendChild(el("p", "card-desc", escapeHtml(company.description || "")));
  card.appendChild(el("div", "card-cta", "View sovereignty profile →"));

  const open = () => showCompanyDetail(company);
  card.addEventListener("click", open);
  card.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
  });
  return card;
}

// Product/service label card — used in the base list once a specific "Service
// type" filter is active. Same layout as companyLabelCard (label, meta,
// description, three per row), but since a product isn't a whole company it
// offers two direct actions instead of a single click-through: expand in
// place to see the sovereignty detail, or jump straight to the company page.
function productLabelCard(company, product) {
  const schemaKey = PRODUCT_TYPES[product.type].schema;
  const assess = computeAssessment(schemaKey, product.answers);

  const card = el("article", "card product-card");

  const titleText = `${companyLabel(company)} · ${productLabel(company, product)}`;
  card.appendChild(el("h3", "card-title", escapeHtml(titleText)));

  const meta = el("div", "card-meta");
  meta.innerHTML = `
    <span class="pill">${escapeHtml(company.countryCode || "")} · ${escapeHtml(company.country || "")}</span>
    <span class="card-sector">${escapeHtml(product.type)}</span>`;
  card.appendChild(meta);

  card.appendChild(el("p", "card-desc", escapeHtml(product.description || "")));

  const actions = el("div", "card-actions");
  const expandBtn = el("button", "btn btn-outline btn-sm");
  expandBtn.type = "button";
  expandBtn.textContent = "View sovereignty details";
  const companyBtn = el("button", "btn btn-ghost btn-sm");
  companyBtn.type = "button";
  companyBtn.textContent = "View company page →";
  companyBtn.addEventListener("click", () => showCompanyDetail(company));
  actions.appendChild(expandBtn);
  actions.appendChild(companyBtn);
  card.appendChild(actions);

  const panel = el("div", "card-detail-panel");
  panel.hidden = true;
  panel.innerHTML = `
    <div class="sov-eyebrow">Sovereignty assessment</div>
    <p class="sov-text">${escapeHtml(product.comment)}</p>
    ${assessmentBody(assess, { fill: "#1F6FB2", size: 260, labelSpace: 78, short: true })}`;
  const qBtn = el("button", "btn btn-outline");
  qBtn.type = "button";
  qBtn.textContent = "View questionnaire";
  qBtn.addEventListener("click", () => openQuestionnaire(
    productLabel(company, product) + " — " + product.type, SCHEMAS[schemaKey].label, schemaKey, product.answers));
  panel.appendChild(qBtn);
  card.appendChild(panel);

  expandBtn.addEventListener("click", () => {
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    expandBtn.textContent = willOpen ? "Hide sovereignty details" : "View sovereignty details";
    card.classList.toggle("expanded", willOpen);
  });

  return card;
}

// Expandable product/service label used on the company detail page: label +
// type + description collapsed, sovereignty commentary + radar + questionnaire
// once expanded.
function productAccordion(company, product) {
  const schemaKey = PRODUCT_TYPES[product.type].schema;
  const assess = computeAssessment(schemaKey, product.answers);

  const item = el("div", "accordion");
  const head = el("button", "accordion-head");
  head.type = "button";
  head.setAttribute("aria-expanded", "false");

  head.innerHTML = `
    <span class="chevron" aria-hidden="true"></span>
    <span class="accordion-main">
      <span class="accordion-name">${escapeHtml(productLabel(company, product))}</span>
      <span class="accordion-desc">${escapeHtml(product.description || "")}</span>
    </span>
    <span class="type-tag">${escapeHtml(product.type)}</span>`;

  const panel = el("div", "accordion-panel");
  panel.hidden = true;
  panel.innerHTML = `
    <div class="sov-eyebrow">Sovereignty assessment</div>
    <p class="sov-text">${escapeHtml(product.comment)}</p>
    ${assessmentBody(assess, { fill: "#1F6FB2", size: 280, labelSpace: 82, short: true })}`;

  const actions = el("div", "panel-actions");
  const qBtn = el("button", "btn btn-outline");
  qBtn.type = "button";
  qBtn.textContent = "View questionnaire";
  qBtn.addEventListener("click", e => {
    e.stopPropagation();
    openQuestionnaire(productLabel(company, product) + " — " + product.type, SCHEMAS[schemaKey].label, schemaKey, product.answers);
  });
  actions.appendChild(qBtn);
  panel.appendChild(actions);

  head.addEventListener("click", () => {
    const open = head.getAttribute("aria-expanded") === "true";
    head.setAttribute("aria-expanded", String(!open));
    panel.hidden = open;
    item.classList.toggle("open", !open);
  });

  item.appendChild(head);
  item.appendChild(panel);
  return item;
}

// ---------------------------------------------------------------------------
// Company detail page
// ---------------------------------------------------------------------------
function renderCompanyDetail(company) {
  const root = document.getElementById("company-detail");
  if (!root) return;
  const lvl = governanceLevel(company);
  const structAssess = computeAssessment("structural", company.structural.answers);
  root.innerHTML = "";

  // Header — anonymised identity + plain-language description (no sovereignty).
  const header = el("div", "detail-header");
  header.innerHTML = `
    <h2 class="detail-title">${escapeHtml(companyLabel(company))}</h2>
    <div class="card-meta">
      <span class="pill">${escapeHtml(company.countryCode || "")} · ${escapeHtml(company.country || "")}</span>
      <span class="card-sector">${escapeHtml(company.sector || "")}</span>
    </div>
    <p class="detail-desc">${escapeHtml(company.description || "")}</p>`;
  root.appendChild(header);

  // Structural sovereignty section.
  const sec = el("section", "detail-section");
  sec.innerHTML = `
    <h3 class="detail-section-title">Structural sovereignty</h3>
    <div class="eval-explainer">
      <p>This assessment looks at the <strong>company as a whole</strong>, independently of any product. It is built from a questionnaire covering three areas — European footprint (ownership, governance and where value is created), independence from extraterritorial law, and research &amp; open-source involvement.</p>
      <p>Each answer is graded on a 0–2 sovereignty scale; the profile below reflects those answers. Figures are intentionally not shown — the aim is to compare postures, not to publish a score.</p>
    </div>
    <div class="gov-line">
      <span class="gov-label">European governance</span>
      <span class="gov-band ${governanceClass(lvl)}">${governanceLabel(lvl)} EU-held</span>
    </div>`;

  const radarWrap = el("div", "detail-radar");
  radarWrap.innerHTML = assessmentBody(structAssess, { fill: "#004494", size: 300, labelSpace: 84, short: false });
  sec.appendChild(radarWrap);

  const sov = el("p", "sov-text");
  sov.textContent = company.structural.comment;
  sec.appendChild(sov);

  const qBtn = el("button", "btn btn-outline");
  qBtn.type = "button";
  qBtn.textContent = "View structural questionnaire";
  qBtn.addEventListener("click", () =>
    openQuestionnaire(companyLabel(company), "Structural Sovereignty", "structural", company.structural.answers));
  sec.appendChild(qBtn);
  root.appendChild(sec);

  // Products & services section.
  const psec = el("section", "detail-section");
  psec.innerHTML = `
    <h3 class="detail-section-title">Products &amp; services (${company.products.length})</h3>
    <p class="detail-section-intro">Expand an offering to see its sovereignty profile. Each product is assessed with a questionnaire tailored to its category.</p>`;
  if (!company.products.length) {
    psec.appendChild(el("p", "muted-note", "No product or service declared yet."));
  }
  company.products.forEach(p => psec.appendChild(productAccordion(company, p)));
  root.appendChild(psec);
}
