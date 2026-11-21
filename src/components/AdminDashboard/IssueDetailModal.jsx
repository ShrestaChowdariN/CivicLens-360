import React, { useState } from 'react';
import Modal from '../common/Modal';
import { SeverityBadge, StatusBadge, CommunityBonusBadge } from '../common/Badge';
import { STATUSES, SEVERITIES } from '../../types';
import { assignWorkerToMasterIssue, verifyAndResolveIssue, getTickets, getWorkers } from '../../services/storage';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Layers, 
  ShieldAlert, 
  HardHat, 
  UserPlus, 
  CheckCircle2, 
  FileText,
  AlertTriangle,
  Flame,
  Phone,
  Eye,
  Camera
} from 'lucide-react';

export default function IssueDetailModal({
  isOpen,
  onClose,
  masterIssue,
  onIssueUpdated
}) {
  if (!masterIssue) return null;

  const allTickets = getTickets();
  const allWorkers = getWorkers();

  // Filter linked tickets for this master issue
  const linkedTickets = allTickets.filter(t => 
    masterIssue.linkedTicketIds?.includes(t.id) || t.masterIssueId === masterIssue.id
  );

  const [selectedWorkerId, setSelectedWorkerId] = useState(masterIssue.assignedWorkerId || '');
  const [adminNotes, setAdminNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Filter workers compatible with this department, or allow all workers
  const departmentWorkers = allWorkers.filter(w => 
    w.category === masterIssue.category || w.department === masterIssue.department
  );
  const otherWorkers = allWorkers.filter(w => !departmentWorkers.includes(w));

  const handleAssignWorker = (e) => {
    e.preventDefault();
    if (!selectedWorkerId) return;

    setIsAssigning(true);
    const result = assignWorkerToMasterIssue(masterIssue.id, selectedWorkerId);
    setIsAssigning(false);

    if (result.success) {
      if (onIssueUpdated) onIssueUpdated(result.updatedIssue);
    } else {
      alert('Failed to assign worker: ' + result.error);
    }
  };

  const handleVerifyAndResolve = () => {
    setIsVerifying(true);
    const result = verifyAndResolveIssue(masterIssue.id, adminNotes);
    setIsVerifying(false);

    if (result.success) {
      if (onIssueUpdated) onIssueUpdated(result.updatedIssue);
    } else {
      alert('Verification failed: ' + result.error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Master Issue Details: ${masterIssue.id}`} maxWidth="max-w-4xl">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                {masterIssue.category}
              </span>
              <h3 className="text-xl font-bold text-navy-950 mt-1">
                {masterIssue.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 flex-wrap">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{masterIssue.location}</span>
                {masterIssue.coordinates && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${masterIssue.coordinates.lat}&mlon=${masterIssue.coordinates.lng}#map=17/${masterIssue.coordinates.lat}/${masterIssue.coordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-700 hover:text-teal-900 underline font-mono text-[11px] inline-flex items-center gap-0.5"
                  >
                    [OSM: {masterIssue.coordinates.lat.toFixed(4)}, {masterIssue.coordinates.lng.toFixed(4)}] ↗
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={masterIssue.severity} size="lg" />
              <StatusBadge status={masterIssue.status} size="lg" />
            </div>
          </div>
        </div>

        {/* Community Impact Intelligence Engine Breakdown (Main Innovation) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-800 text-white shadow-md">
          <div className="flex items-center justify-between mb-3 border-b border-navy-700 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-400" />
              <h4 className="text-sm font-bold tracking-tight text-white uppercase">
                Community Impact Intelligence Breakdown
              </h4>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Score: {masterIssue.priorityScore}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center my-3">
            <div className="p-2.5 rounded-xl bg-navy-950/60 border border-navy-700/60">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Safety Base</span>
              <span className="text-lg font-bold text-amber-300">
                {masterIssue.severity === SEVERITIES.CRITICAL ? '4 / 4' : masterIssue.severity === SEVERITIES.HIGH ? '3 / 4' : masterIssue.severity === SEVERITIES.MEDIUM ? '2 / 4' : '1 / 4'}
              </span>
              <span className="text-[10px] text-slate-400 block">{masterIssue.severity}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-navy-950/60 border border-navy-700/60">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Linked Volume</span>
              <span className="text-lg font-bold text-teal-300">{masterIssue.reportCount}</span>
              <span className="text-[10px] text-slate-400 block">Reports (Non-deduped)</span>
            </div>

            <div className="p-2.5 rounded-xl bg-navy-950/60 border border-navy-700/60">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Community Bonus</span>
              <span className="text-lg font-bold text-emerald-300">+{masterIssue.communityBonus}</span>
              <span className="text-[10px] text-slate-400 block">
                {masterIssue.reportCount >= 10 ? '10+ reports (+3)' : masterIssue.reportCount >= 5 ? '5-9 reports (+2)' : masterIssue.reportCount >= 2 ? '2-4 reports (+1)' : 'Single report (0)'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-navy-950/60 border border-navy-700/60">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Priority Rank</span>
              <span className="text-lg font-bold text-white">
                {masterIssue.severity === SEVERITIES.CRITICAL ? '#1 Top (Life Safety)' : `#${masterIssue.priorityScore} P-Index`}
              </span>
              <span className="text-[10px] text-teal-400 block">Guaranteed Hierarchy</span>
            </div>
          </div>

          <div className="mt-3 p-3 rounded-lg bg-navy-950/80 border border-navy-700/80 text-xs text-slate-200">
            <strong className="text-teal-300 font-semibold block mb-0.5">Priority Logic:</strong>
            <p className="italic">{masterIssue.priorityExplanation}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              * Critical safety hazards remain strictly prioritized above non-critical issues, even those with high report counts.
            </p>
          </div>
        </div>

        {/* Worker Assignment & Re-assignment Section */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-purple-600" />
              <span>Field Worker Assignment & Dispatch</span>
            </h4>
            {masterIssue.assignedWorkerName && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Assigned: {masterIssue.assignedWorkerName}
              </span>
            )}
          </div>

          {masterIssue.assignedWorkerName ? (
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <strong className="text-purple-950 font-bold text-sm block">
                  {masterIssue.assignedWorkerName}
                </strong>
                <span className="text-purple-800">{masterIssue.assignedWorkerDepartment}</span>
                {masterIssue.assignedWorkerPhone && (
                  <div className="flex items-center gap-1.5 text-slate-600 mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{masterIssue.assignedWorkerPhone}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Worker Status:</span>
                <span className="font-semibold text-navy-900">
                  {masterIssue.status === STATUSES.IN_PROGRESS 
                    ? 'Active on Site' 
                    : masterIssue.status === STATUSES.AWAITING_VERIFICATION 
                    ? 'Work Submitted (Awaiting Verification)' 
                    : masterIssue.status === STATUSES.RESOLVED 
                    ? 'Work Verified Resolved' 
                    : 'Dispatch Pending'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              ⚠️ No field worker currently assigned. Please select a compatible department worker below to initiate field dispatch.
            </p>
          )}

          {/* Assignment Dropdown Form */}
          <form onSubmit={handleAssignWorker} className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:border-teal-500 focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">-- Select Worker to Assign / Reassign --</option>
              <optgroup label={`Recommended for ${masterIssue.department}`}>
                {departmentWorkers.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.department} - {w.zone})
                  </option>
                ))}
              </optgroup>
              {otherWorkers.length > 0 && (
                <optgroup label="Other Municipal Department Crews">
                  {otherWorkers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.department} - {w.zone})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <button
              type="submit"
              disabled={isAssigning || !selectedWorkerId}
              className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{masterIssue.assignedWorkerName ? 'Reassign Worker' : 'Assign & Dispatch'}</span>
            </button>
          </form>
        </div>

        {/* Verification & Resolution Section (When Awaiting Verification) */}
        {masterIssue.status === STATUSES.AWAITING_VERIFICATION && (
          <div className="p-5 rounded-2xl bg-teal-50 border-2 border-teal-500 shadow-md space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-700" />
              <h4 className="text-sm font-bold text-teal-950 uppercase tracking-tight">
                Field Work Submitted — Municipal Verification Required
              </h4>
            </div>

            <p className="text-xs text-slate-700">
              The assigned field worker has marked their on-site repair completed. Before closing the issue, verify repair quality and sign off.
            </p>

            {masterIssue.workerNotes && (
              <div className="p-3 bg-white rounded-xl border border-teal-200 text-xs text-slate-800">
                <strong className="block text-navy-950 font-semibold mb-0.5">Worker Completion Notes:</strong>
                <p className="italic">"{masterIssue.workerNotes}"</p>
                {masterIssue.completionPhoto && (
                  <div className="mt-2">
                    <span className="text-[11px] text-slate-500 block mb-1">Worker Completion Photo:</span>
                    <img 
                      src={masterIssue.completionPhoto} 
                      alt="Work Completion" 
                      className="h-32 w-auto rounded-lg border object-cover shadow-sm"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 space-y-2">
              <label htmlFor="admin-notes" className="block text-xs font-bold text-navy-900">
                Municipal Inspection Sign-off Notes:
              </label>
              <input
                id="admin-notes"
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Inspected by Zonal Engineer. Surface compacted and safe for public use."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-teal-500 focus:ring-2 focus:ring-teal-500 bg-white"
              />
              <button
                type="button"
                onClick={handleVerifyAndResolve}
                disabled={isVerifying}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify and Mark Issue RESOLVED</span>
              </button>
            </div>
          </div>
        )}

        {/* Resolved Banner */}
        {masterIssue.status === STATUSES.RESOLVED && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-sm block">Issue Formally Resolved & Closed</strong>
              <p className="mt-0.5">
                {masterIssue.adminVerificationNotes || 'Inspected and verified satisfactory resolution on site.'}
              </p>
              <span className="text-[10px] text-emerald-700 block mt-1">
                All {linkedTickets.length} linked citizen tickets have been synchronized to RESOLVED.
              </span>
            </div>
          </div>
        )}

        {/* Related Complaints Drawer (Every Individual Citizen Report Preserved!) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Preserved Individual Citizen Reports ({linkedTickets.length})</span>
            </h4>
            <span className="text-xs text-slate-500">
              Zero complaint loss — every original voice is archived
            </span>
          </div>

          <div className="space-y-3">
            {linkedTickets.map((t, idx) => (
              <div key={t.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded">
                      {t.id}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="font-medium text-slate-700">Language: {t.language}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {new Date(t.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>

                <p className="text-slate-900 text-sm whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-200">
                  {t.complaintText}
                </p>

                {t.photo && (
                  <div className="pt-1">
                    <span className="text-[11px] text-slate-500 block mb-1">Citizen Evidence Photo:</span>
                    <img 
                      src={t.photo} 
                      alt="Citizen evidence" 
                      className="h-24 w-auto rounded-lg border object-cover shadow-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
