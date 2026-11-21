import React, { useState, useRef } from 'react';
import { STATUSES, SEVERITIES } from '../../types';
import { SeverityBadge, StatusBadge, CommunityBonusBadge } from '../common/Badge';
import { updateWorkerProgress, compressImage, getTickets } from '../../services/storage';
import { 
  HardHat, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Upload, 
  X, 
  Phone, 
  Building2, 
  Play, 
  Send, 
  AlertCircle,
  FileText,
  Camera,
  Layers
} from 'lucide-react';

export default function FieldWorkerDashboard({
  workers,
  activeWorkerId,
  onWorkerChange,
  masterIssues,
  onIssueUpdated
}) {
  const activeWorker = workers.find(w => w.id === activeWorkerId) || workers[0];
  const allTickets = getTickets();

  // Filter master issues assigned ONLY to this active worker
  const assignedIssues = masterIssues.filter(m => m.assignedWorkerId === activeWorker?.id);

  // Local state for completion workflow
  const [activeFormIssueId, setActiveFormIssueId] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Handle Start Job -> Mark In Progress
  const handleMarkInProgress = (issueId) => {
    const result = updateWorkerProgress(issueId, STATUSES.IN_PROGRESS, 'Field crew arrived on site; maintenance initiated.');
    if (result.success) {
      if (onIssueUpdated) onIssueUpdated(result.updatedIssue);
    } else {
      alert('Error updating progress: ' + result.error);
    }
  };

  // Handle Photo selection
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressed = await compressImage(file, 800, 800, 0.7);
      setCompletionPhoto(compressed);
    } catch (err) {
      console.error(err);
      alert('Error processing photo: ' + err.message);
    } finally {
      setIsCompressing(false);
    }
  };

  const removePhoto = () => {
    setCompletionPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Submit Work Completed -> Awaiting Verification
  const handleSubmitCompletion = (issueId) => {
    if (!completionNotes.trim()) {
      alert('Please enter repair completion notes for municipal verification.');
      return;
    }

    setIsSubmitting(true);
    // Explicitly enforce that completing work moves to AWAITING_VERIFICATION (not Resolved!)
    const result = updateWorkerProgress(
      issueId,
      STATUSES.AWAITING_VERIFICATION,
      completionNotes.trim(),
      completionPhoto
    );
    setIsSubmitting(false);

    if (result.success) {
      setActiveFormIssueId(null);
      setCompletionNotes('');
      setCompletionPhoto(null);
      if (onIssueUpdated) onIssueUpdated(result.updatedIssue);
    } else {
      alert('Failed to submit work: ' + result.error);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Worker Switcher & Profile Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-lg">
              <HardHat className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  Field Personnel Console
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-mono font-bold">{activeWorker?.id}</span>
              </div>
              <h2 className="text-2xl font-bold text-navy-950 mt-0.5">
                {activeWorker?.name}
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                {activeWorker?.department} • {activeWorker?.zone}
              </p>
            </div>
          </div>

          {/* Worker Profile Details */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Field Dispatch ID:
            </span>
            <span className="font-mono font-bold text-purple-900 block">{activeWorker?.id || 'WRK-101'}</span>
            <span className="text-slate-500 text-[11px] block mt-0.5">{activeWorker?.department || 'Municipal Operations'}</span>
          </div>
        </div>

        {/* Worker Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 text-center">
          <div className="p-2 rounded-xl bg-slate-50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Assigned</span>
            <span className="text-xl font-bold text-navy-900 font-mono">{assignedIssues.length}</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">In Progress</span>
            <span className="text-xl font-bold text-amber-800 font-mono">
              {assignedIssues.filter(i => i.status === STATUSES.IN_PROGRESS).length}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-teal-50">
            <span className="text-[10px] uppercase font-bold text-teal-700 block">Awaiting Verification</span>
            <span className="text-xl font-bold text-teal-800 font-mono">
              {assignedIssues.filter(i => i.status === STATUSES.AWAITING_VERIFICATION).length}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Verified Resolved</span>
            <span className="text-xl font-bold text-emerald-800 font-mono">
              {assignedIssues.filter(i => i.status === STATUSES.RESOLVED).length}
            </span>
          </div>
        </div>
      </div>

      {/* Assigned Tasks List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy-950 flex items-center gap-2">
            <span>My Assigned Dispatch Tasks ({assignedIssues.length})</span>
          </h3>
          <span className="text-xs text-slate-500">
            Filtered exclusively for {activeWorker?.name}
          </span>
        </div>

        {assignedIssues.length > 0 ? (
          assignedIssues.map((issue) => {
            const linkedTickets = allTickets.filter(t => issue.linkedTicketIds?.includes(t.id));
            const isEditing = activeFormIssueId === issue.id;

            return (
              <div 
                key={issue.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-md overflow-hidden"
              >
                {/* Job Card Top Banner */}
                <div className="bg-slate-50 p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                        {issue.id}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                        {issue.category}
                      </span>
                      <SeverityBadge severity={issue.severity} size="sm" />
                      <CommunityBonusBadge bonus={issue.communityBonus} reportCount={issue.reportCount} />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-navy-950 mt-1.5">
                      {issue.title}
                    </h4>
                  </div>

                  <StatusBadge status={issue.status} size="lg" />
                </div>

                {/* Job Details */}
                <div className="p-5 sm:p-6 space-y-5 text-xs">
                  {/* Location & Department */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-navy-950 block text-[11px] uppercase">Incident Location:</strong>
                        <span className="text-slate-700 font-medium text-xs">{issue.location}</span>
                        {issue.coordinates && (
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${issue.coordinates.lat}&mlon=${issue.coordinates.lng}#map=17/${issue.coordinates.lat}/${issue.coordinates.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-700 hover:text-teal-900 underline font-mono text-[11px] block mt-0.5"
                          >
                            Open Field Navigation (OSM) ↗
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <Building2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-navy-950 block text-[11px] uppercase">Municipal Department:</strong>
                        <span className="text-slate-700 font-medium text-xs">{issue.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Citizen Description Summary */}
                  <div>
                    <strong className="text-navy-950 block mb-1">Incident Summary:</strong>
                    <p className="p-3 rounded-xl bg-slate-50 border text-slate-800 text-sm leading-relaxed">
                      {issue.summary}
                    </p>
                  </div>

                  {/* Existing Notes / Completion Status */}
                  {issue.workerNotes && (
                    <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
                      <strong className="text-purple-950 block text-xs font-bold mb-1">
                        Your Submitted Progress Notes:
                      </strong>
                      <p className="italic text-slate-800">"{issue.workerNotes}"</p>
                      {issue.completionPhoto && (
                        <div className="mt-2.5">
                          <span className="text-[11px] text-slate-500 block mb-1">Attached Completion Photo:</span>
                          <img 
                            src={issue.completionPhoto} 
                            alt="Completion Evidence" 
                            className="h-28 w-auto rounded-lg border object-cover shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Verification Signoff */}
                  {issue.adminVerificationNotes && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950">
                      <strong className="text-emerald-900 block text-xs font-bold mb-0.5">
                        Municipal Admin Sign-off & Quality Inspection:
                      </strong>
                      <p className="italic">"{issue.adminVerificationNotes}"</p>
                    </div>
                  )}

                  {/* WORKFLOW ACTIONS FOR WORKER */}
                  <div className="pt-2 border-t border-slate-100">
                    {/* Action 1: If Assigned -> Mark In Progress */}
                    {issue.status === STATUSES.ASSIGNED && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-slate-600">
                          Job is assigned to you. Click to mark work initiated on site.
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMarkInProgress(issue.id)}
                          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Start Job (Mark In Progress)</span>
                        </button>
                      </div>
                    )}

                    {/* Action 2: If In Progress -> Fill Completion Form */}
                    {issue.status === STATUSES.IN_PROGRESS && !isEditing && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-amber-800">
                          <Clock className="w-4 h-4" />
                          <span className="font-semibold">Repair actively in progress</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFormIssueId(issue.id);
                            setCompletionNotes(issue.workerNotes || '');
                          }}
                          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit Work Completed</span>
                        </button>
                      </div>
                    )}

                    {/* Inline Completion Form */}
                    {isEditing && (
                      <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-300 space-y-4">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs font-bold text-teal-950 uppercase tracking-tight flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-teal-700" />
                            Submit Work Completion Report
                          </strong>
                          <button
                            type="button"
                            onClick={() => setActiveFormIssueId(null)}
                            className="text-xs text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Critical Requirement Notice */}
                        <div className="p-2.5 rounded-lg bg-white border border-teal-200 text-xs text-slate-700">
                          <strong className="text-navy-950 font-bold block mb-0.5">Municipal Process Requirement:</strong>
                          Submitting this will move the ticket to <strong className="text-teal-800">Awaiting Verification</strong>. A municipal zonal engineer must review before it is marked Resolved.
                        </div>

                        {/* Completion Notes */}
                        <div>
                          <label className="block text-xs font-bold text-navy-950 mb-1">
                            Field Repair / Resolution Notes:
                          </label>
                          <textarea
                            rows={3}
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            placeholder="Describe actions taken, materials applied, or site condition, e.g., Pothole filled with cold asphalt mix, compacted with roller..."
                            className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:border-teal-500 focus:ring-2 focus:ring-teal-500 bg-white"
                          />
                        </div>

                        {/* Optional Completion Photo */}
                        <div>
                          <label className="block text-xs font-bold text-navy-950 mb-1">
                            Upload Completion Photo (Optional Evidence):
                          </label>

                          {!completionPhoto ? (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="border border-dashed border-teal-300 hover:border-teal-600 rounded-xl p-3 text-center cursor-pointer bg-white transition"
                            >
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePhotoSelect}
                                accept="image/*"
                                className="hidden"
                              />
                              <div className="flex items-center justify-center gap-2 text-teal-800 font-medium">
                                <Camera className="w-4 h-4" />
                                <span>{isCompressing ? 'Optimizing photo...' : 'Click to Upload After-Repair Photo'}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="relative inline-block border rounded-xl overflow-hidden">
                              <img 
                                src={completionPhoto} 
                                alt="Completion Preview" 
                                className="h-28 w-auto object-cover rounded-xl"
                              />
                              <button
                                type="button"
                                onClick={removePhoto}
                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Submit Button */}
                        <button
                          type="button"
                          onClick={() => handleSubmitCompletion(issue.id)}
                          disabled={isSubmitting}
                          className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          <span>Submit Work for Municipal Verification</span>
                        </button>
                      </div>
                    )}

                    {/* Action 3: If Awaiting Verification -> Waiting notice */}
                    {issue.status === STATUSES.AWAITING_VERIFICATION && (
                      <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-700 shrink-0" />
                        <span className="font-medium">
                          Work submitted by you. Awaiting physical inspection by Municipal Admin to close issue.
                        </span>
                      </div>
                    )}

                    {/* Action 4: If Resolved */}
                    {issue.status === STATUSES.RESOLVED && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold">
                          Job completed, verified, and officially closed in municipal records.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
            <HardHat className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-navy-950">No Tasks Assigned</h4>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
              You currently have no active field dispatch assignments. As municipal administrators assign complaints in your department, they will appear here in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
