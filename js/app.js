// ============================================================================
// Sovereignty Explorer — application logic
// ============================================================================

const state = {
  query: "",
  country: "all",
  type: "all",
  minTier: "all",
  sort: "score_desc"
};

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  buildFilters();
  bindControls();
  render();
});

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------
function buildFilters() {
  const countries = Array.from(new Set(COMPANIES.map(c => c.country))).sort();
  const countrySel = document.getElementById("filter-country");
  countries.forEach(c => countrySel.add(new Option(c, c)));

  const types = Object.keys(PRODUCT_TYPES);
  const typeSel = document.getElementById("filter-type");
  types.forEach(t => typeSel.add(new Option(t, t)));
}

function bindControls() {
  const search = document.getElementById("search");
  search.addEventListener("input", e => { state.query = e.target.value.trim().toLowerCase(); render(); });

  document.getElementById("filter-country").addEventListener("change", e => { state.country = e.target.value; render(); });
  document.getElementById("filter-type").addEventListener("change", e => { state.type = e.target.value; render(); });
  document.getElementById("filter-tier").addEventListener("change", e => { state.minTier = e.target.value; render(); });
  document.getElementById("filter-sort").addEventListener("change", e => { state.sort = e.target.value; render(); });

  document.getElementById("reset-filters").addEventListener("click", () => {
    state.query = ""; state.country = "all"; state.type = "all"; state.minTier = "all"; state.sort = "score_desc";
    document.getElementById("search").value = "";
    document.getElementById("filter-country").value = "all";
    document.getElementById("filter-type").value = "all";
    document.getElementById("filter-tier").value = "all";
    document.getElementById("filter-sort").value = "score_desc";
    render();
  });

  // Modal close handlers.
  document.getElementById("modal-backdrop").addEventListener("click", closeModal);
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
}

// ---------------------------------------------------------------------------
// Filtering & sorting
// ---------------------------------------------------------------------------
function structuralScore(company) {
  return computeAssessment("structural", company.structural.answers).overall;
}

function filterCompanies() {
  const minMap = { all: -1, low: 25, medium: 50, high: 75 };
  const minScore = minMap[state.minTier];

  let list = COMPANIES.filter(c => {
    // Text search across company + product names + sector.
    if (state.query) {
      const hay = [c.name, c.sector, c.country, ...c.products.map(p => p.name), ...c.products.map(p => p.type)]
        .join(" ").toLowerCase();
      if (!hay.includes(state.query)) return false;
    }
    if (state.country !== "all" && c.country !== state.country) return false;
    if (state.type !== "all" && !c.products.some(p => p.type === state.type)) return false;
    if (structuralScore(c) < minScore) return false;
    return true;
  });

  list.sort((a, b) => {
    if (state.sort === "name_asc") return a.name.localeCompare(b.name);
    const sa = structuralScore(a), sb = structuralScore(b);
    return state.sort === "score_asc" ? sa - sb : sb - sa;
  });
  return list;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function render() {
  const list = filterCompanies();
  const results = document.getElementById("results");
  const count = document.getElementById("result-count");

  count.textContent = list.length === 0
    ? "No supplier matches your criteria."
    : `${list.length} supplier${list.length > 1 ? "s" : ""} found`;

  results.innerHTML = "";
  if (list.length === 0) {
    results.innerHTML = `<p class="empty">Try broadening your search or resetting the filters.</p>`;
    return;
  }
  list.forEach(c => results.appendChild(companyCard(c)));
}

function companyCard(company) {
  const assess = computeAssessment("structural", company.structural.answers);
  const tier = scoreTier(assess.overall);

  const card = el("article", "card");

  // ---- Header ----
  const header = el("div", "card-head");
  header.innerHTML = `
    <div class="logo" style="background:${company.color}">${escapeHtml(company.initials)}</div>
    <div class="card-head-main">
      <h2 class="card-title">${escapeHtml(company.name)}</h2>
      <div class="card-meta">
        <span class="pill">${escapeHtml(company.countryCode)} · ${escapeHtml(company.country)}</span>
        <span class="card-sector">${escapeHtml(company.sector)}</span>
      </div>
    </div>
    ${scoreBadge(assess.overall, tier)}
  `;
  card.appendChild(header);

  // ---- Structural assessment (radar + detail) ----
  const struct = el("div", "assess");
  struct.innerHTML = `
    <div class="assess-title">Structural sovereignty</div>
    <div class="assess-body">
      <div class="radar-wrap">${radarSVG(
        assess.themes.map(t => t.name),
        assess.themes.map(t => t.score),
        { fill: "#004494", size: 260 }
      )}</div>
      <div class="assess-detail">
        ${assess.themes.map(scoreRow).join("")}
      </div>
    </div>
    <p class="comment">${escapeHtml(company.structural.comment)}</p>
  `;
  card.appendChild(struct);

  const qBtn = el("button", "btn btn-outline");
  qBtn.textContent = "View questionnaire";
  qBtn.addEventListener("click", () => openQuestionnaire(company.name, "Structural Sovereignty", "structural", company.structural.answers));
  card.appendChild(qBtn);

  // ---- Products accordion ----
  const prodWrap = el("div", "products");
  prodWrap.innerHTML = `<div class="products-title">Products &amp; services (${company.products.length})</div>`;
  company.products.forEach((p, idx) => prodWrap.appendChild(productItem(company, p, idx)));
  card.appendChild(prodWrap);

  return card;
}

function productItem(company, product, idx) {
  const schemaKey = PRODUCT_TYPES[product.type].schema;
  const assess = computeAssessment(schemaKey, product.answers);
  const tier = scoreTier(assess.overall);

  const item = el("div", "accordion");
  const btn = el("button", "accordion-head");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = `
    <span class="chevron" aria-hidden="true"></span>
    <span class="accordion-name">${escapeHtml(product.name)}</span>
    <span class="type-tag">${escapeHtml(product.type)}</span>
    ${scoreBadge(assess.overall, tier, true)}
  `;

  const panel = el("div", "accordion-panel");
  panel.hidden = true;
  panel.innerHTML = `
    <div class="assess-body">
      <div class="radar-wrap">${radarSVG(
        assess.themes.map(t => shortTheme(t.name)),
        assess.themes.map(t => t.score),
        { fill: "#1F6FB2", size: 280, labelSpace: 82 }
      )}</div>
      <div class="assess-detail">
        ${assess.themes.map(scoreRow).join("")}
      </div>
    </div>
    <p class="comment">${escapeHtml(product.comment)}</p>
  `;
  const pBtn = el("button", "btn btn-outline");
  pBtn.textContent = "View questionnaire";
  pBtn.addEventListener("click", () => openQuestionnaire(
    `${company.name} — ${product.name}`, SCHEMAS[schemaKey].label, schemaKey, product.answers
  ));
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

// ---------------------------------------------------------------------------
// Small render helpers
// ---------------------------------------------------------------------------
function scoreBadge(score, tier, small) {
  return `<div class="score-badge ${tier.key} ${small ? "small" : ""}" style="--tier:${tier.color}">
    <span class="score-num">${score}</span><span class="score-unit">/100</span>
    <span class="score-tier">${tier.label}</span>
  </div>`;
}

function scoreRow(theme) {
  const tier = scoreTier(theme.score);
  return `<div class="score-row">
    <span class="score-row-label">${escapeHtml(theme.name)}</span>
    <span class="score-row-bar"><span style="width:${theme.score}%;background:${tier.color}"></span></span>
    <span class="score-row-val">${theme.score}</span>
  </div>`;
}

// Shorten long product theme names so the radar stays legible.
function shortTheme(name) {
  return name
    .replace("Legal Framework & Compliance", "Legal & Compliance")
    .replace("Data Location & Control", "Data Control")
    .replace("Security & Encryption", "Security")
    .replace("Technological Independence", "Tech Independence")
    .replace("Transparency & Audit", "Transparency")
    .replace("Reversibility & Exit", "Reversibility");
}

// ---------------------------------------------------------------------------
// Questionnaire modal
// ---------------------------------------------------------------------------
function openQuestionnaire(entityName, questionnaireLabel, schemaKey, answers) {
  const assess = computeAssessment(schemaKey, answers);
  const tier = scoreTier(assess.overall);
  const body = document.getElementById("modal-body");

  let html = `
    <div class="modal-head-info">
      <div>
        <div class="modal-eyebrow">${escapeHtml(questionnaireLabel)} questionnaire</div>
        <h3 class="modal-title">${escapeHtml(entityName)}</h3>
      </div>
      ${scoreBadge(assess.overall, tier)}
    </div>`;

  assess.themes.forEach(theme => {
    const tTier = scoreTier(theme.score);
    html += `<section class="q-theme">
      <div class="q-theme-head">
        <h4>${escapeHtml(theme.name)}</h4>
        <span class="q-theme-score" style="color:${tTier.color}">${theme.score}/100</span>
      </div>`;
    theme.questions.forEach((question, i) => {
      const chosen = theme.levels[i];
      html += `<div class="q-item">
        <p class="q-text">${escapeHtml(question.q)}</p>
        <p class="q-guidance">${escapeHtml(question.guidance)}</p>
        <div class="q-levels">`;
      question.levels.forEach((lvl, li) => {
        const isSel = li === chosen;
        html += `<div class="q-level ${isSel ? "selected" : ""}">
          <span class="q-level-tag">L${li}</span>
          <span class="q-level-text">${escapeHtml(lvl)}</span>
          ${isSel ? '<span class="q-level-check">Selected</span>' : ""}
        </div>`;
      });
      html += `</div></div>`;
    });
    html += `</section>`;
  });

  body.innerHTML = html;
  body.scrollTop = 0;
  document.getElementById("modal").classList.add("open");
  document.body.classList.add("modal-lock");
}

function closeModal() {
  document.getElementById("modal").classList.remove("open");
  document.body.classList.remove("modal-lock");
}

// ---------------------------------------------------------------------------
// DOM utilities
// ---------------------------------------------------------------------------
function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
