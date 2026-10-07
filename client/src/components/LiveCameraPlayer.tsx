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
              {isOnline ? (
                <span className="flex items-center space-x-1 text-[10px] font-bold font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ONLINE • LIVE</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-[10px] font-bold font-mono text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>OFFLINE</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isOnline && (
            <button
              onClick={handleManualTriage}
              disabled={isAnalyzing}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-lg transition"
              title="Run instant AI multimodal vision analysis on current frame"
            >
              <Sparkles className={`w-3.5 h-3.5 text-purple-300 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing...' : 'AI Triage'}</span>
            </button>
          )}

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
        {isOnline ? (
          <>
            {/* Real WebRTC Video Element */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                hasWebRTCStream ? 'opacity-100' : 'opacity-0 absolute'
              }`}
            />

            {/* Instant Fallback Image Relay Frame (Rendered when WebRTC is establishing or behind NAT) */}
            {!hasWebRTCStream && latestRelayFrame && (
              <img
                src={latestRelayFrame}
                alt={`Live stream from ${camera.id}`}
                className="w-full h-full object-cover"
              />
            )}

            {/* Waiting for feed state */}
            {!hasWebRTCStream && !latestRelayFrame && (
              <div className="flex flex-col items-center justify-center space-y-2 p-6 text-center">
                <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                <span className="text-xs font-mono text-cyan-300">
                  Establishing P2P WebRTC handshake with mobile phone...
                </span>
                <span className="text-[11px] text-slate-400">
                  Camera: {camera.id} (Listening on signaling mesh)
                </span>
              </div>
            )}

            {/* Live On-Screen HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none p-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono font-bold text-red-400 border border-red-500/30">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>LIVE REAR FEED</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                  <Radio className="w-3 h-3 text-emerald-400" />
                  <span>GPS ACTIVE</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-slate-300 border border-slate-800">
                <span>
                  LAT: <strong className="text-white">{typeof camera.latitude === 'number' && !isNaN(camera.latitude) ? camera.latitude.toFixed(5) : '0.00000'}°</strong>
                </span>
                <span>
                  LNG: <strong className="text-white">{typeof camera.longitude === 'number' && !isNaN(camera.longitude) ? camera.longitude.toFixed(5) : '0.00000'}°</strong>
                </span>
                <span>ACC: ±{camera.accuracy || 8}m</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 text-slate-400">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <VideoOff className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-300">🔴 {camera.id} is currently OFFLINE</p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              No phone is actively broadcasting on this camera ID. Scan the registration QR code on your mobile device to start live streaming.
            </p>
          </div>
        )}
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
