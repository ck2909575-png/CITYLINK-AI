import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  IncidentRecord,
  FacilityRecord,
  ResponseUnitRecord,
  IncidentSeverity,
  CameraRecord,
} from '@urbanshield/shared';
import {
  AlertTriangle,
  Flame,
  Activity,
  Shield,
  Truck,
  Building2,
  Navigation,
  Eye,
  Camera,
  Compass,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCameras } from '../hooks/useCameras';

interface IncidentMapProps {
  incidents: IncidentRecord[];
  facilities?: FacilityRecord[];
  units?: ResponseUnitRecord[];
  cameras?: CameraRecord[];
  selectedIncident?: IncidentRecord | null;
  onSelectIncident?: (incident: IncidentRecord) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  showDetours?: boolean;
}

import { ErrorBoundary } from './ErrorBoundary';

const isValidCoord = (lat: any, lng: any): boolean =>
  typeof lat === 'number' &&
  typeof lng === 'number' &&
  !isNaN(lat) &&
  !isNaN(lng) &&
  isFinite(lat) &&
  isFinite(lng);

// Controller component to smoothly fly map to selected coordinates
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (Array.isArray(center) && isValidCoord(center[0], center[1])) {
      try {
        map.setView(center, zoom, { animate: true });
      } catch (err) {
        console.warn('[IncidentMap] Map setView notice:', err);
      }
    }
  }, [center, zoom, map]);
  return null;
}

// Helper: Custom SVG Icon Generator for Leaflet
function createPulsingMarker(severity: IncidentSeverity, domain: string) {
  let color = '#3b82f6';
  let pulseClass = 'border-blue-500';

  if (severity === 'CRITICAL') {
    color = '#ef4444';
    pulseClass = 'border-red-500';
  } else if (severity === 'HIGH') {
    color = '#f97316';
    pulseClass = 'border-orange-500';
  } else if (severity === 'MEDIUM') {
    color = '#f59e0b';
    pulseClass = 'border-amber-500';
  }

  const svgHtml = `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: ${color};
        opacity: 0.35;
        animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: relative;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background-color: #0c1220;
        border: 2px solid ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 14px ${color};
      ">
        <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${color};"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
}

function createFacilityMarker(agency: string) {
  let iconSvg = '🏥';
  let bg = '#0284c7';
  if (agency === 'POLICE') {
    iconSvg = '🚔';
    bg = '#2563eb';
  } else if (agency === 'FIRE_DEPARTMENT') {
    iconSvg = '🚒';
    bg = '#dc2626';
  } else if (agency === 'DISASTER_MANAGEMENT') {
    iconSvg = '⛺';
    bg = '#059669';
  }

  const html = `
    <div style="
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #0f172a;
      border: 2px solid ${bg};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.5);
    ">
      ${iconSvg}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'facility-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function createUnitMarker(status: string) {
  const isIdle = status === 'IDLE';
  const color = isIdle ? '#10b981' : '#f59e0b';

  const html = `
    <div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #0c1220;
      border: 2px solid ${color};
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 8px ${color};
    ">
      <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'unit-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

function createCameraMarker(camera: CameraRecord) {
  const isOnline = camera.status === 'ONLINE';
  const border = isOnline ? '#06b6d4' : '#475569';
  const statusColor = isOnline ? '#10b981' : '#ef4444';

  const html = `
    <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
      ${
        isOnline
          ? `<div style="
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: #06b6d4;
        opacity: 0.35;
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>`
          : ''
      }
      <div style="
        position: relative;
        width: 30px;
        height: 30px;
        border-radius: 10px;
        background-color: #030712;
        border: 2px solid ${border};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: ${isOnline ? '0 0 14px rgba(6, 182, 212, 0.8)' : '0 2px 6px rgba(0,0,0,0.6)'};
        font-size: 15px;
      ">
        📹
      </div>
      <div style="
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background-color: ${statusColor};
        border: 1.5px solid #030712;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'camera-marker',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19],
  });
}

export const IncidentMap: React.FC<IncidentMapProps> = ({
  incidents,
  facilities = [],
  units = [],
  cameras,
  selectedIncident = null,
  onSelectIncident,
  center = [17.6868, 83.2185],
  zoom = 13,
  height = '600px',
  showDetours = true,
}) => {
  const { data: defaultCameras = [] } = useCameras();
  const allCameras = cameras || defaultCameras;

  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState<number>(zoom);

  useEffect(() => {
    if (selectedIncident && isValidCoord(selectedIncident.latitude, selectedIncident.longitude)) {
      setMapCenter([selectedIncident.latitude, selectedIncident.longitude]);
      setMapZoom(15);
    }
  }, [selectedIncident]);

  return (
    <ErrorBoundary fallbackTitle="Tactical GIS Map Protection">
      <div className="relative w-full rounded-2xl overflow-hidden border border-command-800 shadow-2xl bg-command-950" style={{ height }}>

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <ChangeView center={mapCenter} zoom={mapZoom} />

          {/* High-Contrast Dark CartoDB Vector Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* 0. Live Surveillance Cameras Layer */}
          {allCameras
            .filter((c) => isValidCoord(c.latitude, c.longitude))
            .map((camera) => {
              const isOnline = camera.status === 'ONLINE';
              const lat = camera.latitude!;
              const lng = camera.longitude!;
              return (
              <Marker
                key={camera.id}
                position={[lat, lng]}
                icon={createCameraMarker(camera)}
              >
                  <Popup>
                    <div className="p-2 min-w-[220px] text-slate-100 font-sans">
                      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-700">
                        <span className="font-mono font-bold text-xs text-cyan-400 flex items-center gap-1">
                          📹 {camera.id}
                        </span>
                        {isOnline ? (
                          <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/40">
                            🟢 LIVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold font-mono text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-500/40">
                            🔴 OFFLINE
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-xs text-slate-300 font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status:</span>
                          <strong className={isOnline ? 'text-emerald-400' : 'text-slate-400'}>
                            {camera.status}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">GPS:</span>
                          <strong className={camera.gps_active ? 'text-emerald-400' : 'text-slate-500'}>
                            {camera.gps_active ? 'ACTIVE' : 'INACTIVE'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Accuracy:</span>
                          <span>±{camera.accuracy || 8}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Telemetry:</span>
                          <span className="text-slate-300">
                            {camera.last_updated ? new Date(camera.last_updated).toLocaleTimeString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

        {/* 1. Incident Markers and Exclusion Zones */}
        {incidents
          .filter((inc) => isValidCoord(inc.latitude, inc.longitude))
          .map((incident) => {
            const isSelected = selectedIncident?.id === incident.id;
            const radius = incident.hazard_perimeter_meters || 120;

            // Generate alternative detour routing waypoint around the perimeter
            const detourStart: [number, number] = [
              incident.latitude - 0.005,
              incident.longitude - 0.008,
            ];
            const detourBypass: [number, number] = [
              incident.latitude + 0.004,
              incident.longitude - 0.004,
            ];
            const detourEnd: [number, number] = [
              incident.latitude - 0.004,
              incident.longitude + 0.008,
            ];

            return (
              <React.Fragment key={incident.id}>
                {/* Exclusion Zone Ring */}
                <Circle
                  center={[incident.latitude, incident.longitude]}
                  radius={radius}
                  pathOptions={{
                    color:
                      incident.severity === 'CRITICAL'
                        ? '#ef4444'
                        : incident.severity === 'HIGH'
                        ? '#f97316'
                        : '#f59e0b',
                    fillColor:
                      incident.severity === 'CRITICAL'
                        ? '#ef4444'
                        : incident.severity === 'HIGH'
                        ? '#f97316'
                        : '#f59e0b',
                    fillOpacity: isSelected ? 0.28 : 0.16,
                    weight: isSelected ? 2.5 : 1.5,
                  }}
                />

                {/* Detour Route Polyline */}
                {showDetours && incident.severity === 'CRITICAL' && (
                  <Polyline
                    positions={[detourStart, detourBypass, detourEnd]}
                    pathOptions={{
                      color: '#06b6d4',
                      weight: 3,
                      dashArray: '6, 8',
                    }}
                  />
                )}

                {/* Incident Center Marker */}
                <Marker
                  position={[incident.latitude, incident.longitude]}
                  icon={createPulsingMarker(incident.severity, incident.domain)}
                  eventHandlers={{
                    click: () => {
                      if (onSelectIncident) onSelectIncident(incident);
                    },
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[240px] text-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            incident.severity === 'CRITICAL'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {incident.severity}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          {incident.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-100 leading-snug">
                        {incident.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {incident.description}
                      </p>
                      {incident.citizen_advisory && (
                        <div className="mt-2 p-1.5 rounded bg-command-900 border border-command-700 text-[11px] text-cyan-300">
                          🛡️ {incident.citizen_advisory}
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-command-700">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Zone: {radius}m
                        </span>
                        <Link
                          to={`/command`}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1"
                        >
                          <span>Open Dispatch</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

        {/* 2. Emergency Facilities Markers */}
        {facilities
          .filter((fac) => isValidCoord(fac.latitude, fac.longitude))
          .map((fac) => (
            <Marker
              key={fac.id}
              position={[fac.latitude, fac.longitude]}
              icon={createFacilityMarker(fac.agency)}
            >
              <Popup>
                <div className="p-1 text-slate-100">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase">
                    {fac.agency}
                  </span>
                  <h4 className="font-bold text-xs text-slate-100">{fac.name}</h4>
                  <p className="text-[11px] text-slate-400">{fac.address}</p>
                  <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                    ☎ {fac.contact_phone}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 3. Emergency Fleet Units */}
        {units
          .filter((unit) => isValidCoord(unit.latitude, unit.longitude))
          .map((unit) => (
            <Marker
              key={unit.id}
              position={[unit.latitude, unit.longitude]}
              icon={createUnitMarker(unit.status)}
            >
              <Popup>
                <div className="p-1 text-slate-100">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">
                    FLEET UNIT
                  </span>
                  <h4 className="font-bold text-xs">{unit.unit_callsign}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Agency: {unit.agency}
                  </p>
                  <p className="text-[11px] font-bold text-amber-400 mt-0.5">
                    Status: {unit.status}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  </ErrorBoundary>
  );
};
