-- ==============================================================================
-- CITYNEXUS / URBANSHIELD: CAMERAS & WEBRTC SESSIONS
-- Migration: 002_cameras_schema.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.cameras (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OFFLINE', -- 'ONLINE', 'OFFLINE'
    latitude DOUBLE PRECISION NULL,
    longitude DOUBLE PRECISION NULL,
    accuracy DOUBLE PRECISION NULL,
    location GEOGRAPHY(Point, 4326) NULL,
    is_live BOOLEAN NOT NULL DEFAULT FALSE,
    gps_active BOOLEAN NOT NULL DEFAULT FALSE,
    authorized_roles TEXT[] NOT NULL DEFAULT ARRAY['admin', 'operator', 'police', 'fire', 'responder'],
    session_token TEXT NULL,
    token_expires_at TIMESTAMPTZ NULL,
    evidence_frame_url TEXT NULL,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to maintain location geography column on cameras
CREATE OR REPLACE FUNCTION set_camera_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_camera_location ON public.cameras;
CREATE TRIGGER trg_camera_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.cameras
FOR EACH ROW EXECUTE FUNCTION set_camera_location();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cameras_status ON public.cameras(status);
CREATE INDEX IF NOT EXISTS idx_cameras_location ON public.cameras USING GIST(location);

-- RLS
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authorized can view cameras" ON public.cameras;
CREATE POLICY "Authorized can view cameras" ON public.cameras FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authorized can modify cameras" ON public.cameras;
CREATE POLICY "Authorized can modify cameras" ON public.cameras FOR ALL USING (true);

-- Realtime publication
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'cameras'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cameras;
    END IF;
END $$;
