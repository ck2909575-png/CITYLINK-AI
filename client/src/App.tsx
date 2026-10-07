import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';

import { LandingPage } from './pages/LandingPage';
import { SOSPage } from './pages/SOSPage';
import { SafeMapPage } from './pages/SafeMapPage';
import { ServicesPage } from './pages/ServicesPage';
import { LoginPage } from './pages/LoginPage';
import { CommandDashboard } from './pages/CommandDashboard';
import { DispatchPage } from './pages/DispatchPage';
import { SignagePage } from './pages/SignagePage';
import { AuditPage } from './pages/AuditPage';
import { PolicePortal } from './pages/PolicePortal';
import { FirePortal } from './pages/FirePortal';
import { MedicalPortal } from './pages/MedicalPortal';
import { TrafficPortal } from './pages/TrafficPortal';
import { DisasterPortal } from './pages/DisasterPortal';
import { CameraPortal } from './pages/CameraPortal';
import { CitizenPortal } from './pages/CitizenPortal';
import { MobileCameraPage } from './pages/MobileCameraPage';

import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 2,
      refetchOnWindowFocus: false,
      throwOnError: false, // Prevents queries from crashing React rendering into blank screen
    },
    mutations: {
      throwOnError: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-command-950 text-slate-100 flex flex-col font-display selection:bg-cyan-500 selection:text-white">
              <Navbar />
              <main className="flex-1">
                <ErrorBoundary fallbackTitle="UrbanShield Navigation Mesh Protection">
                  <Routes>
                  {/* Department Portals */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/command" element={<CommandDashboard />} />
                  <Route path="/police" element={<PolicePortal />} />
                  <Route path="/fire" element={<FirePortal />} />
                  <Route path="/medical" element={<MedicalPortal />} />
                  <Route path="/traffic" element={<TrafficPortal />} />
                  <Route path="/disaster" element={<DisasterPortal />} />
                  <Route path="/cameras" element={<CameraPortal />} />
                  <Route path="/citizen" element={<CitizenPortal />} />

                  {/* Real Mobile Phone Camera Interface */}
                  <Route path="/camera/connect" element={<MobileCameraPage />} />

                  {/* Operational & Citizen Tools */}
                  <Route path="/sos" element={<SOSPage />} />
                  <Route path="/map" element={<SafeMapPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/auth/login" element={<LoginPage />} />
                  <Route path="/dispatch/:id" element={<DispatchPage />} />
                  <Route path="/signage" element={<SignagePage />} />
                  <Route path="/admin/audit" element={<AuditPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </main>
              {/* Toaster Notification System */}
              <Toaster
                position="top-right"
                theme="dark"
                toastOptions={{
                  style: {
                    background: '#0c1220',
                    border: '1px solid #1e293b',
                    color: '#f8fafc',
                  },
                }}
              />
            </div>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
