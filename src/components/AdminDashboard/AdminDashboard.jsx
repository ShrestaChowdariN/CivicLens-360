import React, { useState } from 'react';
import { CATEGORIES, SEVERITIES, STATUSES } from '../../types';
import { SeverityBadge, StatusBadge, CommunityBonusBadge } from '../common/Badge';
import IssueDetailModal from './IssueDetailModal';
import { 
  Building2, 
  Search, 
  Filter, 
  Flame, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  HardHat, 
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  FileText
} from 'lucide-react';

export default function AdminDashboard({
  masterIssues,
  tickets,
  workers,
  onIssueUpdated
}) {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Metrics Calculations
  const totalComplaints = tickets.length;
  const totalMasterIssues = masterIssues.length;
  const criticalIssuesCount = masterIssues.filter(m => m.severity === SEVERITIES.CRITICAL).length;
  const pendingIssuesCount = masterIssues.filter(m => m.status !== STATUSES.RESOLVED).length;
  const resolvedIssuesCount = masterIssues.filter(m => m.status === STATUSES.RESOLVED).length;
  const awaitingVerificationCount = masterIssues.filter(m => m.status === STATUSES.AWAITING_VERIFICATION).length;

  // Department Workload aggregation
  const departmentWorkload = {};
  for (const cat of Object.values(CATEGORIES)) {
    departmentWorkload[cat] = 0;
  }
  for (const issue of masterIssues) {
    if (issue.status !== STATUSES.RESOLVED) {
      departmentWorkload[issue.category] = (departmentWorkload[issue.category] || 0) + 1;
    }
  }

  // Filter & Sort: Critical issues MUST always appear above non-Critical issues!
  const filteredAndSortedIssues = [...masterIssues]
    .filter(issue => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = issue.id.toLowerCase().includes(query);
        const matchesTitle = issue.title.toLowerCase().includes(query);
        const matchesLoc = issue.location.toLowerCase().includes(query);
        const matchesWorker = (issue.assignedWorkerName || '').toLowerCase().includes(query);
        if (!matchesId && !matchesTitle && !matchesLoc && !matchesWorker) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'ALL' && issue.category !== categoryFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== 'ALL' && issue.severity !== severityFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && issue.status !== statusFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort strictly by priority score descending
      return (b.priorityScore || 0) - (a.priorityScore || 0);
    });

  const openIssueModal = (issue) => {
    setSelectedIssue(issue);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedIssue(null);
  };

  const handleIssueUpdated = (updated) => {
    setSelectedIssue(updated);
    if (onIssueUpdated) onIssueUpdated(updated);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Mission */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-950 flex items-center gap-2.5">
            <Building2 className="w-8 h-8 text-teal-600" />
            <span>Municipal Command Center</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Community-Impact Prioritized Civic Triage & Department Dispatch
          </p>
        </div>

        {awaitingVerificationCount > 0 && (
          <div className="self-start md:self-center bg-teal-100 border border-teal-400 text-teal-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-teal-700" />
            <span>{awaitingVerificationCount} issue{awaitingVerificationCount > 1 ? 's' : ''} awaiting physical verification!</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Citizen Reports */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Complaints
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-navy-950 font-mono">
              {totalComplaints}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Preserved citizen voices</span>
          </div>
        </div>

        {/* Master Grouped Issues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Grouped Issues
            </span>
            <Layers className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-700 font-mono">
              {totalMasterIssues}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Clustered ground incidents</span>
          </div>
        </div>

        {/* Critical Safety Hazards */}
        <div className="bg-white p-5 rounded-2xl border-2 border-red-300 shadow-sm flex flex-col justify-between bg-red-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-800">
              Critical Hazards
            </span>
            <Flame className="w-4 h-4 text-red-600 animate-pulse" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-700 font-mono">
              {criticalIssuesCount}
            </span>
            <span className="text-[11px] text-red-800 font-medium block mt-0.5">Priority 1: Emergency</span>
          </div>
        </div>

        {/* Pending In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Pending / In Progress
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono">
              {pendingIssuesCount}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Active field pipeline</span>
          </div>
        </div>

        {/* Resolved Issues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Verified Resolved
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
              {resolvedIssuesCount}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Inspected & closed</span>
          </div>
        </div>
      </div>

      {/* Department Workload Distribution */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal-600" />
          <span>Active Department Workload Distribution (Unresolved Master Issues)</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {Object.entries(departmentWorkload).map(([cat, count]) => (
            <div key={cat} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-600 block truncate" title={cat}>
                {cat}
              </span>
              <span className="text-lg font-bold text-navy-900 font-mono mt-0.5 block">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-teal-600" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by issue ID, location, title, worker..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 text-xs font-medium bg-white"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="ALL">All Categories</option>
              {Object.values(CATEGORIES).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="ALL">All Severities</option>
              <option value={SEVERITIES.CRITICAL}>Critical Only</option>
              <option value={SEVERITIES.HIGH}>High Only</option>
              <option value={SEVERITIES.MEDIUM}>Medium Only</option>
              <option value={SEVERITIES.LOW}>Low Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="ALL">All Statuses</option>
              {Object.values(STATUSES).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Pills */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong className="text-navy-950 font-bold">{filteredAndSortedIssues.length}</strong> prioritized master issues
          </span>
          <span className="italic">
            * Sorted strictly by Safety Base × 10 + Community Impact Bonus
          </span>
        </div>
      </div>

      {/* Prioritized Master Issues Table / Card List */}
      <div className="space-y-3.5">
        {filteredAndSortedIssues.length > 0 ? (
          filteredAndSortedIssues.map((issue, index) => {
            const isCritical = issue.severity === SEVERITIES.CRITICAL;

            return (
              <div
                key={issue.id}
                onClick={() => openIssueModal(issue)}
                className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer hover:shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isCritical 
                    ? 'border-red-400 bg-red-50/20 ring-1 ring-red-300 hover:border-red-500' 
                    : 'border-slate-200/90 hover:border-teal-500'
                }`}
              >
                {/* Left: Priority Rank, ID, Title & Location */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Priority Score Badge */}
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold shadow-sm ${
                    isCritical 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : 'bg-navy-900 text-white'
                  }`}>
                    <span className="text-[10px] uppercase font-semibold leading-none">Rank</span>
                    <span className="text-base font-mono leading-tight">#{index + 1}</span>
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {issue.id}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {issue.category}
                      </span>
                      <SeverityBadge severity={issue.severity} size="sm" />
                      <CommunityBonusBadge bonus={issue.communityBonus} reportCount={issue.reportCount} />
                    </div>

                    <h4 className="text-base font-bold text-navy-950 hover:text-teal-700 transition">
                      {issue.title}
                    </h4>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{issue.location}</span>
                    </div>

                    <p className="text-xs text-slate-500 italic line-clamp-1">
                      "{issue.severityReason}"
                    </p>
                  </div>
                </div>

                {/* Right: Worker, Status, Action */}
                <div className="flex flex-wrap lg:flex-nowrap items-center justify-between lg:justify-end gap-3.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {/* Worker Assigned Indicator */}
                  <div className="text-left lg:text-right text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned Crew</span>
                    {issue.assignedWorkerName ? (
                      <span className="font-semibold text-purple-900 flex items-center gap-1">
                        <HardHat className="w-3.5 h-3.5 text-purple-600" />
                        {issue.assignedWorkerName}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">Unassigned</span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <StatusBadge status={issue.status} />

                  {/* Inspect & Dispatch Action Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openIssueModal(issue);
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-teal-600 text-white text-xs font-bold transition shadow-sm"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : totalComplaints === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-navy-950">No complaints have been submitted yet.</h4>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
              The municipal registry is clear. When citizens submit complaints, they will automatically be triaged, prioritized, and grouped here in real time.
            </p>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
            <Filter className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-base font-bold text-navy-950">No Matching Issues Found</h4>
            <p className="text-xs text-slate-600 mt-1">
              No issues match your current search and filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Modal for Issue Deep Inspection & Worker Assignment */}
      <IssueDetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        masterIssue={selectedIssue}
        onIssueUpdated={handleIssueUpdated}
      />
    </div>
  );
}
