import { SAFETY_BASE_SCORES, SEVERITIES, STATUSES } from '../types';

/**
 * Calculates the community impact bonus based on the number of reports.
 * 1 report = 0 bonus
 * 2–4 reports = +1 bonus
 * 5–9 reports = +2 bonus
 * 10+ reports = +3 bonus
 */
export function calculateCommunityBonus(reportCount) {
  if (!reportCount || reportCount <= 1) return 0;
  if (reportCount <= 4) return 1;
  if (reportCount <= 9) return 2;
  return 3;
}

/**
 * Calculates priority score guaranteeing Critical issues always rank above non-critical.
 * Composite score = (Safety Base * 10) + Community Impact Bonus.
 * Critical: 40-43
 * High:     30-33
 * Medium:   20-23
 * Low:      10-13
 */
export function calculatePriorityScore(severity, reportCount) {
  const baseScore = SAFETY_BASE_SCORES[severity] || 2;
  const bonus = calculateCommunityBonus(reportCount);
  return (baseScore * 10) + bonus;
}

/**
 * Generates an explainable priority reason breaking down Safety vs Community Impact.
 */
export function generatePriorityExplanation(severity, reportCount, bonus, location) {
  const isCritical = severity === SEVERITIES.CRITICAL;
  if (isCritical) {
    return `Critical Safety Priority: Life-safety hazard takes immediate precedence regardless of report count (${reportCount} report${reportCount > 1 ? 's' : ''}, +${bonus} bonus).`;
  }
  if (bonus > 0) {
    return `${severity} Base Safety + ${bonus > 0 ? `+${bonus}` : '0'} Community Bonus: Elevated due to ${reportCount} corroborated citizen reports at ${location?.split(',')[0] || 'site'}.`;
  }
  return `${severity} Base Safety (+0 Community Bonus): Single verified report awaiting field inspection.`;
}

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Helper to normalize and tokenize text for comparison.
 */
function tokenize(str) {
  if (!str) return [];
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['near', 'the', 'and', 'for', 'with', 'road', 'street', 'area'].includes(w));
}

/**
 * Compute Jaccard similarity between two token sets.
 */
function jaccardSimilarity(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Checks if two location strings refer to the same physical vicinity.
 */
export function areLocationsSimilar(locA, locB) {
  if (!locA || !locB) return false;
  const normA = locA.toLowerCase().trim();
  const normB = locB.toLowerCase().trim();

  // Exact or direct substring match
  if (normA === normB || normA.includes(normB) || normB.includes(normA)) {
    return true;
  }

  // Token overlap (e.g., "12th Main Indiranagar" vs "Indiranagar 12th Main Road")
  const tokensA = tokenize(normA);
  const tokensB = tokenize(normB);
  const sim = jaccardSimilarity(tokensA, tokensB);
  return sim >= 0.45; // Corroborating vicinity
}

/**
 * Evaluates whether a new complaint should be clustered into an existing Master Issue.
 * Rules:
 * - Must share the same category. (Unrelated categories are NEVER grouped together).
 * - Must be in the same vicinity (either coordinates within 350m or textual location match).
 * - Text must share civic keywords or topic overlap (do not group different problems merely because nearby).
 * - Never group unrelated or uncertain matches.
 */
export function findMatchingMasterIssue(newComplaint, masterIssues) {
  for (const master of masterIssues) {
    // 1. Mandatory category match
    if (master.category !== newComplaint.category) {
      continue;
    }

    // 2. Vicinity match (GPS coordinates OR textual location similarity)
    let isNearby = false;
    if (
      newComplaint.coordinates?.lat != null &&
      newComplaint.coordinates?.lng != null &&
      master.coordinates?.lat != null &&
      master.coordinates?.lng != null
    ) {
      const distanceKm = calculateHaversineDistanceKm(
        newComplaint.coordinates.lat,
        newComplaint.coordinates.lng,
        master.coordinates.lat,
        master.coordinates.lng
      );
      // Within ~350 meters on the map
      if (distanceKm <= 0.35) {
        isNearby = true;
      }
    }

    if (!isNearby) {
      isNearby = areLocationsSimilar(master.location, newComplaint.location);
    }

    if (!isNearby) {
      continue;
    }

    // 3. Text & problem context similarity - Do NOT group different problems merely because locations are nearby!
    const masterTokens = tokenize(master.title + ' ' + master.summary);
    const complaintTokens = tokenize(newComplaint.complaintText);
    const textSim = jaccardSimilarity(masterTokens, complaintTokens);

    // If locations match closely and they share category, check if text/keyword is reasonably aligned
    if (textSim >= 0.15 || (master.matchedKeyword && master.matchedKeyword === newComplaint.matchedKeyword)) {
      return master;
    }
  }

  return null;
}

/**
 * Re-computes master issue metrics after linking or updating complaints.
 */
export function recalculateMasterIssue(masterIssue, allTickets) {
  const linkedTickets = allTickets.filter(t => masterIssue.linkedTicketIds.includes(t.id));
  const reportCount = linkedTickets.length;
  const communityBonus = calculateCommunityBonus(reportCount);

  // Highest severity among linked tickets is preserved for safety
  const severityRank = {
    [SEVERITIES.CRITICAL]: 4,
    [SEVERITIES.HIGH]: 3,
    [SEVERITIES.MEDIUM]: 2,
    [SEVERITIES.LOW]: 1
  };

  let highestSeverity = masterIssue.severity;
  let highestReason = masterIssue.severityReason;

  for (const t of linkedTickets) {
    if ((severityRank[t.severity] || 0) > (severityRank[highestSeverity] || 0)) {
      highestSeverity = t.severity;
      highestReason = t.severityReason;
    }
  }

  const priorityScore = calculatePriorityScore(highestSeverity, reportCount);
  const priorityExplanation = generatePriorityExplanation(
    highestSeverity,
    reportCount,
    communityBonus,
    masterIssue.location
  );

  return {
    ...masterIssue,
    reportCount,
    communityBonus,
    severity: highestSeverity,
    severityReason: highestReason,
    priorityScore,
    priorityExplanation,
    updatedAt: new Date().toISOString()
  };
}
