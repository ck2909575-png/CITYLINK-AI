import React, { useState, useRef } from 'react';
import {
  ShieldAlert,
  Mic,
  MicOff,
  Camera,
  MapPin,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Car,
  Skull,
  Radio,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useSubmitSOS } from '../hooks/useIncidents';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  { id: 'TRAFFIC_ACCIDENT', label: 'Car Collision', icon: Car, color: 'text-blue-400' },
  { id: 'FIRE_RESCUE', label: 'Fire / Smoke', icon: Flame, color: 'text-red-400' },
  { id: 'MEDICAL_EMERGENCY', label: 'Medical EMS', icon: Activity, color: 'text-emerald-400' },
  { id: 'INFRASTRUCTURE_HAZARD', label: 'Chemical / Hazard', icon: Skull, color: 'text-amber-400' },
];

export const SOSPage: React.FC = () => {
  const { latitude, longitude, isLoading: isGeoLoading } = useGeolocation();
  const {
    isListening,
    transcript,
    audioBlob,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  } = useVoiceRecognition({ continuous: true, recordAudio: true });

  const [categoryHint, setCategoryHint] = useState<string>('TRAFFIC_ACCIDENT');
  const [description, setDescription] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [hasTrappedIndividuals, setHasTrappedIndividuals] = useState(false);
  const [hasVisibleFlames, setHasVisibleFlames] = useState(false);
  const [hasChemicalOdor, setHasChemicalOdor] = useState(false);
  const [reporterPhone, setReporterPhone] = useState('');

  // File uploads
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Result state
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);

  const { mutate: submitSOS, isPending: isSubmitting } = useSubmitSOS();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalDescription = (description + ' ' + transcript).trim();
    if (!finalDescription) {
      alert('Please provide an incident description or use the voice recording widget.');
      return;
    }

    const formData = new FormData();
    formData.append('description', finalDescription);
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());
    formData.append('source', 'CITIZEN_SOS');
    formData.append('category_hint', categoryHint);
    if (address) formData.append('address', address);
    if (reporterPhone) formData.append('reporter_phone', reporterPhone);

    formData.append('has_trapped_individuals', String(hasTrappedIndividuals));
    formData.append('has_visible_flames', String(hasVisibleFlames));
    formData.append('has_chemical_odor', String(hasChemicalOdor));

    if (transcript) {
      formData.append('audio_transcript', transcript);
    }

    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    if (audioBlob) {
      formData.append('audio', audioBlob, 'emergency-voice.webm');
    }

    submitSOS(formData, {
      onSuccess: (data) => {
        setSubmittedResult(data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Title Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800 text-red-400 text-xs font-mono">
          <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
          <span>CITIZEN EMERGENCY INTAKE TERMINAL</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          Emergency SOS Incident Intake
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          AI-powered intake immediately classifies threat severity via Gemini 2.5
          Flash and routes verified alerts directly to first responder dispatch.
        </p>
      </div>

      {/* Submitted Success Banner */}
      {submittedResult && (
        <div className="p-6 bg-gradient-to-br from-command-900 to-command-950 border-2 border-emerald-500/80 rounded-2xl shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-command-800">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="font-extrabold text-lg text-white">
                  Emergency Report Verified & Dispatched
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Incident ID: {submittedResult.incident.id}
                </p>
              </div>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded border uppercase ${
                submittedResult.incident.severity === 'CRITICAL'
                  ? 'bg-red-950 text-red-400 border-red-800'
                  : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}
            >
              {submittedResult.incident.severity}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-cyan-400 uppercase">
                AI Classified Headline
              </span>
              <p className="font-bold text-sm text-slate-100">
                {submittedResult.incident.title}
              </p>
              <div className="flex items-center space-x-2 pt-1 text-xs text-slate-400">
                <span>Assigned Authority:</span>
                <span className="text-cyan-300 font-bold font-mono">
                  {submittedResult.incident.primary_agency}
                </span>
              </div>
            </div>

            {submittedResult.suggested_unit && (
              <div className="p-3 bg-command-950 rounded-xl border border-command-800 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                  ⚡ Auto-Paired First Responder Fleet Unit
                </span>
                <p className="text-xs font-bold text-white">
                  {submittedResult.suggested_unit.unit_callsign}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  Status: {submittedResult.suggested_unit.status}
                </p>
              </div>
            )}
          </div>

          {/* Citizen Advisory */}
          {submittedResult.incident.citizen_advisory && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-1">
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                <span>🛡️ IMMEDIATE LIFE-SAFETY ACTION ADVISORY:</span>
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                {submittedResult.incident.citizen_advisory}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={() => {
                setSubmittedResult(null);
                setDescription('');
                resetTranscript();
                removeImage();
              }}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-command-800 rounded-lg"
            >
              Submit Another Report
            </button>
            <Link
              to="/command"
              className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center space-x-1"
            >
              <span>Track in Command Grid</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}

      {/* SOS Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-command-900 border border-command-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
      >
        {/* Category Selector */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block">
            1. Select Incident Domain
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = categoryHint === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategoryHint(cat.id)}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col items-start space-y-2 ${
                    isSelected
                      ? 'bg-command-800 border-cyan-400 shadow-lg shadow-cyan-950/50'
                      : 'bg-command-950/70 border-command-800 hover:border-command-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${cat.color}`} />
                  <span className="text-xs font-bold text-white leading-tight">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Voice-to-Text & Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono text-slate-300 uppercase tracking-wider">
              2. Describe Emergency (Voice or Text)
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              Web Speech & Gemini Audio Multimodal
            </span>
          </div>

          {/* Voice Recording Widget */}
          <div className="p-3.5 bg-command-950 border border-command-800 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-3 rounded-xl flex items-center justify-center transition shadow-lg ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse shadow-red-600/40'
                    : 'bg-command-800 text-cyan-400 hover:bg-command-700'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
              <div>
                <span className="text-xs font-bold text-slate-100 block">
                  {isListening ? 'Listening & Recording...' : 'Tap Mic for Instant Voice SOS'}
                </span>
                <p className="text-[11px] text-slate-400">
                  {isListening
                    ? 'Speak clearly. Live transcript is generating below.'
                    : 'Uses Web Speech Recognition & audio stream.'}
                </p>
              </div>
            </div>

            {transcript && (
              <button
                type="button"
                onClick={resetTranscript}
                className="text-[11px] font-mono text-slate-400 hover:text-white"
              >
                Clear Audio
              </button>
            )}
          </div>

          {/* Voice Error notice if any */}
          {voiceError && (
            <div className="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-500/40 text-[11px] text-red-300 font-mono">
              ⚠️ {voiceError}
            </div>
          )}

          {/* Live Transcript / Textarea */}
          <textarea
            rows={3}
            placeholder="E.g., Two commercial trucks collided at 4th and Market. Heavy fuel spill leaking near crosswalk, pedestrian trapped in rear seat..."
            value={description || transcript}
            onChange={(e) => {
              setDescription(e.target.value);
              if (transcript) setTranscript(e.target.value);
            }}
            className="w-full bg-command-950 border border-command-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
          />
        </div>

        {/* Location & GPS */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block">
            3. Geolocated Coordinates & Address
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-command-950 border border-command-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate">
                <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="text-xs font-mono text-slate-300 truncate">
                  {isGeoLoading
                    ? 'Acquiring GPS...'
                    : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                GPS AUTO-LOCKED
              </span>
            </div>

            <input
              type="text"
              placeholder="Street Address or Landmark (optional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-command-950 border border-command-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Critical Checkbox Toggles */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block">
            4. Critical On-Scene Hazards (Check all that apply)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label
              className={`p-3 rounded-xl border cursor-pointer flex items-center space-x-2.5 transition ${
                hasTrappedIndividuals
                  ? 'bg-red-950/60 border-red-500 text-white'
                  : 'bg-command-950 border-command-800 text-slate-400 hover:border-command-700'
              }`}
            >
              <input
                type="checkbox"
                checked={hasTrappedIndividuals}
                onChange={(e) => setHasTrappedIndividuals(e.target.checked)}
                className="rounded bg-command-900 border-command-700 text-red-500 focus:ring-0"
              />
              <span className="text-xs font-semibold">Trapped Individuals</span>
            </label>

            <label
              className={`p-3 rounded-xl border cursor-pointer flex items-center space-x-2.5 transition ${
                hasVisibleFlames
                  ? 'bg-orange-950/60 border-orange-500 text-white'
                  : 'bg-command-950 border-command-800 text-slate-400 hover:border-command-700'
              }`}
            >
              <input
                type="checkbox"
                checked={hasVisibleFlames}
                onChange={(e) => setHasVisibleFlames(e.target.checked)}
                className="rounded bg-command-900 border-command-700 text-orange-500 focus:ring-0"
              />
              <span className="text-xs font-semibold">Visible Flames</span>
            </label>

            <label
              className={`p-3 rounded-xl border cursor-pointer flex items-center space-x-2.5 transition ${
                hasChemicalOdor
                  ? 'bg-amber-950/60 border-amber-500 text-white'
                  : 'bg-command-950 border-command-800 text-slate-400 hover:border-command-700'
              }`}
            >
              <input
                type="checkbox"
                checked={hasChemicalOdor}
                onChange={(e) => setHasChemicalOdor(e.target.checked)}
                className="rounded bg-command-900 border-command-700 text-amber-500 focus:ring-0"
              />
              <span className="text-xs font-semibold">Chemical / Gas Odor</span>
            </label>
          </div>
        </div>

        {/* Media Photo Upload Dropzone */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block">
            5. Attach Scene Photo / Evidence (Optional)
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {imagePreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-command-700 bg-black max-w-sm">
              <img src={imagePreview} alt="Preview" className="w-full h-44 object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-command-700 hover:border-cyan-500 rounded-2xl p-6 text-center cursor-pointer transition bg-command-950/50 space-y-1"
            >
              <Camera className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-200">
                Click to attach scene photo or camera capture
              </p>
              <p className="text-[10px] text-slate-500">
                JPEG, PNG, WebP up to 10MB processed by Gemini Vision
              </p>
            </div>
          )}
        </div>

        {/* Reporter Phone & Submit Button */}
        <div className="pt-4 border-t border-command-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <input
            type="tel"
            placeholder="Callback Phone Number (optional)"
            value={reporterPhone}
            onChange={(e) => setReporterPhone(e.target.value)}
            className="w-full sm:w-64 bg-command-950 border border-command-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-extrabold text-sm text-white flex items-center justify-center space-x-2 transition shadow-xl ${
              isSubmitting
                ? 'bg-red-800 cursor-wait'
                : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>TRIAGING VIA GEMINI 2.5 FLASH...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>SUBMIT EMERGENCY SOS REPORT</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
