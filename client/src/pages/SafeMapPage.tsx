import React, { useState } from 'react';
import { useIncidents, useNearestFacilities, useResponseUnits } from '../hooks/useIncidents';
import { useGeolocation } from '../hooks/useGeolocation';
import { IncidentMap } from '../components/IncidentMap';
import { IncidentRecord } from '@urbanshield/shared';
import {
  MapPin,
  AlertTriangle,
  Compass,
  Navigation,
  Shield,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const SafeMapPage: React.FC = () => {
  const { latitude, longitude } = useGeolocation();
  const { data: incidents = [] } = useIncidents();
  const { data: facilities = [] } = useNearestFacilities({ lat: latitude, lng: longitude });
  const { data: units = [] } = useResponseUnits();

  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>('ALL');

  const filteredIncidents = incidents.filter((i) => {
    if (filterDomain !== 'ALL' && i.domain !== filterDomain) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 space-y-3 bg-command-950 overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-command-900 border border-command-800 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Citizen Safe Navigation & Road Hazard Map
            </h2>
            <p className="text-[11px] text-slate-400">
              Active hazard exclusion buffers & dynamic alternate detour polygons
            </p>
          </div>
        </div>

        {/* Hazard Domain Filter Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-mono">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {[
            { id: 'ALL', label: 'All Hazards' },
            { id: 'TRAFFIC_ACCIDENT', label: 'Roadblocks' },
            { id: 'FIRE_RESCUE', label: 'Fires' },
            { id: 'NATURAL_DISASTER', label: 'Flood Zones' },
            { id: 'INFRASTRUCTURE_HAZARD', label: 'Chemical' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterDomain(cat.id)}
              className={`px-2.5 py-1 rounded-lg transition ${
                filterDomain === cat.id
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-command-950 text-slate-400 hover:text-white border border-command-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map + Sidebar */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* Left Side: Active Hazards Feed */}
        <div className="lg:col-span-4 h-full min-h-0 bg-command-900 border border-command-800 rounded-2xl p-4 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-command-800">
            <span className="text-xs font-bold text-slate-200 uppercase font-mono">
              Reported Hazard Corridors ({filteredIncidents.length})
            </span>
            <span className="text-[11px] text-cyan-400 font-mono">
              Bypass Active
            </span>
          </div>

          <div className="space-y-2.5">
            {filteredIncidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3 rounded-xl border cursor-pointer transition space-y-2 ${
                    isSelected
                      ? 'bg-command-800 border-cyan-400 shadow-lg'
                      : 'bg-command-950/60 border-command-800 hover:border-command-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                        inc.severity === 'CRITICAL'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <span className="text-[10px] text-cyan-300 font-mono">
                      Radius: {inc.hazard_perimeter_meters}m
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white leading-snug">
                    {inc.title}
                  </h4>

                  {inc.citizen_advisory && (
                    <div className="p-2 rounded bg-command-900/80 border border-command-800 text-[11px] text-slate-300 leading-relaxed">
                      ⚠️ <strong className="text-cyan-300">Safety Advisory:</strong> {inc.citizen_advisory}
                    </div>
                  )}

                  {inc.traffic_vms_text && (
                    <div className="text-[10px] font-mono text-amber-400 bg-black/60 p-1.5 rounded border border-amber-950 uppercase">
                      🛣️ Detour: {inc.traffic_vms_text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Vector Map */}
        <div className="lg:col-span-8 h-full min-h-0 rounded-2xl overflow-hidden border border-command-800 shadow-2xl">
          <IncidentMap
            incidents={filteredIncidents}
            facilities={facilities}
            units={units}
            selectedIncident={selectedIncident}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            height="100%"
            showDetours={true}
          />
        </div>
      </div>
    </div>
  );
};
