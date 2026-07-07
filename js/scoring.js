// ============================================================================
// Scoring — derives sovereignty scores from answers, with optional weights
// ----------------------------------------------------------------------------
// A raw answer is a level 0/1/2. A question score is level/2*100 (0-100).
// Weighting is two-level and set by the SME (see priorities.js):
//   - each DOMAIN (theme) has a weight 1..3
//   - each QUESTION has a weight 1..3
// Theme score  = weighted average of its question scores (by question weight).
// Overall score = weighted average of theme scores (by domain weight).
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
  return { domains: w.domains || [], questions: w.questions || [] };
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
    const qWeights = w.questions[di] || [];
    return {
      name: t.name,
      questions: t.questions,
      levels: t.levels,
      score: weightedAverage(qScores, qWeights),
      questionWeights: qWeights
    };
  });

  const overall = weightedAverage(themes.map(t => t.score), w.domains);
  return { schema, themes, overall, domainWeights: w.domains };
}

// Sovereignty tier for colour-coding and labels.
function scoreTier(score) {
  if (score >= 75) return { key: "high",     label: "High sovereignty",     color: "#1E7A46" };
  if (score >= 50) return { key: "medium",   label: "Moderate sovereignty", color: "#B8860B" };
  if (score >= 25) return { key: "low",      label: "Low sovereignty",      color: "#C86A1F" };
  return              { key: "critical", label: "Critical exposure",    color: "#B23A3A" };
}
