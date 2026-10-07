import React, { useState } from 'react';
import { useIncidents, useResponseUnits, useUpdateIncidentStatus } from '../hooks/useIncidents';
import { useCameras } from '../hooks/useCameras';
import { IncidentRecord, IncidentStatus } from '@urbanshield/shared';
import { IncidentMap } from '../components/IncidentMap';
import { DepartmentNav } from '../components/DepartmentNav';
import { IncidentDetailDrawer } from '../components/IncidentDetailDrawer';
import {
  AlertTriangle,
  Waves,
  Building,
  CloudRain,
  Camera,
  ShieldAlert,
  MapPin,
  LifeBuoy,
} from 'lucide-react';

export const DisasterPortal: React.FC = () => {
  const { data: allIncidents = [] } = useIncidents();
  const { data: allUnits = [] } = useResponseUnits();
  const { data: cameras = [] } = useCameras('disaster');
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateIncidentStatus();

  // Filter to flood, structural damage, natural disasters
  const disasterIncidents = allIncidents.filter((inc) => {
    return (
      inc.domain === 'NATURAL_DISASTER' ||
      inc.domain === 'INFRASTRUCTURE_HAZARD' ||
      inc.primary_agency === 'DISASTER_MANAGEMENT' ||
      inc.title.toLowerCase().includes('flood') ||
      inc.title.toLowerCase().includes('water') ||
      inc.title.toLowerCase().includes('damage') ||
      inc.title.toLowerCase().includes('structural') ||
      inc.title.toLowerCase().includes('collapse')
    );
  });

  const disasterUnits = allUnits.filter((u) => u.agency === 'DISASTER_MANAGEMENT');

  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(
    disasterIncidents[0] || null
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
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-orange-950/40 border border-orange-500/30 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400">
              <Waves className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-extrabold text-white uppercase font-mono tracking-wider">
                  Disaster Management & Civil Defense Control
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-500/40">
                  DEFENSE GRID
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Flood Inundation Buffers • Structural Integrity & Evacuation Corridors
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 px-3 py-1.5 rounded-xl bg-command-950/80 border border-command-800 text-xs font-mono text-slate-300">
            <div className="flex items-center space-x-1.5">
              <LifeBuoy className="w-3.5 h-3.5 text-orange-400" />
              <span>Rescue Squads: <strong className="text-white">{disasterUnits.length}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
              <span>Disaster Zones: <strong className="text-orange-400">{disasterIncidents.length}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sensors: <strong className="text-cyan-400">{cameras.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Work Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[580px]">
          {/* Left: Disaster Alerts */}
          <div className="lg:col-span-3 h-full min-h-0 bg-command-900 border border-command-800 rounded-2xl p-3 flex flex-col space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-command-800 text-xs font-mono font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-orange-400">
                <Waves className="w-3.5 h-3.5" />
                <span>Disaster Zones ({disasterIncidents.length})</span>
              </span>
              <span className="text-[10px] text-slate-500">HAZARD SORT</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {disasterIncidents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No active flood, structural, or natural disaster zones flagged.
                </div>
              ) : (
                disasterIncidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`p-3 rounded-xl border cursor-pointer transition space-y-1.5 ${
                        isSelected
                          ? 'bg-orange-950/60 border-orange-400 shadow-md'
                          : 'bg-command-950/60 border-command-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-orange-900/60 text-orange-300 font-bold border border-orange-500/30">
                          {inc.domain}
                        </span>
                        <span className={`font-bold ${inc.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                          {inc.severity}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{inc.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{inc.description}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-command-800/80 text-[10px] font-mono text-slate-400">
                        <span>Evacuation Buffer: {inc.hazard_perimeter_meters || 200}m</span>
                        <span className="text-orange-400">{inc.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Center: Situational Map */}
          <div className="lg:col-span-5 h-full min-h-0 rounded-2xl overflow-hidden border border-command-800 shadow-xl">
            <IncidentMap
              incidents={disasterIncidents}
              units={disasterUnits}
              cameras={cameras}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              height="100%"
            />
          </div>

          {/* Right: Drawer */}
          <div className="lg:col-span-4 h-full min-h-0">
            {selectedIncident ? (
              <IncidentDetailDrawer
                incident={selectedIncident}
                units={disasterUnits}
                onClose={() => setSelectedIncident(null)}
                onUpdateStatus={handleStatusUpdate}
                isUpdating={isUpdating}
              />
            ) : (
              <div className="h-full bg-command-900 border border-command-800 rounded-2xl flex items-center justify-center p-6 text-center text-slate-500 text-xs">
                Select a disaster sector to inspect civil defense shelters and evacuation corridors.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
