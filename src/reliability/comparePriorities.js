const { analyzeRuns } = require('./analyzeRuns');
const { prioritizeTests } = require('./priorityFromDependencies');

/**
 * Contrast two descriptive orderings for investigation. No future outcomes,
 * ground-truth positives, or predictive performance are implied.
 */
function comparePriorities(records, dependencies, options = {}) {
  const ranked = prioritizeTests(records, dependencies, options);
  const stats = new Map(analyzeRuns(records).map(s => [s.testId, s]));
  const baseline = [...ranked].sort((a, b) => {
    const left = stats.get(a.testId);
    const right = stats.get(b.testId);
    // Tests with no executed observations sort after observed outcomes.
    if (!!left?.executed !== !!right?.executed) return right?.executed ? 1 : -1;
    const delta = (right?.failureRate ?? -1) - (left?.failureRate ?? -1);
    return delta || a.testId.localeCompare(b.testId);
  });
  const baselinePositions = new Map(baseline.map((item, index) => [item.testId, index + 1]));
  return {
    methodology: {
      baseline: 'Descending observed failure rate; unobserved tests last; alphabetical ties',
      heuristic: 'Existing manually mapped dependency score; not calibrated',
      limitation: 'Rank differences alone do not establish predictive benefit or accuracy'
    },
    ranking: ranked.map((item, index) => ({
      testId: item.testId,
      heuristicRank: index + 1,
      failureRateRank: baselinePositions.get(item.testId),
      rankDifference: baselinePositions.get(item.testId) - (index + 1),
      priorityScore: item.priorityScore,
      observedFailureRate: item.observedFailureRate,
      executed: item.executed,
      insufficientEvidence: item.insufficientEvidence,
      impactedComponents: item.impactedComponents
    })),
    baselineOrder: baseline.map(item => item.testId)
  };
}
module.exports = { comparePriorities };
