// ============================================================================
// Bootstrap — loads data and initialises the single Explore view
// ----------------------------------------------------------------------------
// The app is a read-only, anonymised supplier explorer. Data comes from the DB
// layer (Supabase with a local read-only fallback). Emblem drawing self-runs
// from emblem.js.
// ============================================================================

document.addEventListener("DOMContentLoaded", boot);

async function boot() {
  setDbStatus();
  bindModal();

  try {
    APP.companies = await DB.loadCompanies();
  } catch (e) {
    console.error("Data load failed, falling back to local demo data.", e);
    // Keep the POC usable even if the DB is unreachable or not yet migrated.
    APP.companies = (typeof COMPANIES !== "undefined" ? COMPANIES : []).map(c => ({
      ...c, products: c.products.map((p, i) => ({ id: `${c.id}-p${i}`, ...p }))
    }));
    APP.dataFallback = true;
    toast("Database unavailable — showing local demo data.", "error");
  }

  setDbStatus();   // refresh now that we know whether the DB is actually usable
  initExplore();
  renderExplore();
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
// Questionnaire modal close handlers
// ---------------------------------------------------------------------------
function bindModal() {
  document.getElementById("modal-backdrop").addEventListener("click", closeModal);
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
}
