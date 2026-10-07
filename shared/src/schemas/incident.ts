import { z } from 'zod';

export const UserRoleEnum = z.enum([
  'citizen',
  'operator',
  'responder',
  'admin',
  'police',
  'fire',
  'medical',
  'traffic',
  'disaster'
]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const AgencyTypeEnum = z.enum([
  'POLICE',
  'FIRE_DEPARTMENT',
  'HEALTH_EMS',
  'TRAFFIC_AUTHORITY',
  'DISASTER_MANAGEMENT'
]);
export type AgencyType = z.infer<typeof AgencyTypeEnum>;

export const IncidentDomainEnum = z.enum([
  'TRAFFIC_ACCIDENT',
  'FIRE_RESCUE',
  'MEDICAL_EMERGENCY',
  'NATURAL_DISASTER',
  'INFRASTRUCTURE_HAZARD',
  'CRIME_PUBLIC_SAFETY'
]);
export type IncidentDomain = z.infer<typeof IncidentDomainEnum>;

export const IncidentSeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type IncidentSeverity = z.infer<typeof IncidentSeverityEnum>;

export const IncidentStatusEnum = z.enum([
  'DETECTED',
  'AI_VERIFIED',
  'DISPATCHED',
  'ON_SCENE',
  'RESOLVED',
  'CLOSED'
]);
export type IncidentStatus = z.infer<typeof IncidentStatusEnum>;

export const UnitStatusEnum = z.enum(['IDLE', 'ASSIGNED', 'EN_ROUTE', 'BUSY', 'OFFLINE']);
export type UnitStatus = z.infer<typeof UnitStatusEnum>;

export const IncidentSourceEnum = z.enum(['CITIZEN_SOS', 'CCTV_STREAM', 'IOT_SENSOR']);
export type IncidentSource = z.infer<typeof IncidentSourceEnum>;

export const IncidentInputSchema = z.object({
  description: z.string().min(3, 'Incident report must provide context'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  source: IncidentSourceEnum.default('CITIZEN_SOS'),
  category_hint: z.string().optional(),
  title: z.string().optional(),
  address: z.string().optional(),
  media_urls: z.array(z.string()).optional(),
  has_trapped_individuals: z.boolean().optional(),
  has_visible_flames: z.boolean().optional(),
  has_chemical_odor: z.boolean().optional(),
  reporter_phone: z.string().optional(),
  reporter_name: z.string().optional(),
});
export type IncidentInput = z.infer<typeof IncidentInputSchema>;

export const IncidentUpdateStatusSchema = z.object({
  status: IncidentStatusEnum,
  unit_id: z.string().optional(),
  notes: z.string().max(500).optional(),
});
export type IncidentUpdateStatus = z.infer<typeof IncidentUpdateStatusSchema>;

export const NearestFacilityQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  agency: AgencyTypeEnum.optional(),
  radiusMeters: z.coerce.number().min(100).max(100000).default(5000),
});
export type NearestFacilityQuery = z.infer<typeof NearestFacilityQuerySchema>;

export interface AITriageAnalysis {
  title: string;
  domain: IncidentDomain;
  severity: IncidentSeverity;
  primary_agency: AgencyType;
  confidence_score: number;
  hazard_perimeter_meters: number;
  key_hazards_detected: string[];
  citizen_advisory: string;
  responder_tactical_brief: string;
  traffic_vms_text: string;
}

export interface IncidentRecord {
  id: string;
  reporter_id?: string | null;
  title: string;
  description: string;
  source: IncidentSource;
  domain: IncidentDomain;
  severity: IncidentSeverity;
  status: IncidentStatus;
  primary_agency: AgencyType;
  latitude: number;
  longitude: number;
  address?: string | null;
  media_urls: string[];
  ai_raw_analysis?: AITriageAnalysis | null;
  citizen_advisory?: string | null;
  responder_tactical_brief?: string | null;
  traffic_vms_text?: string | null;
  confidence_score?: number | null;
  hazard_perimeter_meters: number;
  assigned_unit_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FacilityRecord {
  id: string;
  name: string;
  agency: AgencyType;
  address: string;
  latitude: number;
  longitude: number;
  contact_phone: string;
  capacity_status: 'NORMAL' | 'HIGH' | 'CRITICAL_OVERFLOW';
  is_active: boolean;
  distance_meters?: number;
  created_at: string;
}

export interface ResponseUnitRecord {
  id: string;
  unit_callsign: string;
  agency: AgencyType;
  latitude: number;
  longitude: number;
  status: UnitStatus;
  assigned_incident_id?: string | null;
  distance_meters?: number;
  updated_at: string;
}

export interface DispatchLogRecord {
  id: string;
  incident_id: string;
  unit_id?: string | null;
  actor_id?: string | null;
  previous_status?: IncidentStatus | null;
  new_status: IncidentStatus;
  notes?: string | null;
  logged_at: string;
}

export interface UserProfileRecord {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  agency?: AgencyType | null;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

// REAL LIVE MOBILE CAMERA SPECIFICATION
export interface CameraRecord {
  id: string; // e.g. 'CAMERA-07'
  name: string;
  status: 'ONLINE' | 'OFFLINE';
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  is_live: boolean;
  gps_active: boolean;
  last_updated: string;
  created_at: string;
  session_token?: string;
  token_expires_at?: string;
  authorized_roles: UserRole[];
  evidence_frame_url?: string | null;
  current_incident_id?: string | null;
}

export interface CameraSession {
  cameraId: string;
  token: string;
  expiresAt: string;
  qrUrl: string;
}

export interface CameraAIEvent {
  id: string;
  cameraId: string;
  timestamp: string;
  incidentType: string;
  confidence: number;
  evidenceFrame: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  status: 'AWAITING_VERIFICATION' | 'VERIFIED' | 'DISMISSED';
  aiAnalysis: AITriageAnalysis;
}
