import React, { useState } from 'react';
import { STATUS_STEPS, STATUSES } from '../../types';
import { StatusBadge, SeverityBadge, CommunityBonusBadge } from '../common/Badge';
import { getTickets, getMasterIssues } from '../../services/storage';
import { 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  HardHat, 
  FileText, 
  Layers,
  Calendar,
  Building2
} from 'lucide-react';

export default function ComplaintTracker({ initialTicketId }) {
  const [searchId, setSearchId] = useState(initialTicketId || '');
  const [selectedTicket, setSelectedTicket] = useState(() => {
    const all = getTickets();
    if (initialTicketId) {
      return all.find(t => t.id.toLowerCase() === initialTicketId.toLowerCase()) || all[0] || null;
    }
    return all[0] || null;
  });

  const allTickets = getTickets();
  const allMasters = getMasterIssues();

  // Find linked master issue for selected ticket
  const linkedMaster = selectedTicket 
    ? allMasters.find(m => m.id === selectedTicket.masterIssueId || m.linkedTicketIds?.includes(selectedTicket.id))
    : null;

  // Real-time effective status is synced from master issue if available
  const effectiveStatus = linkedMaster ? linkedMaster.status : (selectedTicket?.status || STATUSES.SUBMITTED);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    const found = allTickets.find(t => t.id.toLowerCase() === searchId.trim().toLowerCase());
    if (found) {
      setSelectedTicket(found);
    } else {
      alert(`No complaint found with Ticket ID "${searchId}". Please verify the ID or pick from the recent list below.`);
    }
  };

  // Determine stage progress for 6-step timeline
  const getStepIndex = (status) => {
    switch (status) {
      case STATUSES.SUBMITTED: return 0;
      case STATUSES.UNDER_REVIEW: return 1;
      case STATUSES.ASSIGNED: return 2;
      case STATUSES.IN_PROGRESS: return 3;
      case STATUSES.AWAITING_VERIFICATION: return 4;
      case STATUSES.RESOLVED: return 5;
      default: return 0;
    }
  };

  const currentStepIndex = getStepIndex(effectiveStatus);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200">
        <h2 className="text-xl sm:text-2xl font-bold text-navy-950">Track Complaint Status</h2>
        <p className="text-sm text-slate-600 mt-1">
          Enter your unique Ticket ID to see real-time investigation, field worker dispatch, and municipal verification updates.
        </p>

        <form onSubmit={handleSearch} className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-teal-600" />
            </div>
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="e.g. TKT-2026-001 or TKT-..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 text-slate-900 font-mono text-sm uppercase"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Search Ticket</span>
          </button>
        </form>

        {/* Quick Ticket Picker Chips */}
        {allTickets.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 mr-2">Quick Inspect Available Tickets:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {allTickets.slice(0, 5).map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTicket(t);
                    setSearchId(t.id);
                  }}
                  className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition ${
                    selectedTicket?.id === t.id
                      ? 'bg-teal-600 text-white border-teal-700 font-bold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {t.id} ({t.category})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Ticket Tracking Details */}
      {selectedTicket ? (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Top Banner */}
          <div className="bg-gradient-to-r from-navy-900 to-navy-800 p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  Citizen Grievance Record
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(selectedTicket.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <h3 className="text-2xl font-bold font-mono tracking-tight mt-1 text-white">
                {selectedTicket.id}
              </h3>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <StatusBadge status={effectiveStatus} size="lg" />
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* 6-Stage Visual Workflow Tracker */}
            <div>
              <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                Redressal Progress Timeline
              </h4>

              <div className="relative">
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0">
                  <div 
                    className="h-full bg-teal-500 transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 relative z-10">
                  {STATUS_STEPS.map((step, idx) => {
                    const isDone = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    const isPending = idx > currentStepIndex;

                    return (
                      <div 
                        key={step.key}
                        className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                          isCurrent
                            ? 'bg-teal-50/80 border-teal-500 shadow-md ring-2 ring-teal-400'
                            : isDone
                            ? 'bg-slate-50 border-emerald-300 text-slate-700'
                            : 'bg-white border-slate-200 opacity-60 text-slate-400'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 ${
                          isDone 
                            ? 'bg-emerald-500 text-white' 
                            : isCurrent
                            ? 'bg-teal-600 text-white animate-pulse'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span className={`text-xs font-bold ${isCurrent ? 'text-teal-950' : 'text-slate-800'}`}>
                          {step.label}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-tight hidden lg:block">
                          {step.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grouped Master Issue Notification Box */}
            {linkedMaster && (
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-navy-950">
                        Linked Master Issue: <span className="font-mono text-teal-800">{linkedMaster.id}</span>
                      </span>
                      <CommunityBonusBadge bonus={linkedMaster.communityBonus} reportCount={linkedMaster.reportCount} />
                    </div>
                    <p className="text-xs text-slate-700 mt-0.5">
                      Your ticket is consolidated with {linkedMaster.reportCount} report{linkedMaster.reportCount > 1 ? 's' : ''} at {linkedMaster.location}. Status updates reflect coordinated municipal resolution.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Field Progress & Verification Updates */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                <HardHat className="w-4 h-4 text-teal-600" />
                Latest Field & Resolution Updates
              </h4>

              {linkedMaster?.assignedWorkerName ? (
                <div className="text-xs space-y-2 text-slate-700">
                  <div className="flex items-center gap-2">
                    <strong className="text-navy-950">Assigned Field Crew:</strong>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                      {linkedMaster.assignedWorkerName}
                    </span>
                    <span className="text-slate-500">({linkedMaster.assignedWorkerDepartment})</span>
                  </div>

                  {linkedMaster.workerNotes && (
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <strong className="text-navy-900 block text-xs mb-0.5">Field Worker Progress Log:</strong>
                      <p className="italic text-slate-800">"{linkedMaster.workerNotes}"</p>
                      {linkedMaster.completionPhoto && (
                        <div className="mt-2">
                          <span className="text-[11px] text-slate-500 block mb-1">On-site Verification Photo:</span>
                          <img
                            src={linkedMaster.completionPhoto}
                            alt="Repair completion evidence"
                            className="h-28 w-auto rounded-lg border object-cover shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {linkedMaster.adminVerificationNotes && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950">
                      <strong className="block text-xs font-bold text-emerald-900 mb-0.5">
                        Municipal Authority Physical Sign-off:
                      </strong>
                      <p className="italic">"{linkedMaster.adminVerificationNotes}"</p>
                      <span className="text-[10px] text-emerald-700 block mt-1">
                        Verified closed on {new Date(linkedMaster.resolvedAt || linkedMaster.updatedAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-600">
                  Complaint has been classified by local triage and queued for municipal zonal assignment.
                </p>
              )}
            </div>

            {/* Original Complaint Summary Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 block text-[11px]">Original Complaint Text:</span>
                  <p className="p-3 rounded-xl bg-slate-50 border text-slate-800 text-sm mt-1 whitespace-pre-wrap leading-relaxed font-sans">
                    {selectedTicket.complaintText}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Language:</span>
                  <span className="font-semibold text-slate-700">{selectedTicket.language}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 block text-[11px]">Incident Location:</span>
                  <div className="flex items-start gap-1.5 mt-1 text-slate-900 font-semibold text-sm">
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span>{selectedTicket.location}</span>
                      {selectedTicket.coordinates && (
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${selectedTicket.coordinates.lat}&mlon=${selectedTicket.coordinates.lng}#map=17/${selectedTicket.coordinates.lat}/${selectedTicket.coordinates.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-700 hover:text-teal-900 underline font-mono text-[11px] block mt-0.5 font-normal"
                        >
                          View GPS on OpenStreetMap ({selectedTicket.coordinates.lat.toFixed(4)}, {selectedTicket.coordinates.lng.toFixed(4)}) ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Category:</span>
                    <strong className="text-navy-950">{selectedTicket.category}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Severity:</span>
                    <div className="mt-0.5">
                      <SeverityBadge severity={selectedTicket.severity} />
                    </div>
                  </div>
                </div>

                {selectedTicket.photo && (
                  <div>
                    <span className="text-slate-500 block text-[11px] mb-1">Attached Complaint Photo:</span>
                    <img
                      src={selectedTicket.photo}
                      alt="Citizen evidence photo"
                      className="h-28 w-auto rounded-lg border object-cover shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-navy-950">No complaints have been submitted yet.</h4>
          <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
            Once you submit a grievance through the citizen portal, your unique tracking ID will appear here with live updates from municipal inspection.
          </p>
        </div>
      )}
    </div>
  );
}
