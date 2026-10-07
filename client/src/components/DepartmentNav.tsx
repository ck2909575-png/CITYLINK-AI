import React from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import {
  Radio,
  Sliders,
  Shield,
  Flame,
  Activity,
  Car,
  AlertTriangle,
  Camera,
  Users,
  Smartphone,
} from 'lucide-react';

export interface DepartmentItem {
  id: string;
  path: string;
  label: string;
  icon: any;
  color: string;
}

export const DEPARTMENTS: DepartmentItem[] = [
  { id: 'overview', path: '/', label: 'Overview Hub', icon: Radio, color: 'text-sky-400' },
  { id: 'command', path: '/command', label: 'Command HQ', icon: Sliders, color: 'text-cyan-400' },
  { id: 'police', path: '/police', label: 'Police Control', icon: Shield, color: 'text-blue-400' },
  { id: 'fire', path: '/fire', label: 'Fire Control', icon: Flame, color: 'text-rose-400' },
  { id: 'medical', path: '/medical', label: 'Medical EMS', icon: Activity, color: 'text-emerald-400' },
  { id: 'traffic', path: '/traffic', label: 'Traffic Control', icon: Car, color: 'text-amber-400' },
  { id: 'disaster', path: '/disaster', label: 'Disaster Dept', icon: AlertTriangle, color: 'text-orange-400' },
  { id: 'cameras', path: '/cameras', label: 'Camera Fleet', icon: Camera, color: 'text-purple-400' },
  { id: 'citizen', path: '/citizen', label: 'Citizen SOS', icon: Users, color: 'text-teal-400' },
];

interface DepartmentNavProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const DepartmentNav: React.FC<DepartmentNavProps> = ({ activeTab, onTabChange }) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabFromParam = searchParams.get('tab') || 'overview';

  const isCurrentActive = (dept: DepartmentItem) => {
    if (activeTab) {
      return activeTab === dept.id;
    }
    if (location.pathname === '/' && searchParams.has('tab')) {
      return currentTabFromParam === dept.id;
    }
    if (dept.path === '/') {
      return location.pathname === '/' && !searchParams.has('tab');
    }
    return location.pathname === dept.path;
  };

  const handleClick = (e: React.MouseEvent, dept: DepartmentItem) => {
    if (onTabChange) {
      e.preventDefault();
      onTabChange(dept.id);
      return;
    }
    if (location.pathname === '/') {
      e.preventDefault();
      if (dept.id === 'overview') {
        searchParams.delete('tab');
        setSearchParams(searchParams);
      } else {
        setSearchParams({ tab: dept.id });
      }
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-3 sm:px-4 py-2 flex items-center justify-between overflow-x-auto gap-2 scrollbar-none z-20 sticky top-16 shadow-lg">
      <div className="flex items-center space-x-1 sm:space-x-1.5 flex-nowrap">
        {DEPARTMENTS.map((dept) => {
          const Icon = dept.icon;
          const active = isCurrentActive(dept);
          return (
            <NavLink
              key={dept.id}
              to={location.pathname === '/' ? (dept.id === 'overview' ? '/' : `/?tab=${dept.id}`) : dept.path}
              onClick={(e) => handleClick(e, dept)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                active
                  ? 'bg-slate-800 text-white border border-cyan-500/50 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${dept.color}`} />
              <span>{dept.label}</span>
              {active && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse ml-0.5" />
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="shrink-0 pl-2">
        <NavLink
          to="/camera/connect"
          target="_blank"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600 hover:text-white transition whitespace-nowrap shadow-sm"
          title="Open Mobile Camera Node in new tab or phone"
        >
          <Smartphone className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>Phone Node</span>
        </NavLink>
      </div>
    </div>
  );
};
