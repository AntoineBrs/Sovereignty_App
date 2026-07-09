// ============================================================================
// Scoring — derives sovereignty scores from questionnaire answers
// ----------------------------------------------------------------------------
// A raw answer is a level 0/1/2. A question score is level/2*100 (0-100).
// A theme score is the simple average of its question scores.
// There is no weighting: every question and every theme counts equally.
// The radar charts read these theme scores; the criteria ranking (explorer.js)
// works directly on the raw levels (0/1/2), not on these percentages.
// ============================================================================

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

// Full computed assessment for a (schemaKey, answers) pair.
function computeAssessment(schemaKey, answers) {
  const schema = SCHEMAS[schemaKey];
  const mapped = mapAnswersToThemes(schema, answers);

  const themes = mapped.map(t => {
    const qScores = t.levels.map(l => (l / 2) * 100);
    const score = qScores.length
      ? Math.round(qScores.reduce((a, b) => a + b, 0) / qScores.length)
      : 0;
    return { name: t.name, questions: t.questions, levels: t.levels, score };
  });

  return { schema, themes };
}
