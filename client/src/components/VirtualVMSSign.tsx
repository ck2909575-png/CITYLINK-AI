import React from 'react';
import { AlertTriangle, Compass, ShieldAlert } from 'lucide-react';

interface VirtualVMSSignProps {
  terminalName?: string;
  line1: string;
  line2?: string;
  isUrgent?: boolean;
  speedLimitMph?: number;
  detourText?: string;
}

export const VirtualVMSSign: React.FC<VirtualVMSSignProps> = ({
  terminalName = 'VMS GANTRY #104 (HIGHWAY CORRIDOR)',
  line1,
  line2 = 'REDUCE SPEED - PREPARE TO STOP',
  isUrgent = true,
  speedLimitMph = 25,
  detourText,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Sign Gantry Hardware Mounting Frame */}
      <div className="bg-slate-800 rounded-t-xl py-1 px-4 flex items-center justify-between text-[11px] font-mono text-slate-300 border-t-2 border-x-2 border-slate-700 shadow-lg">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold tracking-wide">{terminalName}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[10px] text-slate-400">STATUS: ACTIVE FEED</span>
        </div>
      </div>

      {/* Main Electronic Amber LED Board Display */}
      <div className="relative bg-black p-5 sm:p-7 rounded-b-xl border-4 border-slate-800 shadow-2xl vms-led-screen overflow-hidden">
        {/* Amber Flashing Hazard Beacons (Left & Right) */}
        <div className="absolute top-3 left-3 flex items-center space-x-1">
          <div
            className={`w-4 h-4 rounded-full bg-amber-500 shadow-lg shadow-amber-500 ${
              isUrgent ? 'animate-pulse-fast' : 'opacity-80'
            }`}
          />
        </div>
        <div className="absolute top-3 right-3 flex items-center space-x-1">
          <div
            className={`w-4 h-4 rounded-full bg-amber-500 shadow-lg shadow-amber-500 ${
              isUrgent ? 'animate-pulse-fast' : 'opacity-80'
            }`}
          />
        </div>

        {/* LED Matrix Text Lines */}
        <div className="text-center space-y-2 py-2">
          <div className="vms-led-text text-sm sm:text-lg md:text-xl font-mono uppercase tracking-widest leading-relaxed">
            {line1 || 'ALL LANES OPEN - DRIVE SAFELY'}
          </div>
          {line2 && (
            <div className="vms-led-text text-xs sm:text-base md:text-lg font-mono uppercase tracking-widest text-amber-300/90 leading-relaxed">
              {line2}
            </div>
          )}
        </div>

        {/* Bottom Variable Status Row */}
        <div className="mt-4 pt-3 border-t border-amber-950/60 flex items-center justify-between text-[11px] font-mono text-amber-500/80">
          <div className="flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>ADVISORY SPEED: {speedLimitMph} MPH</span>
          </div>
          <div className="flex items-center space-x-1">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>BYPASS: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Detour Footer Notification */}
      {detourText && (
        <div className="mt-2 text-center text-xs text-slate-400 font-mono">
          ℹ️ Navigation Detour Directive: <span className="text-cyan-300 font-semibold">{detourText}</span>
        </div>
      )}
    </div>
  );
};
