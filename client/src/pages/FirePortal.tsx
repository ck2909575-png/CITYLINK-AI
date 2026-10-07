import React, { useState } from 'react';
import { useIncidents, useResponseUnits, useUpdateIncidentStatus } from '../hooks/useIncidents';
import { useCameras } from '../hooks/useCameras';
import { IncidentRecord, IncidentStatus } from '@urbanshield/shared';
import { IncidentMap } from '../components/IncidentMap';
import { DepartmentNav } from '../components/DepartmentNav';
import { IncidentDetailDrawer } from '../components/IncidentDetailDrawer';
import {
  Flame,
  Truck,
  Wind,
  ShieldAlert,
  Camera,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Radio,
} from 'lucide-react';

export const FirePortal: React.FC = () => {
  const { data: allIncidents = [] } = useIncidents();
  const { data: allUnits = [] } = useResponseUnits();
  const { data: cameras = [] } = useCameras('fire');
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateIncidentStatus();

  // Filter to fire/smoke/hazmat incidents
  const fireIncidents = allIncidents.filter((inc) => {
    return (
      inc.domain === 'FIRE_RESCUE' ||
      inc.primary_agency === 'FIRE_DEPARTMENT' ||
      inc.domain === 'INFRASTRUCTURE_HAZARD' ||
      inc.title.toLowerCase().includes('fire') ||
      inc.title.toLowerCase().includes('smoke') ||
      inc.title.toLowerCase().includes('gas') ||
      inc.title.toLowerCase().includes('explosion')
    );
  });

  const fireUnits = allUnits.filter((u) => u.agency === 'FIRE_DEPARTMENT');

  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(
    fireIncidents[0] || null
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
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-rose-950/40 border border-rose-500/30 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-extrabold text-white uppercase font-mono tracking-wider">
                  Fire & Emergency Rescue Operations Control
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40">
                  HAZMAT DISPATCH
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Active Thermal & Smoke Sensors • Fire Engine Response Routes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 px-3 py-1.5 rounded-xl bg-command-950/80 border border-command-800 text-xs font-mono text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Truck className="w-3.5 h-3.5 text-rose-400" />
              <span>Fire Engines: <strong className="text-white">{fireUnits.length}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Active Fires: <strong className="text-rose-400">{fireIncidents.length}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Thermal Surveillance: <strong className="text-cyan-400">{cameras.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[580px]">
          {/* Left: Fire Incidents List */}
          <div className="lg:col-span-3 h-full min-h-0 bg-command-900 border border-command-800 rounded-2xl p-3 flex flex-col space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-command-800 text-xs font-mono font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-rose-400">
                <Flame className="w-3.5 h-3.5" />
                <span>Fire / Rescue Alerts ({fireIncidents.length})</span>
              </span>
              <span className="text-[10px] text-slate-500">THERMAL SORT</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {fireIncidents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No active fire or hazmat emergencies logged in city sector.
                </div>
              ) : (
                fireIncidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`p-3 rounded-xl border cursor-pointer transition space-y-1.5 ${
                        isSelected
                          ? 'bg-rose-950/60 border-rose-400 shadow-md'
                          : 'bg-command-950/60 border-command-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300 font-bold border border-rose-500/30">
                          {inc.domain}
                        </span>
                        <span className={`font-bold ${inc.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                          {inc.severity}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{inc.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{inc.description}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-command-800/80 text-[10px] font-mono text-slate-400">
                        <span>Zone: {inc.hazard_perimeter_meters || 150}m</span>
                        <span className="text-rose-400 font-semibold">{inc.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Center: Map with Fire Units & Exclusion Zones */}
          <div className="lg:col-span-5 h-full min-h-0 rounded-2xl overflow-hidden border border-command-800 shadow-xl">
            <IncidentMap
              incidents={fireIncidents}
              units={fireUnits}
              cameras={cameras}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              height="100%"
            />
          </div>

          {/* Right: Detail & Unit Dispatcher */}
          <div className="lg:col-span-4 h-full min-h-0">
            {selectedIncident ? (
              <IncidentDetailDrawer
                incident={selectedIncident}
                units={fireUnits}
                onClose={() => setSelectedIncident(null)}
                onUpdateStatus={handleStatusUpdate}
                isUpdating={isUpdating}
              />
            ) : (
              <div className="h-full bg-command-900 border border-command-800 rounded-2xl flex items-center justify-center p-6 text-center text-slate-500 text-xs">
                Select a fire or hazmat report to inspect thermal exclusion perimeter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
