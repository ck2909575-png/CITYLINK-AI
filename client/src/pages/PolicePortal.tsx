import React, { useState } from 'react';
import { useIncidents, useResponseUnits, useUpdateIncidentStatus } from '../hooks/useIncidents';
import { useCameras } from '../hooks/useCameras';
import { IncidentRecord, IncidentStatus } from '@urbanshield/shared';
import { IncidentMap } from '../components/IncidentMap';
import { DepartmentNav } from '../components/DepartmentNav';
import { IncidentDetailDrawer } from '../components/IncidentDetailDrawer';
import {
  Shield,
  Siren,
  Car,
  Radio,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Eye,
  Camera,
} from 'lucide-react';

export const PolicePortal: React.FC = () => {
  const { data: allIncidents = [] } = useIncidents();
  const { data: allUnits = [] } = useResponseUnits();
  const { data: cameras = [] } = useCameras('police');
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateIncidentStatus();

  // Filter to police relevant incidents: Traffic Accidents, Violence, Theft, Law Enforcement
  const policeIncidents = allIncidents.filter((inc) => {
    return (
      inc.domain === 'TRAFFIC_ACCIDENT' ||
      inc.primary_agency === 'POLICE' ||
      inc.domain === 'CRIME_PUBLIC_SAFETY' ||
      inc.title.toLowerCase().includes('accident') ||
      inc.title.toLowerCase().includes('police')
    );
  });

  const policeUnits = allUnits.filter((u) => u.agency === 'POLICE');

  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(
    policeIncidents[0] || null
  );

  const handleStatusUpdate = (status: IncidentStatus, unitId?: string, notes?: string) => {
    if (!selectedIncident) return;
    updateStatus({
      id: selectedIncident.id,
      status,
      unit_id: unitId,
      notes,
    });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-command-950">
      <DepartmentNav />

      <div className="flex-1 flex flex-col p-4 space-y-3 min-h-0">
        {/* Department Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-950/40 border border-blue-500/30 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-extrabold text-white uppercase font-mono tracking-wider">
                  Metropolitan Police Department Control
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40">
                  PATROL MESH
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Active Tactical Incident Routing • Live Pursuit & Intercept Feed
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 px-3 py-1.5 rounded-xl bg-command-950/80 border border-command-800 text-xs font-mono text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Car className="w-3.5 h-3.5 text-blue-400" />
              <span>Patrol Units: <strong className="text-white">{policeUnits.length}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Siren className="w-3.5 h-3.5 text-amber-400" />
              <span>Active Police Alerts: <strong className="text-amber-400">{policeIncidents.length}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tactical Feeds: <strong className="text-cyan-400">{cameras.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[580px]">
          {/* Left: Police Incidents List */}
          <div className="lg:col-span-3 h-full min-h-0 bg-command-900 border border-command-800 rounded-2xl p-3 flex flex-col space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-command-800 text-xs font-mono font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-blue-400">
                <Siren className="w-3.5 h-3.5" />
                <span>Police Incidents ({policeIncidents.length})</span>
              </span>
              <span className="text-[10px] text-slate-500">PRIORITY SORT</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {policeIncidents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No active police alerts logged in current sector.
                </div>
              ) : (
                policeIncidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`p-3 rounded-xl border cursor-pointer transition space-y-1.5 ${
                        isSelected
                          ? 'bg-blue-950/60 border-blue-400 shadow-md'
                          : 'bg-command-950/60 border-command-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold border border-blue-500/30">
                          {inc.domain}
                        </span>
                        <span className={`font-bold ${inc.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                          {inc.severity}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{inc.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{inc.description}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-command-800/80 text-[10px] font-mono text-slate-400">
                        <span>Status: <strong className="text-cyan-400">{inc.status}</strong></span>
                        <span>{new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Center: Map with Police Units & Relevant Cameras */}
          <div className="lg:col-span-5 h-full min-h-0 rounded-2xl overflow-hidden border border-command-800 shadow-xl">
            <IncidentMap
              incidents={policeIncidents}
              units={policeUnits}
              cameras={cameras}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              height="100%"
            />
          </div>

          {/* Right: Police Detail & Response Status Tracker */}
          <div className="lg:col-span-4 h-full min-h-0 flex flex-col space-y-3">
            {selectedIncident ? (
              <IncidentDetailDrawer
                incident={selectedIncident}
                units={policeUnits}
                onClose={() => setSelectedIncident(null)}
                onUpdateStatus={handleStatusUpdate}
                isUpdating={isUpdating}
              />
            ) : (
              <div className="h-full bg-command-900 border border-command-800 rounded-2xl flex items-center justify-center p-6 text-center text-slate-500 text-xs">
                Select an incident from the sector queue to inspect police telemetry.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
