import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfileRecord, UserRole, AgencyType } from '@urbanshield/shared';

interface AuthContextType {
  user: UserProfileRecord;
  switchRole: (role: UserRole, agency?: AgencyType) => void;
  isAuthenticated: boolean;
}

const DEFAULT_CITIZEN: UserProfileRecord = {
  id: 'user-citizen-01',
  email: 'citizen@urban.shield',
  full_name: 'Alex Chen (Citizen)',
  role: 'citizen',
  phone: '(555) 019-2831',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const PRESET_USERS: Record<UserRole, UserProfileRecord> = {
  citizen: DEFAULT_CITIZEN,
  operator: {
    id: 'user-operator-01',
    email: 'operator@urban.shield',
    full_name: 'Cmdr. Elena Rostova',
    role: 'operator',
    agency: 'FIRE_DEPARTMENT',
    phone: '(555) 019-5432',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  responder: {
    id: 'user-responder-01',
    email: 'marcus@urban.shield',
    full_name: 'Paramedic Marcus Vance (MEDIC-41)',
    role: 'responder',
    agency: 'HEALTH_EMS',
    phone: '(555) 019-7711',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  admin: {
    id: 'user-admin-01',
    email: 'admin@urban.shield',
    full_name: 'Director Sarah Jenkins',
    role: 'admin',
    agency: 'DISASTER_MANAGEMENT',
    phone: '(555) 019-9999',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  police: {
    id: 'user-police-01',
    email: 'police@urban.shield',
    full_name: 'Capt. Marcus Cole',
    role: 'police',
    agency: 'POLICE',
    phone: '(555) 019-1001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  fire: {
    id: 'user-fire-01',
    email: 'fire@urban.shield',
    full_name: 'Chief David Morales',
    role: 'fire',
    agency: 'FIRE_DEPARTMENT',
    phone: '(555) 019-1002',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  medical: {
    id: 'user-medical-01',
    email: 'medical@urban.shield',
    full_name: 'Dr. Rebecca Adams',
    role: 'medical',
    agency: 'HEALTH_EMS',
    phone: '(555) 019-1003',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  traffic: {
    id: 'user-traffic-01',
    email: 'traffic@urban.shield',
    full_name: 'Eng. Vikram Rao',
    role: 'traffic',
    agency: 'TRAFFIC_AUTHORITY',
    phone: '(555) 019-1004',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  disaster: {
    id: 'user-disaster-01',
    email: 'disaster@urban.shield',
    full_name: 'Coord. Priya Sharma',
    role: 'disaster',
    agency: 'DISASTER_MANAGEMENT',
    phone: '(555) 019-1005',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_CITIZEN,
  switchRole: () => {},
  isAuthenticated: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfileRecord>(() => {
    const saved = localStorage.getItem('urbanshield_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_CITIZEN;
  });

  useEffect(() => {
    localStorage.setItem('urbanshield_user', JSON.stringify(user));
  }, [user]);

  const switchRole = (role: UserRole, agency?: AgencyType) => {
    const preset = PRESET_USERS[role] || DEFAULT_CITIZEN;
    setUser({
      ...preset,
      ...(agency && { agency }),
    });
  };

  return (
    <AuthContext.Provider value={{ user, switchRole, isAuthenticated: true }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
