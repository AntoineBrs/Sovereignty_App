// ============================================================================
// Explore view — anonymised search, filters, company cards, product accordion
// ----------------------------------------------------------------------------
// Cards are anonymous: no company or product names, no numeric sovereignty
// scores. The structural block shows country, sector, European-governance band
// and a comment. Products keep the radar chart (visual only) plus a comment.
// Ranking is driven purely by the selected criteria: each criterion is the sum
// of its questionnaire answer levels (0/1/2); several criteria are averaged.
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
// `desc` feeds the on-chip "i" tooltip.
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
  renderSortCats();
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
// - "Company only" → only structural criteria are allowed (product criteria
//   make no sense without a specific product/service selected).
// - A specific product type (e.g. SaaS) → structural criteria remain allowed
//   (the company's structural answers still apply), PLUS only the product
//   criteria whose theme actually exists in that product type's schema — this
//   is what keeps "Technological Independence" unavailable for Agency/Service,
//   since the agency_service schema has no such theme. This does not work in
//   reverse: "Company only" still excludes all product criteria.
// - "All types" → every criterion is allowed.
function isCriterionAllowed(cat) {
  if (explore.type === "company") return cat.scope === "structural";
  if (explore.type === "all") return true;
  if (cat.scope === "structural") return true;
  const schemaKey = PRODUCT_TYPES[explore.type] && PRODUCT_TYPES[explore.type].schema;
  const schema = schemaKey && SCHEMAS[schemaKey];
  if (!schema) return false;
  return schema.themes.some(t => cat.themes.includes(t.name));
}

// Drop any selected criteria that fall outside what's now allowed by the
// "Service type" filter (e.g. switching to "Company only" clears product ones,
// switching to "Agency" clears "Technological Independence").
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
    renderSortCats();
    renderExplore();
  });
  document.getElementById("filter-gov").addEventListener("change", e => { explore.gov = e.target.value; renderExplore(); });
  document.getElementById("reset-filters").addEventListener("click", () => {
    Object.assign(explore, { query: "", country: "all", type: "all", gov: "all", sortCats: [] });
    document.getElementById("search").value = "";
    ["country", "type", "gov"].forEach(k => document.getElementById("filter-" + k).value = "all");
    renderSortCats();
    renderExplore();
  });

  document.getElementById("add-sort-cat").addEventListener("click", e => {
    e.stopPropagation();
    toggleCriteriaHelp(false);
    toggleSortCatMenu();
  });
  // Close the add-criterion menu when clicking outside it.
  document.addEventListener("click", e => {
    const wrap = document.querySelector(".sort-cats-add-wrap");
    if (wrap && !wrap.contains(e.target)) toggleSortCatMenu(false);
  });

  document.getElementById("sort-cats-help").addEventListener("click", e => {
    e.stopPropagation();
    toggleSortCatMenu(false);
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
  return (explore.type !== "all" && explore.type !== "company")
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

function addSortCat(id) {
  if (explore.sortCats.length >= MAX_SORT_CATS) return;
  if (explore.sortCats.includes(id)) return;
  const cat = SORT_CATEGORIES.find(c => c.id === id);
  if (!cat || !isCriterionAllowed(cat)) return;
  explore.sortCats.push(id);
  renderSortCats();
  renderExplore();
}

function removeSortCat(id) {
  explore.sortCats = explore.sortCats.filter(x => x !== id);
  renderSortCats();
  renderExplore();
}

function toggleSortCatMenu(force) {
  const menu = document.getElementById("sort-cat-menu");
  if (!menu) return;
  const show = force != null ? force : menu.hidden;
  if (show) renderSortCatMenu();
  menu.hidden = !show;
}

function renderSortCatMenu() {
  const menu = document.getElementById("sort-cat-menu");
  if (!menu) return;
  menu.innerHTML = "";
  const used = new Set(explore.sortCats);
  let available = SORT_CATEGORIES.filter(c => !used.has(c.id) && isCriterionAllowed(c));
  if (!available.length) {
    menu.appendChild(el("div", "sort-cat-menu-empty", "All criteria added"));
    return;
  }
  SORT_CAT_GROUPS.forEach(g => {
    const items = available.filter(c => c.scope === g.key);
    if (!items.length) return;
    menu.appendChild(el("div", "sort-cat-menu-group", g.title));
    items.forEach(c => {
      const b = el("button", "sort-cat-menu-item", escapeHtml(c.label));
      b.type = "button";
      b.addEventListener("click", () => { addSortCat(c.id); toggleSortCatMenu(false); });
      menu.appendChild(b);
    });
  });
}

function renderSortCats() {
  const wrap = document.getElementById("sort-cats-chips");
  if (!wrap) return;
  wrap.innerHTML = "";

  explore.sortCats.forEach(id => {
    const cat = SORT_CATEGORIES.find(c => c.id === id);
    if (!cat) return;

    const chip = el("div", "sort-chip");
    chip.dataset.id = id;
    chip.appendChild(el("span", "sort-chip-label", escapeHtml(cat.label)));

    // "i" affordance: hovering reveals the criterion description and states
    // that the ranking is based on the questionnaire answers.
    const info = el("span", "sort-chip-info", "i");
    info.title = cat.desc + " Ranking is based on the questionnaire answers.";
    info.setAttribute("aria-label", info.title);
    chip.appendChild(info);

    const remove = el("button", "sort-chip-remove", "&times;");
    remove.type = "button";
    remove.title = "Remove criterion";
    remove.addEventListener("click", () => removeSortCat(id));
    chip.appendChild(remove);

    wrap.appendChild(chip);
  });

  const addBtn = document.getElementById("add-sort-cat");
  if (addBtn) addBtn.disabled = explore.sortCats.length >= MAX_SORT_CATS;

  syncTypeFilterAvailability();
}

function hasProductCriterion() {
  return explore.sortCats.some(id => {
    const cat = SORT_CATEGORIES.find(c => c.id === id);
    return cat && cat.scope === "product";
  });
}

// A product-scoped criterion (Security & Encryption, Data Location &
// Control...) only makes sense while product data stays visible, so the
// "Company only" service-type option is disabled while one is selected.
function syncTypeFilterAvailability() {
  const sel = document.getElementById("filter-type");
  if (!sel) return;
  const companyOpt = sel.querySelector('option[value="company"]');
  if (companyOpt) companyOpt.disabled = hasProductCriterion();
}

// ---------------------------------------------------------------------------
// Filtering & rendering
// ---------------------------------------------------------------------------
function filteredCompanies() {
  let list = APP.companies.filter(c => {
    if (explore.query) {
      const hay = [c.sector, c.country, ...c.products.map(p => p.type)]
        .join(" ").toLowerCase();
      if (!hay.includes(explore.query)) return false;
    }
    if (explore.country !== "all" && c.country !== explore.country) return false;
    // "company" shows every company (structural view only); a product type
    // keeps only companies that offer a matching product/service.
    if (explore.type !== "all" && explore.type !== "company" && !c.products.some(p => p.type === explore.type)) return false;
    if (explore.gov !== "all" && String(governanceLevel(c)) !== explore.gov) return false;
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

function renderExplore() {
  const list = filteredCompanies();
  const results = document.getElementById("results");
  document.getElementById("result-count").textContent =
    list.length === 0 ? "No supplier matches your criteria."
                      : `${list.length} supplier${list.length > 1 ? "s" : ""} found`;

  const sortNote = document.getElementById("result-sort-note");
  if (sortNote) sortNote.hidden = explore.sortCats.length === 0;

  // Identify tied ranks (only meaningful when criteria are active).
  const tieColors = explore.sortCats.length > 0 ? computeTieColors(list) : {};

  results.innerHTML = "";
  if (list.length === 0) {
    results.innerHTML = `<p class="empty">Try broadening your search or resetting the filters.</p>`;
    return;
  }
  list.forEach(c => {
    results.appendChild(companyCard(c, tieColors[relevanceKey(c)] || null));
  });
}

function companyCard(company, tieColor) {
  // Service type filter drives what the card shows:
  //  - "all"                : structural block + all products (accordion list)
  //  - "company"             : structural block only, products hidden
  //  - a product type value  : structural identity (country + sector) plus
  //                            that single matching product, shown directly
  //                            (no accordion — a company never offers more
  //                            than one product per category).
  const mode = explore.type;
  const showStructural = mode === "all" || mode === "company";
  const showProducts = mode !== "company";
  const isProductOnly = mode !== "all" && mode !== "company";
  const productsToShow = isProductOnly
    ? company.products.filter(p => p.type === mode)
    : company.products;

  const card = el("article", "card");

  if (tieColor) {
    card.style.borderTopColor = tieColor;
    const badge = el("div", "tie-badge");
    badge.style.setProperty("--tie-color", tieColor);
    badge.innerHTML = `<span class="tie-dot"></span>Ex æquo — equal ranking`;
    card.appendChild(badge);
  }

  if (showStructural) {
    const lvl = governanceLevel(company);
    const struct = el("div", "assess");
    struct.innerHTML = `
      <div class="card-meta">
        <span class="pill">${escapeHtml(company.countryCode || "")} · ${escapeHtml(company.country || "")}</span>
        <span class="card-sector">${escapeHtml(company.sector || "")}</span>
      </div>
      <div class="gov-line">
        <span class="gov-label">European governance</span>
        <span class="gov-band ${governanceClass(lvl)}">${governanceLabel(lvl)} EU-held</span>
      </div>
      <p class="comment">${escapeHtml(company.structural.comment)}</p>`;
    card.appendChild(struct);

    const qBtn = el("button", "btn btn-outline");
    qBtn.textContent = "View questionnaire";
    qBtn.addEventListener("click", () =>
      openQuestionnaire(company.sector || "Company", "Structural Sovereignty", "structural", company.structural.answers));
    card.appendChild(qBtn);
  } else if (isProductOnly) {
    // Minimal identity header (country + sector), no governance/comment —
    // those belong to the structural block only.
    const meta = el("div", "card-meta");
    meta.innerHTML = `
      <span class="pill">${escapeHtml(company.countryCode || "")} · ${escapeHtml(company.country || "")}</span>
      <span class="card-sector">${escapeHtml(company.sector || "")}</span>`;
    card.appendChild(meta);
  }

  if (showProducts) {
    if (isProductOnly) {
      if (productsToShow.length === 0) {
        card.appendChild(el("p", "muted-note", "No product or service declared yet."));
      }
      productsToShow.forEach(p => card.appendChild(productBlock(company, p)));
    } else {
      const prodWrap = el("div", "products");
      prodWrap.innerHTML = `<div class="products-title">Products &amp; services (${productsToShow.length})</div>`;
      if (productsToShow.length === 0) {
        prodWrap.appendChild(el("p", "muted-note", "No product or service declared yet."));
      }
      productsToShow.forEach(p => prodWrap.appendChild(productAccordionItem(company, p)));
      card.appendChild(prodWrap);
    }
  }

  return card;
}

// Product shown directly, no accordion — used when the "Service type" filter
// narrows the view to a single product/service category (type title, radar,
// comment, questionnaire button).
function productBlock(company, product) {
  const schemaKey = PRODUCT_TYPES[product.type].schema;
  const assess = computeAssessment(schemaKey, product.answers);

  const wrap = el("div", "assess");
  wrap.innerHTML = `<div class="products-title">${escapeHtml(product.type)}</div>
    ${assessmentBody(assess, { fill: "#1F6FB2", size: 280, labelSpace: 82, short: true })}
    <p class="comment">${escapeHtml(product.comment)}</p>`;
  const btn = el("button", "btn btn-outline");
  btn.textContent = "View questionnaire";
  btn.addEventListener("click", () => openQuestionnaire(
    product.type, SCHEMAS[schemaKey].label, schemaKey, product.answers));
  wrap.appendChild(btn);
  return wrap;
}

// Product shown collapsed inside an accordion — used in the "all types" view,
// where a company's several products/services are listed together.
function productAccordionItem(company, product) {
  const schemaKey = PRODUCT_TYPES[product.type].schema;
  const assess = computeAssessment(schemaKey, product.answers);

  const item = el("div", "accordion");
  const btn = el("button", "accordion-head");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = `
    <span class="chevron" aria-hidden="true"></span>
    <span class="accordion-name">${escapeHtml(product.type)}</span>`;

  const panel = el("div", "accordion-panel");
  panel.hidden = true;
  panel.innerHTML = `${assessmentBody(assess, { fill: "#1F6FB2", size: 280, labelSpace: 82, short: true })}
    <p class="comment">${escapeHtml(product.comment)}</p>`;
  const pBtn = el("button", "btn btn-outline");
  pBtn.textContent = "View questionnaire";
  pBtn.addEventListener("click", () => openQuestionnaire(
    product.type, SCHEMAS[schemaKey].label, schemaKey, product.answers));
  panel.appendChild(pBtn);

  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    panel.hidden = open;
    item.classList.toggle("open", !open);
  });

  item.appendChild(btn);
  item.appendChild(panel);
  return item;
}
