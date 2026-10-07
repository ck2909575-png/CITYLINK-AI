import React, { useState } from 'react';
import { useDispatchLogs, useIncidents, useResponseUnits } from '../hooks/useIncidents';
import {
  FileText,
  Clock,
  ShieldCheck,
  Cpu,
  Activity,
  AlertTriangle,
  Download,
  Filter,
} from 'lucide-react';

export const AuditPage: React.FC = () => {
  const { data: logs = [], isLoading: isLogsLoading } = useDispatchLogs();
  const { data: incidents = [] } = useIncidents();
  const { data: units = [] } = useResponseUnits();

  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((l) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      l.new_status.toLowerCase().includes(q) ||
      (l.notes && l.notes.toLowerCase().includes(q)) ||
      l.incident_id.toLowerCase().includes(q)
    );
  });

  // Calculate metrics
  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL').length;
  const avgConfidence = incidents.length
    ? Math.round(
        (incidents.reduce((acc, i) => acc + (i.confidence_score || 0.9), 0) /
          incidents.length) *
          100
      )
    : 95;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-command-900 border border-command-800 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase">
            <FileText className="w-4 h-4" />
            <span>Audit & Compliance Terminal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Incident Dispatch Audit Trail & System Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Immutable log of status transitions, AI triage verifications, and fleet dispatches
          </p>
        </div>

        <button
          onClick={() => {
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute('href', dataStr);
            dlAnchor.setAttribute('download', `urbanshield_audit_logs_${Date.now()}.json`);
            dlAnchor.click();
          }}
          className="px-4 py-2.5 rounded-xl bg-command-800 hover:bg-command-700 text-slate-200 text-xs font-mono font-bold border border-command-700 flex items-center space-x-2 transition"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Export Audit JSON</span>
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-command-900 border border-command-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Total Triaged Incidents
          </span>
          <div className="text-2xl font-black font-mono text-white">
            {totalIncidents}
          </div>
          <span className="text-[10px] text-cyan-400 font-mono">
            Recorded in PostgreSQL
          </span>
        </div>

        <div className="p-4 bg-command-900 border border-command-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Critical Events
          </span>
          <div className="text-2xl font-black font-mono text-red-400">
            {criticalCount}
          </div>
          <span className="text-[10px] text-red-300 font-mono">
            High-Impact Emergencies
          </span>
        </div>

        <div className="p-4 bg-command-900 border border-command-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Mean AI Confidence Score
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {avgConfidence}%
          </div>
          <span className="text-[10px] text-emerald-300 font-mono">
            Gemini Structured Outputs
          </span>
        </div>

        <div className="p-4 bg-command-900 border border-command-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Registered Fleet Units
          </span>
          <div className="text-2xl font-black font-mono text-blue-400">
            {units.length} Units
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Police • Fire • Paramedic • Traffic
          </span>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-command-900 border border-command-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-command-800 flex items-center justify-between">
          <input
            type="text"
            placeholder="Search audit trail by status or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-72 bg-command-950 border border-command-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <span className="text-xs font-mono text-slate-400">
            {filteredLogs.length} Entries Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-command-950 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-command-800">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Incident Reference</th>
                <th className="px-6 py-3.5">New Status</th>
                <th className="px-6 py-3.5">Assigned Unit</th>
                <th className="px-6 py-3.5">Audit Log Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-command-800/60 font-mono text-[11px]">
              {isLogsLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Loading audit trail from database...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No dispatch audit events match search query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-command-850/60 transition">
                    <td className="px-6 py-3.5 text-slate-400">
                      {new Date(log.logged_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-cyan-400 font-bold truncate max-w-[140px]">
                      {log.incident_id.slice(0, 13)}...
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-command-950 border border-command-700 text-slate-200 uppercase font-bold text-[10px]">
                        {log.new_status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {log.unit_id ? log.unit_id.slice(0, 8) + '...' : 'System'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-300 font-sans">
                      {log.notes || 'Status updated'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
