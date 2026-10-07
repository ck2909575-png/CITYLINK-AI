import React, { useState } from 'react';
import { useCameras } from '../hooks/useCameras';
import { CameraRecord } from '@urbanshield/shared';
import { DepartmentNav } from '../components/DepartmentNav';
import { AddCameraModal } from '../components/AddCameraModal';
import { LiveCameraPlayer } from '../components/LiveCameraPlayer';
import {
  Camera,
  Video,
  VideoOff,
  MapPin,
  ShieldCheck,
  Plus,
  RefreshCw,
  Compass,
  Radio,
  ExternalLink,
  Smartphone,
  Eye,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CameraPortal: React.FC = () => {
  const { data: cameras = [], refetch, isFetching } = useCameras('command_operator');
  const [isAddCameraOpen, setIsAddCameraOpen] = useState(false);
  const [selectedWatchCamera, setSelectedWatchCamera] = useState<CameraRecord | null>(null);

  const onlineCameras = cameras.filter((c) => c.status === 'ONLINE');
  const offlineCameras = cameras.filter((c) => c.status === 'OFFLINE');

  // Default active camera: selected camera or CAMERA-07 or first camera
  const activeCamera =
    selectedWatchCamera ||
    cameras.find((c) => c.id === 'CAMERA-07') ||
    cameras[0] ||
    null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-command-950">
      <DepartmentNav />

      <div className="flex-1 flex flex-col p-4 space-y-4 max-w-7xl mx-auto w-full">
        {/* Top Control Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold text-white uppercase font-mono tracking-wider">
                  City Surveillance & IoT Camera Fleet Manager
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                  WEBRTC MESH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-Time Video Nodes • Mobile Smartphone Registration • Telemetry Health
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/camera/connect?cam=CAMERA-07"
              target="_blank"
              className="px-3 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 rounded-xl font-mono text-xs font-bold transition flex items-center space-x-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>START PHONE NODE (CAM-07)</span>
            </Link>

            <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE: <strong>{onlineCameras.length}</strong></span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>OFFLINE: <strong>{offlineCameras.length}</strong></span>
              </span>
            </div>

            <button
              onClick={() => refetch()}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="Refresh Camera Fleet"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsAddCameraOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold rounded-xl transition shadow-lg shadow-purple-950 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>ADD CAMERA (QR)</span>
            </button>
          </div>
        </div>

        {/* Live Command Video Player Monitor */}
        {activeCamera && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider">
                <Video className="w-4 h-4" />
                Active Tactical Video Monitor: <span className="text-white">{activeCamera.id}</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Click any camera card below to switch feed
              </span>
            </div>
            <LiveCameraPlayer camera={activeCamera} className="w-full max-w-4xl mx-auto shadow-2xl" />
          </div>
        )}

        {/* Camera Fleet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map((camera) => {
            const isOnline = camera.status === 'ONLINE';
            const isMobile = camera.id.includes('07') || camera.name.includes('Mobile');

            return (
              <div
                key={camera.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                  isOnline
                    ? 'bg-slate-900/80 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`p-2 rounded-xl ${
                        isOnline
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {isMobile ? <Smartphone className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-mono font-bold text-white text-sm">{camera.id}</h3>
                        {isMobile && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                            PHONE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{camera.name}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isOnline ? (
                    <span className="flex items-center space-x-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>ONLINE</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-[11px] font-mono font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded-lg border border-red-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>OFFLINE</span>
                    </span>
                  )}
                </div>

                {/* Sensor & Telemetry Data */}
                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-850 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" /> Coordinates:
                    </span>
                    <span className="text-white">
                      {typeof camera.latitude === 'number' && typeof camera.longitude === 'number' && !isNaN(camera.latitude) && !isNaN(camera.longitude)
                        ? `${camera.latitude.toFixed(5)}°, ${camera.longitude.toFixed(5)}°`
                        : 'PENDING CONNECTION'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Radio className="w-3 h-3 text-emerald-400" /> GPS Status:
                    </span>
                    <span className={camera.gps_active ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {camera.gps_active ? `ACTIVE (±${camera.accuracy || 8}m)` : 'INACTIVE'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Telemetry Ping:
                    </span>
                    <span className="text-slate-300">
                      {camera.last_updated ? new Date(camera.last_updated).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Node Status / Actions */}
                <div className="pt-1 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWatchCamera(camera);
                      window.scrollTo({ top: 100, behavior: 'smooth' });
                    }}
                    className={`py-2 px-3 font-mono font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 flex-1 ${
                      activeCamera?.id === camera.id
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{activeCamera?.id === camera.id ? 'NOW PLAYING' : 'WATCH FEED'}</span>
                  </button>

                  {isMobile && (
                    <Link
                      to={`/camera/connect?cam=${camera.id}`}
                      target="_blank"
                      className="py-2 px-3 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 font-mono font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1"
                      title="Open Mobile Streamer Interface"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>STREAM</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security and Authorization Notice */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-start space-x-3 text-xs text-slate-400">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-white">Cryptographic Node Security & RBAC Access Policy</h4>
            <p>
              Only authenticated CITYNEXUS operators and registered departmental nodes can subscribe to raw live WebRTC streams. Public citizen users are strictly restricted from surveillance feeds.
            </p>
          </div>
        </div>
      </div>

      {/* Add Camera Modal */}
      <AddCameraModal
        isOpen={isAddCameraOpen}
        onClose={() => setIsAddCameraOpen(false)}
        defaultCameraId="CAMERA-07"
      />
    </div>
  );
};
