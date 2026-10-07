import React from 'react';
import { CameraAIEvent } from '@urbanshield/shared';
import { useVerifyCameraEvent } from '../hooks/useCameras';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Camera,
  ShieldAlert,
  Sparkles,
  Clock,
} from 'lucide-react';

interface AIVerificationCardProps {
  event: CameraAIEvent;
}

export const AIVerificationCard: React.FC<AIVerificationCardProps> = ({
  event,
}) => {
  const { mutate: verifyEvent, isPending } = useVerifyCameraEvent();

  const handleVerify = () => {
    verifyEvent({ eventId: event.id, verified: true });
  };

  const handleDismiss = () => {
    verifyEvent({ eventId: event.id, verified: false });
  };

  const confidencePct = Math.round((event.confidence || 0.9) * 100);

  return (
    <div className="bg-red-950/70 border-2 border-red-500/60 rounded-2xl p-4 shadow-2xl shadow-red-950/60 animate-pulse-glow text-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      {/* Left: Hazard Details */}
      <div className="flex items-start space-x-3 min-w-0">
        <div className="p-3 rounded-xl bg-red-600/30 border border-red-500/50 text-red-400 shrink-0">
          <ShieldAlert className="w-6 h-6 animate-bounce" />
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-red-500 text-white tracking-wider">
              🚨 {event.incidentType || 'POSSIBLE ACCIDENT'}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/60 text-amber-300 border border-amber-500/40">
              AWAITING VERIFICATION
            </span>
            <span className="text-xs font-mono font-bold text-cyan-300">
              Confidence: {confidencePct}%
            </span>
          </div>

          <p className="text-sm font-bold text-white leading-snug">
            {event.aiAnalysis?.title || event.aiAnalysis?.responder_tactical_brief || 'Autonomous AI sensor flagged high-probability incident on live video stream.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300 pt-0.5">
            <span className="flex items-center gap-1 text-cyan-400">
              <Camera className="w-3.5 h-3.5" />
              <strong>{event.cameraId}</strong>
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {event.location && typeof event.location.latitude === 'number' && typeof event.location.longitude === 'number'
                  ? `${event.location.latitude.toFixed(5)}°, ${event.location.longitude.toFixed(5)}°`
                  : 'Sector Grid'}
              </span>
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Human Verification Actions */}
      <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
        <button
          onClick={handleVerify}
          disabled={isPending}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition shadow-lg shadow-emerald-950 flex items-center space-x-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>VERIFY & DISPATCH</span>
        </button>

        <button
          onClick={handleDismiss}
          disabled={isPending}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition flex items-center space-x-1"
        >
          <XCircle className="w-4 h-4 text-slate-400" />
          <span>DISMISS</span>
        </button>
      </div>
    </div>
  );
};
