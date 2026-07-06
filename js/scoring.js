// ============================================================================
// Scoring — derives sovereignty scores from questionnaire answers
// ----------------------------------------------------------------------------
// A raw answer is a level 0/1/2. A score is normalised to 0-100 (level/2*100).
// ============================================================================

// Map a flat answers array onto the schema's themes, preserving order.
function mapAnswersToThemes(schema, answers) {
  const result = [];
  let cursor = 0;
  schema.themes.forEach(theme => {
    const count = theme.questions.length;
    const levels = answers.slice(cursor, cursor + count);
    cursor += count;
    result.push({ name: theme.name, questions: theme.questions, levels });
  });
  return result;
}

// Average of a list of 0/2 levels, normalised to 0-100.
function levelsToScore(levels) {
  if (!levels.length) return 0;
  const sum = levels.reduce((a, b) => a + b, 0);
  return Math.round((sum / (levels.length * 2)) * 100);
}

// Full computed assessment for a (schemaKey, answers) pair.
function computeAssessment(schemaKey, answers) {
  const schema = SCHEMAS[schemaKey];
  const themes = mapAnswersToThemes(schema, answers).map(t => ({
    name: t.name,
    questions: t.questions,
    levels: t.levels,
    score: levelsToScore(t.levels)
  }));
  const overall = levelsToScore(answers);
  return { schema, themes, overall };
}

// Sovereignty tier for colour-coding and labels.
function scoreTier(score) {
  if (score >= 75) return { key: "high",   label: "High sovereignty",     color: "#1E7A46" };
  if (score >= 50) return { key: "medium", label: "Moderate sovereignty", color: "#B8860B" };
  if (score >= 25) return { key: "low",    label: "Low sovereignty",      color: "#C86A1F" };
  return              { key: "critical", label: "Critical exposure",    color: "#B23A3A" };
}
