import React, { useState } from 'react';
import { useNearestFacilities } from '../hooks/useIncidents';
import { useGeolocation } from '../hooks/useGeolocation';
import {
  Building2,
  Phone,
  MapPin,
  Activity,
  Shield,
  Flame,
  Tent,
  Navigation,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { AgencyType } from '@urbanshield/shared';

export const ServicesPage: React.FC = () => {
  const { latitude, longitude, isLoading: isGeoLoading, isCustom, refreshCoordinates } =
    useGeolocation();

  const [selectedAgency, setSelectedAgency] = useState<string>('ALL');
  const [radiusMeters, setRadiusMeters] = useState<number>(10000);

  const { data: facilities = [], isLoading: isFacilitiesLoading } =
    useNearestFacilities({
      lat: latitude,
      lng: longitude,
      agency: selectedAgency !== 'ALL' ? selectedAgency : undefined,
      radiusMeters,
    });

  const getAgencyBadge = (agency: AgencyType) => {
    switch (agency) {
      case 'HEALTH_EMS':
        return (
          <span className="flex items-center space-x-1 text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            <Activity className="w-3.5 h-3.5" />
            <span>Hospital / EMS</span>
          </span>
        );
      case 'POLICE':
        return (
          <span className="flex items-center space-x-1 text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
            <Shield className="w-3.5 h-3.5" />
            <span>Police Station</span>
          </span>
        );
      case 'FIRE_DEPARTMENT':
        return (
          <span className="flex items-center space-x-1 text-xs px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
            <Flame className="w-3.5 h-3.5" />
            <span>Fire & Rescue</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
            <Tent className="w-3.5 h-3.5" />
            <span>Disaster Shelter</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-command-900 border border-command-800 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase">
            <Building2 className="w-4 h-4" />
            <span>Civic Lifeline Locator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Nearest Emergency Facilities & Shelters
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            PostGIS spatial proximity sorting with real-time operational capacity status
          </p>
        </div>

        {/* GPS Coordinate Pill */}
        <div className="flex items-center space-x-3 bg-command-950 border border-command-800 p-2.5 rounded-2xl">
          <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="text-xs font-mono">
            <span className="text-slate-400 block text-[10px] uppercase">
              Current Origin Point:
            </span>
            <span className="text-slate-200 font-bold">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </span>
          </div>
          <button
            onClick={refreshCoordinates}
            className="p-1.5 rounded-lg bg-command-800 text-cyan-400 hover:text-white transition"
            title="Refresh GPS"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Radius Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-command-900/60 p-4 rounded-2xl border border-command-800">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Services' },
            { id: 'HEALTH_EMS', label: 'Hospitals & EMS' },
            { id: 'POLICE', label: 'Police Stations' },
            { id: 'FIRE_DEPARTMENT', label: 'Fire Stations' },
            { id: 'DISASTER_MANAGEMENT', label: 'Relief Shelters' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedAgency(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex-shrink-0 ${
                selectedAgency === tab.id
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-command-950 text-slate-400 hover:text-white border border-command-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Radius dropdown */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Search Radius:</span>
          <select
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(parseInt(e.target.value, 10))}
            className="bg-command-950 border border-command-700 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none"
          >
            <option value={3000}>3 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={25000}>25 km</option>
          </select>
        </div>
      </div>

      {/* Facilities Cards Grid */}
      {isFacilitiesLoading ? (
        <div className="p-16 text-center text-slate-500 font-mono text-sm animate-pulse">
          Calculating PostGIS geodesic distance matrix...
        </div>
      ) : facilities.length === 0 ? (
        <div className="p-16 text-center text-slate-500 text-sm bg-command-900 border border-command-800 rounded-3xl">
          No emergency facilities located within this radius. Try expanding the search perimeter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map((fac) => {
            const distanceText = fac.distance_meters
              ? fac.distance_meters < 1000
                ? `${fac.distance_meters} m`
                : `${(fac.distance_meters / 1000).toFixed(1)} km`
              : 'Nearby';

            return (
              <div
                key={fac.id}
                className="p-5 bg-command-900 border border-command-800 hover:border-cyan-500/60 rounded-2xl shadow-xl transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {getAgencyBadge(fac.agency)}
                    <span className="text-xs font-mono font-extrabold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {distanceText}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white leading-snug">
                    {fac.name}
                  </h3>

                  <div className="flex items-start space-x-1.5 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span>{fac.address}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-command-800 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                      fac.capacity_status === 'NORMAL'
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                    }`}
                  >
                    Capacity: {fac.capacity_status}
                  </span>

                  <a
                    href={`tel:${fac.contact_phone}`}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition shadow-md shadow-emerald-950"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call {fac.contact_phone}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
