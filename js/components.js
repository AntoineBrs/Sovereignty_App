// ============================================================================
// Shared state, DOM helpers and reusable UI components
// ============================================================================

const APP = {
  companies: [],   // normalised companies (with products)
  weights: {},     // global weighting profile
  view: "explore"
};

// ---------------------------------------------------------------------------
// DOM utilities
// ---------------------------------------------------------------------------
function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html != null) e.innerHTML = html;
  return e;
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function toast(message, kind) {
  const t = document.getElementById("toast");
  t.textContent = message;
  t.className = "toast show" + (kind ? " " + kind : "");
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = "toast"; t.hidden = true; }, 2600);
}

// ---------------------------------------------------------------------------
// Score presentation
// ---------------------------------------------------------------------------
function scoreBadge(score, tier, small) {
  return `<div class="score-badge ${tier.key} ${small ? "small" : ""}" style="--tier:${tier.color}">
    <span class="score-num">${score}</span><span class="score-unit">/100</span>
    <span class="score-tier">${tier.label}</span>
  </div>`;
}

// weight is the domain-level weight actually applied to the overall score
// (neutral/1 whenever the theme is in per-question "precise" mode).
function scoreRow(theme, weight) {
  const tier = scoreTier(theme.score);
  let tag = "";
  if (theme.precise) {
    tag = `<span class="prio-precise-tag">Weighted by question</span>`;
  } else if (weight && weight !== 1) {
    tag = weightChip(weight);
  }
  return `<div class="score-row">
    <span class="score-row-label">${escapeHtml(theme.name)}${tag}</span>
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

// Radar + score-rows block for an assessment.
function assessmentBody(assess, opts) {
  const o = opts || {};
  const labels = assess.themes.map(t => o.short ? shortTheme(t.name) : t.name);
  const radar = radarSVG(labels, assess.themes.map(t => t.score),
    { fill: o.fill || "#004494", size: o.size || 260, labelSpace: o.labelSpace || 74 });
  const rows = assess.themes.map((t, di) => scoreRow(t, assess.domainWeights[di])).join("");
  return `<div class="assess-body">
      <div class="radar-wrap">${radar}</div>
      <div class="assess-detail">${rows}</div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Segmented control (used for level 0/1/2 and weight 1/2/3)
// values: array of {value, label}. Returns an element; calls onChange(value).
// ---------------------------------------------------------------------------
function makeSegmented(values, current, onChange, opts) {
  const o = opts || {};
  const wrap = el("div", "segmented" + (o.className ? " " + o.className : ""));
  values.forEach(v => {
    const b = el("button", "seg-btn", escapeHtml(v.label));
    b.type = "button";
    b.dataset.value = v.value;
    if (String(v.value) === String(current)) b.classList.add("active");
    if (o.tone) b.classList.add("tone-" + o.tone);
    b.addEventListener("click", () => {
      wrap.querySelectorAll(".seg-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      onChange(v.value);
    });
    wrap.appendChild(b);
  });
  return wrap;
}

const LEVEL_OPTIONS  = [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }];
const WEIGHT_OPTIONS = [{ value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }];

// ---------------------------------------------------------------------------
// Questionnaire modal (read-only filled questionnaire, weight-aware)
// ---------------------------------------------------------------------------
function openQuestionnaire(entityName, questionnaireLabel, schemaKey, answers) {
  const assess = computeAssessment(schemaKey, answers, APP.weights);
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

  assess.themes.forEach((theme, di) => {
    const tTier = scoreTier(theme.score);
    const dW = (assess.domainWeights && assess.domainWeights[di]) || 1;
    html += `<section class="q-theme">
      <div class="q-theme-head">
        <h4>${escapeHtml(theme.name)} ${weightChip(dW)}</h4>
        <span class="q-theme-score" style="color:${tTier.color}">${theme.score}/100</span>
      </div>`;
    theme.questions.forEach((question, i) => {
      const chosen = theme.levels[i];
      const qW = (theme.questionWeights && theme.questionWeights[i]) || 1;
      html += `<div class="q-item">
        <p class="q-text">${escapeHtml(question.q)} ${weightChip(qW)}</p>
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

function weightChip(w) {
  if (!w || w === 1) return "";
  return `<span class="weight-chip" title="Priority weight">×${w}</span>`;
}

function closeModal() {
  document.getElementById("modal").classList.remove("open");
  document.body.classList.remove("modal-lock");
}
