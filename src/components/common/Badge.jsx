import React from 'react';
import { SEVERITIES, STATUSES } from '../../types';
import { AlertTriangle, Flame, ShieldAlert, CheckCircle2, Clock, Wrench, FileSearch, UserCheck } from 'lucide-react';

export function SeverityBadge({ severity, showIcon = true, size = 'md' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold'
  }[size];

  switch (severity) {
    case SEVERITIES.CRITICAL:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-800 border border-red-300 shadow-sm ${sizeClasses}`}>
          {showIcon && <Flame className="w-3.5 h-3.5 text-red-600 animate-pulse" />}
          Critical Safety
        </span>
      );
    case SEVERITIES.HIGH:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 ${sizeClasses}`}>
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          High Severity
        </span>
      );
    case SEVERITIES.MEDIUM:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 ${sizeClasses}`}>
          {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-sky-600" />}
          Medium Severity
        </span>
      );
    case SEVERITIES.LOW:
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          Low Severity
        </span>
      );
  }
}

export function StatusBadge({ status, showIcon = true, size = 'md' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3.5 py-1.5 font-semibold'
  }[size];

  switch (status) {
    case STATUSES.SUBMITTED:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 ${sizeClasses}`}>
          {showIcon && <Clock className="w-3.5 h-3.5 text-slate-500" />}
          {status}
        </span>
      );
    case STATUSES.UNDER_REVIEW:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 ${sizeClasses}`}>
          {showIcon && <FileSearch className="w-3.5 h-3.5 text-blue-600" />}
          {status}
        </span>
      );
    case STATUSES.ASSIGNED:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 ${sizeClasses}`}>
          {showIcon && <UserCheck className="w-3.5 h-3.5 text-purple-600" />}
          {status}
        </span>
      );
    case STATUSES.IN_PROGRESS:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses}`}>
          {showIcon && <Wrench className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />}
          {status}
        </span>
      );
    case STATUSES.AWAITING_VERIFICATION:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-300 ${sizeClasses}`}>
          {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />}
          {status}
        </span>
      );
    case STATUSES.RESOLVED:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm ${sizeClasses}`}>
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          {status}
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
}

export function CommunityBonusBadge({ bonus, reportCount }) {
  if (bonus === 0 && reportCount <= 1) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200" title="1 Single Verified Report">
        1 Report (0 bonus)
      </span>
    );
  }

  const bonusColor = bonus >= 3 
    ? 'bg-rose-100 text-rose-800 border-rose-300' 
    : bonus === 2 
    ? 'bg-orange-100 text-orange-800 border-orange-300' 
    : 'bg-teal-100 text-teal-800 border-teal-300';

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border shadow-sm ${bonusColor}`} title={`${reportCount} linked citizen reports yield a +${bonus} community impact bonus`}>
      <span className="font-bold">{reportCount} Reports</span>
      <span className="text-[11px] font-normal px-1 rounded bg-white/70">+{bonus} Bonus</span>
    </span>
  );
}
