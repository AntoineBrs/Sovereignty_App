// ============================================================================
// My priorities — SME weighting editor (two-level: domain + question)
// ----------------------------------------------------------------------------
// The SME sets an importance weight (1..3) for each DOMAIN (theme) of every
// questionnaire, and may expand a domain to fine-tune per-QUESTION weights.
// Changes mutate APP.weights, persist to the DB (debounced) and re-score
// every supplier instantly via renderExplore().
//
// Weights shape:  APP.weights = {
//   [schemaKey]: { domains: [w,...], questions: [[w,...], [w,...], ...] }
// }
// A missing weight is treated as 1 by the scoring layer.
// ============================================================================

const priorities = { bound: false };

function initPriorities() {
  ensureAllWeights();
  if (!priorities.bound) {
    document.getElementById("weights-reset").addEventListener("click", resetAllWeights);
    priorities.bound = true;
  }
  renderPriorities();
}

// Make sure APP.weights has a fully-shaped entry for every questionnaire,
// so the UI can bind controls without worrying about gaps.
function ensureAllWeights() {
  Object.keys(SCHEMAS).forEach(key => {
    const schema = SCHEMAS[key];
    const w = APP.weights[key] || (APP.weights[key] = {});
    if (!Array.isArray(w.domains)) w.domains = [];
    if (!Array.isArray(w.questions)) w.questions = [];
    schema.themes.forEach((theme, di) => {
      if (w.domains[di] == null) w.domains[di] = DEFAULT_WEIGHT;
      if (!Array.isArray(w.questions[di])) w.questions[di] = [];
      theme.questions.forEach((_, qi) => {
        if (w.questions[di][qi] == null) w.questions[di][qi] = DEFAULT_WEIGHT;
      });
    });
  });
}

// Debounced persistence so rapid clicks collapse into one write.
let _saveTimer = null;
function persistWeights() {
  if (typeof dbWritable === "function" && !dbWritable()) return; // demo mode: keep weights local
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    try {
      await DB.saveWeights(APP.weights);
    } catch (e) {
      console.error(e);
      toast("Priorities could not be saved to the database.", "error");
    }
  }, 500);
}

// A single weight change propagates everywhere.
function onWeightChanged() {
  persistWeights();
  if (typeof renderExplore === "function") renderExplore();
}

function renderPriorities() {
  const root = document.getElementById("priorities");
  root.innerHTML = "";
  Object.keys(SCHEMAS).forEach(key => root.appendChild(schemaBlock(key)));
}

function schemaBlock(schemaKey) {
  const schema = SCHEMAS[schemaKey];
  const w = APP.weights[schemaKey];

  const block = el("section", "prio-block");
  block.appendChild(el("h3", "prio-block-title", escapeHtml(schema.label)));

  schema.themes.forEach((theme, di) => {
    const domain = el("div", "prio-domain");

    // --- Domain header: name + weight control + expand toggle --------------
    const head = el("div", "prio-domain-head");

    const nameWrap = el("div", "prio-domain-name");
    nameWrap.textContent = theme.name;
    head.appendChild(nameWrap);

    const controls = el("div", "prio-domain-controls");
    const domSeg = makeSegmented(WEIGHT_OPTIONS, w.domains[di], val => {
      w.domains[di] = Number(val);
      onWeightChanged();
    }, { tone: "weight", className: "seg-weight" });
    controls.appendChild(domSeg);

    const toggle = el("button", "prio-expand");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = `<span class="chevron" aria-hidden="true"></span>
      <span class="prio-expand-label">Questions (${theme.questions.length})</span>`;
    controls.appendChild(toggle);

    head.appendChild(controls);
    domain.appendChild(head);

    // --- Per-question panel -------------------------------------------------
    const panel = el("div", "prio-questions");
    panel.hidden = true;
    theme.questions.forEach((question, qi) => {
      const row = el("div", "prio-question");
      row.appendChild(el("p", "prio-question-text", escapeHtml(question.q)));
      const qSeg = makeSegmented(WEIGHT_OPTIONS, w.questions[di][qi], val => {
        w.questions[di][qi] = Number(val);
        onWeightChanged();
      }, { tone: "weight", className: "seg-weight" });
      row.appendChild(qSeg);
      panel.appendChild(row);
    });
    domain.appendChild(panel);

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
      domain.classList.toggle("open", !open);
    });

    block.appendChild(domain);
  });

  return block;
}

// Reset every weight back to 1 (standard) and re-render both views.
function resetAllWeights() {
  Object.keys(SCHEMAS).forEach(key => {
    const schema = SCHEMAS[key];
    const w = APP.weights[key];
    schema.themes.forEach((theme, di) => {
      w.domains[di] = DEFAULT_WEIGHT;
      theme.questions.forEach((_, qi) => { w.questions[di][qi] = DEFAULT_WEIGHT; });
    });
  });
  persistWeights();
  renderPriorities();
  if (typeof renderExplore === "function") renderExplore();
  toast("All priorities reset to standard.", "ok");
}
