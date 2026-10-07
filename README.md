# UrbanShield: Unified Smart City Incident Intelligence & Emergency Response Network

UrbanShield is an enterprise-grade, scalable, open-source smart city incident intelligence and emergency coordination platform. It bridges citizens, municipal surveillance infrastructure (CCTV, IoT sensors, emergency kiosks), and multi-agency emergency command centers (Police, Fire & Rescue, Medical/EMS, Traffic Control, and Disaster Response).

---

## 🚀 Key Features

1. **Multimodal Incident Intake Engine:**
   - Citizen Voice SOS intake via Web Speech API & audio file processing.
   - Scene photo attachment and instant image preview processed via Gemini Vision.
   - Automatic geolocation capture with manual coordinates override.
   - Critical on-scene hazard toggles (Trapped individuals, Visible flames, Chemical odors).
   - Automated IoT sensor and CCTV anomaly stream simulator (`/api/v1/simulation/seed-feed`).

2. **Gemini 2.5 / 3.8 Flash SDK Structured Triage:**
   - Server-side `@google/genai` integration with strict JSON Schema output.
   - Classifies domain (`TRAFFIC_ACCIDENT`, `FIRE_RESCUE`, `MEDICAL_EMERGENCY`, `NATURAL_DISASTER`, `INFRASTRUCTURE_HAZARD`, `CRIME_PUBLIC_SAFETY`).
   - Generates:
     - Hazard severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
     - Assigned primary agency (`HEALTH_EMS`, `FIRE_DEPARTMENT`, `POLICE`, `TRAFFIC_AUTHORITY`, `DISASTER_MANAGEMENT`)
     - Citizen life-safety advisory
     - First-responder tactical brief & gear checklist
     - Roadside Variable Message Sign (VMS) directive string
     - Hazard perimeter exclusion radius (meters).

3. **Geospatial Command & Navigation Center:**
   - Interactive vector map powered by Leaflet & OpenStreetMap tiles.
   - Custom pulsing SVG markers color-coded by severity.
   - Hazard avoidance navigation: dynamic detour routing polylines avoiding roadblocks and exclusion perimeters.
   - Facilities layer (Hospitals, Police, Fire, Shelters) and fleet vehicle tracking.

4. **Multi-Agency Dispatch & Responder Lifecycle Management:**
   - Six-stage pipeline: `DETECTED` ➔ `AI_VERIFIED` ➔ `DISPATCHED` ➔ `ON_SCENE` ➔ `RESOLVED` ➔ `CLOSED`.
   - Automated Haversine distance pairing calculating nearest idle emergency fleet unit.
   - Bi-directional live status sync via WebSockets (`/ws/realtime`) and Supabase Realtime.

5. **Digital Roadside Signage Simulator (VMS):**
   - Pixel-accurate simulation of amber LED variable message billboards.
   - Dual-line display with flashing beacons, speed limit directives, and detour instructions.

6. **Citizen Safety Hub & Nearest Services Finder:**
   - GPS-sorted emergency facility locator (PostGIS geodesic distance).
   - Real-time capacity indicators and click-to-call emergency lines.

---

## 🌐 Unified Single Public URL

The platform provides a **single unified public URL** where the Express server serves both the production React application and the REST / WebSocket APIs on one port:

- **Local Access:** `http://localhost:5000`
- **Network / LAN Access:** `http://0.0.0.0:5000` or `http://<YOUR-IP>:5000`
- **Realtime WebSocket:** `ws://localhost:5000/ws/realtime`

---

## 📁 Repository Structure

```
CITYLINK AI/
├── client/                      # React 18 + Vite + Tailwind CSS + Leaflet
│   ├── src/
│   │   ├── components/          # IncidentMap, LiveTriageQueue, VirtualVMSSign, etc.
│   │   ├── context/             # AuthContext, SocketContext
│   │   ├── hooks/               # useIncidents, useGeolocation, useVoiceRecognition
│   │   ├── lib/                 # api.ts, supabase.ts
│   │   ├── pages/               # LandingPage, SOSPage, CommandDashboard, SafeMapPage, etc.
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env                     # Client environment variables
│   └── vite.config.ts
├── server/                      # Express.js + Node.js + TypeScript
│   ├── src/
│   │   ├── controllers/         # incident, facility, dispatch, signage, simulation
│   │   ├── lib/                 # gemini.ts, supabaseAdmin.ts, geospatial.ts
│   │   ├── middlewares/         # rateLimiter, upload, errorHandler
│   │   ├── routes/              # incident, facility, dispatch, signage, simulation
│   │   └── server.ts            # Unified Express server & WebSockets
│   └── .env                     # Server environment variables
├── shared/                      # Shared TypeScript models and Zod schemas
│   └── src/schemas/incident.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Complete PostgreSQL schema, PostGIS, RLS, and seed data
├── scripts/
│   ├── migrate.js               # Supabase migration runner
│   └── verify-all.js            # End-to-end verification script
└── package.json                 # Monorepo root scripts
```

---

## ⚙️ Environment Variables

### Server (`server/.env`)
```env
PORT=5000
HOST=0.0.0.0
NODE_ENV=development
SUPABASE_URL=https://pmrbnwdhchgsbtelnwwu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_ORIGIN=http://localhost:5173
```

### Client (`client/.env`)
```env
VITE_SUPABASE_URL=https://pmrbnwdhchgsbtelnwwu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_API_BASE_URL=/api/v1
```

---

## 🗄️ Supabase Cloud Database Setup

1. **Option A: Supabase Dashboard SQL Editor (Recommended - 1 Click)**
   - Open [Supabase SQL Editor](https://supabase.com/dashboard/project/pmrbnwdhchgsbtelnwwu/sql/new)
   - Copy the contents of [`supabase/migrations/001_initial_schema.sql`](file:///d:/CITYLINK%20AI/supabase/migrations/001_initial_schema.sql)
   - Paste into the SQL Editor and click **Run**.

2. **Option B: Node.js Migration Runner**
   ```bash
   set DATABASE_URL=postgres://postgres.pmrbnwdhchgsbtelnwwu:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   npm run migrate
   ```

*Note: UrbanShield features an integrated high-availability fallback store that operates immediately even before the SQL migration is executed in Supabase, syncing with Supabase Cloud automatically as soon as the tables are present.*

---

## 🛠️ Running the Application

### 1. Build and Run Unified Server (Single Public URL)
```bash
# Build shared, client, and server
npm run build

# Start the unified server on port 5000
npm start
```
Open **`http://localhost:5000`** in any web browser.

### 2. Run in Development Mode with Hot Reloading
```bash
# Terminal 1: Backend API & WebSockets
npm run dev:server

# Terminal 2: Frontend Vite Client (Hot Reload)
npm run dev:client
```
Client runs at `http://localhost:5173` (proxies `/api` and `/ws` to port 5000).

---

## 🧪 Verification & Testing

Run the automated end-to-end verification suite:
```bash
node scripts/verify-all.js
```

Verifies:
- ✅ Frontend SPA bundle serving (Status 200 OK)
- ✅ Incident intake & list API
- ✅ Nearest facilities geodesic spatial calculations
- ✅ Emergency fleet vehicle status
- ✅ Digital roadside VMS billboard output
- ✅ Automated IoT / CCTV sensor telemetry injection
