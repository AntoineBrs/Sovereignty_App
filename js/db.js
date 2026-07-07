// ============================================================================
// Data access layer — Supabase (with a read-only local fallback)
// ----------------------------------------------------------------------------
// Exposes an async `DB` façade used by every view. If the Supabase client or
// network is unavailable, it falls back to the bundled demo data so the UI
// still renders (writes are disabled in that mode).
// ============================================================================

const DB = (function () {
  let client = null;
  let online = false;

  try {
    if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      online = true;
    }
  } catch (e) {
    console.warn("Supabase client init failed, using local fallback.", e);
  }

  // --- Normalisation: DB row -> shape expected by the views -----------------
  function normalizeCompany(row) {
    return {
      id: row.id,
      name: row.name,
      initials: row.initials,
      color: row.color || "#004494",
      country: row.country,
      countryCode: row.country_code,
      hq: row.hq,
      sector: row.sector,
      structural: {
        answers: (row.structural_answers || []).map(Number),
        comment: row.structural_comment || ""
      },
      products: (row.products || [])
        .slice()
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          answers: (p.answers || []).map(Number),
          comment: p.comment || ""
        }))
    };
  }

  // --- Local fallback (from data.js) ----------------------------------------
  function localCompanies() {
    return (typeof COMPANIES !== "undefined" ? COMPANIES : []).map(c => ({
      ...c,
      products: c.products.map((p, i) => ({ id: `${c.id}-p${i}`, ...p }))
    }));
  }

  return {
    online,

    async loadCompanies() {
      if (!online) return localCompanies();
      const { data, error } = await client
        .from("companies")
        .select("*, products(*)")
        .order("name", { ascending: true });
      if (error) { console.error(error); throw error; }
      return data.map(normalizeCompany);
    },

    async loadWeights() {
      if (!online) return {};
      const { data, error } = await client
        .from("weight_profiles").select("weights").eq("id", 1).maybeSingle();
      if (error) { console.error(error); return {}; }
      return (data && data.weights) || {};
    },

    async saveWeights(weights) {
      if (!online) return;
      const { error } = await client
        .from("weight_profiles")
        .upsert({ id: 1, weights }, { onConflict: "id" });
      if (error) { console.error(error); throw error; }
    },

    // --- Company CRUD -------------------------------------------------------
    async createCompany(payload) {
      const { data, error } = await client.from("companies").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    async updateCompany(id, payload) {
      const { error } = await client.from("companies").update(payload).eq("id", id);
      if (error) throw error;
    },
    async deleteCompany(id) {
      const { error } = await client.from("companies").delete().eq("id", id);
      if (error) throw error;
    },

    // --- Product CRUD -------------------------------------------------------
    async createProduct(payload) {
      const { data, error } = await client.from("products").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    async updateProduct(id, payload) {
      const { error } = await client.from("products").update(payload).eq("id", id);
      if (error) throw error;
    },
    async deleteProduct(id) {
      const { error } = await client.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    async replaceProducts(companyId, products) {
      // Simplest robust approach for the POC: delete all, re-insert.
      const del = await client.from("products").delete().eq("company_id", companyId);
      if (del.error) throw del.error;
      if (!products.length) return;
      const rows = products.map((p, i) => ({
        company_id: companyId, name: p.name, type: p.type,
        answers: p.answers, comment: p.comment, position: i
      }));
      const { error } = await client.from("products").insert(rows);
      if (error) throw error;
    }
  };
})();
