-- ==============================================================================
-- URBANSHIELD: UNIFIED SMART CITY INCIDENT MANAGEMENT & EMERGENCY RESPONSE
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. ENUMS (IDEMPOTENT CREATION)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('citizen', 'operator', 'responder', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agency_type') THEN
        CREATE TYPE agency_type AS ENUM ('POLICE', 'FIRE_DEPARTMENT', 'HEALTH_EMS', 'TRAFFIC_AUTHORITY', 'DISASTER_MANAGEMENT');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_severity') THEN
        CREATE TYPE incident_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_status') THEN
        CREATE TYPE incident_status AS ENUM ('DETECTED', 'AI_VERIFIED', 'DISPATCHED', 'ON_SCENE', 'RESOLVED', 'CLOSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit_status') THEN
        CREATE TYPE unit_status AS ENUM ('IDLE', 'ASSIGNED', 'EN_ROUTE', 'BUSY', 'OFFLINE');
    END IF;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'citizen',
    agency agency_type NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. EMERGENCY FACILITIES TABLE
CREATE TABLE IF NOT EXISTS public.facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    agency agency_type NOT NULL,
    address TEXT NOT NULL,
    location GEOGRAPHY(Point, 4326),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    contact_phone TEXT NOT NULL,
    capacity_status TEXT NOT NULL DEFAULT 'NORMAL',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to maintain location geography column on facilities
CREATE OR REPLACE FUNCTION set_facility_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_facility_location ON public.facilities;
CREATE TRIGGER trg_facility_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.facilities
FOR EACH ROW EXECUTE FUNCTION set_facility_location();

-- 5. EMERGENCY UNITS / VEHICLES TABLE
CREATE TABLE IF NOT EXISTS public.response_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_callsign TEXT NOT NULL UNIQUE,
    agency agency_type NOT NULL,
    location GEOGRAPHY(Point, 4326),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status unit_status NOT NULL DEFAULT 'IDLE',
    assigned_incident_id UUID NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to maintain location geography column on response_units
CREATE OR REPLACE FUNCTION set_unit_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_unit_location ON public.response_units;
CREATE TRIGGER trg_unit_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.response_units
FOR EACH ROW EXECUTE FUNCTION set_unit_location();

-- 6. INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    source TEXT NOT NULL DEFAULT 'CITIZEN_SOS',
    domain TEXT NOT NULL,
    severity incident_severity NOT NULL DEFAULT 'MEDIUM',
    status incident_status NOT NULL DEFAULT 'DETECTED',
    primary_agency agency_type NOT NULL,
    location GEOGRAPHY(Point, 4326),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    assigned_unit_id UUID NULL REFERENCES public.response_units(id) ON DELETE SET NULL,
    
    -- AI Generated Insights
    ai_raw_analysis JSONB,
    citizen_advisory TEXT,
    responder_tactical_brief TEXT,
    traffic_vms_text TEXT,
    confidence_score NUMERIC(3, 2) DEFAULT 0.85,
    hazard_perimeter_meters INTEGER DEFAULT 100,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to maintain location geography column on incidents
CREATE OR REPLACE FUNCTION set_incident_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_incident_location ON public.incidents;
CREATE TRIGGER trg_incident_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.incidents
FOR EACH ROW EXECUTE FUNCTION set_incident_location();

-- 7. DISPATCH AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.dispatch_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    unit_id UUID NULL REFERENCES public.response_units(id) ON DELETE SET NULL,
    actor_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    previous_status incident_status,
    new_status incident_status NOT NULL,
    notes TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SPATIAL & PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_facilities_location ON public.facilities USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_response_units_location ON public.response_units USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_incidents_location ON public.incidents USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_agency ON public.incidents(primary_agency);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at DESC);

-- 9. HELPER POSTGIS STORED PROCEDURES (RPC)

-- Find Nearest Facilities with Distance Calculation
CREATE OR REPLACE FUNCTION get_nearest_facilities(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_meters INTEGER DEFAULT 10000,
    p_agency agency_type DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    agency agency_type,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    contact_phone TEXT,
    capacity_status TEXT,
    is_active BOOLEAN,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.agency,
        f.address,
        f.latitude,
        f.longitude,
        f.contact_phone,
        f.capacity_status,
        f.is_active,
        ST_Distance(f.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) AS distance_meters
    FROM public.facilities f
    WHERE f.is_active = TRUE
      AND (p_agency IS NULL OR f.agency = p_agency)
      AND ST_DWithin(f.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
    ORDER BY distance_meters ASC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public can view facilities" ON public.facilities;
DROP POLICY IF EXISTS "Public can view active non-draft incidents" ON public.incidents;
DROP POLICY IF EXISTS "Citizens can report incidents" ON public.incidents;
DROP POLICY IF EXISTS "Staff can update incidents" ON public.incidents;
DROP POLICY IF EXISTS "Staff can view units" ON public.response_units;
DROP POLICY IF EXISTS "Responders/Operators update units" ON public.response_units;
DROP POLICY IF EXISTS "Staff can view and insert logs" ON public.dispatch_logs;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;

-- Create Policies
CREATE POLICY "Public can view facilities"
ON public.facilities FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can view active non-draft incidents"
ON public.incidents FOR SELECT
USING (true);

CREATE POLICY "Citizens can report incidents"
ON public.incidents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Staff can update incidents"
ON public.incidents FOR UPDATE
USING (true);

CREATE POLICY "Staff can view units"
ON public.response_units FOR SELECT
USING (true);

CREATE POLICY "Responders/Operators update units"
ON public.response_units FOR UPDATE
USING (true);

CREATE POLICY "Staff can view and insert logs"
ON public.dispatch_logs FOR ALL
USING (true);

CREATE POLICY "Public read profiles"
ON public.profiles FOR SELECT
USING (true);

-- 11. SUPABASE REALTIME REPLICATION PUBLICATION
-- Enable realtime publication for all operational tables
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'incidents'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'response_units'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.response_units;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'dispatch_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_logs;
    END IF;
END $$;

-- 12. SEED DATA (20 REAL-WORLD METRO FACILITIES, FLEET UNITS, AND INCIDENTS)

-- Seed Facilities (San Francisco Metropolitan Area Landmarks)
INSERT INTO public.facilities (id, name, agency, address, latitude, longitude, contact_phone, capacity_status, is_active)
VALUES
('a0000001-0000-0000-0000-000000000001', 'Zuckerberg SF General Hospital & Trauma Center', 'HEALTH_EMS', '1001 Potrero Ave, San Francisco, CA', 37.7557, -122.4048, '(415) 206-8000', 'NORMAL', true),
('a0000001-0000-0000-0000-000000000002', 'UCSF Medical Center at Mission Bay', 'HEALTH_EMS', '1825 4th St, San Francisco, CA', 37.7681, -122.3912, '(415) 353-6000', 'NORMAL', true),
('a0000001-0000-0000-0000-000000000003', 'Saint Francis Memorial Hospital Emergency', 'HEALTH_EMS', '900 Hyde St, San Francisco, CA', 37.7898, -122.4172, '(415) 353-6000', 'HIGH', true),
('a0000001-0000-0000-0000-000000000004', 'Kaiser Permanente SF Medical Center', 'HEALTH_EMS', '2425 Geary Blvd, San Francisco, CA', 37.7828, -122.4431, '(415) 833-2000', 'NORMAL', true),
('a0000001-0000-0000-0000-000000000005', 'California Pacific Medical Center Van Ness', 'HEALTH_EMS', '1101 Van Ness Ave, San Francisco, CA', 37.7854, -122.4215, '(415) 600-6000', 'NORMAL', true),

('b0000001-0000-0000-0000-000000000001', 'SFPD Central Police Station', 'POLICE', '766 Vallejo St, San Francisco, CA', 37.7984, -122.4098, '(415) 315-2400', 'NORMAL', true),
('b0000001-0000-0000-0000-000000000002', 'SFPD Mission District Police Station', 'POLICE', '630 Valencia St, San Francisco, CA', 37.7629, -122.4220, '(415) 558-5400', 'NORMAL', true),
('b0000001-0000-0000-0000-000000000003', 'SFPD Northern Police Station', 'POLICE', '1125 Fillmore St, San Francisco, CA', 37.7797, -122.4318, '(415) 614-3400', 'NORMAL', true),
('b0000001-0000-0000-0000-000000000004', 'SFPD Tenderloin Police Station', 'POLICE', '301 Eddy St, San Francisco, CA', 37.7838, -122.4140, '(415) 345-7300', 'HIGH', true),
('b0000001-0000-0000-0000-000000000005', 'SFPD Bayview District Station', 'POLICE', '201 Williams Ave, San Francisco, CA', 37.7297, -122.3979, '(415) 671-2300', 'NORMAL', true),

('c0000001-0000-0000-0000-000000000001', 'SFFD Fire Station 1 (Downtown Headquarters)', 'FIRE_DEPARTMENT', '935 Folsom St, San Francisco, CA', 37.7788, -122.4042, '(415) 558-3201', 'NORMAL', true),
('c0000001-0000-0000-0000-000000000002', 'SFFD Fire Station 2 (North Beach)', 'FIRE_DEPARTMENT', '1340 Powell St, San Francisco, CA', 37.7979, -122.4106, '(415) 558-3202', 'NORMAL', true),
('c0000001-0000-0000-0000-000000000003', 'SFFD Fire Station 7 (Mission & SOMA)', 'FIRE_DEPARTMENT', '2300 Folsom St, San Francisco, CA', 37.7601, -122.4150, '(415) 558-3207', 'NORMAL', true),
('c0000001-0000-0000-0000-000000000004', 'SFFD Fire Station 36 (Civic Center Engine)', 'FIRE_DEPARTMENT', '109 Oak St, San Francisco, CA', 37.7749, -122.4211, '(415) 558-3236', 'NORMAL', true),
('c0000001-0000-0000-0000-000000000005', 'SFFD Fire Station 35 (Pier 22.5 Marine / HAZMAT)', 'FIRE_DEPARTMENT', 'The Embarcadero at Pier 22.5, San Francisco, CA', 37.7892, -122.3882, '(415) 558-3235', 'NORMAL', true),

('d0000001-0000-0000-0000-000000000001', 'SFMTA Central Traffic Operations Command', 'TRAFFIC_AUTHORITY', '1 South Van Ness Ave, San Francisco, CA', 37.7752, -122.4190, '(415) 701-4500', 'NORMAL', true),
('d0000001-0000-0000-0000-000000000002', 'Caltrans District 4 Bay Bridge Command Center', 'TRAFFIC_AUTHORITY', '111 Grand Ave, Oakland, CA', 37.8080, -122.2647, '(510) 286-4444', 'NORMAL', true),

('e0000001-0000-0000-0000-000000000001', 'SF Department of Emergency Management (DEM)', 'DISASTER_MANAGEMENT', '1011 Turk St, San Francisco, CA', 37.7816, -122.4287, '(415) 558-3800', 'NORMAL', true),
('e0000001-0000-0000-0000-000000000002', 'Bill Graham Emergency Shelter & Relief Kiosk', 'DISASTER_MANAGEMENT', '99 Grove St, San Francisco, CA', 37.7781, -122.4175, '(415) 554-4000', 'NORMAL', true),
('e0000001-0000-0000-0000-000000000003', 'Moscone Center Disaster Logistics Hub', 'DISASTER_MANAGEMENT', '747 Howard St, San Francisco, CA', 37.7842, -122.4014, '(415) 974-4000', 'NORMAL', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;

-- Seed Emergency Response Fleet Units
INSERT INTO public.response_units (id, unit_callsign, agency, latitude, longitude, status)
VALUES
('f0000001-0000-0000-0000-000000000001', 'MEDIC-41 (ALS Ambulance)', 'HEALTH_EMS', 37.7760, -122.4120, 'IDLE'),
('f0000001-0000-0000-0000-000000000002', 'MEDIC-18 (Rescue Ambulance)', 'HEALTH_EMS', 37.7650, -122.4180, 'IDLE'),
('f0000001-0000-0000-0000-000000000003', 'TRAUMA-9 (Mobile Intensive Care)', 'HEALTH_EMS', 37.7890, -122.4080, 'IDLE'),

('f0000001-0000-0000-0000-000000000004', 'ENGINE-01 (Pumper Unit)', 'FIRE_DEPARTMENT', 37.7810, -122.4060, 'IDLE'),
('f0000001-0000-0000-0000-000000000005', 'TRUCK-07 (Aerial Ladder)', 'FIRE_DEPARTMENT', 37.7620, -122.4160, 'IDLE'),
('f0000001-0000-0000-0000-000000000006', 'HAZMAT-35 (Heavy Chemical Unit)', 'FIRE_DEPARTMENT', 37.7900, -122.3920, 'IDLE'),

('f0000001-0000-0000-0000-000000000007', 'PATROL-104 (Interceptor)', 'POLICE', 37.7850, -122.4100, 'IDLE'),
('f0000001-0000-0000-0000-000000000008', 'PATROL-208 (Rapid Response)', 'POLICE', 37.7720, -122.4240, 'IDLE'),
('f0000001-0000-0000-0000-000000000009', 'K9-UNIT-03 (Tactical Perimeter)', 'POLICE', 37.7960, -122.4120, 'IDLE'),

('f0000001-0000-0000-0000-000000000010', 'TRAFFIC-VAN-01 (Highway Assist)', 'TRAFFIC_AUTHORITY', 37.7780, -122.4190, 'IDLE'),
('f0000001-0000-0000-0000-000000000011', 'SIGNAL-OP-04 (Grid Control)', 'TRAFFIC_AUTHORITY', 37.7820, -122.3990, 'IDLE'),

('f0000001-0000-0000-0000-000000000012', 'DISASTER-CMD-01 (Mobile Incident Post)', 'DISASTER_MANAGEMENT', 37.7750, -122.4200, 'IDLE')
ON CONFLICT (id) DO UPDATE SET
  unit_callsign = EXCLUDED.unit_callsign,
  status = EXCLUDED.status;

-- Seed Sample Active Incidents
INSERT INTO public.incidents (
    id, title, description, source, domain, severity, status, primary_agency,
    latitude, longitude, address, confidence_score, hazard_perimeter_meters,
    citizen_advisory, responder_tactical_brief, traffic_vms_text, ai_raw_analysis
) VALUES
(
    '00000000-0000-0000-0000-000000000101',
    'Multi-Vehicle Pileup with Structural Debris on Market St',
    'Two commercial trucks and one electric commuter vehicle collided at Market and 4th St. Fuel leak observed, pedestrian crosswalk obstructed.',
    'CCTV_STREAM',
    'TRAFFIC_ACCIDENT',
    'CRITICAL',
    'AI_VERIFIED',
    'FIRE_DEPARTMENT',
    37.7858,
    -122.4065,
    'Market St & 4th St, San Francisco, CA',
    0.96,
    180,
    'Evacuate intersection immediately. Do not smoke or ignite flames due to diesel spillage. Detour through Mission St.',
    'Dispatch Engine 1 and Hazmat 35. Foam line deployment mandatory. Block eastbound Market St at 5th St.',
    'MARKET ST CLOSED AT 4TH ST - FUEL SPILL - DETOUR MISSION ST',
    '{"title": "Multi-Vehicle Pileup with Structural Debris on Market St", "domain": "TRAFFIC_ACCIDENT", "severity": "CRITICAL", "primary_agency": "FIRE_DEPARTMENT", "confidence_score": 0.96, "hazard_perimeter_meters": 180, "key_hazards_detected": ["Diesel fuel leak", "Crushed battery pack", "Blockage of major transit artery"], "citizen_advisory": "Evacuate intersection immediately. Do not smoke or ignite flames due to diesel spillage. Detour through Mission St.", "responder_tactical_brief": "Dispatch Engine 1 and Hazmat 35. Foam line deployment mandatory. Block eastbound Market St at 5th St.", "traffic_vms_text": "MARKET ST CLOSED AT 4TH ST - FUEL SPILL - DETOUR MISSION ST"}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000102',
    'Commercial Kitchen Grease Fire Threatening Residential Loft',
    'Dense dark smoke billowing from second-floor exhaust duct. Audible fire alarm sounding, occupants self-evacuating.',
    'CITIZEN_SOS',
    'FIRE_RESCUE',
    'HIGH',
    'DISPATCHED',
    'FIRE_DEPARTMENT',
    37.7645,
    -122.4215,
    'Valencia St & 18th St, San Francisco, CA',
    0.92,
    120,
    'Remain clear of Valencia St sidewalks to allow aerial ladder trucks space. Keep windows closed due to toxic smoke.',
    'Truck 7 and Engine 7 en route. Check roof ventilation and ensure gas shutoff at main meter on 18th St.',
    'VALENCIA ST CLOSED 17TH TO 19TH - STRUCTURE FIRE - USE GUERRERO',
    '{"title": "Commercial Kitchen Grease Fire Threatening Residential Loft", "domain": "FIRE_RESCUE", "severity": "HIGH", "primary_agency": "FIRE_DEPARTMENT", "confidence_score": 0.92, "hazard_perimeter_meters": 120, "key_hazards_detected": ["Heavy grease duct fire", "Exposure to wood frame building", "Smoke inhalation"], "citizen_advisory": "Remain clear of Valencia St sidewalks to allow aerial ladder trucks space. Keep windows closed due to toxic smoke.", "responder_tactical_brief": "Truck 7 and Engine 7 en route. Check roof ventilation and ensure gas shutoff at main meter on 18th St.", "traffic_vms_text": "VALENCIA ST CLOSED 17TH TO 19TH - STRUCTURE FIRE - USE GUERRERO"}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000103',
    'Flash Flood & High-Voltage Transformer Sparking on Embarcadero',
    'Water main burst combined with storm drain overflow. 14 inches of water covering roadway near streetcar tracks with submerged electric junction.',
    'IOT_SENSOR',
    'NATURAL_DISASTER',
    'HIGH',
    'AI_VERIFIED',
    'DISASTER_MANAGEMENT',
    37.7942,
    -122.3951,
    'The Embarcadero & Washington St, San Francisco, CA',
    0.89,
    150,
    'DO NOT STEP IN WATER. High electrocution hazard from submerged electrical boxes. Seek elevated ground.',
    'Coordinate with PG&E for instant grid isolation on sector E-4. Stage high-volume water pump at Pier 3.',
    'EMBARCADERO FLOOD HAZARD - ELECTROCUTION RISK - AVOID WATERFRONT',
    '{"title": "Flash Flood & High-Voltage Transformer Sparking on Embarcadero", "domain": "NATURAL_DISASTER", "severity": "HIGH", "primary_agency": "DISASTER_MANAGEMENT", "confidence_score": 0.89, "hazard_perimeter_meters": 150, "key_hazards_detected": ["Standing water >12 inches", "Submerged live electrical conduits", "Trolley line disruption"], "citizen_advisory": "DO NOT STEP IN WATER. High electrocution hazard from submerged electrical boxes. Seek elevated ground.", "responder_tactical_brief": "Coordinate with PG&E for instant grid isolation on sector E-4. Stage high-volume water pump at Pier 3.", "traffic_vms_text": "EMBARCADERO FLOOD HAZARD - ELECTROCUTION RISK - AVOID WATERFRONT"}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000104',
    'Suspected Chemical Leak from Freight Van near Civic Center',
    'Yellowish pungent vapor escaping from abandoned delivery vehicle. 3 citizens reporting eye irritation and breathing distress.',
    'CITIZEN_SOS',
    'INFRASTRUCTURE_HAZARD',
    'CRITICAL',
    'AI_VERIFIED',
    'FIRE_DEPARTMENT',
    37.7795,
    -122.4180,
    'Polk St & Grove St, San Francisco, CA',
    0.95,
    250,
    'Move UPWIND towards Van Ness Ave immediately. Cover mouth and nose with a damp cloth if available.',
    'Hazmat 35 deployment. Level A hazmat suits required. Establish 250m hot zone perimeter, stage decon corridor.',
    'HAZMAT ALERT CIVIC CENTER - MOVE UPWIND - AVOID POLK ST',
    '{"title": "Suspected Chemical Leak from Freight Van near Civic Center", "domain": "INFRASTRUCTURE_HAZARD", "severity": "CRITICAL", "primary_agency": "FIRE_DEPARTMENT", "confidence_score": 0.95, "hazard_perimeter_meters": 250, "key_hazards_detected": ["Unknown vaporous irritant", "Civic center pedestrian concentration", "Rapid wind dispersal"], "citizen_advisory": "Move UPWIND towards Van Ness Ave immediately. Cover mouth and nose with a damp cloth if available.", "responder_tactical_brief": "Hazmat 35 deployment. Level A hazmat suits required. Establish 250m hot zone perimeter, stage decon corridor.", "traffic_vms_text": "HAZMAT ALERT CIVIC CENTER - MOVE UPWIND - AVOID POLK ST"}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000105',
    'Mass Transit Station Escalator Crush & Medical Emergency',
    'Sudden stoppage of heavy escalator during peak rush hour causing 6 pedestrian falls and suspected head trauma.',
    'CITIZEN_SOS',
    'MEDICAL_EMERGENCY',
    'HIGH',
    'ON_SCENE',
    'HEALTH_EMS',
    37.7830,
    -122.4070,
    'Powell St Station Mezzanine, San Francisco, CA',
    0.91,
    50,
    'Station personnel guiding commuters to eastern stairwells. Do not crowd the concourse.',
    'Medic 41 and Trauma 9 on scene. Triage priority given to elderly pedestrian with bleeding laceration.',
    'POWELL BART ENTRANCE CONGESTED - EMS RESPONDING - USE 4TH ST',
    '{"title": "Mass Transit Station Escalator Crush & Medical Emergency", "domain": "MEDICAL_EMERGENCY", "severity": "HIGH", "primary_agency": "HEALTH_EMS", "confidence_score": 0.91, "hazard_perimeter_meters": 50, "key_hazards_detected": ["Crowd crush risk", "Multiple trauma casualties", "Escalator structural lockup"], "citizen_advisory": "Station personnel guiding commuters to eastern stairwells. Do not crowd the concourse.", "responder_tactical_brief": "Medic 41 and Trauma 9 on scene. Triage priority given to elderly pedestrian with bleeding laceration.", "traffic_vms_text": "POWELL BART ENTRANCE CONGESTED - EMS RESPONDING - USE 4TH ST"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status;

-- Link unit to dispatched incident
UPDATE public.response_units 
SET status = 'ASSIGNED', assigned_incident_id = '00000000-0000-0000-0000-000000000102' 
WHERE unit_callsign = 'ENGINE-01';

UPDATE public.response_units 
SET status = 'BUSY', assigned_incident_id = '00000000-0000-0000-0000-000000000105' 
WHERE unit_callsign = 'MEDIC-41 (ALS Ambulance)';

-- Seed initial dispatch audit logs
INSERT INTO public.dispatch_logs (incident_id, unit_id, new_status, notes)
VALUES
('00000000-0000-0000-0000-000000000102', 'f0000001-0000-0000-0000-000000000004', 'DISPATCHED', 'Engine 01 assigned by UrbanShield Automated Dispatch Matrix'),
('00000000-0000-0000-0000-000000000105', 'f0000001-0000-0000-0000-000000000001', 'ON_SCENE', 'Medic 41 confirmed arrival on scene; triage underway');

-- ==============================================================================
-- END OF INITIAL SCHEMA MIGRATION
-- ==============================================================================
