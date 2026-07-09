// ============================================================================
// Data access layer — 100% local, no external database
// ----------------------------------------------------------------------------
// All supplier data lives in data.js and ships with the app: there is no
// network call and no external service involved. The app is fully usable
// offline, which is consistent with the sovereignty principles it
// demonstrates. `DB` is kept as a small façade so the rest of the code does
// not need to know the data is local rather than remote.
// ============================================================================

const DB = (function () {
  function localCompanies() {
    return (typeof COMPANIES !== "undefined" ? COMPANIES : []).map(c => ({
      ...c,
      products: c.products.map((p, i) => ({ id: `${c.id}-p${i}`, ...p }))
    }));
  }

  return {
    async loadCompanies() {
      return localCompanies();
    }
  };
})();
