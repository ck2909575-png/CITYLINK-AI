import React from 'react';
import {
  IncidentRecord,
  ResponseUnitRecord,
  AgencyType,
} from '@urbanshield/shared';
import { Truck, Navigation, CheckCircle2, ShieldAlert } from 'lucide-react';

interface UnitDispatchSelectorProps {
  incident: IncidentRecord;
  units: ResponseUnitRecord[];
  onAssignUnit: (unitId: string) => void;
}

// Haversine distance in meters
function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function formatDist(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export const UnitDispatchSelector: React.FC<UnitDispatchSelectorProps> = ({
  incident,
  units,
  onAssignUnit,
}) => {
  // Compute distance for all units and filter by recommended agency first
  const enrichedUnits = units
    .map((u) => {
      const dist = getDistance(
        incident.latitude,
        incident.longitude,
        u.latitude,
        u.longitude
      );
      // Rough ETA estimation: assuming 35 km/h urban emergency response speed
      const etaMinutes = Math.max(1, Math.round((dist / (35 * 1000)) * 60));
      return {
        ...u,
        distance_meters: dist,
        etaMinutes,
        isMatchingAgency: u.agency === incident.primary_agency,
      };
    })
    .sort((a, b) => {
      // Prioritize matching agency and IDLE status, then distance
      if (a.isMatchingAgency && !b.isMatchingAgency) return -1;
      if (!a.isMatchingAgency && b.isMatchingAgency) return 1;
      if (a.status === 'IDLE' && b.status !== 'IDLE') return -1;
      if (a.status !== 'IDLE' && b.status === 'IDLE') return 1;
      return a.distance_meters - b.distance_meters;
    });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
            Target Agency: {incident.primary_agency}
          </h4>
          <p className="text-[11px] text-slate-400">
            Automated Haversine distance pairing from incident coordinates
          </p>
        </div>
      </div>

      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {enrichedUnits.map((u, idx) => {
          const isAssignedToThis = incident.assigned_unit_id === u.id;
          const isIdle = u.status === 'IDLE';

          return (
            <div
              key={u.id}
              className={`p-3 rounded-xl border transition flex items-center justify-between ${
                isAssignedToThis
                  ? 'bg-emerald-950/40 border-emerald-500/60'
                  : isIdle && u.isMatchingAgency
                  ? 'bg-command-950 border-command-700 hover:border-cyan-500'
                  : 'bg-command-950/50 border-command-800 opacity-60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-slate-100">
                    {u.unit_callsign}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                      isIdle
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {u.status}
                  </span>
                  {idx === 0 && isIdle && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      ★ FASTEST ETA
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
                  <span>Agency: {u.agency}</span>
                  <span>•</span>
                  <span>Dist: {formatDist(u.distance_meters)}</span>
                  <span>•</span>
                  <span className="text-cyan-400">ETA: ~{u.etaMinutes} min</span>
                </div>
              </div>

              <div>
                {isAssignedToThis ? (
                  <span className="px-2.5 py-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 rounded border border-emerald-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ON DUTY</span>
                  </span>
                ) : (
                  <button
                    disabled={!isIdle}
                    onClick={() => onAssignUnit(u.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                      isIdle
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950'
                        : 'bg-command-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Dispatch</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
