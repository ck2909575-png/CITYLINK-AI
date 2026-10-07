import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  User,
  Sliders,
  Radio,
  FileText,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { UserRole } from '@urbanshield/shared';

const ROLES = [
  {
    role: 'citizen' as UserRole,
    title: 'Citizen Portal',
    name: 'Alex Chen',
    agency: 'Public Citizen',
    desc: 'Voice/Text SOS submission, nearest hospital locator, safe navigation detours.',
    icon: User,
    color: 'from-blue-600 to-cyan-600',
    target: '/sos',
  },
  {
    role: 'operator' as UserRole,
    title: 'Command Operator',
    name: 'Cmdr. Elena Rostova',
    agency: 'Fire & Emergency HQ',
    desc: 'Human-in-the-loop AI verification, triage queue, vehicle dispatch matrix.',
    icon: Sliders,
    color: 'from-amber-600 to-red-600',
    target: '/command',
  },
  {
    role: 'responder' as UserRole,
    title: 'Field Responder',
    name: 'Marcus Vance (MEDIC-41)',
    agency: 'Health & EMS Fleet',
    desc: 'Field navigation terminal, tactical checklist, on-scene status telemetry.',
    icon: Radio,
    color: 'from-emerald-600 to-teal-600',
    target: '/dispatch/00000000-0000-0000-0000-000000000105',
  },
  {
    role: 'admin' as UserRole,
    title: 'System Director',
    name: 'Sarah Jenkins',
    agency: 'Dept of Emergency Mgmt',
    desc: 'Audit trail logs, sensor telemetry ingestion, municipal infrastructure control.',
    icon: FileText,
    color: 'from-purple-600 to-indigo-600',
    target: '/admin/audit',
  },
];

export const LoginPage: React.FC = () => {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = (r: UserRole, target: string) => {
    switchRole(r);
    navigate(target);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-mono">
          <Lock className="w-3.5 h-3.5" />
          <span>ROLE-BASED SMART CITY AUTHENTICATION</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Sign in to UrbanShield
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Choose a role to test role-specific emergency workflows, from citizen SOS reporting to command dispatch.
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROLES.map((item) => {
          const Icon = item.icon;
          const isActive = user.role === item.role;

          return (
            <div
              key={item.role}
              onClick={() => handleSelectRole(item.role, item.target)}
              className={`p-6 rounded-3xl border cursor-pointer transition relative group flex flex-col justify-between space-y-4 ${
                isActive
                  ? 'bg-command-900 border-cyan-400 shadow-xl shadow-cyan-950/50 ring-1 ring-cyan-400'
                  : 'bg-command-900/60 border-command-800 hover:border-command-700 hover:bg-command-850'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-lg`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  {isActive && (
                    <span className="flex items-center space-x-1 text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>CURRENT SESSION</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-lg text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs font-mono text-cyan-400 font-semibold">
                    {item.name} • {item.agency}
                  </p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-command-800/80 flex items-center justify-between text-xs font-bold text-slate-300 group-hover:text-cyan-400 transition">
                <span>Launch as {item.title}</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
