// ============================================================================
// Bootstrap — loads the local supplier data and initialises the Explore view
// ----------------------------------------------------------------------------
// The app is a read-only, anonymised supplier explorer. All data is bundled
// locally (see data.js via the DB façade in db.js) — there is no external
// database and no network call, so the app works 100% offline. Emblem
// drawing self-runs from emblem.js.
// ============================================================================

document.addEventListener("DOMContentLoaded", boot);

async function boot() {
  bindModal();
  APP.companies = await DB.loadCompanies();
  initExplore();
  renderExplore();
}

// ---------------------------------------------------------------------------
// Questionnaire modal close handlers
// ---------------------------------------------------------------------------
function bindModal() {
  document.getElementById("modal-backdrop").addEventListener("click", closeModal);
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
}
