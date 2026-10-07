import React, { useState } from 'react';
import {
  useIncidents,
  useResponseUnits,
  useUpdateIncidentStatus,
  useTriggerSimulation,
} from '../hooks/useIncidents';
import { useCameras, useCameraEvents } from '../hooks/useCameras';
import { IncidentRecord, IncidentStatus } from '@urbanshield/shared';
import { LiveTriageQueue } from '../components/LiveTriageQueue';
import { IncidentMap } from '../components/IncidentMap';
import { IncidentDetailDrawer } from '../components/IncidentDetailDrawer';
import { DepartmentNav } from '../components/DepartmentNav';
import { AddCameraModal } from '../components/AddCameraModal';
import { AIVerificationCard } from '../components/AIVerificationCard';
import {
  Sliders,
  Cpu,
  RefreshCw,
  Shield,
  Activity,
  Flame,
  Truck,
  Tv,
  Camera,
  Plus,
  Video,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const CommandDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: incidents = [], isLoading: isIncidentsLoading } = useIncidents();
  const { data: units = [] } = useResponseUnits();
  const { data: cameras = [] } = useCameras(user.role);
  const { data: cameraEvents = [] } = useCameraEvents();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateIncidentStatus();
  const { mutate: triggerSim, isPending: isSimulating } = useTriggerSimulation();

  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [isAddCameraOpen, setIsAddCameraOpen] = useState(false);

  // If none selected, default to the most urgent or newest active incident
  const activeSelected =
    selectedIncident ||
    incidents.find((i) => i.severity === 'CRITICAL') ||
    incidents[0] ||
    null;

  const handleStatusUpdate = (
    status: IncidentStatus,
    unitId?: string,
    notes?: string
  ) => {
    if (!activeSelected) return;
    updateStatus({
      id: activeSelected.id,
      status,
      unit_id: unitId,
      notes,
    });
  };

  const idleUnitsCount = units.filter((u) => u.status === 'IDLE').length;
  const onlineCameras = cameras.filter((c) => c.status === 'ONLINE');
  const pendingAiEvents = cameraEvents.filter((e) => e.status === 'AWAITING_VERIFICATION');

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-command-950">
      {/* 8 Department Navigation Bar */}
      <DepartmentNav />

      <div className="flex-1 flex flex-col p-4 space-y-3 min-h-0">
        {/* Top Operations Telemetry Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-command-900 border border-command-800 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Emergency Command & Control Center
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  ACTIVE GRID
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Operator: <span className="text-slate-200 font-semibold">{user.full_name}</span> ({user.role})
              </p>
            </div>
          </div>

          {/* Quick Fleet, Cameras & Actions */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-4 px-3 py-1.5 rounded-xl bg-command-950 border border-command-800 text-xs font-mono">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Video className={`w-3.5 h-3.5 ${onlineCameras.length > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span>
                  Cameras Online:{' '}
                  <strong className={onlineCameras.length > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {onlineCameras.length}
                  </strong>
                  /{cameras.length}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fleet Idle: <strong className="text-emerald-400">{idleUnitsCount}</strong>/{units.length}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Activity className="w-3.5 h-3.5 text-red-400" />
                <span>Incidents: <strong className="text-red-400">{incidents.length}</strong></span>
              </div>
            </div>

            {/* ADD CAMERA (QR Code Registration) Button */}
            <button
              onClick={() => setIsAddCameraOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-cyan-950 transition"
              title="Generate temporary QR code to connect mobile phone camera"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD CAMERA</span>
            </button>

            {/* Seed IoT / CCTV Simulation Button */}
            <button
              disabled={isSimulating}
              onClick={() => triggerSim(undefined)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold flex items-center space-x-1.5 border border-slate-750 transition"
              title="Simulate incoming IoT sensor trip or automated CCTV detection"
            >
              <Cpu className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>Simulate IoT Alert</span>
            </button>
          </div>
        </div>

        {/* Pending AI Verification Alert Queue (Human-In-The-Loop) */}
        {pendingAiEvents.map((evt) => (
          <AIVerificationCard key={evt.id} event={evt} />
        ))}

        {/* Main Grid View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[580px]">
          {/* Left Column: Live Triage Queue */}
          <div className="lg:col-span-3 h-full min-h-0">
            <LiveTriageQueue
              incidents={incidents}
              selectedIncidentId={activeSelected?.id}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
            />
          </div>

          {/* Center Column: Situational Interactive Map */}
          <div className="lg:col-span-5 h-full min-h-0 rounded-2xl overflow-hidden border border-command-800 shadow-xl">
            <IncidentMap
              incidents={incidents}
              units={units}
              cameras={cameras}
              selectedIncident={activeSelected}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              height="100%"
            />
          </div>

          {/* Right Column: Incident Inspection & Dispatch Drawer */}
          <div className="lg:col-span-4 h-full min-h-0">
            {activeSelected ? (
              <IncidentDetailDrawer
                incident={activeSelected}
                units={units}
                onClose={() => setSelectedIncident(null)}
                onUpdateStatus={handleStatusUpdate}
                isUpdating={isUpdating}
              />
            ) : (
              <div className="h-full bg-command-900 border border-command-800 rounded-2xl flex items-center justify-center p-6 text-center text-slate-500 text-xs">
                Select an emergency incident from the Triage Queue or Map to inspect tactical brief.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Camera QR Registration Modal */}
      <AddCameraModal
        isOpen={isAddCameraOpen}
        onClose={() => setIsAddCameraOpen(false)}
        defaultCameraId="CAMERA-07"
      />
    </div>
  );
};

