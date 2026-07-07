// ============================================================================
// Scoring — derives sovereignty scores from answers, with optional weights
// ----------------------------------------------------------------------------
// A raw answer is a level 0/1/2. A question score is level/2*100 (0-100).
// Weighting is two-level and set by the SME (see priorities.js), and the two
// levels are MUTUALLY EXCLUSIVE per domain (theme):
//   - "domain mode" (default): the DOMAIN has a weight 1..3 that counts
//     towards the overall score; its questions all count equally (weight 1).
//   - "question mode" (precise[di] === true): the SME fine-tunes a weight
//     1..3 per QUESTION inside that domain; the domain's own weight is then
//     neutral (1) for the overall aggregation — picking precision at question
//     level cancels the block-level weighting for that domain.
// Theme score  = weighted average of its question scores (by question weight,
//                only applied when that domain is in question mode).
// Overall score = weighted average of theme scores (by domain weight, only
//                 applied when that domain is in domain mode).
// Missing weights default to 1, so an empty profile == equal weighting.
// ============================================================================

const DEFAULT_WEIGHT = 1;

// Map a flat answers array onto the schema's themes, preserving order.
function mapAnswersToThemes(schema, answers) {
  const result = [];
  let cursor = 0;
  schema.themes.forEach(theme => {
    const count = theme.questions.length;
    result.push({ name: theme.name, questions: theme.questions, levels: answers.slice(cursor, cursor + count) });
    cursor += count;
  });
  return result;
}

// Extract the weights sub-object for a given questionnaire, tolerating gaps.
function weightsFor(schemaKey, allWeights) {
  const w = (allWeights && allWeights[schemaKey]) || {};
  return { domains: w.domains || [], questions: w.questions || [], precise: w.precise || [] };
}

function weightedAverage(values, weights) {
  let num = 0, den = 0;
  for (let i = 0; i < values.length; i++) {
    const w = (weights && weights[i] != null) ? weights[i] : DEFAULT_WEIGHT;
    num += values[i] * w;
    den += w;
  }
  return den ? Math.round(num / den) : 0;
}

// Full computed assessment for a (schemaKey, answers) pair, given global weights.
function computeAssessment(schemaKey, answers, allWeights) {
  const schema = SCHEMAS[schemaKey];
  const w = weightsFor(schemaKey, allWeights);
  const mapped = mapAnswersToThemes(schema, answers);

  const themes = mapped.map((t, di) => {
    const qScores = t.levels.map(l => (l / 2) * 100);
    const precise = !!w.precise[di];
    // In domain mode, questions count equally: per-question weights are void.
    const qWeights = precise ? (w.questions[di] || []) : null;
    return {
      name: t.name,
      questions: t.questions,
      levels: t.levels,
      score: weightedAverage(qScores, qWeights),
      questionWeights: t.levels.map((_, qi) =>
        precise && qWeights[qi] != null ? qWeights[qi] : DEFAULT_WEIGHT)
    };
  });

  // In question mode, the domain's own block-weight is void (neutral = 1):
  // precision at question level cancels the domain-level weighting.
  const domainWeights = schema.themes.map((_, di) =>
    w.precise[di] ? DEFAULT_WEIGHT : (w.domains[di] != null ? w.domains[di] : DEFAULT_WEIGHT));

  const overall = weightedAverage(themes.map(t => t.score), domainWeights);
  return { schema, themes, overall, domainWeights };
}

// Sovereignty tier for colour-coding and labels.
function scoreTier(score) {
  if (score >= 75) return { key: "high",     label: "High sovereignty",     color: "#1E7A46" };
  if (score >= 50) return { key: "medium",   label: "Moderate sovereignty", color: "#B8860B" };
  if (score >= 25) return { key: "low",      label: "Low sovereignty",      color: "#C86A1F" };
  return              { key: "critical", label: "Critical exposure",    color: "#B23A3A" };
}
