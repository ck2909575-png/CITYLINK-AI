import React, { useState } from 'react';
import { IncidentRecord, IncidentSeverity } from '@urbanshield/shared';
import {
  AlertCircle,
  Clock,
  MapPin,
  ChevronRight,
  Shield,
  Video,
  Cpu,
  Flame,
  Activity,
  Car,
  Waves,
  Zap,
} from 'lucide-react';

interface LiveTriageQueueProps {
  incidents: IncidentRecord[];
  selectedIncidentId?: string | null;
  onSelectIncident: (incident: IncidentRecord) => void;
}

export const LiveTriageQueue: React.FC<LiveTriageQueueProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = incidents.filter((inc) => {
    if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        (inc.address && inc.address.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'CCTV_STREAM':
        return (
          <span className="flex items-center space-x-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
            <Video className="w-2.5 h-2.5" />
            <span>AI CCTV</span>
          </span>
        );
      case 'IOT_SENSOR':
        return (
          <span className="flex items-center space-x-1 text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
            <Cpu className="w-2.5 h-2.5" />
            <span>IoT Sensor</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 text-[10px] px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800">
            <AlertCircle className="w-2.5 h-2.5" />
            <span>Citizen SOS</span>
          </span>
        );
    }
  };

  const getSeverityPill = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-950/80 text-red-400 border-red-800/80 animate-pulse';
      case 'HIGH':
        return 'bg-orange-950/80 text-orange-400 border-orange-800/80';
      case 'MEDIUM':
        return 'bg-amber-950/80 text-amber-400 border-amber-800/80';
      default:
        return 'bg-blue-950/80 text-blue-400 border-blue-800/80';
    }
  };

  return (
    <div className="flex flex-col h-full bg-command-900 border border-command-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header & Filter Controls */}
      <div className="p-4 border-b border-command-800 bg-command-950/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <h3 className="font-bold text-sm text-slate-100 tracking-wide uppercase font-mono">
              Live Triage Stream ({incidents.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Auto-Sync ⚡
          </span>
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Filter incidents, address, keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-command-900 border border-command-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition mb-3"
        />

        {/* Severity Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterSeverity(lvl)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition ${
                filterSeverity === lvl
                  ? 'bg-command-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-command-850'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto divide-y divide-command-800/60 p-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No active incidents matching criteria.
          </div>
        ) : (
          filtered.map((inc) => {
            const isSelected = selectedIncidentId === inc.id;

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className={`p-3.5 rounded-xl cursor-pointer transition relative group border ${
                  isSelected
                    ? 'bg-command-800/90 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                    : 'bg-command-950/40 border-command-800/80 hover:bg-command-850 hover:border-command-700'
                }`}
              >
                {/* Top Meta Bar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getSeverityPill(
                        inc.severity
                      )}`}
                    >
                      {inc.severity}
                    </span>
                    {getSourceBadge(inc.source)}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-command-900 border border-command-700 text-slate-400 uppercase">
                    {inc.status}
                  </span>
                </div>

                {/* Headline */}
                <h4 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition leading-snug line-clamp-2">
                  {inc.title}
                </h4>

                {/* Address & Agency */}
                <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1 truncate max-w-[70%]">
                    <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{inc.address || 'Metro Grid'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                    {inc.primary_agency}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
