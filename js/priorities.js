// ============================================================================
// My priorities — SME weighting editor (two-level, mutually exclusive)
// ----------------------------------------------------------------------------
// For each DOMAIN (theme) of every questionnaire, the SME picks ONE mode:
//   - "domain mode" (default): a single importance weight (1..3) for the
//     whole domain block, applied against the other domains in the overall
//     score. Its questions all count equally.
//   - "question mode": expanding the domain to fine-tune a weight (1..3) per
//     QUESTION cancels the domain-level weight (shown unselected) — the
//     domain's own contribution to the overall score becomes neutral, and
//     precision moves to the question level instead.
// Changes mutate APP.weights, persist to the DB (debounced) and re-score
// every supplier instantly via renderExplore(); scoring.js applies the
// mutual-exclusivity rule everywhere (overall score, radar, answer detail).
//
// Weights shape:  APP.weights = {
//   [schemaKey]: { domains: [w,...], questions: [[w,...], ...], precise: [bool,...] }
// }
// A missing weight is treated as 1 by the scoring layer; a missing `precise`
// flag is treated as false (domain mode).
// ============================================================================

const priorities = { bound: false, openPanels: new Set() };

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
    if (!Array.isArray(w.precise)) w.precise = [];
    schema.themes.forEach((theme, di) => {
      if (w.domains[di] == null) w.domains[di] = DEFAULT_WEIGHT;
      if (w.precise[di] == null) w.precise[di] = false;
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

// A single weight change propagates to every score shown across the app.
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
    const panelKey = schemaKey + ":" + di;
    const precise = !!w.precise[di];
    const isOpen = priorities.openPanels.has(panelKey);

    const domain = el("div", "prio-domain" + (precise ? " precise" : "") + (isOpen ? " open" : ""));

    // --- Domain header: name + weight control + expand toggle --------------
    const head = el("div", "prio-domain-head");

    const nameWrap = el("div", "prio-domain-name");
    nameWrap.textContent = theme.name;
    if (precise) {
      nameWrap.appendChild(el("span", "prio-precise-tag", "Weighted by question"));
    }
    head.appendChild(nameWrap);

    const controls = el("div", "prio-domain-controls");
    // Unselected (no colored box) whenever this domain is in question mode.
    const domSeg = makeSegmented(WEIGHT_OPTIONS, precise ? null : w.domains[di], val => {
      // Choosing a domain weight switches back to domain mode: cancel
      // per-question precision and collapse the detail panel.
      w.domains[di] = Number(val);
      w.precise[di] = false;
      theme.questions.forEach((_, qi) => { w.questions[di][qi] = DEFAULT_WEIGHT; });
      priorities.openPanels.delete(panelKey);
      onWeightChanged();
      renderPriorities();
    }, { tone: "weight", className: "seg-weight" });
    controls.appendChild(domSeg);

    const toggle = el("button", "prio-expand");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.innerHTML = `<span class="chevron" aria-hidden="true"></span>
      <span class="prio-expand-label">Questions (${theme.questions.length})</span>`;
    controls.appendChild(toggle);

    head.appendChild(controls);
    domain.appendChild(head);

    // --- Per-question panel -------------------------------------------------
    const panel = el("div", "prio-questions");
    panel.hidden = !isOpen;
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
      if (open) {
        // Just collapsing the detail — the domain stays in question mode.
        priorities.openPanels.delete(panelKey);
        toggle.setAttribute("aria-expanded", "false");
        panel.hidden = true;
        domain.classList.remove("open");
      } else {
        // Expanding to fine-tune questions cancels the domain-level weight.
        priorities.openPanels.add(panelKey);
        w.precise[di] = true;
        onWeightChanged();
        renderPriorities();
      }
    });

    block.appendChild(domain);
  });

  return block;
}

// Reset every weight back to 1 (standard domain mode) and re-render both views.
function resetAllWeights() {
  Object.keys(SCHEMAS).forEach(key => {
    const schema = SCHEMAS[key];
    const w = APP.weights[key];
    schema.themes.forEach((theme, di) => {
      w.domains[di] = DEFAULT_WEIGHT;
      w.precise[di] = false;
      theme.questions.forEach((_, qi) => { w.questions[di][qi] = DEFAULT_WEIGHT; });
    });
  });
  priorities.openPanels.clear();
  persistWeights();
  renderPriorities();
  if (typeof renderExplore === "function") renderExplore();
  toast("All priorities reset to standard.", "ok");
}
