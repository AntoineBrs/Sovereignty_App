// ============================================================================
// Supplier space — company CRUD, mandatory structural questionnaire, products
// ----------------------------------------------------------------------------
// A supplier can add a company, complete the mandatory structural
// questionnaire, then declare products/services (each with its own
// questionnaire). Entries can be edited or deleted. Weights are NOT set here;
// they belong to the SME "My priorities" view.
//
// Writes require an online DB (Supabase). In local-fallback mode the editor is
// read-only and actions are disabled with an explanatory toast.
// ============================================================================

const supplier = { bound: false, draft: null };

const PALETTE = ["#004494", "#1F6FB2", "#1E7A46", "#B8860B", "#7A3E9D", "#B23A3A", "#0F766E", "#334155"];

function initSupplier() {
  if (!supplier.bound) {
    document.getElementById("add-company").addEventListener("click", () => openCompanyForm(null));
    supplier.bound = true;
  }
  showSupplierList();
}

// Total number of questions in a questionnaire (flat).
function schemaQuestionCount(schemaKey) {
  return SCHEMAS[schemaKey].themes.reduce((n, t) => n + t.questions.length, 0);
}

function zeros(n) { return Array.from({ length: n }, () => 0); }

// --- List view --------------------------------------------------------------
function showSupplierList() {
  document.getElementById("supplier-form-view").hidden = true;
  document.getElementById("supplier-list-view").hidden = false;
  renderSupplierList();
}

function renderSupplierList() {
  const root = document.getElementById("supplier-list");
  root.innerHTML = "";

  if (!dbWritable()) {
    root.appendChild(el("p", "muted-note",
      "Demo mode (database unavailable or not migrated): suppliers are read-only. Connect Supabase to add or edit."));
  }

  if (APP.companies.length === 0) {
    root.appendChild(el("p", "muted-note", "No supplier yet. Use “Add a company” to create the first one."));
    return;
  }

  APP.companies.forEach(company => root.appendChild(supplierRow(company)));
}

function supplierRow(company) {
  const assess = computeAssessment("structural", company.structural.answers, APP.weights);
  const tier = scoreTier(assess.overall);

  const row = el("div", "supplier-row");
  const info = el("div", "supplier-row-info");
  info.innerHTML = `
    <div class="logo" style="background:${company.color}">${escapeHtml(company.initials)}</div>
    <div>
      <div class="supplier-row-name">${escapeHtml(company.name)}</div>
      <div class="supplier-row-meta">${escapeHtml(company.country || "")} · ${company.products.length} product${company.products.length === 1 ? "" : "s"}</div>
    </div>`;
  row.appendChild(info);

  const right = el("div", "supplier-row-actions");
  right.innerHTML = scoreBadge(assess.overall, tier, true);

  if (dbWritable()) {
    const edit = el("button", "btn btn-outline", "Edit");
    edit.addEventListener("click", () => openCompanyForm(company));
    const del = el("button", "btn btn-ghost danger", "Delete");
    del.addEventListener("click", () => deleteCompanyFlow(company));
    right.appendChild(edit);
    right.appendChild(del);
  }
  row.appendChild(right);
  return row;
}

async function deleteCompanyFlow(company) {
  if (!confirm(`Delete “${company.name}” and all its products? This cannot be undone.`)) return;
  try {
    await DB.deleteCompany(company.id);
    toast("Supplier deleted.", "ok");
    await reloadCompanies();
    renderSupplierList();
    if (typeof renderExplore === "function") renderExplore();
  } catch (e) {
    console.error(e);
    toast("Deletion failed.", "error");
  }
}

// --- Form view --------------------------------------------------------------
function openCompanyForm(company) {
  if (!dbWritable()) { toast("Connect a database to add or edit suppliers.", "error"); return; }

  supplier.draft = company ? cloneCompany(company) : blankCompany();
  document.getElementById("supplier-list-view").hidden = true;
  document.getElementById("supplier-form-view").hidden = false;
  renderCompanyForm();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function blankCompany() {
  return {
    id: null, isNew: true,
    name: "", initials: "", color: PALETTE[0],
    country: "", countryCode: "", hq: "", sector: "",
    structural: { answers: zeros(schemaQuestionCount("structural")), comment: "" },
    products: []
  };
}

function cloneCompany(c) {
  return {
    id: c.id, isNew: false,
    name: c.name, initials: c.initials, color: c.color || PALETTE[0],
    country: c.country || "", countryCode: c.countryCode || "", hq: c.hq || "", sector: c.sector || "",
    structural: {
      answers: (c.structural.answers || []).slice(),
      comment: c.structural.comment || ""
    },
    products: (c.products || []).map(p => ({
      name: p.name, type: p.type,
      answers: (p.answers || []).slice(),
      comment: p.comment || ""
    }))
  };
}

function renderCompanyForm() {
  const d = supplier.draft;
  const root = document.getElementById("supplier-form-view");
  root.innerHTML = "";

  const head = el("div", "form-head");
  head.innerHTML = `<h2>${d.isNew ? "Add a company" : "Edit company"}</h2>
    <p class="muted-note">The structural questionnaire is mandatory. Products &amp; services are optional.</p>`;
  root.appendChild(head);

  // ---- Company identity fields ----
  const fields = el("section", "form-card");
  fields.appendChild(el("h3", "form-card-title", "Company information"));
  const grid = el("div", "form-grid");
  grid.appendChild(textField("Company name *", d.name, v => d.name = v, "e.g. Scaleway"));
  grid.appendChild(textField("Initials / logo *", d.initials, v => d.initials = v, "e.g. SCW", { maxlength: 4 }));
  grid.appendChild(textField("Country", d.country, v => d.country = v, "e.g. France"));
  grid.appendChild(textField("Country code", d.countryCode, v => d.countryCode = v, "e.g. FR", { maxlength: 2 }));
  grid.appendChild(textField("Headquarters", d.hq, v => d.hq = v, "e.g. Paris, France"));
  grid.appendChild(textField("Sector", d.sector, v => d.sector = v, "e.g. Cloud infrastructure"));
  grid.appendChild(colorField("Brand colour", d.color, v => d.color = v));
  fields.appendChild(grid);
  root.appendChild(fields);

  // ---- Structural questionnaire (mandatory) ----
  const struct = el("section", "form-card");
  struct.appendChild(el("h3", "form-card-title", "Structural sovereignty questionnaire *"));
  struct.appendChild(questionnaireForm("structural", d.structural.answers));
  struct.appendChild(commentField("Summary comment", d.structural.comment, v => d.structural.comment = v));
  root.appendChild(struct);

  // ---- Products ----
  const prods = el("section", "form-card");
  const ph = el("div", "form-card-head");
  ph.appendChild(el("h3", "form-card-title", `Products & services (${d.products.length})`));
  const addBtn = el("button", "btn btn-outline", "+ Add a product");
  addBtn.type = "button";
  addBtn.addEventListener("click", () => {
    const type = "Cloud";
    d.products.push({ name: "", type, answers: zeros(schemaQuestionCount(PRODUCT_TYPES[type].schema)), comment: "" });
    renderCompanyForm();
  });
  ph.appendChild(addBtn);
  prods.appendChild(ph);

  if (d.products.length === 0) {
    prods.appendChild(el("p", "muted-note", "No product declared. Add one if you offer products or services."));
  }
  d.products.forEach((p, idx) => prods.appendChild(productForm(p, idx)));
  root.appendChild(prods);

  // ---- Actions ----
  const actions = el("div", "form-actions");
  const save = el("button", "btn btn-primary", d.isNew ? "Create supplier" : "Save changes");
  save.addEventListener("click", saveCompanyFlow);
  const cancel = el("button", "btn btn-ghost", "Cancel");
  cancel.addEventListener("click", showSupplierList);
  actions.appendChild(save);
  actions.appendChild(cancel);
  root.appendChild(actions);
}

function productForm(product, idx) {
  const wrap = el("div", "product-form");
  const head = el("div", "product-form-head");
  head.appendChild(el("span", "product-form-idx", `#${idx + 1}`));
  const remove = el("button", "btn btn-ghost danger", "Remove");
  remove.type = "button";
  remove.addEventListener("click", () => { supplier.draft.products.splice(idx, 1); renderCompanyForm(); });
  head.appendChild(remove);
  wrap.appendChild(head);

  const grid = el("div", "form-grid");
  grid.appendChild(textField("Product / service name *", product.name, v => product.name = v, "e.g. Elastic Metal"));

  // Type dropdown — changing type swaps the questionnaire schema.
  const typeWrap = el("label", "field");
  typeWrap.appendChild(el("span", "field-label", "Type"));
  const sel = el("select", "field-input");
  Object.keys(PRODUCT_TYPES).forEach(t => sel.add(new Option(t, t)));
  sel.value = product.type;
  sel.addEventListener("change", () => {
    const prevSchema = PRODUCT_TYPES[product.type].schema;
    const nextSchema = PRODUCT_TYPES[sel.value].schema;
    product.type = sel.value;
    if (prevSchema !== nextSchema) {
      product.answers = zeros(schemaQuestionCount(nextSchema));
    }
    renderCompanyForm();
  });
  typeWrap.appendChild(sel);
  grid.appendChild(typeWrap);
  wrap.appendChild(grid);

  const schemaKey = PRODUCT_TYPES[product.type].schema;
  wrap.appendChild(questionnaireForm(schemaKey, product.answers));
  wrap.appendChild(commentField("Comment", product.comment, v => product.comment = v));
  return wrap;
}

// --- Reusable form controls -------------------------------------------------
function textField(label, value, onInput, placeholder, opts) {
  const o = opts || {};
  const wrap = el("label", "field");
  wrap.appendChild(el("span", "field-label", escapeHtml(label)));
  const input = el("input", "field-input");
  input.type = "text";
  input.value = value || "";
  if (placeholder) input.placeholder = placeholder;
  if (o.maxlength) input.maxLength = o.maxlength;
  input.addEventListener("input", e => onInput(e.target.value));
  wrap.appendChild(input);
  return wrap;
}

function colorField(label, value, onInput) {
  const wrap = el("label", "field");
  wrap.appendChild(el("span", "field-label", escapeHtml(label)));
  const input = el("input", "field-input field-color");
  input.type = "color";
  input.value = value || "#004494";
  input.addEventListener("input", e => onInput(e.target.value));
  wrap.appendChild(input);
  return wrap;
}

function commentField(label, value, onInput) {
  const wrap = el("label", "field field-wide");
  wrap.appendChild(el("span", "field-label", escapeHtml(label)));
  const ta = el("textarea", "field-input field-textarea");
  ta.rows = 3;
  ta.value = value || "";
  ta.addEventListener("input", e => onInput(e.target.value));
  wrap.appendChild(ta);
  return wrap;
}

// Editable questionnaire: 0/1/2 segmented control per question, mutating the
// answers array in place (flat index across themes).
function questionnaireForm(schemaKey, answers) {
  const schema = SCHEMAS[schemaKey];
  const box = el("div", "qform");
  let cursor = 0;
  schema.themes.forEach(theme => {
    const themeEl = el("div", "qform-theme");
    themeEl.appendChild(el("div", "qform-theme-title", escapeHtml(theme.name)));
    theme.questions.forEach(question => {
      const flat = cursor++;
      const row = el("div", "qform-q");
      row.appendChild(el("p", "qform-q-text", escapeHtml(question.q)));
      const seg = makeSegmented(LEVEL_OPTIONS, answers[flat] != null ? answers[flat] : 0, val => {
        answers[flat] = Number(val);
      }, { tone: "level", className: "seg-level" });
      const segWrap = el("div", "qform-q-control");
      // Show the selected level's descriptive text for context.
      const levelText = el("p", "qform-q-level");
      const setLevelText = i => { levelText.textContent = question.levels[i] || ""; };
      setLevelText(answers[flat] != null ? answers[flat] : 0);
      seg.querySelectorAll(".seg-btn").forEach(b =>
        b.addEventListener("click", () => setLevelText(Number(b.dataset.value))));
      segWrap.appendChild(seg);
      segWrap.appendChild(levelText);
      row.appendChild(segWrap);
      themeEl.appendChild(row);
    });
    box.appendChild(themeEl);
  });
  return box;
}

// --- Save orchestration -----------------------------------------------------
async function saveCompanyFlow() {
  const d = supplier.draft;
  if (!d.name.trim()) { toast("Company name is required.", "error"); return; }
  if (!d.initials.trim()) { toast("Initials are required.", "error"); return; }
  for (const p of d.products) {
    if (!p.name.trim()) { toast("Every product needs a name.", "error"); return; }
  }

  const companyPayload = {
    name: d.name.trim(),
    initials: d.initials.trim(),
    color: d.color,
    country: d.country.trim(),
    country_code: d.countryCode.trim().toUpperCase(),
    hq: d.hq.trim(),
    sector: d.sector.trim(),
    structural_answers: d.structural.answers,
    structural_comment: d.structural.comment.trim()
  };

  try {
    let companyId;
    if (d.isNew) {
      companyPayload.id = slugId(d.name);
      const created = await DB.createCompany(companyPayload);
      companyId = created.id;
    } else {
      companyId = d.id;
      await DB.updateCompany(companyId, companyPayload);
    }
    await DB.replaceProducts(companyId, d.products);

    toast(d.isNew ? "Supplier created." : "Supplier updated.", "ok");
    await reloadCompanies();
    showSupplierList();
    if (typeof renderExplore === "function") renderExplore();
  } catch (e) {
    console.error(e);
    toast("Save failed. Check the console for details.", "error");
  }
}

// Build a URL-safe, reasonably-unique text id from the company name.
function slugId(name) {
  const base = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "company";
  return `${base}-${Date.now().toString(36)}`;
}
