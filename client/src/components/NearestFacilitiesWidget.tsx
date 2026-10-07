import React, { useState } from 'react';
import { FacilityRecord, AgencyType } from '@urbanshield/shared';
import { Building2, Phone, MapPin, Activity, Shield, Flame, Tent } from 'lucide-react';

interface NearestFacilitiesWidgetProps {
  facilities: FacilityRecord[];
  isLoading?: boolean;
}

export const NearestFacilitiesWidget: React.FC<NearestFacilitiesWidgetProps> = ({
  facilities,
  isLoading = false,
}) => {
  const [agencyFilter, setAgencyFilter] = useState<string>('ALL');

  const filtered = facilities.filter((f) => {
    if (agencyFilter !== 'ALL' && f.agency !== agencyFilter) return false;
    return true;
  });

  const getAgencyIcon = (agency: AgencyType) => {
    switch (agency) {
      case 'HEALTH_EMS':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'POLICE':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'FIRE_DEPARTMENT':
        return <Flame className="w-4 h-4 text-red-400" />;
      case 'DISASTER_MANAGEMENT':
        return <Tent className="w-4 h-4 text-amber-400" />;
      default:
        return <Building2 className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="bg-command-900 border border-command-800 rounded-2xl overflow-hidden shadow-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100 font-mono">
            Nearest Emergency Facilities
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Live GPS Sorted
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
        {['ALL', 'HEALTH_EMS', 'POLICE', 'FIRE_DEPARTMENT', 'DISASTER_MANAGEMENT'].map(
          (ag) => (
            <button
              key={ag}
              onClick={() => setAgencyFilter(ag)}
              className={`px-2 py-0.5 rounded transition truncate ${
                agencyFilter === ag
                  ? 'bg-command-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-command-850'
              }`}
            >
              {ag === 'ALL'
                ? 'ALL'
                : ag === 'HEALTH_EMS'
                ? 'EMS'
                : ag === 'FIRE_DEPARTMENT'
                ? 'FIRE'
                : ag === 'DISASTER_MANAGEMENT'
                ? 'SHELTERS'
                : ag}
            </button>
          )
        )}
      </div>

      {/* Facilities Cards */}
      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="p-4 text-center text-xs text-slate-500 animate-pulse">
            Calculating GPS road distances...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            No facilities found matching selected category.
          </div>
        ) : (
          filtered.slice(0, 6).map((fac) => {
            const distFormatted = fac.distance_meters
              ? fac.distance_meters < 1000
                ? `${fac.distance_meters} m`
                : `${(fac.distance_meters / 1000).toFixed(1)} km`
              : 'Nearby';

            return (
              <div
                key={fac.id}
                className="p-3 bg-command-950/70 border border-command-800 rounded-xl hover:border-command-700 transition space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getAgencyIcon(fac.agency)}
                    <h4 className="font-bold text-xs text-slate-100 truncate max-w-[200px]">
                      {fac.name}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    {distFormatted}
                  </span>
                </div>

                <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                  <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{fac.address}</span>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span
                    className={`font-mono text-[9px] px-1.5 py-0.2 rounded uppercase ${
                      fac.capacity_status === 'NORMAL'
                        ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/80'
                        : 'text-amber-400 bg-amber-950/60 border border-amber-800/80'
                    }`}
                  >
                    Capacity: {fac.capacity_status}
                  </span>

                  <a
                    href={`tel:${fac.contact_phone}`}
                    className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-mono text-xs font-semibold"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{fac.contact_phone}</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
