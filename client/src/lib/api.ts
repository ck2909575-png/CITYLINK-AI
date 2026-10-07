import {
  IncidentRecord,
  FacilityRecord,
  ResponseUnitRecord,
  DispatchLogRecord,
  UserProfileRecord,
  IncidentStatus,
  CameraRecord,
  CameraSession,
  CameraAIEvent,
} from '@urbanshield/shared';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export async function fetchCameras(userRole: string = 'command_operator'): Promise<CameraRecord[]> {
  const res = await fetch(`${API_BASE}/cameras?role=${encodeURIComponent(userRole)}`);
  if (!res.ok) {
    if (res.status === 403) return [];
    throw new Error('Failed to fetch cameras');
  }
  const json = await res.json();
  return json.data || [];
}

export async function fetchCameraById(id: string): Promise<CameraRecord> {
  const res = await fetch(`${API_BASE}/cameras/${id}`);
  if (!res.ok) throw new Error(`Camera ${id} not found`);
  const json = await res.json();
  return json.data;
}

export async function createCameraSession(params: {
  cameraId?: string;
  requestedBy?: string;
  userRole?: string;
}): Promise<{ session: CameraSession; connectUrl: string }> {
  const res = await fetch(`${API_BASE}/cameras/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to create camera registration session');
  const json = await res.json();
  return { session: json.data, connectUrl: json.connectUrl };
}

export async function registerCameraApi(params: {
  cameraId: string;
  token: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
}): Promise<{ camera: CameraRecord; token: string }> {
  const res = await fetch(`${API_BASE}/cameras/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Camera registration failed');
  }
  const json = await res.json();
  return json.data;
}

export async function updateCameraGpsApi(
  id: string,
  params: { lat: number; lng: number; accuracy?: number; heading?: number; speed?: number }
) {
  const res = await fetch(`${API_BASE}/cameras/${id}/gps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to transmit GPS telemetry');
  return res.json();
}

export async function updateCameraStatusApi(id: string, status: 'online' | 'offline') {
  const res = await fetch(`${API_BASE}/cameras/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update camera status');
  return res.json();
}

export async function analyzeCameraFrameApi(
  id: string,
  params: { frameBase64: string; lat?: number; lng?: number }
): Promise<{ incident?: any; threatDetected: boolean; label: string; confidence: number; evidenceFrame?: string; eventId?: string }> {
  const res = await fetch(`${API_BASE}/cameras/${id}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Frame triage failed');
  const json = await res.json();
  return json.data;
}

export async function fetchCameraEvents(id?: string): Promise<CameraAIEvent[]> {
  const query = id ? `?cameraId=${id}` : '';
  const res = await fetch(`${API_BASE}/cameras/events/all${query}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function verifyCameraEventApi(eventId: string, verified: boolean): Promise<any> {
  const res = await fetch(`${API_BASE}/cameras/events/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, verified }),
  });
  if (!res.ok) throw new Error('Failed to verify incident event');
  return res.json();
}


export async function fetchIncidents(params?: {
  status?: string;
  severity?: string;
  agency?: string;
}): Promise<IncidentRecord[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.severity) query.set('severity', params.severity);
  if (params?.agency) query.set('agency', params.agency);

  const res = await fetch(`${API_BASE}/incidents?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  const json = await res.json();
  return json.data || [];
}

export async function fetchIncidentById(id: string): Promise<{
  incident: IncidentRecord;
  assigned_unit: ResponseUnitRecord | null;
  dispatch_logs: DispatchLogRecord[];
}> {
  const res = await fetch(`${API_BASE}/incidents/${id}`);
  if (!res.ok) throw new Error('Failed to fetch incident details');
  const json = await res.json();
  return {
    incident: json.data,
    assigned_unit: json.assigned_unit,
    dispatch_logs: json.dispatch_logs || [],
  };
}

export async function submitIncidentMultipart(formData: FormData): Promise<{
  incident: IncidentRecord;
  analysis: any;
  suggested_unit: ResponseUnitRecord | null;
}> {
  const res = await fetch(`${API_BASE}/incidents/analyze`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || 'Emergency report intake failed');
  }
  const json = await res.json();
  return json;
}

export async function updateIncidentStatusApi(
  id: string,
  data: { status: IncidentStatus; unit_id?: string; notes?: string }
): Promise<IncidentRecord> {
  const res = await fetch(`${API_BASE}/incidents/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update incident status');
  const json = await res.json();
  return json.data;
}

export async function fetchNearestFacilities(params: {
  lat: number;
  lng: number;
  agency?: string;
  radiusMeters?: number;
}): Promise<FacilityRecord[]> {
  const query = new URLSearchParams({
    lat: params.lat.toString(),
    lng: params.lng.toString(),
    radiusMeters: (params.radiusMeters || 10000).toString(),
  });
  if (params.agency) query.set('agency', params.agency);

  const res = await fetch(`${API_BASE}/facilities/nearest?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch nearest facilities');
  const json = await res.json();
  return json.data || [];
}

export async function fetchAllFacilities(agency?: string): Promise<FacilityRecord[]> {
  const query = new URLSearchParams();
  if (agency) query.set('agency', agency);
  const res = await fetch(`${API_BASE}/facilities?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch facilities');
  const json = await res.json();
  return json.data || [];
}

export async function fetchResponseUnits(params?: {
  agency?: string;
  status?: string;
  lat?: number;
  lng?: number;
}): Promise<ResponseUnitRecord[]> {
  const query = new URLSearchParams();
  if (params?.agency) query.set('agency', params.agency);
  if (params?.status) query.set('status', params.status);
  if (params?.lat !== undefined) query.set('lat', params.lat.toString());
  if (params?.lng !== undefined) query.set('lng', params.lng.toString());

  const res = await fetch(`${API_BASE}/dispatch/units?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch units');
  const json = await res.json();
  return json.data || [];
}

export async function assignUnitApi(params: {
  incidentId: string;
  unitId: string;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE}/dispatch/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to assign unit');
  return res.json();
}

export async function fetchActiveSignage(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/signage/active`);
  if (!res.ok) throw new Error('Failed to fetch active signage');
  const json = await res.json();
  return json.data || [];
}

export async function fetchDispatchLogs(incidentId?: string): Promise<DispatchLogRecord[]> {
  const query = incidentId ? `?incidentId=${incidentId}` : '';
  const res = await fetch(`${API_BASE}/dispatch/logs${query}`);
  if (!res.ok) throw new Error('Failed to fetch dispatch logs');
  const json = await res.json();
  return json.data || [];
}

export async function triggerSimulationFeed(presetIndex?: number) {
  const res = await fetch(`${API_BASE}/simulation/seed-feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ presetIndex }),
  });
  if (!res.ok) throw new Error('Failed to trigger simulation feed');
  return res.json();
}

export async function fetchDemoProfiles(): Promise<UserProfileRecord[]> {
  const res = await fetch(`${API_BASE}/auth/profiles`);
  if (!res.ok) throw new Error('Failed to fetch demo profiles');
  const json = await res.json();
  return json.profiles || [];
}

