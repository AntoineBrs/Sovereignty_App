// ============================================================================
// Shared state, DOM helpers and reusable UI components
// ============================================================================

const APP = {
  companies: [],   // normalised companies (with products)
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
// Radar presentation
// ---------------------------------------------------------------------------

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

// Radar-only block for an assessment (no numeric scores are shown).
function assessmentBody(assess, opts) {
  const o = opts || {};
  const labels = assess.themes.map(t => o.short ? shortTheme(t.name) : t.name);
  const radar = radarSVG(labels, assess.themes.map(t => t.score),
    { fill: o.fill || "#004494", size: o.size || 260, labelSpace: o.labelSpace || 74 });
  return `<div class="assess-body assess-body-radar">
      <div class="radar-wrap">${radar}</div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Questionnaire modal (read-only filled questionnaire, anonymised, no scores)
// ---------------------------------------------------------------------------
function openQuestionnaire(entityName, questionnaireLabel, schemaKey, answers) {
  const assess = computeAssessment(schemaKey, answers);
  const body = document.getElementById("modal-body");

  let html = `
    <div class="modal-head-info">
      <div>
        <div class="modal-eyebrow">${escapeHtml(questionnaireLabel)} questionnaire</div>
        <h3 class="modal-title">${escapeHtml(entityName)}</h3>
      </div>
    </div>`;

  assess.themes.forEach(theme => {
    html += `<section class="q-theme">
      <div class="q-theme-head">
        <h4>${escapeHtml(theme.name)}</h4>
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
