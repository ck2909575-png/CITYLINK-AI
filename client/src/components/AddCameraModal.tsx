import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createCameraSession } from '../lib/api';
import { Camera, QrCode, Copy, Check, ExternalLink, ShieldCheck, Clock, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface AddCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCameraId?: string;
}

export const AddCameraModal: React.FC<AddCameraModalProps> = ({
  isOpen,
  onClose,
  defaultCameraId = 'CAMERA-07',
}) => {
  const [cameraId, setCameraId] = useState(defaultCameraId);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [connectUrl, setConnectUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 mins in seconds

  useEffect(() => {
    if (isOpen) {
      generateSession();
    } else {
      setSession(null);
    }
  }, [isOpen, cameraId]);

  useEffect(() => {
    if (!session?.expiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const generateSession = async () => {
    setLoading(true);
    try {
      const result = await createCameraSession({
        cameraId,
        requestedBy: 'Command Operator',
        userRole: 'command_operator',
      });
      setSession(result.session);
      // Construct full mobile url with token and camera ID
      const fullUrl = `${window.location.origin}/camera/connect?cam=${encodeURIComponent(result.session.cameraId)}&token=${encodeURIComponent(result.session.token)}`;
      setConnectUrl(fullUrl);
    } catch (err: any) {
      toast.error('Failed to generate secure camera session', {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(connectUrl);
    setCopied(true);
    toast.success('Registration URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg p-6 bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Register Real Phone Camera
              </h2>
              <p className="text-xs text-slate-400">CITYNEXUS Secure Mobile Surveillance Node</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-sm">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-medium">Assigned Camera ID:</span>
            </div>
            <span className="px-3 py-1 font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 rounded-lg">
              {cameraId}
            </span>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950/90 rounded-xl border border-cyan-500/20 text-center">
            {loading ? (
              <div className="py-12 flex flex-col items-center space-y-3">
                <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                <span className="text-xs text-slate-400">Generating cryptographic session token...</span>
              </div>
            ) : connectUrl ? (
              <>
                <div className="p-3 bg-white rounded-2xl shadow-lg shadow-cyan-500/10 mb-4">
                  <QRCodeSVG
                    value={connectUrl}
                    size={210}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="flex items-center space-x-2 text-xs text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Temporary Token expires in: <strong className="font-mono">{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</strong>
                  </span>
                </div>
              </>
            ) : (
              <div className="text-red-400 text-sm py-8">Failed to generate QR session.</div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-slate-300 space-y-1.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
            <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" /> Quick Connect Steps:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
              <li>Open your phone's Camera app and point it at the QR code.</li>
              <li>Tap the notification to open CITYNEXUS Mobile Camera.</li>
              <li>Grant camera and location permissions when prompted.</li>
              <li>Press <strong className="text-emerald-400">[START CAMERA]</strong> to stream live HD video and GPS.</li>
            </ol>
          </div>

          {/* Direct Link & Copy */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={connectUrl}
              className="flex-1 px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-cyan-500/50 truncate"
            />
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <a
              href={connectUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
              title="Test in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex items-start space-x-2 text-[11px] text-slate-500">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Network notice:</strong> For real mobile phone connection, ensure phone and laptop are on the same local network or use HTTPS / development tunnel (<code className="text-cyan-400">npx localtunnel --port 5000</code>).
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={generateSession}
            disabled={loading}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline-offset-4 hover:underline"
          >
            Regenerate QR Token
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
