import React, { useState } from 'react';
import ComplaintForm from './ComplaintForm';
import ComplaintTracker from './ComplaintTracker';
import { PlusCircle, Search, Sparkles } from 'lucide-react';

export default function CitizenPortal({ onComplaintSubmitted }) {
  const [activeTab, setActiveTab] = useState('report');
  const [trackedTicketId, setTrackedTicketId] = useState(null);

  const handleTrackTicket = (ticketId) => {
    setTrackedTicketId(ticketId);
    setActiveTab('track');
  };

  return (
    <div className="space-y-6">
      {/* Subnavigation Tabs */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('report')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'report'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Civic Grievance</span>
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'track'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Track by Ticket ID</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'report' ? (
        <ComplaintForm
          onComplaintSubmitted={onComplaintSubmitted}
          onTrackTicket={handleTrackTicket}
        />
      ) : (
        <ComplaintTracker initialTicketId={trackedTicketId} />
      )}
    </div>
  );
}
