// ============================================================================
// Bootstrap — loads data, wires navigation, coordinates the three views
// ----------------------------------------------------------------------------
// Views: Explore (search & compare), My priorities (SME weights),
// Supplier space (company CRUD). Data comes from the DB layer (Supabase with a
// local read-only fallback). Emblem drawing self-runs from emblem.js.
// ============================================================================

const VIEW_INIT = { explore: false, priorities: false, supplier: false };

document.addEventListener("DOMContentLoaded", boot);

async function boot() {
  setDbStatus();
  bindNav();
  bindModal();

  try {
    const [companies, weights] = await Promise.all([DB.loadCompanies(), DB.loadWeights()]);
    APP.companies = companies;
    APP.weights = weights || {};
  } catch (e) {
    console.error("Data load failed, falling back to local demo data.", e);
    // Keep the POC usable even if the DB is unreachable or not yet migrated.
    APP.companies = (typeof COMPANIES !== "undefined" ? COMPANIES : []).map(c => ({
      ...c, products: c.products.map((p, i) => ({ id: `${c.id}-p${i}`, ...p }))
    }));
    APP.weights = {};
    APP.dataFallback = true;
    toast("Database unavailable — showing local demo data.", "error");
  }

  setDbStatus();   // refresh now that we know whether the DB is actually usable
  switchView("explore");
}

// Writes are only allowed against a reachable, migrated database.
function dbWritable() { return DB.online && !APP.dataFallback; }

// Small badge in the header telling the user where data comes from.
function setDbStatus() {
  const node = document.getElementById("db-status");
  if (!node) return;
  node.classList.remove("online", "offline");
  if (dbWritable()) {
    node.textContent = "● Live database";
    node.classList.add("online");
    node.title = "Connected to Supabase";
  } else {
    node.textContent = "● Demo data";
    node.classList.add("offline");
    node.title = DB.online
      ? "Database unreachable or not migrated — read-only demo data"
      : "No database connection — read-only demo data";
  }
}

// ---------------------------------------------------------------------------
// Navigation between the three top-level views
// ---------------------------------------------------------------------------
function bindNav() {
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });
}

function switchView(view) {
  APP.view = view;

  document.querySelectorAll(".nav-tab").forEach(t =>
    t.classList.toggle("active", t.dataset.view === view));
  document.querySelectorAll(".view").forEach(v =>
    v.hidden = v.id !== "view-" + view);

  if (view === "explore") {
    if (!VIEW_INIT.explore) { initExplore(); VIEW_INIT.explore = true; }
    renderExplore();
  } else if (view === "priorities") {
    initPriorities();          // (re)renders every time — cheap and always fresh
    VIEW_INIT.priorities = true;
  } else if (view === "supplier") {
    initSupplier();            // (re)renders the list every time
    VIEW_INIT.supplier = true;
  }
}

// ---------------------------------------------------------------------------
// Shared helper: reload companies from the DB after a write
// ---------------------------------------------------------------------------
async function reloadCompanies() {
  try {
    APP.companies = await DB.loadCompanies();
  } catch (e) {
    console.error("Reload failed.", e);
    toast("Could not refresh the supplier list.", "error");
  }
}

// ---------------------------------------------------------------------------
// Questionnaire modal close handlers
// ---------------------------------------------------------------------------
function bindModal() {
  document.getElementById("modal-backdrop").addEventListener("click", closeModal);
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
}
