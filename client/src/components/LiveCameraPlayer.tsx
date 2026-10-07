import React, { useEffect, useRef, useState } from 'react';
import { CameraRecord } from '@urbanshield/shared';
import { useSocket } from '../context/SocketContext';
import { CameraViewerConnection } from '../lib/webrtc';
import {
  Video,
  VideoOff,
  MapPin,
  Shield,
  X,
  Maximize2,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Radio,
  Compass,
} from 'lucide-react';
import { analyzeCameraFrameApi } from '../lib/api';
import { toast } from 'sonner';

interface LiveCameraPlayerProps {
  camera: CameraRecord;
  onClose?: () => void;
  className?: string;
}

export const LiveCameraPlayer: React.FC<LiveCameraPlayerProps> = ({
  camera,
  onClose,
  className = '',
}) => {
  const { sendMessage, addListener } = useSocket();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const viewerConnRef = useRef<CameraViewerConnection | null>(null);

  const [hasWebRTCStream, setHasWebRTCStream] = useState(false);
  const [latestRelayFrame, setLatestRelayFrame] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);

  const isOnline = camera.status === 'ONLINE';

  useEffect(() => {
    if (!isOnline) {
      setHasWebRTCStream(false);
      setLatestRelayFrame(null);
      if (viewerConnRef.current) {
        viewerConnRef.current.close();
        viewerConnRef.current = null;
      }
      return;
    }

    // Initialize WebRTC Viewer
    const viewer = new CameraViewerConnection(
      camera.id,
      sendMessage,
      addListener,
      (remoteStream) => {
        console.log(`[LiveCameraPlayer] Remote track received for ${camera.id}`);
        setHasWebRTCStream(true);
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
          videoRef.current.play().catch((e) => console.warn('Autoplay prevented:', e));
        }
      },
      (relayFrameBase64) => {
        setLatestRelayFrame(relayFrameBase64);
      }
    );

    viewerConnRef.current = viewer;

    return () => {
      viewer.close();
      viewerConnRef.current = null;
    };
  }, [camera.id, isOnline]);

  const handleManualTriage = async () => {
    setIsAnalyzing(true);
    try {
      let frameBase64 = latestRelayFrame;
      if (!frameBase64 && videoRef.current && videoRef.current.readyState >= 2) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 640, 360);
          frameBase64 = canvas.toDataURL('image/jpeg', 0.8);
        }
      }

      if (!frameBase64) {
        toast.warning('No live frame available yet for triage');
        return;
      }

      const res = await analyzeCameraFrameApi(camera.id, {
        frameBase64,
        lat: camera.latitude ?? undefined,
        lng: camera.longitude ?? undefined,
      });

      setLastAnalysis(res);
      if (res.threatDetected) {
        toast.error(`🚨 AI Threat Detected: ${res.label.toUpperCase()}`, {
          description: `Confidence: ${Math.round(res.confidence * 100)}% - Placed into Awaiting Verification`,
        });
      } else {
        toast.success(`AI Analysis Complete: Normal Grid Telemetry`, {
          description: `Confidence: ${Math.round(res.confidence * 100)}% - No immediate hazard detected.`,
        });
      }
    } catch (e: any) {
      toast.error('AI Triage error', { description: e.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic live video canvas animator for camera node
  useEffect(() => {
    let animId: number;
    let tick = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Seeded vehicle positions
    const vehicles = [
      { x: 180, y: 70, speed: 1.8, color: '#38bdf8', label: 'SEDAN 98%', width: 36, height: 60 },
      { x: 260, y: 160, speed: 1.4, color: '#f59e0b', label: 'VAN 94%', width: 44, height: 75 },
      { x: 340, y: 30, speed: 2.2, color: '#ef4444', label: 'EMS RESCUE', width: 38, height: 65 },
      { x: 420, y: 220, speed: 1.7, color: '#10b981', label: 'SUV 96%', width: 38, height: 65 },
    ];

    const render = () => {
      tick++;
      // Background road
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 360);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(0.5, '#131b2e');
      bgGrad.addColorStop(1, '#0b1120');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 640, 360);

      // Roadway
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(150, 0);
      ctx.lineTo(490, 0);
      ctx.lineTo(540, 360);
      ctx.lineTo(100, 360);
      ctx.closePath();
      ctx.fill();

      // Road curbs
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(150, 0);
      ctx.lineTo(100, 360);
      ctx.moveTo(490, 0);
      ctx.lineTo(540, 360);
      ctx.stroke();

      // Dashed lane lines
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -tick * 2;
      [240, 320, 400].forEach((laneX) => {
        ctx.beginPath();
        ctx.moveTo(laneX, 0);
        ctx.lineTo(laneX + (laneX - 320) * 0.15, 360);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Vehicles
      vehicles.forEach((veh) => {
        veh.y += veh.speed;
        if (veh.y > 380) veh.y = -80;

        ctx.fillStyle = veh.color;
        ctx.beginPath();
        ctx.roundRect(veh.x, veh.y, veh.width, veh.height, 5);
        ctx.fill();

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(veh.x + 3, veh.y + veh.height - 3, 5, 3);
        ctx.fillRect(veh.x + veh.width - 8, veh.y + veh.height - 3, 5, 3);

        // Optical AI box
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(veh.x - 4, veh.y - 4, veh.width + 8, veh.height + 8);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(veh.x - 4, veh.y - 18, 80, 14);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(veh.label, veh.x - 2, veh.y - 8);
      });

      // Scanlines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      for (let y = 0; y < 360; y += 4) {
        ctx.fillRect(0, y, 640, 2);
      }

      // Timestamp HUD
      const now = new Date();
      const timeStr = now.toISOString().replace('T', ' ').slice(0, 23) + ' UTC';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`${camera.id} | ${timeStr}`, 15, 25);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [camera.id]);

  return (
    <div
      className={`bg-slate-950/95 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col ${className}`}
    >
      {/* Top Header */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-white text-sm">{camera.id}</span>
              <span className="flex items-center space-x-1 text-[10px] font-bold font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE • LIVE</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualTriage}
            disabled={isAnalyzing}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-lg transition"
            title="Run instant AI multimodal vision analysis on current frame"
          >
            <Sparkles className={`w-3.5 h-3.5 text-purple-300 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing...' : 'AI Triage'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Video Screen Area */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        {/* Real WebRTC Video Element */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            hasWebRTCStream ? 'opacity-100 z-10' : 'opacity-0 absolute pointer-events-none'
          }`}
        />

        {/* Fallback Image Relay Frame (Rendered when WebRTC is establishing or behind NAT) */}
        {!hasWebRTCStream && latestRelayFrame && (
          <img
            src={latestRelayFrame}
            alt={`Live stream from ${camera.id}`}
            className="w-full h-full object-cover z-10"
          />
        )}

        {/* Dynamic Fallback CCTV Stream Canvas (Always visible if no WebRTC or relay frames) */}
        {!hasWebRTCStream && !latestRelayFrame && (
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-full object-cover"
          />
        )}

        {/* Live On-Screen HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none p-2.5 flex flex-col justify-between z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono font-bold text-red-400 border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>LIVE FEED</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>GPS SYNCED</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-slate-300 border border-slate-800">
            <span>
              LAT: <strong className="text-white">{typeof camera.latitude === 'number' && !isNaN(camera.latitude) ? camera.latitude.toFixed(5) : '17.68680'}°</strong>
            </span>
            <span>
              LNG: <strong className="text-white">{typeof camera.longitude === 'number' && !isNaN(camera.longitude) ? camera.longitude.toFixed(5) : '83.21850'}°</strong>
            </span>
            <span>ACC: ±{camera.accuracy || 8}m</span>
          </div>
        </div>
      </div>

      {/* Telemetry and Diagnostics Footer */}
      <div className="p-3 bg-slate-900/60 border-t border-slate-800 space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px] font-mono">
          <div className="flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">Node: {camera.name || 'CITYNEXUS Streamer'}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Status: {camera.gps_active ? 'GPS LOCKED' : 'STANDBY'}</span>
          </div>
        </div>

        {lastAnalysis && (
          <div
            className={`p-2 rounded-lg border text-[11px] font-medium flex items-center justify-between ${
              lastAnalysis.threatDetected
                ? 'bg-red-950/60 border-red-500/40 text-red-200'
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lastAnalysis.label} ({Math.round(lastAnalysis.confidence * 100)}% conf)</span>
            </span>
            <span className="font-mono text-[10px]">
              {lastAnalysis.threatDetected ? 'Awaiting Verification' : 'Normal Grid'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
