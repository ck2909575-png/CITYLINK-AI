import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useIncident, useUpdateIncidentStatus } from '../hooks/useIncidents';
import { IncidentMap } from '../components/IncidentMap';
import {
  Radio,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  ShieldAlert,
  FileCheck2,
  ArrowLeft,
  MapPin,
} from 'lucide-react';
import { IncidentStatus } from '@urbanshield/shared';

export const DispatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const incidentId = id || '00000000-0000-0000-0000-000000000105';

  const { data, isLoading } = useIncident(incidentId);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateIncidentStatus();

  const [clearanceNotes, setClearanceNotes] = useState('');

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center font-mono text-sm text-slate-400">
        Connecting to Emergency Fleet Dispatch Terminal...
      </div>
    );
  }

  const incident = data?.incident;
  const unit = data?.assigned_unit;
  const logs = data?.dispatch_logs || [];

  if (!incident) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Incident Dispatch Not Found</h2>
        <Link to="/command" className="text-xs text-cyan-400 font-bold underline">
          Return to Command Grid
        </Link>
      </div>
    );
  }

  const handleAdvanceStatus = (nextStatus: IncidentStatus) => {
    updateStatus({
      id: incident.id,
      status: nextStatus,
      unit_id: unit?.id,
      notes: clearanceNotes || `Field Unit updated status to ${nextStatus}`,
    });
    setClearanceNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-command-900 border border-command-800 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <Link
            to="/command"
            className="p-2 rounded-xl bg-command-950 text-slate-400 hover:text-white border border-command-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                FIELD RESPONDER MOBILE TERMINAL (MDT)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-command-950 text-cyan-400 border border-command-800">
                CALLSIGN: {unit?.unit_callsign || 'ASSIGNED UNIT'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-white leading-snug">
              {incident.title}
            </h1>
          </div>
        </div>

        {/* Current State Pill */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400">Current Phase:</span>
          <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
            {incident.status}
          </span>
        </div>
      </div>

      {/* Main Grid: MDT Tactical Brief & Map Route */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tactical MDT Checklist */}
        <div className="lg:col-span-5 space-y-4">
          {/* Tactical Brief */}
          <div className="p-5 bg-command-900 border border-command-800 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold uppercase">
              <FileCheck2 className="w-4 h-4" />
              <span>Tactical Checklist & Hazards on Scene</span>
            </div>

            <div className="p-3.5 bg-blue-950/40 border border-blue-900/60 rounded-xl text-xs text-slate-200 font-mono leading-relaxed">
              {incident.responder_tactical_brief ||
                'Establish 360-degree perimeter, stage primary response apparatus, and verify victim stabilization.'}
            </div>

            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Target Site: <strong>{incident.address}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                <span>
                  Coordinates:{' '}
                  {typeof incident.latitude === 'number' && typeof incident.longitude === 'number'
                    ? `${incident.latitude.toFixed(5)}, ${incident.longitude.toFixed(5)}`
                    : 'Grid Ref Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Control Panel */}
          <div className="p-5 bg-command-900 border border-command-800 rounded-2xl shadow-xl space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 font-mono">
              Field Telemetry Actions
            </h3>

            <textarea
              rows={2}
              placeholder="Field notes / on-scene situation update..."
              value={clearanceNotes}
              onChange={(e) => setClearanceNotes(e.target.value)}
              className="w-full bg-command-950 border border-command-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {incident.status === 'DISPATCHED' && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleAdvanceStatus('ON_SCENE')}
                  className="px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 col-span-2 shadow-lg shadow-amber-950"
                >
                  <Radio className="w-4 h-4" />
                  <span>CONFIRM ARRIVAL ON-SCENE</span>
                </button>
              )}

              {incident.status === 'ON_SCENE' && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleAdvanceStatus('RESOLVED')}
                  className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 col-span-2 shadow-lg shadow-emerald-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>HAZARDS STABILIZED (MARK RESOLVED)</span>
                </button>
              )}

              {incident.status === 'RESOLVED' && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleAdvanceStatus('CLOSED')}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 col-span-2 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CLEAR UNIT & CLOSE CASE</span>
                </button>
              )}
            </div>
          </div>

          {/* Dispatch Logs */}
          <div className="p-4 bg-command-900 border border-command-800 rounded-2xl shadow-xl space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Telemetry Audit Trail
            </span>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded bg-command-950 border border-command-800 text-[11px] font-mono space-y-0.5"
                >
                  <div className="flex items-center justify-between text-cyan-400">
                    <span>{log.new_status}</span>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(log.logged_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {log.notes && <p className="text-slate-400">{log.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Tactical Vector Route Map */}
        <div className="lg:col-span-7 h-[560px] rounded-2xl overflow-hidden border border-command-800 shadow-2xl">
          <IncidentMap
            incidents={[incident]}
            units={unit ? [unit] : []}
            selectedIncident={incident}
            height="100%"
            zoom={15}
            showDetours={true}
          />
        </div>
      </div>
    </div>
  );
};
