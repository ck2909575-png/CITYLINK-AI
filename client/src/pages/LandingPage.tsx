import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  Radio,
  Zap,
  MapPin,
  Clock,
  ArrowRight,
  Tv,
  CheckCircle2,
  Cpu,
  Flame,
  Activity,
  Car,
  Tent,
  Camera,
  Users,
  Shield,
  Sliders,
} from 'lucide-react';
import { useIncidents, useActiveSignage } from '../hooks/useIncidents';
import { IncidentMap } from '../components/IncidentMap';
import { VirtualVMSSign } from '../components/VirtualVMSSign';
import { DepartmentNav } from '../components/DepartmentNav';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Inline Department Portals
import { CommandDashboard } from './CommandDashboard';
import { PolicePortal } from './PolicePortal';
import { FirePortal } from './FirePortal';
import { MedicalPortal } from './MedicalPortal';
import { TrafficPortal } from './TrafficPortal';
import { DisasterPortal } from './DisasterPortal';
import { CameraPortal } from './CameraPortal';
import { CitizenPortal } from './CitizenPortal';

export const LandingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const { data: incidents = [], isLoading } = useIncidents();
  const { data: signageList = [] } = useActiveSignage();

  const activeIncidents = incidents.filter((i) => i.status !== 'CLOSED');
  const criticalCount = activeIncidents.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = activeIncidents.filter((i) => i.severity === 'HIGH').length;

  const primarySign = signageList[0] || null;

  const switchTab = (tabId: string) => {
    if (tabId === 'overview') {
      searchParams.delete('tab');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ tab: tabId });
    }
  };

  // Render department portal if selected
  if (currentTab === 'command') {
    return (
      <ErrorBoundary fallbackTitle="Command HQ Safe Recovery">
        <CommandDashboard />
      </ErrorBoundary>
    );
  }
  if (currentTab === 'police') {
    return (
      <ErrorBoundary fallbackTitle="Police Control Safe Recovery">
        <PolicePortal />
      </ErrorBoundary>
    );
  }
  if (currentTab === 'fire') {
    return (
      <ErrorBoundary fallbackTitle="Fire & Rescue Safe Recovery">
        <FirePortal />
      </ErrorBoundary>
    );
  }
  if (currentTab === 'medical') {
    return (
      <ErrorBoundary fallbackTitle="Medical EMS Safe Recovery">
        <MedicalPortal />
      </ErrorBoundary>
    );
  }
  if (currentTab === 'traffic') {
    return (
      <ErrorBoundary fallbackTitle="Traffic Control Safe Recovery">
        <TrafficPortal />
      </ErrorBoundary>
    );
  }
  if (currentTab === 'disaster') {
    return (
      <ErrorBoundary fallbackTitle="Disaster Operations Safe Recovery">
        <DisasterPortal />
      </ErrorBoundary>
    );
  }
  if (currentTab === 'cameras') {
    return (
      <ErrorBoundary fallbackTitle="Camera Fleet Safe Recovery">
        <CameraPortal />
      </ErrorBoundary>
    );
  }
  if (currentTab === 'citizen') {
    return (
      <ErrorBoundary fallbackTitle="Citizen Portal Safe Recovery">
        <CitizenPortal />
      </ErrorBoundary>
    );
  }

  // Otherwise, render Unified Overview Hub
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-command-950">
      {/* 8-Department Switcher Bar */}
      <DepartmentNav activeTab="overview" onTabChange={switchTab} />

      <div className="space-y-10 pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-8 pb-10 sm:pt-10 sm:pb-12 border-b border-command-800 bg-gradient-to-b from-command-950 via-command-900 to-command-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-5">
              {/* Live System Banner */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-mono shadow-md">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>URBANSHIELD ALL-IN-ONE SMART CITY COMMAND MESH</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Unified Emergency Intelligence &{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
                  Rapid Agency Dispatch
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                All 8 municipal emergency departments unified in a single live link. Live Gemini 2.5 multimodal triage, PostGIS hazard exclusion perimeter routing, and real-time WebRTC surveillance.
              </p>

              {/* Department Quick Launcher Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 max-w-4xl mx-auto text-left">
                <button
                  onClick={() => switchTab('command')}
                  className="p-3 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 hover:border-cyan-400 rounded-xl transition flex items-center space-x-2.5 text-left group"
                >
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Command HQ</h4>
                    <p className="text-[10px] text-slate-400">Master Operations</p>
                  </div>
                </button>

                <button
                  onClick={() => switchTab('police')}
                  className="p-3 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 hover:border-blue-400 rounded-xl transition flex items-center space-x-2.5 text-left group"
                >
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Police Control</h4>
                    <p className="text-[10px] text-slate-400">Patrols & Tactical</p>
                  </div>
                </button>

                <button
                  onClick={() => switchTab('fire')}
                  className="p-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 hover:border-rose-400 rounded-xl transition flex items-center space-x-2.5 text-left group"
                >
                  <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-105 transition-transform">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Fire & Hazmat</h4>
                    <p className="text-[10px] text-slate-400">Thermal & Rescue</p>
                  </div>
                </button>

                <button
                  onClick={() => switchTab('medical')}
                  className="p-3 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 hover:border-emerald-400 rounded-xl transition flex items-center space-x-2.5 text-left group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Medical EMS</h4>
                    <p className="text-[10px] text-slate-400">Hospitals & Paramedics</p>
                  </div>
                </button>

                <button
                  onClick={() => switchTab('traffic')}
                  className="p-3 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 hover:border-amber-400 rounded-xl transition flex items-center space-x-2.5 text-left group"
                >
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Traffic Control</h4>
                    <p className="text-[10px] text-slate-400">VMS & Detours</p>
                  </div>
                </button>

                <button
                  onClick={() => switchTab('disaster')}
                  className="p-3 bg-orange-950/40 hover:bg-orange-900/60 border border-orange-500/30 hover:border-orange-400 rounded-xl transition flex items-center space-x-2.5 text-left group"
                >
                  <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 group-hover:scale-105 transition-transform">
                    <Tent className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Disaster Dept</h4>
                    <p className="text-[10px] text-slate-400">Shelters & Relief</p>
                  </div>
                </button>

                <button
                  onClick={() => switchTab('cameras')}
                  className="p-3 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 hover:border-purple-400 rounded-xl transition flex items-center space-x-2.5 text-left group"
                >
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Camera Fleet</h4>
                    <p className="text-[10px] text-slate-400">WebRTC Surveillance</p>
                  </div>
                </button>

                <button
                  onClick={() => switchTab('citizen')}
                  className="p-3 bg-teal-950/40 hover:bg-teal-900/60 border border-teal-500/30 hover:border-teal-400 rounded-xl transition flex items-center space-x-2.5 text-left group"
                >
                  <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 group-hover:scale-105 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Citizen Portal</h4>
                    <p className="text-[10px] text-slate-400">SOS & Safe Zones</p>
                  </div>
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <Link
                  to="/sos"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
                >
                  <ShieldAlert className="w-4 h-4 animate-pulse" />
                  <span>REPORT EMERGENCY SOS (VOICE / TEXT)</span>
                </Link>
                <button
                  onClick={() => switchTab('command')}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-command-800 hover:bg-command-700 text-slate-100 font-bold text-xs border border-command-700 flex items-center justify-center space-x-2 transition"
                >
                  <span>LAUNCH MASTER INCIDENT CONSOLE</span>
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                </button>
              </div>

              {/* Live Metrics Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-4xl mx-auto text-left">
                <div className="p-3 bg-command-900/80 border border-command-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Active Incidents
                  </span>
                  <div className="text-2xl font-black font-mono text-white mt-0.5">
                    {activeIncidents.length}
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    Real-time Supabase Sync
                  </span>
                </div>
                <div className="p-3 bg-command-900/80 border border-command-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Critical Emergencies
                  </span>
                  <div className="text-2xl font-black font-mono text-red-400 mt-0.5">
                    {criticalCount}
                  </div>
                  <span className="text-[10px] text-red-300 font-mono">
                    Immediate Life-Safety
                  </span>
                </div>
                <div className="p-3 bg-command-900/80 border border-command-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Triage Latency
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                    &lt; 3.2s
                  </div>
                  <span className="text-[10px] text-emerald-300 font-mono">
                    Gemini 2.5 Flash SDK
                  </span>
                </div>
                <div className="p-3 bg-command-900/80 border border-command-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Connected Fleets
                  </span>
                  <div className="text-2xl font-black font-mono text-blue-400 mt-0.5">
                    8 Sectors
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Zero-Silo Agency Mesh
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Roadside Signage Virtual Preview */}
        {primarySign && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-3 space-y-1">
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest">
                LIVE DIGITAL ROADSIDE SIGNAGE BROADCAST (VMS)
              </span>
              <h2 className="text-base font-bold text-slate-200">
                Active Municipal Roadway Hazard Directive
              </h2>
            </div>
            <VirtualVMSSign
              terminalName={primarySign.terminal_name}
              line1={primarySign.vms_display_line_1}
              line2={primarySign.vms_display_line_2}
              isUrgent={primarySign.flashing_amber_alert}
              speedLimitMph={primarySign.recommended_speed_mph}
              detourText={primarySign.detour_instructions}
            />
          </section>
        )}

        {/* Live Map Preview & Incident Summary */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 uppercase">
                <MapPin className="w-4 h-4" />
                <span>Real-Time Situational Map</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Metro Emergency Incidents & Hazard Exclusion Zones
              </h2>
            </div>
            <button
              onClick={() => switchTab('command')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 font-mono bg-command-900 border border-command-700 px-3 py-2 rounded-lg transition"
            >
              <span>Inspect Full Tactical Grid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-[460px] rounded-2xl overflow-hidden border border-command-800 shadow-2xl">
            <IncidentMap
              incidents={activeIncidents}
              height="100%"
              zoom={13}
            />
          </div>
        </section>

        {/* Multi-Agency Coordinated Mesh */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-command-900 border border-command-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-1.5">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                Multi-Agency Coordinated Mesh
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Zero Silos. Unified Dispatch across 8 Municipal Departments.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                onClick={() => switchTab('medical')}
                className="p-4 bg-command-950 border border-command-800 hover:border-emerald-500/40 rounded-2xl space-y-2 cursor-pointer transition group"
              >
                <Activity className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-xs text-white">Health & EMS</h4>
                <p className="text-[11px] text-slate-400">
                  Paramedic triage, ALS ambulances, trauma center diversion feeds.
                </p>
              </div>

              <div
                onClick={() => switchTab('fire')}
                className="p-4 bg-command-950 border border-command-800 hover:border-rose-500/40 rounded-2xl space-y-2 cursor-pointer transition group"
              >
                <Flame className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-xs text-white">Fire & Rescue</h4>
                <p className="text-[11px] text-slate-400">
                  Thermal suppression, structural collapse, HAZMAT chemical containment.
                </p>
              </div>

              <div
                onClick={() => switchTab('police')}
                className="p-4 bg-command-950 border border-command-800 hover:border-blue-500/40 rounded-2xl space-y-2 cursor-pointer transition group"
              >
                <Radio className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-xs text-white">Metropolitan Police</h4>
                <p className="text-[11px] text-slate-400">
                  Perimeter containment, collision investigation, active threat suppression.
                </p>
              </div>

              <div
                onClick={() => switchTab('traffic')}
                className="p-4 bg-command-950 border border-command-800 hover:border-amber-500/40 rounded-2xl space-y-2 cursor-pointer transition group"
              >
                <Car className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-xs text-white">Traffic Control</h4>
                <p className="text-[11px] text-slate-400">
                  Variable message signs (VMS), signal overrides, bypass routes.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
