// ============================================================================
// Explore view — search, filter, company cards, product accordion
// ============================================================================

const explore = {
  query: "", country: "all", type: "all", minTier: "all", sort: "score_desc",
  bound: false
};

function initExplore() {
  if (explore.bound) return;
  buildExploreFilters();
  bindExploreControls();
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
    Object.assign(explore, { query: "", country: "all", type: "all", minTier: "all", sort: "score_desc" });
    document.getElementById("search").value = "";
    ["country", "type", "tier"].forEach(k => document.getElementById("filter-" + k).value = "all");
    document.getElementById("filter-sort").value = "score_desc";
    renderExplore();
  });
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
