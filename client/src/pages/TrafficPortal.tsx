import React, { useState } from 'react';
import { useIncidents, useResponseUnits, useUpdateIncidentStatus } from '../hooks/useIncidents';
import { useCameras } from '../hooks/useCameras';
import { IncidentRecord, IncidentStatus } from '@urbanshield/shared';
import { IncidentMap } from '../components/IncidentMap';
import { DepartmentNav } from '../components/DepartmentNav';
import { VirtualVMSSign } from '../components/VirtualVMSSign';
import {
  Car,
  AlertTriangle,
  Camera,
  Compass,
  Tv,
  Signpost,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

export const TrafficPortal: React.FC = () => {
  const { data: allIncidents = [] } = useIncidents();
  const { data: allUnits = [] } = useResponseUnits();
  const { data: cameras = [] } = useCameras('traffic');
  const { mutate: updateStatus } = useUpdateIncidentStatus();

  // Filter to traffic, accident, road blockage incidents
  const trafficIncidents = allIncidents.filter((inc) => {
    return (
      inc.domain === 'TRAFFIC_ACCIDENT' ||
      inc.domain === 'INFRASTRUCTURE_HAZARD' ||
      inc.title.toLowerCase().includes('traffic') ||
      inc.title.toLowerCase().includes('accident') ||
      inc.title.toLowerCase().includes('road') ||
      inc.title.toLowerCase().includes('congestion')
    );
  });

  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(
    trafficIncidents[0] || null
  );

  const [vmsLine1, setVmsLine1] = useState(
    selectedIncident ? `⚠️ ACCIDENT AHEAD - SLOW DOWN` : 'ALL CORRIDORS OPEN - DRIVE CAUTIOUSLY'
  );
  const [vmsLine2, setVmsLine2] = useState('HEAVY TRAFFIC • ALTERNATIVE ROUTE AVAILABLE');
  const [vmsSpeed, setVmsSpeed] = useState(25);

  const handleUpdateSignage = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Roadside VMS Displays Updated', {
      description: `Broadcasted to Highway Corridor Screens: "${vmsLine1}"`,
    });
  };

  const handleApplyDetour = () => {
    if (!selectedIncident) return;
    setVmsLine1('ACCIDENT AHEAD - DETOUR VIA BYPASS');
    setVmsLine2('FOLLOW EMERGENCY ARROWS • SPEED: 20 MPH');
    setVmsSpeed(20);
    toast.info('Autonomous Roadside Diversion Applied', {
      description: 'Traffic signals synchronized with detour route.',
    });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-command-950">
      <DepartmentNav />

      <div className="flex-1 flex flex-col p-4 space-y-3 min-h-0">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-950/40 border border-amber-500/30 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-400">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-extrabold text-white uppercase font-mono tracking-wider">
                  Intelligent Traffic & Mobility Operations Control
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                  GRID VMS ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automated Detour Routing • Electronic Roadside Signboards (VMS)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 px-3 py-1.5 rounded-xl bg-command-950/80 border border-command-800 text-xs font-mono text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Car className="w-3.5 h-3.5 text-amber-400" />
              <span>Choke Points: <strong className="text-amber-400">{trafficIncidents.length}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Traffic Cameras: <strong className="text-cyan-400">{cameras.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Work Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[580px]">
          {/* Left: Road Hazards & Congestion Queue */}
          <div className="lg:col-span-3 h-full min-h-0 bg-command-900 border border-command-800 rounded-2xl p-3 flex flex-col space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-command-800 text-xs font-mono font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Signpost className="w-3.5 h-3.5" />
                <span>Roadway Incidents ({trafficIncidents.length})</span>
              </span>
              <span className="text-[10px] text-slate-500">TRAFFIC FLOW</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {trafficIncidents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  All major arterial roadways flowing normally.
                </div>
              ) : (
                trafficIncidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => {
                        setSelectedIncident(inc);
                        setVmsLine1(`⚠️ ACCIDENT AHEAD - SLOW DOWN`);
                        setVmsLine2('HEAVY TRAFFIC • ALTERNATIVE ROUTE AVAILABLE');
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition space-y-1.5 ${
                        isSelected
                          ? 'bg-amber-950/60 border-amber-400 shadow-md'
                          : 'bg-command-950/60 border-command-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 font-bold border border-amber-500/30">
                          {inc.domain}
                        </span>
                        <span className={`font-bold ${inc.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                          {inc.severity}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{inc.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{inc.description}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-command-800/80 text-[10px] font-mono text-slate-400">
                        <span className="text-cyan-400">Detour Active</span>
                        <span>{inc.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Center: Interactive Map with Detour Routes */}
          <div className="lg:col-span-5 h-full min-h-0 rounded-2xl overflow-hidden border border-command-800 shadow-xl">
            <IncidentMap
              incidents={trafficIncidents}
              cameras={cameras}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              showDetours={true}
              height="100%"
            />
          </div>

          {/* Right: Electronic Roadside Screen (VMS) Live Terminal */}
          <div className="lg:col-span-4 h-full min-h-0 bg-command-900 border border-command-800 rounded-2xl p-4 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-command-800 pb-2">
              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                <Tv className="w-4 h-4" />
                <span>ROADSIDE VMS GANTRY TERMINAL</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">CONNECTED</span>
            </div>

            {/* Live Electronic Amber Sign Preview */}
            <VirtualVMSSign
              line1={vmsLine1}
              line2={vmsLine2}
              speedLimitMph={vmsSpeed}
              isUrgent={true}
            />

            {/* Quick Action Detour Trigger */}
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-amber-300 uppercase">
                Instant Detour Broadcast
              </span>
              <p className="text-xs text-slate-300">
                Pushes dynamic route re-routing to all public navigational signs and roadside digital screens.
              </p>
              <button
                onClick={handleApplyDetour}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-md shadow-amber-950 flex items-center justify-center space-x-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>BROADCAST ALTERNATIVE ROUTE</span>
              </button>
            </div>

            {/* Manual VMS Message Control Form */}
            <form onSubmit={handleUpdateSignage} className="space-y-3 pt-1">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  VMS Screen Line 1:
                </label>
                <input
                  type="text"
                  value={vmsLine1}
                  onChange={(e) => setVmsLine1(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-amber-400 focus:outline-none focus:border-amber-400 uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  VMS Screen Line 2:
                </label>
                <input
                  type="text"
                  value={vmsLine2}
                  onChange={(e) => setVmsLine2(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-amber-300 focus:outline-none focus:border-amber-400 uppercase"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition border border-slate-700"
                >
                  Update Signage
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
