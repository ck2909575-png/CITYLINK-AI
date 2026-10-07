import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  Radio,
  MapPin,
  Building2,
  Sliders,
  Tv,
  FileText,
  User,
  Activity,
  AlertTriangle,
  Camera,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { UserRole } from '@urbanshield/shared';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, switchRole } = useAuth();
  const { isConnected } = useSocket();

  const navLinks = [
    { path: '/', label: 'Overview', icon: Radio },
    { path: '/command', label: 'Command HQ', icon: Sliders, badge: 'OPS' },
    { path: '/cameras', label: 'Cameras', icon: Camera },
    { path: '/citizen', label: 'Citizen Portal', icon: Building2 },
    { path: '/sos', label: 'SOS Intake', icon: AlertTriangle, highlight: true },
    { path: '/map', label: 'Safety Map', icon: MapPin },
    { path: '/camera/connect', label: 'Connect Phone', icon: Smartphone, external: true },
  ];


  return (
    <header className="sticky top-0 z-50 bg-command-950/90 backdrop-blur-md border-b border-command-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition">
              <div className="w-full h-full bg-command-950 rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-300">
                  CITY<span className="text-cyan-400 font-black">NEXUS</span>
                </span>
                <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 uppercase">
                  COMMAND
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-tight hidden sm:block">
                Smart City Autonomous Incident Intelligence & Department Mesh
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;

              if (link.highlight) {
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600 hover:text-white transition shadow-sm font-semibold text-xs tracking-wide mr-1"
                  >
                    <Icon className="w-4 h-4 animate-pulse" />
                    <span>{link.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-command-800 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-command-850'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-command-700 text-slate-300 font-mono">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Role Switcher & Realtime Telemetry Status */}
          <div className="flex items-center space-x-3">
            {/* Live Socket Status Indicator */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                isConnected
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                  : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
              }`}
              title={isConnected ? 'Connected to Realtime Command Mesh' : 'Reconnecting to Mesh...'}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="hidden sm:inline">
                {isConnected ? 'LIVE MESH' : 'SYNCING'}
              </span>
            </div>

            {/* Role Switcher Pill */}
            <div className="flex items-center bg-command-900 border border-command-700 rounded-lg p-0.5 text-xs">
              <span className="px-2 text-[10px] uppercase font-mono text-slate-400 flex items-center space-x-1">
                <User className="w-3 h-3 text-cyan-400" />
                <span className="hidden xl:inline">Role:</span>
              </span>
              <select
                value={user.role}
                onChange={(e) => switchRole(e.target.value as UserRole)}
                className="bg-command-800 text-slate-200 border-none rounded text-xs px-2 py-1 focus:ring-1 focus:ring-cyan-400 outline-none cursor-pointer font-medium"
              >
                <option value="operator">Command Operator (HQ)</option>
                <option value="police">Police Commander</option>
                <option value="fire">Fire Chief</option>
                <option value="medical">Medical EMS Officer</option>
                <option value="traffic">Traffic Controller</option>
                <option value="disaster">Civil Defense Officer</option>
                <option value="admin">System Admin</option>
                <option value="citizen">Citizen</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 bg-command-900/95 border-t border-command-800/80 space-x-2 scrollbar-none">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex-shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded text-xs ${
                isActive
                  ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-700/50'
                  : link.highlight
                  ? 'bg-red-950/40 text-red-400 border border-red-800/60 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};
