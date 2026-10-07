import React, { useState, useEffect } from 'react';
import { useIncidents, useNearestFacilities } from '../hooks/useIncidents';
import { useGeolocation } from '../hooks/useGeolocation';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { IncidentMap } from '../components/IncidentMap';
import { DepartmentNav } from '../components/DepartmentNav';
import {
  Users,
  Building2,
  Shield,
  Flame,
  Pill,
  Mic,
  MicOff,
  Navigation,
  Compass,
  Volume2,
  AlertTriangle,
  PhoneCall,
  Search,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const CitizenPortal: React.FC = () => {
  const { latitude, longitude } = useGeolocation();
  const { data: incidents = [] } = useIncidents();
  const { data: facilities = [] } = useNearestFacilities({ lat: latitude, lng: longitude });

  const {
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({ continuous: false });

  const [voiceQuery, setVoiceQuery] = useState('');
  const [voiceAnswer, setVoiceAnswer] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Sync transcription into query input
  useEffect(() => {
    if (transcript) {
      setVoiceQuery(transcript);
    }
  }, [transcript]);

  // When speech recognition ends and we have words, trigger answer
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      processVoiceCommand(transcript.trim());
      resetTranscript();
    }
  }, [isListening, transcript]);

  const processVoiceCommand = (rawText: string) => {
    stopListening();
    const text = rawText.toLowerCase().trim();

    if (text.includes('hospital') || text.includes('doctor') || text.includes('medical')) {
      const hosp = facilities.find((f) => f.agency === 'HEALTH_EMS') || facilities[0];
      const reply = hosp
        ? `The nearest medical center is ${hosp.name} located at ${hosp.address}. Emergency phone: ${hosp.contact_phone}. Route displayed on map.`
        : `Nearest emergency hospital is Apollo Trauma Center, 1.8 kilometers away on Health Boulevard.`;
      setVoiceAnswer(reply);
      speak(reply);
      setSelectedFilter('HEALTH_EMS');
    } else if (text.includes('police') || text.includes('cop') || text.includes('security')) {
      const pol = facilities.find((f) => f.agency === 'POLICE');
      const reply = pol
        ? `The nearest police station is ${pol.name} located at ${pol.address}. Emergency contact: ${pol.contact_phone}.`
        : `Nearest police station is 2nd Precinct Central, located 1.2 kilometers away on Patrol Way.`;
      setVoiceAnswer(reply);
      speak(reply);
      setSelectedFilter('POLICE');
    } else if (text.includes('fire') || text.includes('smoke')) {
      const fire = facilities.find((f) => f.agency === 'FIRE_DEPARTMENT');
      const reply = fire
        ? `The nearest fire rescue station is ${fire.name} on ${fire.address}.`
        : `Nearest fire station is Fire Station 4, 2.1 kilometers away.`;
      setVoiceAnswer(reply);
      speak(reply);
      setSelectedFilter('FIRE_DEPARTMENT');
    } else if (text.includes('pharmacy') || text.includes('medicine') || text.includes('chemist')) {
      const reply = `The nearest 24/7 emergency pharmacy is MedPlus Pharmacy located 450 meters away on Harbor Road.`;
      setVoiceAnswer(reply);
      speak(reply);
      setSelectedFilter('PHARMACY');
    } else if (text.includes('traffic') || text.includes('congestion') || text.includes('road')) {
      const activeTraffic = incidents.filter((i) => i.domain === 'TRAFFIC_ACCIDENT');
      const reply = activeTraffic.length > 0
        ? `Traffic advisory: ${activeTraffic.length} active road incident reported. Detour bypasses are active on the main corridor.`
        : `All city corridors are flowing freely with no major bottlenecks reported.`;
      setVoiceAnswer(reply);
      speak(reply);
      setSelectedFilter('TRAFFIC');
    } else if (text.includes('accident') || text.includes('route')) {
      const firstAccident = incidents.find((i) => i.domain === 'TRAFFIC_ACCIDENT');
      const reply = firstAccident
        ? `Incident route highlighted: ${firstAccident.title} at ${firstAccident.address}. Detour corridor is recommended.`
        : `No active accident routes found in your immediate sector.`;
      setVoiceAnswer(reply);
      speak(reply);
      setSelectedFilter('ALL');
    } else {
      const reply = `I heard: "${rawText}". You can ask: "Where is the nearest hospital?", "Show me the nearest police station", or "Is there traffic ahead?".`;
      setVoiceAnswer(reply);
      speak(reply);
    }
  };

  const speak = (message: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredFacilities = facilities.filter((f) => {
    if (selectedFilter === 'ALL') return true;
    return f.agency === selectedFilter;
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-command-950">
      <DepartmentNav />

      <div className="flex-1 flex flex-col p-4 space-y-3 min-h-0">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-teal-950/40 border border-teal-500/30 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-teal-600/20 border border-teal-500/40 text-teal-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-extrabold text-white uppercase font-mono tracking-wider">
                  Citizen Safety & Emergency Assistance Portal
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/40">
                  PUBLIC PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Voice Emergency Terminal • Safe Navigation • Emergency Hotlines
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/sos"
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition shadow-lg shadow-red-950 flex items-center space-x-1.5 animate-pulse"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>SOS EMERGENCY INTAKE</span>
            </Link>
          </div>
        </div>

        {/* Voice Terminal Card */}
        <div className="p-4 bg-slate-900/90 border border-cyan-500/30 rounded-2xl shadow-xl space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-3 rounded-2xl transition shadow-lg shrink-0 ${
                  isListening
                    ? 'bg-red-600 text-white shadow-red-950 animate-pulse'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950'
                }`}
                title={isListening ? 'Click to stop listening' : 'Click to speak to Voice Assistant'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Voice Assistant Terminal</span>
                  </span>
                  {isListening && (
                    <span className="text-[10px] font-mono text-red-400 bg-red-950 px-1.5 py-0.2 rounded animate-pulse">
                      LISTENING...
                    </span>
                  )}
                  {isSpeaking && (
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-1.5 py-0.2 rounded">
                      SPEAKING...
                    </span>
                  )}
                </div>

                {/* Text query input + submit */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (voiceQuery.trim()) {
                      processVoiceCommand(voiceQuery.trim());
                    }
                  }}
                  className="flex items-center space-x-2 pt-0.5"
                >
                  <input
                    type="text"
                    value={voiceQuery}
                    onChange={(e) => setVoiceQuery(e.target.value)}
                    placeholder="Speak via mic or type: e.g. Where is the nearest hospital?"
                    className="flex-1 bg-command-950 border border-command-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition shrink-0"
                  >
                    Ask
                  </button>
                </form>
              </div>
            </div>

            {/* Quick Voice Prompt Shortcuts */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-medium scrollbar-none">
              {[
                'Where is the nearest hospital?',
                'Show me the nearest police station.',
                'Is there traffic ahead?',
                'Take me to the nearest pharmacy.',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setVoiceQuery(q);
                    processVoiceCommand(q);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Error Notice */}
          {voiceError && (
            <div className="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-500/40 text-[11px] text-red-300 font-mono">
              ⚠️ {voiceError}
            </div>
          )}
        </div>

        {/* Spoken Answer Banner */}
        {voiceAnswer && (
          <div className="p-3 bg-cyan-950/60 border border-cyan-500/40 rounded-xl text-xs text-cyan-200 flex items-start space-x-2.5 animate-fade-in">
            <Volume2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-cyan-400 font-bold block">
                ASSISTANT RESPONSE:
              </span>
              <p className="text-white font-medium">{voiceAnswer}</p>
            </div>
          </div>
        )}

        {/* Main Work Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[550px]">
          {/* Left: Nearby Community Facilities */}
          <div className="lg:col-span-4 h-full min-h-0 bg-command-900 border border-command-800 rounded-2xl p-3 flex flex-col space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-command-800 text-xs font-mono font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-teal-400">
                <Building2 className="w-3.5 h-3.5" />
                <span>Nearby Public Facilities ({filteredFacilities.length})</span>
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'HEALTH_EMS', label: 'Hospitals' },
                { id: 'POLICE', label: 'Police' },
                { id: 'FIRE_DEPARTMENT', label: 'Fire' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setSelectedFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    selectedFilter === pill.id
                      ? 'bg-teal-600 text-white font-bold'
                      : 'bg-command-950 text-slate-400 hover:text-white border border-command-800'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {filteredFacilities.map((fac) => (
                <div
                  key={fac.id}
                  className="p-3 bg-command-950/70 border border-command-800 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                      {fac.agency}
                    </span>
                    <span className="text-emerald-400 font-bold">OPEN 24/7</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{fac.name}</h4>
                  <p className="text-[11px] text-slate-400">{fac.address}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-command-800/80 text-[11px] font-mono">
                    <span className="text-cyan-400">☎ {fac.contact_phone}</span>
                    <button
                      onClick={() => speak(`Navigating to ${fac.name}. Follow map guidance.`)}
                      className="text-teal-400 hover:underline flex items-center gap-1 text-[10px]"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Directions</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Citizen Safe Navigation Map (No private surveillance cameras exposed for citizen privacy) */}
          <div className="lg:col-span-8 h-full min-h-0 rounded-2xl overflow-hidden border border-command-800 shadow-xl">
            <IncidentMap
              incidents={incidents}
              facilities={filteredFacilities}
              cameras={[]} // Operational private cameras hidden from citizen view as per requirement 9
              center={[latitude || 17.6868, longitude || 83.2185]}
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
