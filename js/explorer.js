// ============================================================================
// Explore view — search, filter, company cards, product accordion
// ============================================================================

const explore = {
  query: "", country: "all", type: "all", minTier: "all", sort: "score_desc",
  sortCats: [],   // [{ id, weight }] — weighted multi-criteria ranking (max 8)
  bound: false
};

const MAX_SORT_CATS = 8;

// Canonical sort criteria = the 9 sovereignty sub-categories (schema themes).
// `scope` selects where the score comes from; `themes` lists the theme name(s)
// that map to this criterion (Security is named differently across schemas).
const SORT_CATEGORIES = [
  { id: "eu_footprint",     label: "European Footprint",                  scope: "structural", themes: ["European Footprint"] },
  { id: "extraterritorial", label: "Independence from Extraterritorial Law", scope: "structural", themes: ["Independence from Extraterritorial Law"] },
  { id: "research_oss",     label: "Research & Open Source",              scope: "structural", themes: ["Research & Open Source"] },
  { id: "legal",            label: "Legal Framework & Compliance",        scope: "product",    themes: ["Legal Framework & Compliance"] },
  { id: "data_control",     label: "Data Location & Control",             scope: "product",    themes: ["Data Location & Control"] },
  { id: "security",         label: "Security & Encryption",               scope: "product",    themes: ["Security & Encryption", "Security"] },
  { id: "tech_indep",       label: "Technological Independence",          scope: "product",    themes: ["Technological Independence"] },
  { id: "transparency",     label: "Transparency & Audit",                scope: "product",    themes: ["Transparency & Audit"] },
  { id: "reversibility",    label: "Reversibility & Exit",                scope: "product",    themes: ["Reversibility & Exit"] }
];

const SORT_CAT_GROUPS = [
  { key: "structural", title: "Company (structural)" },
  { key: "product",    title: "Products & services" }
];

const GAUGE_ICON = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">' +
  '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
  '<circle cx="15" cy="6" r="2" fill="#fff" stroke="currentColor" stroke-width="1.8"/>' +
  '<circle cx="9" cy="12" r="2" fill="#fff" stroke="currentColor" stroke-width="1.8"/>' +
  '<circle cx="17" cy="18" r="2" fill="#fff" stroke="currentColor" stroke-width="1.8"/></svg>';

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

  const typeSel = document.getElementById("filter-type");
  typeSel.length = 1;
  Object.keys(PRODUCT_TYPES).forEach(t => typeSel.add(new Option(t, t)));
}

function bindExploreControls() {
  document.getElementById("search").addEventListener("input", e => { explore.query = e.target.value.trim().toLowerCase(); renderExplore(); });
  document.getElementById("filter-country").addEventListener("change", e => { explore.country = e.target.value; renderExplore(); });
  document.getElementById("filter-type").addEventListener("change", e => { explore.type = e.target.value; renderExplore(); });
  document.getElementById("filter-tier").addEventListener("change", e => { explore.minTier = e.target.value; renderExplore(); });
  document.getElementById("filter-sort").addEventListener("change", e => { explore.sort = e.target.value; renderExplore(); });
  document.getElementById("reset-filters").addEventListener("click", () => {
    Object.assign(explore, { query: "", country: "all", type: "all", minTier: "all", sort: "score_desc", sortCats: [] });
    document.getElementById("search").value = "";
    ["country", "type", "tier"].forEach(k => document.getElementById("filter-" + k).value = "all");
    document.getElementById("filter-sort").value = "score_desc";
    renderSortCats();
    renderExplore();
  });

  document.getElementById("add-sort-cat").addEventListener("click", e => {
    e.stopPropagation();
    toggleSortCatMenu();
  });
  // Close the add-criterion menu when clicking outside it.
  document.addEventListener("click", e => {
    const wrap = document.querySelector(".sort-cats-add-wrap");
    if (wrap && !wrap.contains(e.target)) toggleSortCatMenu(false);
  });
}

// ---------------------------------------------------------------------------
// Multi-criteria weighted ranking
// ---------------------------------------------------------------------------

// Score of a company for one criterion (0-100), or null when not applicable.
function categoryScore(company, cat) {
  if (cat.scope === "structural") {
    const assess = computeAssessment("structural", company.structural.answers, APP.weights);
    const theme = assess.themes.find(t => cat.themes.includes(t.name));
    return theme ? theme.score : null;
  }
  // Product scope: average the matching theme across all of the company's products.
  const scores = [];
  company.products.forEach(p => {
    const schemaKey = PRODUCT_TYPES[p.type] && PRODUCT_TYPES[p.type].schema;
    if (!schemaKey) return;
    const assess = computeAssessment(schemaKey, p.answers, APP.weights);
    const theme = assess.themes.find(t => cat.themes.includes(t.name));
    if (theme) scores.push(theme.score);
  });
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// Weighted average of the selected criteria (missing criterion counts as 0).
function relevanceScore(company) {
  let num = 0, den = 0;
  explore.sortCats.forEach(sc => {
    const cat = SORT_CATEGORIES.find(c => c.id === sc.id);
    if (!cat) return;
    const s = categoryScore(company, cat);
    num += (s == null ? 0 : s) * sc.weight;
    den += sc.weight;
  });
  return den ? num / den : 0;
}

function addSortCat(id) {
  if (explore.sortCats.length >= MAX_SORT_CATS) return;
  if (explore.sortCats.some(s => s.id === id)) return;
  explore.sortCats.push({ id, weight: 1 });
  renderSortCats();
  renderExplore();
}

function removeSortCat(id) {
  explore.sortCats = explore.sortCats.filter(s => s.id !== id);
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
  const used = new Set(explore.sortCats.map(s => s.id));
  const available = SORT_CATEGORIES.filter(c => !used.has(c.id));
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

// Update (or add/remove) the small ×N badge next to a chip label.
function updateChipWeightBadge(chip, weight) {
  let badge = chip.querySelector(".sort-chip-weight");
  if (weight > 1) {
    if (!badge) {
      badge = el("span", "sort-chip-weight", "×" + weight);
      chip.querySelector(".sort-chip-label").after(badge);
    } else {
      badge.textContent = "×" + weight;
    }
  } else if (badge) {
    badge.remove();
  }
}

function renderSortCats() {
  const wrap = document.getElementById("sort-cats-chips");
  if (!wrap) return;
  wrap.innerHTML = "";

  explore.sortCats.forEach(sc => {
    const cat = SORT_CATEGORIES.find(c => c.id === sc.id);
    if (!cat) return;

    const chip = el("div", "sort-chip");
    chip.dataset.id = sc.id;
    chip.appendChild(el("span", "sort-chip-label", escapeHtml(cat.label)));
    if (sc.weight > 1) chip.appendChild(el("span", "sort-chip-weight", "×" + sc.weight));

    const edit = el("button", "sort-chip-edit", GAUGE_ICON);
    edit.type = "button";
    edit.title = "Adjust importance";

    const remove = el("button", "sort-chip-remove", "&times;");
    remove.type = "button";
    remove.title = "Remove criterion";
    remove.addEventListener("click", () => removeSortCat(sc.id));

    chip.appendChild(edit);
    chip.appendChild(remove);

    // Importance gauge (weight 1-5), hidden until the edit icon is toggled.
    const gauge = el("div", "sort-chip-gauge");
    gauge.hidden = true;
    gauge.appendChild(el("span", "sort-chip-gauge-label", "Importance"));
    const range = el("input", "sort-chip-range");
    range.type = "range"; range.min = "1"; range.max = "5"; range.step = "1";
    range.value = String(sc.weight);
    const gv = el("span", "sort-chip-gauge-val", "×" + sc.weight);
    range.addEventListener("input", () => {
      sc.weight = parseInt(range.value, 10) || 1;
      gv.textContent = "×" + sc.weight;
      updateChipWeightBadge(chip, sc.weight);
      renderExplore();
    });
    gauge.appendChild(range);
    gauge.appendChild(gv);
    chip.appendChild(gauge);

    edit.addEventListener("click", () => {
      gauge.hidden = !gauge.hidden;
      chip.classList.toggle("editing", !gauge.hidden);
    });

    wrap.appendChild(chip);
  });

  const addBtn = document.getElementById("add-sort-cat");
  if (addBtn) addBtn.disabled = explore.sortCats.length >= MAX_SORT_CATS;
}

function structuralScore(company) {
  return computeAssessment("structural", company.structural.answers, APP.weights).overall;
}

function filteredCompanies() {
  const minMap = { all: -1, low: 25, medium: 50, high: 75 };
  const minScore = minMap[explore.minTier];

  let list = APP.companies.filter(c => {
    if (explore.query) {
      const hay = [c.name, c.sector, c.country, ...c.products.map(p => p.name), ...c.products.map(p => p.type)]
        .join(" ").toLowerCase();
      if (!hay.includes(explore.query)) return false;
    }
    if (explore.country !== "all" && c.country !== explore.country) return false;
    if (explore.type !== "all" && !c.products.some(p => p.type === explore.type)) return false;
    if (structuralScore(c) < minScore) return false;
    return true;
  });

  // When criteria are selected, they drive the ranking (overriding "Sort by");
  // ties fall back to structural sovereignty so the order stays stable.
  if (explore.sortCats.length > 0) {
    list.sort((a, b) => {
      const diff = relevanceScore(b) - relevanceScore(a);
      return diff !== 0 ? diff : structuralScore(b) - structuralScore(a);
    });
    return list;
  }

  list.sort((a, b) => {
    if (explore.sort === "name_asc") return a.name.localeCompare(b.name);
    const sa = structuralScore(a), sb = structuralScore(b);
    return explore.sort === "score_asc" ? sa - sb : sb - sa;
  });
  return list;
}

function renderExplore() {
  const list = filteredCompanies();
  const results = document.getElementById("results");
  document.getElementById("result-count").textContent =
    list.length === 0 ? "No supplier matches your criteria."
                      : `${list.length} supplier${list.length > 1 ? "s" : ""} found`;

  // Show a marker when custom priorities are active.
  const hasWeights = APP.weights && Object.keys(APP.weights).length > 0 &&
    Object.values(APP.weights).some(w => (w.domains || []).some(x => x !== 1) ||
      (w.questions || []).some(arr => (arr || []).some(x => x !== 1)));
  document.getElementById("weights-active").hidden = !hasWeights;

  results.innerHTML = "";
  if (list.length === 0) {
    results.innerHTML = `<p class="empty">Try broadening your search or resetting the filters.</p>`;
    return;
  }
  list.forEach(c => results.appendChild(companyCard(c)));
}

function companyCard(company) {
  const assess = computeAssessment("structural", company.structural.answers, APP.weights);
  const tier = scoreTier(assess.overall);
  const card = el("article", "card");

  const header = el("div", "card-head");
  header.innerHTML = `
    <div class="logo" style="background:${company.color}">${escapeHtml(company.initials)}</div>
    <div class="card-head-main">
      <h2 class="card-title">${escapeHtml(company.name)}</h2>
      <div class="card-meta">
        <span class="pill">${escapeHtml(company.countryCode || "")} · ${escapeHtml(company.country || "")}</span>
        <span class="card-sector">${escapeHtml(company.sector || "")}</span>
      </div>
    </div>
    ${scoreBadge(assess.overall, tier)}`;
  card.appendChild(header);

  const struct = el("div", "assess");
  struct.innerHTML = `<div class="assess-title">Structural sovereignty</div>
    ${assessmentBody(assess, { fill: "#004494", size: 260 })}
    <p class="comment">${escapeHtml(company.structural.comment)}</p>`;
  card.appendChild(struct);

  const qBtn = el("button", "btn btn-outline");
  qBtn.textContent = "View questionnaire";
  qBtn.addEventListener("click", () => openQuestionnaire(company.name, "Structural Sovereignty", "structural", company.structural.answers));
  card.appendChild(qBtn);

  const prodWrap = el("div", "products");
  prodWrap.innerHTML = `<div class="products-title">Products &amp; services (${company.products.length})</div>`;
  if (company.products.length === 0) {
    prodWrap.appendChild(el("p", "muted-note", "No product or service declared yet."));
  }
  company.products.forEach(p => prodWrap.appendChild(productItem(company, p)));
  card.appendChild(prodWrap);

  return card;
}

function productItem(company, product) {
  const schemaKey = PRODUCT_TYPES[product.type].schema;
  const assess = computeAssessment(schemaKey, product.answers, APP.weights);
  const tier = scoreTier(assess.overall);

  const item = el("div", "accordion");
  const btn = el("button", "accordion-head");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = `
    <span class="chevron" aria-hidden="true"></span>
    <span class="accordion-name">${escapeHtml(product.name)}</span>
    <span class="type-tag">${escapeHtml(product.type)}</span>
    ${scoreBadge(assess.overall, tier, true)}`;

  const panel = el("div", "accordion-panel");
  panel.hidden = true;
  panel.innerHTML = `${assessmentBody(assess, { fill: "#1F6FB2", size: 280, labelSpace: 82, short: true })}
    <p class="comment">${escapeHtml(product.comment)}</p>`;
  const pBtn = el("button", "btn btn-outline");
  pBtn.textContent = "View questionnaire";
  pBtn.addEventListener("click", () => openQuestionnaire(
    `${company.name} — ${product.name}`, SCHEMAS[schemaKey].label, schemaKey, product.answers));
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
