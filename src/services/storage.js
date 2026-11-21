import { DEMO_WORKERS, STATUSES, SEVERITIES, CATEGORIES, DEPARTMENTS } from '../types';
import { calculatePriorityScore, calculateCommunityBonus, generatePriorityExplanation, recalculateMasterIssue } from './communityGrouping';
import { INITIAL_DEMO_DATA } from '../data/demoData';
import { 
  isSupabaseConfigured, 
  insertComplaintToBackend, 
  upsertMasterIssueToBackend,
  fetchComplaintsFromBackend,
  fetchMasterIssuesFromBackend
} from './supabase';

const KEYS = {
  TICKETS: 'civiclens_tickets_v1',
  MASTER_ISSUES: 'civiclens_master_issues_v1',
  WORKERS: 'civiclens_workers_v1',
  AUDIT_LOGS: 'civiclens_audit_logs_v1',
  CURRENT_ROLE: 'civiclens_current_role_v1',
  ACTIVE_WORKER_ID: 'civiclens_active_worker_id_v1',
  DEMO_LOADED_FLAG: 'civiclens_demo_loaded_flag_v1'
};

/**
 * Safely parse JSON from localStorage
 */
function safeGet(key, fallback = []) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error(`Failed to read ${key} from localStorage:`, err);
    return fallback;
  }
}

/**
 * Safely save JSON to localStorage with QuotaExceeded fallback
 */
function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { success: true };
  } catch (err) {
    console.error(`Failed to write ${key} to localStorage:`, err);
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      return {
        success: false,
        error: 'Storage limit reached. Please remove old complaints or upload smaller photos.'
      };
    }
    return { success: false, error: err.message };
  }
}

/**
 * Resizes and compresses an image data URL using Canvas to prevent localStorage saturation.
 */
export function compressImage(file, maxWidth = 720, maxHeight = 720, quality = 0.65) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file format'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Helper to identify whether a ticket or issue originated from demonstration seed
 */
export function isDemoItem(item) {
  if (!item) return false;
  if (item.isDemo === true || item.origin === 'demo') return true;
  // Legacy sample ticket and issue IDs
  if (typeof item.id === 'string' && (item.id.startsWith('TKT-2026-') || item.id.startsWith('ISS-2026-10'))) {
    return true;
  }
  return false;
}

/**
 * Automatically purges legacy sample records from previous sessions
 * Ensures fresh start displays ZERO complaints on startup.
 */
export function purgeLegacySeededData() {
  const allTickets = safeGet(KEYS.TICKETS, []);
  const allMasters = safeGet(KEYS.MASTER_ISSUES, []);

  const genuineTickets = allTickets.filter(t => !isDemoItem(t));
  const genuineMasters = allMasters.filter(m => !isDemoItem(m));

  safeSet(KEYS.TICKETS, genuineTickets);
  safeSet(KEYS.MASTER_ISSUES, genuineMasters);
  try {
    localStorage.removeItem(KEYS.DEMO_LOADED_FLAG);
  } catch {}

  return { genuineTickets, genuineMasters };
}

// Execute purge on module load to guarantee zero complaints on startup
if (typeof window !== 'undefined') {
  purgeLegacySeededData();
}

// Data getters
export function getTickets() {
  // If Supabase is connected, the app fetches live records directly via fetchComplaintsFromBackend()
  const tickets = safeGet(KEYS.TICKETS, []);
  return tickets.filter(t => !isDemoItem(t));
}

export function getMasterIssues() {
  const masters = safeGet(KEYS.MASTER_ISSUES, []);
  return masters.filter(m => !isDemoItem(m));
}

export function getWorkers() {
  const stored = safeGet(KEYS.WORKERS, null);
  if (!stored || stored.length === 0) {
    safeSet(KEYS.WORKERS, DEMO_WORKERS);
    return DEMO_WORKERS;
  }
  return stored;
}

export function getAuditLogs() {
  return safeGet(KEYS.AUDIT_LOGS, []);
}

export function addAuditLog(action, details, actor = 'System') {
  const logs = getAuditLogs();
  const entry = {
    id: `LOG-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    action,
    details,
    actor
  };
  logs.unshift(entry);
  safeSet(KEYS.AUDIT_LOGS, logs.slice(0, 100)); // retain last 100 logs
}

/**
 * Checks if demo data is currently loaded
 */
export function hasDemoDataLoaded() {
  const tickets = safeGet(KEYS.TICKETS, []);
  const masters = safeGet(KEYS.MASTER_ISSUES, []);
  return tickets.some(isDemoItem) || masters.some(isDemoItem);
}

/**
 * Loads demonstration dataset explicitly when the user clicks "Load Demo Data".
 * Preserves all genuine citizen complaints already filed.
 * Never called automatically!
 */
export function loadDemoData() {
  const existingTickets = safeGet(KEYS.TICKETS, []);
  const existingMasters = safeGet(KEYS.MASTER_ISSUES, []);

  // Filter out any older demo data first to prevent duplicate demo entries
  const genuineTickets = existingTickets.filter(t => !isDemoItem(t));
  const genuineMasters = existingMasters.filter(m => !isDemoItem(m));

  const demo = INITIAL_DEMO_DATA();

  const combinedTickets = [...demo.tickets, ...genuineTickets];
  const combinedMasters = [...demo.masterIssues, ...genuineMasters];

  safeSet(KEYS.TICKETS, combinedTickets);
  safeSet(KEYS.MASTER_ISSUES, combinedMasters);
  safeSet(KEYS.WORKERS, DEMO_WORKERS);
  try {
    localStorage.setItem(KEYS.DEMO_LOADED_FLAG, 'true');
  } catch {}

  addAuditLog(
    'DEMO_DATA_LOADED',
    `Loaded ${demo.tickets.length} sample complaints and ${demo.masterIssues.length} master issues for hackathon demonstration.`,
    'Admin/Evaluator'
  );

  return { tickets: combinedTickets, masterIssues: combinedMasters };
}

/**
 * Resets/Clears Demo Data without deleting genuine citizen complaints.
 * Recalculates master issues based solely on remaining genuine citizen tickets.
 */
export function resetDemoData() {
  const allTickets = safeGet(KEYS.TICKETS, []);
  const allMasters = safeGet(KEYS.MASTER_ISSUES, []);

  // 1. Keep ONLY genuine citizen tickets
  const genuineTickets = allTickets.filter(t => !isDemoItem(t));

  // 2. Filter master issues
  const genuineMasters = [];

  for (const master of allMasters) {
    if (isDemoItem(master) && !master.linkedTicketIds.some(id => genuineTickets.some(t => t.id === id))) {
      continue;
    }

    const remainingLinkedIds = (master.linkedTicketIds || []).filter(id => 
      genuineTickets.some(t => t.id === id)
    );

    if (remainingLinkedIds.length > 0) {
      const updatedMaster = recalculateMasterIssue(
        { ...master, linkedTicketIds: remainingLinkedIds, isDemo: false },
        genuineTickets
      );
      genuineMasters.push(updatedMaster);
    }
  }

  safeSet(KEYS.TICKETS, genuineTickets);
  safeSet(KEYS.MASTER_ISSUES, genuineMasters);
  try {
    localStorage.removeItem(KEYS.DEMO_LOADED_FLAG);
  } catch {}

  addAuditLog(
    'DEMO_DATA_RESET',
    `Cleared demonstration complaints. Preserved ${genuineTickets.length} genuine citizen complaints.`,
    'Admin/Evaluator'
  );

  return { tickets: genuineTickets, masterIssues: genuineMasters };
}

/**
 * Saves a new citizen ticket and either links to an existing master issue or creates a new one.
 * Always marks as genuine citizen origin (isDemo: false).
 * Syncs to Supabase if configured.
 */
export async function registerComplaint(ticketData, matchedMasterIssue = null) {
  const allTickets = safeGet(KEYS.TICKETS, []);
  const allMasterIssues = safeGet(KEYS.MASTER_ISSUES, []);

  // 1. Create unique Ticket ID
  const ticketId = `TKT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const newTicket = {
    ...ticketData,
    id: ticketId,
    status: matchedMasterIssue ? matchedMasterIssue.status : STATUSES.SUBMITTED,
    createdAt: new Date().toISOString(),
    isDemo: false,
    origin: 'citizen'
  };

  allTickets.unshift(newTicket);
  safeSet(KEYS.TICKETS, allTickets);

  // 2. Handle Master Issue Grouping
  let targetMasterIssueId = null;
  let targetMasterIssueObj = null;

  if (matchedMasterIssue) {
    // Group into existing master issue
    targetMasterIssueId = matchedMasterIssue.id;
    const masterIndex = allMasterIssues.findIndex(m => m.id === matchedMasterIssue.id);

    if (masterIndex >= 0) {
      const existing = allMasterIssues[masterIndex];
      const updatedLinkedTicketIds = [...new Set([...existing.linkedTicketIds, newTicket.id])];
      const newReportCount = updatedLinkedTicketIds.length;
      const newCommunityBonus = calculateCommunityBonus(newReportCount);

      // Determine highest severity
      const severityOrder = [SEVERITIES.LOW, SEVERITIES.MEDIUM, SEVERITIES.HIGH, SEVERITIES.CRITICAL];
      const existingIndex = severityOrder.indexOf(existing.severity);
      const newIndex = severityOrder.indexOf(newTicket.severity);
      const effectiveSeverity = newIndex > existingIndex ? newTicket.severity : existing.severity;
      const effectiveReason = newIndex > existingIndex ? newTicket.severityReason : existing.severityReason;

      const updatedScore = calculatePriorityScore(effectiveSeverity, newReportCount);
      const updatedExplanation = generatePriorityExplanation(
        effectiveSeverity,
        newReportCount,
        newCommunityBonus,
        existing.location
      );

      targetMasterIssueObj = {
        ...existing,
        linkedTicketIds: updatedLinkedTicketIds,
        reportCount: newReportCount,
        communityBonus: newCommunityBonus,
        severity: effectiveSeverity,
        severityReason: effectiveReason,
        priorityScore: updatedScore,
        priorityExplanation: updatedExplanation,
        lastReportAt: newTicket.createdAt,
        updatedAt: new Date().toISOString(),
        isDemo: false
      };
      allMasterIssues[masterIndex] = targetMasterIssueObj;
    }
  } else {
    // Create new Master Issue
    const issueId = `ISS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    targetMasterIssueId = issueId;
    const reportCount = 1;
    const communityBonus = 0;
    const priorityScore = calculatePriorityScore(newTicket.severity, reportCount);
    const priorityExplanation = generatePriorityExplanation(
      newTicket.severity,
      reportCount,
      communityBonus,
      newTicket.location
    );

    targetMasterIssueObj = {
      id: issueId,
      title: `${newTicket.category}: ${newTicket.complaintText.slice(0, 45)}...`,
      summary: newTicket.complaintText,
      category: newTicket.category,
      department: newTicket.department,
      location: newTicket.location,
      coordinates: newTicket.coordinates || null,
      severity: newTicket.severity,
      severityReason: newTicket.severityReason,
      reportCount: 1,
      communityBonus: 0,
      priorityScore,
      priorityExplanation,
      status: STATUSES.SUBMITTED,
      linkedTicketIds: [newTicket.id],
      assignedWorkerId: null,
      assignedWorkerName: null,
      workerNotes: null,
      completionPhoto: null,
      firstReportedAt: newTicket.createdAt,
      lastReportAt: newTicket.createdAt,
      updatedAt: new Date().toISOString(),
      matchedKeyword: newTicket.matchedKeyword || '',
      isDemo: false,
      origin: 'citizen'
    };

    allMasterIssues.unshift(targetMasterIssueObj);
  }

  // Link ticket back to master issue
  newTicket.masterIssueId = targetMasterIssueId;
  safeSet(KEYS.TICKETS, allTickets);
  safeSet(KEYS.MASTER_ISSUES, allMasterIssues);

  // Sync to Supabase if backend is configured
  if (isSupabaseConfigured()) {
    try {
      await insertComplaintToBackend(newTicket);
      if (targetMasterIssueObj) {
        await upsertMasterIssueToBackend(targetMasterIssueObj);
      }
    } catch (err) {
      console.warn('Background Supabase sync notice:', err.message);
    }
  }

  addAuditLog(
    'COMPLAINT_FILED',
    `Ticket ${newTicket.id} filed (${newTicket.category} at ${newTicket.location}) linked to Master Issue ${targetMasterIssueId}`,
    'Citizen'
  );

  return { ticket: newTicket, masterIssueId: targetMasterIssueId };
}

/**
 * Assigns a field worker to a Master Issue (Admin Action)
 */
export async function assignWorkerToMasterIssue(issueId, workerId) {
  const issues = safeGet(KEYS.MASTER_ISSUES, []);
  const workers = getWorkers();
  const tickets = safeGet(KEYS.TICKETS, []);

  const issueIndex = issues.findIndex(i => i.id === issueId);
  const worker = workers.find(w => w.id === workerId);

  if (issueIndex === -1 || !worker) {
    return { success: false, error: 'Issue or Worker not found' };
  }

  const issue = issues[issueIndex];
  const newStatus = issue.status === STATUSES.SUBMITTED || issue.status === STATUSES.UNDER_REVIEW 
    ? STATUSES.ASSIGNED 
    : issue.status;

  issues[issueIndex] = {
    ...issue,
    assignedWorkerId: worker.id,
    assignedWorkerName: worker.name,
    assignedWorkerPhone: worker.phone,
    assignedWorkerDepartment: worker.department,
    status: newStatus,
    updatedAt: new Date().toISOString()
  };

  const updatedTickets = tickets.map(t => {
    if (issue.linkedTicketIds.includes(t.id)) {
      return { ...t, status: newStatus };
    }
    return t;
  });

  safeSet(KEYS.MASTER_ISSUES, issues);
  safeSet(KEYS.TICKETS, updatedTickets);

  if (isSupabaseConfigured()) {
    try {
      await upsertMasterIssueToBackend(issues[issueIndex]);
    } catch (err) {
      console.warn('Backend assign worker sync notice:', err.message);
    }
  }

  addAuditLog(
    'WORKER_ASSIGNED',
    `Master Issue ${issueId} assigned to ${worker.name} (${worker.department})`,
    'Municipal Admin'
  );

  return { success: true, updatedIssue: issues[issueIndex] };
}

/**
 * Updates worker progress (Worker Action)
 * When worker completes work, moves to Awaiting Verification (NOT resolved!)
 */
export async function updateWorkerProgress(issueId, newStatus, notes = '', completionPhoto = null) {
  const issues = safeGet(KEYS.MASTER_ISSUES, []);
  const tickets = safeGet(KEYS.TICKETS, []);

  const issueIndex = issues.findIndex(i => i.id === issueId);
  if (issueIndex === -1) {
    return { success: false, error: 'Issue not found' };
  }

  const issue = issues[issueIndex];

  let actualStatus = newStatus;
  if (newStatus === 'COMPLETED' || newStatus === STATUSES.AWAITING_VERIFICATION) {
    actualStatus = STATUSES.AWAITING_VERIFICATION;
  }

  issues[issueIndex] = {
    ...issue,
    status: actualStatus,
    workerNotes: notes || issue.workerNotes,
    completionPhoto: completionPhoto || issue.completionPhoto,
    completedAt: actualStatus === STATUSES.AWAITING_VERIFICATION ? new Date().toISOString() : issue.completedAt,
    updatedAt: new Date().toISOString()
  };

  const updatedTickets = tickets.map(t => {
    if (issue.linkedTicketIds.includes(t.id)) {
      return { ...t, status: actualStatus };
    }
    return t;
  });

  safeSet(KEYS.MASTER_ISSUES, issues);
  safeSet(KEYS.TICKETS, updatedTickets);

  if (isSupabaseConfigured()) {
    try {
      await upsertMasterIssueToBackend(issues[issueIndex]);
    } catch (err) {
      console.warn('Backend worker progress sync notice:', err.message);
    }
  }

  addAuditLog(
    'WORKER_STATUS_UPDATE',
    `Issue ${issueId} updated to status "${actualStatus}" by ${issue.assignedWorkerName || 'Field Worker'}. Notes: "${notes || 'None'}"`,
    'Field Worker'
  );

  return { success: true, updatedIssue: issues[issueIndex] };
}

/**
 * Verifies and Marks Resolved (Admin Action)
 */
export async function verifyAndResolveIssue(issueId, adminNotes = '') {
  const issues = safeGet(KEYS.MASTER_ISSUES, []);
  const tickets = safeGet(KEYS.TICKETS, []);

  const issueIndex = issues.findIndex(i => i.id === issueId);
  if (issueIndex === -1) {
    return { success: false, error: 'Issue not found' };
  }

  const issue = issues[issueIndex];
  issues[issueIndex] = {
    ...issue,
    status: STATUSES.RESOLVED,
    adminVerificationNotes: adminNotes || 'Inspected and verified satisfactory resolution on site.',
    resolvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedTickets = tickets.map(t => {
    if (issue.linkedTicketIds.includes(t.id)) {
      return { ...t, status: STATUSES.RESOLVED };
    }
    return t;
  });

  safeSet(KEYS.MASTER_ISSUES, issues);
  safeSet(KEYS.TICKETS, updatedTickets);

  if (isSupabaseConfigured()) {
    try {
      await upsertMasterIssueToBackend(issues[issueIndex]);
    } catch (err) {
      console.warn('Backend verify & resolve sync notice:', err.message);
    }
  }

  addAuditLog(
    'ISSUE_RESOLVED',
    `Master Issue ${issueId} verified and marked RESOLVED by Municipal Admin. Notes: "${adminNotes || 'Satisfactory'}"`,
    'Municipal Admin'
  );

  return { success: true, updatedIssue: issues[issueIndex] };
}

/**
 * Resets storage to completely clean state
 */
export function clearAllStorage() {
  localStorage.removeItem(KEYS.TICKETS);
  localStorage.removeItem(KEYS.MASTER_ISSUES);
  localStorage.removeItem(KEYS.WORKERS);
  localStorage.removeItem(KEYS.AUDIT_LOGS);
  localStorage.removeItem(KEYS.DEMO_LOADED_FLAG);
}
