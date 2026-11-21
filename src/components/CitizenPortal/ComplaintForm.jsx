import React, { useState, useEffect, useRef } from 'react';
import { LANGUAGES, DEMO_LOCATIONS, SEVERITIES } from '../../types';
import { triageComplaint } from '../../services/triageClassifier';
import { findMatchingMasterIssue } from '../../services/communityGrouping';
import { registerComplaint, compressImage, getMasterIssues } from '../../services/storage';
import { isSpeechSupported, speechService } from '../../services/speechRecognition';
import { SeverityBadge } from '../common/Badge';
import LocationPicker from '../common/LocationPicker';
import { useAuth } from '../../context/AuthContext';
import { 
  Mic, 
  MicOff, 
  Upload, 
  X, 
  MapPin, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Layers,
  Copy,
  ArrowRight
} from 'lucide-react';

export default function ComplaintForm({ onComplaintSubmitted, onTrackTicket }) {
  const { user, profile } = useAuth();

  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [complaintText, setComplaintText] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: 12.9716, lng: 77.5946 });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  
  // Voice Recording state
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Live Rule-based Triage State
  const [triageResult, setTriageResult] = useState(null);
  const [matchedMasterIssue, setMatchedMasterIssue] = useState(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setSpeechSupported(isSpeechSupported());
  }, []);

  // Live triage analysis whenever complaint text, language, or location changes
  useEffect(() => {
    if (complaintText.trim().length > 3) {
      const result = triageComplaint(complaintText, selectedLanguage);
      setTriageResult(result);

      // Check if this would group into an existing master issue
      if (location.trim().length > 3 || coordinates) {
        const allMasters = getMasterIssues();
        const hypotheticalComplaint = {
          category: result.category,
          location: location.trim(),
          coordinates: coordinates,
          complaintText: complaintText.trim(),
          matchedKeyword: result.matchedKeyword
        };
        const match = findMatchingMasterIssue(hypotheticalComplaint, allMasters);
        setMatchedMasterIssue(match);
      } else {
        setMatchedMasterIssue(null);
      }
    } else {
      setTriageResult(null);
      setMatchedMasterIssue(null);
    }
  }, [complaintText, selectedLanguage, location, coordinates]);

  // Voice recording toggle
  const toggleListening = () => {
    if (isListening) {
      speechService.stop();
      setIsListening(false);
    } else {
      setSpeechError(null);
      speechService.start({
        language: selectedLanguage,
        onStart: () => {
          setIsListening(true);
        },
        onResult: ({ final, interim }) => {
          if (final) {
            setComplaintText(prev => (prev ? `${prev} ${final.trim()}` : final.trim()));
          }
        },
        onError: (err) => {
          setIsListening(false);
          setSpeechError(err.message);
        },
        onEnd: () => {
          setIsListening(false);
        }
      });
    }
  };

  // Photo upload handler with client-side canvas compression
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    try {
      setIsCompressingPhoto(true);
      const compressedDataUrl = await compressImage(file, 800, 800, 0.7);
      setPhotoPreview(compressedDataUrl);
      setPhotoFile(file);
    } catch (err) {
      console.error('Compression error:', err);
      alert('Could not process this image. Please try a different photo.');
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Complaint
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!complaintText.trim()) {
      alert('Please enter or dictate your complaint description.');
      return;
    }

    if (!location.trim()) {
      alert('Please select or enter a location on the map.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Triage
      const triage = triageComplaint(complaintText, selectedLanguage);

      // 2. Check for Master Issue clustering using location text AND GPS coordinates
      const allMasters = getMasterIssues();
      const complaintObj = {
        category: triage.category,
        location: location.trim(),
        coordinates: coordinates,
        complaintText: complaintText.trim(),
        matchedKeyword: triage.matchedKeyword
      };
      const matchingMaster = findMatchingMasterIssue(complaintObj, allMasters);

      // 3. Register ticket & update/create master issue
      const ticketPayload = {
        complaintText: complaintText.trim(),
        language: selectedLanguage,
        category: triage.category,
        department: triage.department,
        severity: triage.severity,
        severityReason: triage.severityReason,
        location: location.trim(),
        coordinates: coordinates,
        photo: photoPreview,
        matchedKeyword: triage.matchedKeyword,
        requiresManualReview: triage.requiresManualReview,
        citizenUserId: user?.id || null,
        citizenEmail: user?.email || null,
        citizenName: profile?.name || null
      };

      const result = registerComplaint(ticketPayload, matchingMaster);

      setSubmissionSuccess({
        ticket: result.ticket,
        masterIssueId: result.masterIssueId,
        isGrouped: Boolean(matchingMaster),
        matchedMasterTitle: matchingMaster?.title
      });

      // Reset form
      setComplaintText('');
      setPhotoPreview(null);
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onComplaintSubmitted) {
        onComplaintSubmitted(result.ticket);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Failed to submit complaint: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTicketId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Success Modal / Banner */}
      {submissionSuccess && (
        <div className="mb-8 p-6 rounded-2xl bg-teal-50 border-2 border-teal-500 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-200/70 px-2.5 py-0.5 rounded-full">
                Complaint Successfully Registered
              </span>
              <h3 className="text-xl font-bold text-navy-950 mt-1">
                Ticket Generated: <span className="font-mono text-teal-700">{submissionSuccess.ticket.id}</span>
              </h3>

              {submissionSuccess.isGrouped ? (
                <div className="mt-3 p-3.5 rounded-xl bg-white border border-teal-200 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-navy-900">
                    <Layers className="w-4 h-4 text-teal-600" />
                    <span>Community Impact Grouping Activated!</span>
                  </div>
                  <p className="text-slate-600 text-xs mt-1">
                    Your report was automatically consolidated with other reports at this vicinity under Master Issue{' '}
                    <strong className="text-teal-800">{submissionSuccess.masterIssueId}</strong>. This elevates the community priority score for expedited municipal response!
                  </p>
                </div>
              ) : (
                <p className="text-slate-600 text-sm mt-1">
                  A new Master Issue <strong className="text-navy-900">{submissionSuccess.masterIssueId}</strong> has been logged and assigned to the{' '}
                  <strong className="text-navy-900">{submissionSuccess.ticket.department}</strong>.
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => copyTicketId(submissionSuccess.ticket.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedId ? 'Copied to Clipboard!' : 'Copy Ticket ID'}
                </button>
                <button
                  type="button"
                  onClick={() => onTrackTicket(submissionSuccess.ticket.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition"
                >
                  <span>Track This Complaint</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionSuccess(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium ml-auto"
                >
                  File Another Complaint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Complaint Filing Form Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-navy-900 to-navy-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Report a Municipal Issue</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Speak or type in your language. Interactive GPS map & community impact grouping.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-navy-950/60 px-3 py-1.5 rounded-lg border border-navy-700/60 text-xs text-teal-300">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Multilingual Voice + OSM Map</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* 1. Language Selection */}
          <div>
            <label className="block text-sm font-bold text-navy-900 mb-2">
              Step 1: Choose Your Language / ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ / भाषा चुनें
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    selectedLanguage === lang.code
                      ? 'border-teal-600 bg-teal-50/70 text-navy-950 font-bold shadow-sm ring-1 ring-teal-500'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="text-sm font-semibold">{lang.native}</span>
                  <span className="text-[11px] text-slate-500">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Voice Complaint Feature & Editable Text */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="complaint-text" className="block text-sm font-bold text-navy-900">
                Step 2: Describe the Issue (Voice or Text)
              </label>
              <span className="text-xs text-slate-500">
                Dictate or type — you can edit anytime
              </span>
            </div>

            {/* Big Accessible Voice Recording Bar */}
            <div className={`p-4 rounded-xl border transition-all ${
              isListening 
                ? 'bg-red-50 border-red-300 ring-2 ring-red-400' 
                : 'bg-navy-50/50 border-navy-100'
            }`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={!speechSupported}
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md focus:outline-none focus:ring-4 focus:ring-teal-500 ${
                      !speechSupported 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : isListening
                        ? 'bg-red-600 text-white animate-mic-pulse'
                        : 'bg-teal-600 hover:bg-teal-500 text-white'
                    }`}
                    aria-label={isListening ? 'Stop listening' : 'Start voice recording'}
                  >
                    {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                  </button>

                  <div>
                    <h4 className="text-sm font-bold text-navy-950">
                      {isListening ? (
                        <span className="text-red-700 flex items-center gap-1.5 animate-pulse">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                          Listening in {LANGUAGES.find(l => l.code === selectedLanguage)?.name}...
                        </span>
                      ) : (
                        'Tap Microphone to Speak'
                      )}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {speechSupported 
                        ? 'Web Speech API records voice and writes text directly into the box.'
                        : 'Speech recognition is not supported in this browser. Please type below.'}
                    </p>
                  </div>
                </div>

                {isListening && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm"
                  >
                    Done Speaking
                  </button>
                )}
              </div>

              {/* Speech Error Display */}
              {speechError && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Microphone Notice:</p>
                    <p className="mt-0.5">{speechError}</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSpeechError(null)}
                    className="text-amber-700 hover:text-amber-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Editable Text Area */}
            <div className="relative">
              <textarea
                id="complaint-text"
                rows={4}
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Example: Deep dangerous pothole on 12th Main Road, Indiranagar. Two-wheelers skidding frequently..."
                className="w-full p-4 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 text-slate-900 text-base placeholder:text-slate-400 bg-white leading-relaxed resize-y"
              />
              {complaintText && (
                <button
                  type="button"
                  onClick={() => setComplaintText('')}
                  className="absolute top-3 right-3 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
                >
                  Clear text
                </button>
              )}
            </div>
          </div>

          {/* 3. Interactive Location Selection (OpenStreetMap + Leaflet + Nominatim) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-navy-900">
                Step 3: Incident Location & Interactive Map
              </label>
              <span className="text-xs text-slate-500">Search place, tap map, or use GPS</span>
            </div>

            <LocationPicker
              value={location}
              coordinates={coordinates}
              onChange={setLocation}
              onCoordinatesChange={setCoordinates}
            />

            {/* Quick Suggestion Chips */}
            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick Presets:</span>
              {[
                { name: 'Indiranagar 12th Main', loc: '12th Main Road, Indiranagar, Bengaluru', coords: { lat: 12.9719, lng: 77.6412 } },
                { name: 'Malleshwaram 4th Cross', loc: 'Near 4th Cross Bus Stop, 8th Main, Malleshwaram', coords: { lat: 13.0037, lng: 77.5685 } },
                { name: 'Bellandur ORR', loc: 'Outer Ring Road Service Road, Bellandur', coords: { lat: 12.9260, lng: 77.6762 } },
                { name: 'HAL 2nd Stage', loc: '100ft Road near 12th Cross, HAL 2nd Stage, Indiranagar', coords: { lat: 12.9658, lng: 77.6439 } }
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setLocation(preset.loc);
                    setCoordinates(preset.coords);
                  }}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 text-slate-700 border border-slate-200 transition"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Photo Upload with Canvas Compression */}
          <div>
            <label className="block text-sm font-bold text-navy-900 mb-2">
              Step 4: Attach Photo (Optional)
            </label>

            {!photoPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-5 text-center cursor-pointer transition bg-slate-50 hover:bg-teal-50/30"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-1 text-slate-600">
                  <Upload className="w-7 h-7 text-teal-600" />
                  <span className="text-sm font-semibold text-navy-900">
                    {isCompressingPhoto ? 'Optimizing photo...' : 'Click to Upload Image'}
                  </span>
                  <span className="text-xs text-slate-500">
                    Supports JPG, PNG (automatically resized for safe local storage)
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative inline-block border rounded-xl overflow-hidden shadow-sm bg-slate-100">
                <img
                  src={photoPreview}
                  alt="Complaint Preview"
                  className="h-44 w-auto object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 transition"
                  title="Remove uploaded photo"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="p-2 bg-white/90 backdrop-blur-sm text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Photo attached</span>
                  <span className="text-emerald-700 font-semibold">✓ Optimized</span>
                </div>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1.5">
              Note: Visual content is stored with your ticket for field inspection. Vision AI content analysis is not performed.
            </p>
          </div>

          {/* 5. Live Explainable Rule-Based Triage & Grouping Preview */}
          {triageResult && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Info className="w-4 h-4 text-teal-600" />
                  Live Triage Classification Preview
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                  Offline Rule Engine
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Detected Category:</span>
                  <strong className="text-navy-900 text-sm font-bold">{triageResult.category}</strong>
                  <span className="text-slate-500 block text-[11px] mt-1">Routed Department:</span>
                  <strong className="text-teal-800">{triageResult.department}</strong>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Assessed Severity:</span>
                  <div className="mt-1">
                    <SeverityBadge severity={triageResult.severity} />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 italic">
                    "{triageResult.severityReason}"
                  </p>
                </div>
              </div>

              {/* Master Issue Match Preview */}
              {matchedMasterIssue && (
                <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start gap-2">
                  <Layers className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Existing Issue Found in this Vicinity:</strong>
                    <p className="mt-0.5 text-slate-700">
                      Matches Master Issue <strong>{matchedMasterIssue.id}</strong> ({matchedMasterIssue.reportCount} current report{matchedMasterIssue.reportCount > 1 ? 's' : ''}). Submitting will consolidate this report and boost the community priority!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. Big Accessible Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 focus:outline-none focus:ring-4 focus:ring-teal-500 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              <span>{isSubmitting ? 'Registering Complaint...' : 'Submit Civic Complaint'}</span>
            </button>
            <p className="text-center text-xs text-slate-500 mt-2">
              Every complaint receives a verified tracking ID and is routed instantly to municipal zonal officers.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
