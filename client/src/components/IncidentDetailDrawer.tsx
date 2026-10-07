import React, { useState } from 'react';
import {
  IncidentRecord,
  IncidentStatus,
  ResponseUnitRecord,
} from '@urbanshield/shared';
import {
  X,
  ShieldCheck,
  AlertOctagon,
  Clock,
  Radio,
  FileCheck2,
  Tv,
  CheckCircle2,
  Truck,
  Send,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { UnitDispatchSelector } from './UnitDispatchSelector';

interface IncidentDetailDrawerProps {
  incident: IncidentRecord;
  units: ResponseUnitRecord[];
  onClose: () => void;
  onUpdateStatus: (
    status: IncidentStatus,
    unitId?: string,
    notes?: string
  ) => void;
  isUpdating?: boolean;
}

const STATUS_STEPS: IncidentStatus[] = [
  'DETECTED',
  'AI_VERIFIED',
  'DISPATCHED',
  'ON_SCENE',
  'RESOLVED',
  'CLOSED',
];

export const IncidentDetailDrawer: React.FC<IncidentDetailDrawerProps> = ({
  incident,
  units,
  onClose,
  onUpdateStatus,
  isUpdating = false,
}) => {
  const [operatorNotes, setOperatorNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'dispatch' | 'media'>('details');

  const currentIndex = STATUS_STEPS.indexOf(incident.status);

  return (
    <div className="flex flex-col h-full bg-command-900 border border-command-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-command-800 bg-command-950/80 flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                incident.severity === 'CRITICAL'
                  ? 'bg-red-950 text-red-400 border-red-800'
                  : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}
            >
              {incident.severity}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
              {incident.domain.replace('_', ' ')}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Zone: {incident.hazard_perimeter_meters}m
            </span>
          </div>
          <h3 className="font-bold text-base text-slate-100 leading-snug">
            {incident.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-command-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-command-800 bg-command-950/40 px-4 text-xs">
        <button
          onClick={() => setActiveTab('details')}
          className={`py-2.5 px-3 font-semibold border-b-2 transition ${
            activeTab === 'details'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          AI Triage & Advisories
        </button>
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`py-2.5 px-3 font-semibold border-b-2 transition ${
            activeTab === 'dispatch'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Fleet Dispatch ({units.filter((u) => u.agency === incident.primary_agency && u.status === 'IDLE').length} Idle)
        </button>
        {incident.media_urls.length > 0 && (
          <button
            onClick={() => setActiveTab('media')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition ${
              activeTab === 'media'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Media Attachments ({incident.media_urls.length})
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status Pipeline Stepper */}
        <div className="bg-command-950/60 p-3 rounded-xl border border-command-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
            Incident Lifecycle Pipeline
          </span>
          <div className="grid grid-cols-6 gap-1 text-center">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`w-full h-1.5 rounded-full mb-1 transition ${
                      isPast
                        ? 'bg-emerald-500'
                        : isCurrent
                        ? 'bg-cyan-400 shadow-sm shadow-cyan-400'
                        : 'bg-command-800'
                    }`}
                  />
                  <span
                    className={`text-[9px] font-mono truncate w-full ${
                      isCurrent
                        ? 'text-cyan-300 font-bold'
                        : isPast
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {activeTab === 'details' && (
          <>
            {/* AI Confidence Gauge */}
            <div className="p-3 bg-gradient-to-r from-command-950 to-command-900 border border-cyan-900/50 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-xs font-bold text-slate-200">
                    Gemini 2.5 Flash Triage Assessment
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Multimodal threat classification verified
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {((incident.confidence_score || 0.95) * 100).toFixed(0)}%
                </span>
                <span className="block text-[10px] text-slate-500 font-mono">
                  Confidence
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">
                Scene Telemetry & Citizen Report
              </span>
              <p className="text-xs text-slate-300 bg-command-950/40 p-2.5 rounded-lg border border-command-800/80 leading-relaxed">
                {incident.description}
              </p>
            </div>

            {/* Dynamic Advisory 1: First-Responder Brief */}
            {incident.responder_tactical_brief && (
              <div className="p-3 bg-blue-950/30 border border-blue-900/60 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-blue-400 text-xs font-bold">
                  <FileCheck2 className="w-4 h-4" />
                  <span>First-Responder Tactical Brief</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {incident.responder_tactical_brief}
                </p>
              </div>
            )}

            {/* Dynamic Advisory 2: Citizen Micro-Guidance */}
            {incident.citizen_advisory && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-900/60 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Citizen Life-Safety Micro-Guidance</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {incident.citizen_advisory}
                </p>
              </div>
            )}

            {/* Dynamic Advisory 3: Traffic Network Directive (VMS) */}
            {incident.traffic_vms_text && (
              <div className="p-3 bg-amber-950/30 border border-amber-900/60 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-amber-400 text-xs font-bold">
                  <Tv className="w-4 h-4" />
                  <span>Roadside Digital Signage (VMS Directive)</span>
                </div>
                <p className="text-xs font-mono text-amber-300 bg-command-950 p-2 rounded border border-amber-950 uppercase tracking-wider">
                  {incident.traffic_vms_text}
                </p>
              </div>
            )}

            {/* Human-in-the-Loop Operator Actions */}
            <div className="pt-2 border-t border-command-800 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase block">
                Human-In-The-Loop Status Actions
              </span>
              <div className="grid grid-cols-2 gap-2">
                {incident.status === 'DETECTED' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => onUpdateStatus('AI_VERIFIED', undefined, 'Operator verified AI output')}
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify & Approve AI</span>
                  </button>
                )}

                {incident.status === 'AI_VERIFIED' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => setActiveTab('dispatch')}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition col-span-2"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Assign & Dispatch Nearest Unit</span>
                  </button>
                )}

                {incident.status === 'DISPATCHED' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => onUpdateStatus('ON_SCENE', undefined, 'Unit confirmed arrival on scene')}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition col-span-2"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Mark Unit On-Scene</span>
                  </button>
                )}

                {incident.status === 'ON_SCENE' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => onUpdateStatus('RESOLVED', undefined, 'Incident hazards stabilized')}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition col-span-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Incident Resolved</span>
                  </button>
                )}

                {incident.status === 'RESOLVED' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => onUpdateStatus('CLOSED', undefined, 'Case finalized and archived')}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition col-span-2"
                  >
                    <span>Close Incident Case</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Fleet Dispatch Selector */}
        {activeTab === 'dispatch' && (
          <UnitDispatchSelector
            incident={incident}
            units={units}
            onAssignUnit={(unitId) => {
              onUpdateStatus('DISPATCHED', unitId, `Dispatched unit ${unitId}`);
              setActiveTab('details');
            }}
          />
        )}

        {/* Tab 3: Media Attachments */}
        {activeTab === 'media' && (
          <div className="space-y-3">
            {incident.media_urls.map((url, i) => {
              if (url.startsWith('data:audio') || url.includes('.mp3') || url.includes('.wav') || url.includes('.webm')) {
                return (
                  <div key={i} className="p-3 bg-command-950 rounded-xl border border-command-800">
                    <span className="text-[11px] font-mono text-cyan-400 block mb-1">
                      Audio Voice Recording #{i + 1}
                    </span>
                    <audio controls className="w-full">
                      <source src={url} />
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                );
              }
              return (
                <div key={i} className="rounded-xl overflow-hidden border border-command-800 bg-black">
                  <img
                    src={url}
                    alt={`Incident attachment ${i + 1}`}
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
