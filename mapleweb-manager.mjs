/**
 * MapleWeb AI Manager: pricing and publishing safety rules.
 * This module does not publish, charge, or connect to AI services.
 */
export const PRICING_CAD = Object.freeze([
  Object.freeze({ id: 1, label: 'Simple website, 1–2 pages', min: 500, max: 800 }),
  Object.freeze({ id: 2, label: 'Simple website, 3–5 pages', min: 900, max: 1500 }),
  Object.freeze({ id: 3, label: 'Professional website, 5–7 pages', min: 1500, max: 2200 }),
  Object.freeze({ id: 4, label: 'Professional custom design', min: 2300, max: 3000 }),
  Object.freeze({ id: 5, label: 'Advanced booking or payment', min: 3000, max: 4500 }),
  Object.freeze({ id: 6, label: 'Online store or integrations', min: 4500, max: 7000 }),
]);

export function matchingPriceRanges(budget) {
  if (!Number.isFinite(budget) || budget < 0) return [];
  return PRICING_CAD.filter(({ min, max }) => budget >= min && budget <= max);
}

const integerVersion = value => Number.isSafeInteger(value) && value >= 1;

export function assessPublication(project) {
  const reasons = [];
  if (!project || typeof project !== 'object' || Array.isArray(project)) {
    return { readyForOwnerDecision: false, reasons: ['Missing project record'] };
  }
  const version = project.currentVersion;
  if (!integerVersion(version)) reasons.push('No valid current draft version');
  if (project.previewVerified !== true) reasons.push('Current preview has not been verified');
  if (project.customerApprovedVersion !== version || !integerVersion(project.customerApprovedVersion)) {
    reasons.push('Customer approval does not match the current version');
  }
  if (project.ownerApprovedVersion !== version || !integerVersion(project.ownerApprovedVersion)) {
    reasons.push('Owner approval does not match the current version');
  }
  if (!Array.isArray(project.revisionRequests)) {
    reasons.push('Revision request status cannot be verified');
  } else if (project.revisionRequests.some(r => !r || r.status !== 'resolved')) {
    reasons.push('Unresolved or unverified customer revision requests');
  }
  if (project.securityCheckPassed !== true) reasons.push('Security check not confirmed');
  return { readyForOwnerDecision: reasons.length === 0, reasons };
}

export function projectStatusReport(project) {
  const gate = assessPublication(project);
  return {
    projectId: typeof project?.id === 'string' ? project.id : null,
    currentVersion: integerVersion(project?.currentVersion) ? project.currentVersion : null,
    status: gate.readyForOwnerDecision ? 'AWAITING_EXPLICIT_OWNER_PUBLISH_ACTION' : 'ON_HOLD',
    blockers: gate.reasons,
    published: project?.published === true,
    note: 'This is a local rule report, not a Cloudflare deployment or an AI action.',
  };
}
