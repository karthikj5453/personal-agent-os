'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Loader2, Globe, Radio } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string, languageCode: string) => void;
  apiUrl: string;
}

const LANGUAGE_OPTIONS = [
  { code: 'hi-IN', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'te-IN', label: 'తెలుగు', flag: '🏛' },
  { code: 'ta-IN', label: 'தமிழ்', flag: '🕌' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ', flag: '🏯' },
  { code: 'en-IN', label: 'English', flag: '🇬🇧' },
];

const WAKE_WORDS = ['nexus', 'hey nexus', 'hi nexus', 'arey nexus', 'अरे nexus'];

export default function VoiceInput({ onTranscript, apiUrl }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const wakeRecognitionRef = useRef<any>(null);

  const selectedOption = LANGUAGE_OPTIONS.find(l => l.code === selectedLang) || LANGUAGE_OPTIONS[0];

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    cancelAnimationFrame(animFrameRef.current);
    setIsRecording(false);
    setIsProcessing(true);
    setStatusText('Transcribing via Sarvam Saarika...');

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      audioChunksRef.current = [];

      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        const res = await fetch(
          `${apiUrl}/api/v1/voice/transcribe?language_code=${selectedLang}`,
          { method: 'POST', body: formData }
        );

        if (!res.ok) throw new Error('Transcription API error');
        const data = await res.json();
        const transcript = data.transcript || '';
        const mode = data.mode || 'live';

        setStatusText(mode === 'mock' ? '(mock) ' + transcript : transcript);
        onTranscript(transcript, selectedLang);
      } catch (err) {
        setStatusText('Transcription failed. Type query manually.');
      } finally {
        setIsProcessing(false);
      }
    };
  }, [apiUrl, selectedLang, onTranscript]);

  const startRecording = useCallback(async () => {
    try {
      setStatusText('Listening...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyzerRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const animate = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg);
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(100);
      setIsRecording(true);

      // Auto stop recording after 5s if hands-free
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 5000);
    } catch (err) {
      setStatusText('Microphone access denied.');
    }
  }, [stopRecording]);

  // Hands-Free Wake-Word Listener ("Hey Nexus")
  useEffect(() => {
    if (!isWakeWordActive) {
      if (wakeRecognitionRef.current) wakeRecognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatusText('Browser Web Speech API unavailable for wake-word.');
      setIsWakeWordActive(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    wakeRecognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().strip ? event.results[i][0].transcript.toLowerCase().strip() : event.results[i][0].transcript.toLowerCase();
        if (WAKE_WORDS.some(w => transcript.includes(w))) {
          setStatusText('🎙 Wake Word "Hey Nexus" Detected!');
          if (!isRecording && !isProcessing) {
            startRecording();
          }
        }
      }
    };

    recognition.onerror = () => {};
    recognition.onend = () => {
      if (isWakeWordActive) recognition.start();
    };

    try {
      recognition.start();
      setStatusText('Listening for "Hey Nexus"...');
    } catch {}

    return () => {
      try { recognition.stop(); } catch {}
    };
  }, [isWakeWordActive, isRecording, isProcessing, startRecording]);

  const handleToggle = () => {
    if (isProcessing) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const ringScale = isRecording ? 1 + (audioLevel / 512) : 1;

  return (
    <div className="flex items-center gap-3">
      {/* Language Picker */}
      <div className="relative">
        <button
          onClick={() => setShowLangPicker(!showLangPicker)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 hover:border-slate-600 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{selectedOption.flag} {selectedOption.label}</span>
        </button>

        {showLangPicker && (
          <div className="absolute top-10 left-0 z-50 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl py-1 min-w-[140px]">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { setSelectedLang(lang.code); setShowLangPicker(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono transition-colors hover:bg-slate-900 ${
                  selectedLang === lang.code ? 'text-cyan-400' : 'text-slate-300'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hands-Free Wake-Word Toggle ("Hey Nexus") */}
      <button
        onClick={() => setIsWakeWordActive(!isWakeWordActive)}
        title={isWakeWordActive ? 'Disable Wake Word' : 'Enable Wake Word ("Hey Nexus")'}
        className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-mono transition-all ${
          isWakeWordActive
            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/30'
            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
        }`}
      >
        <Radio className={`w-3.5 h-3.5 ${isWakeWordActive ? 'animate-pulse text-emerald-400' : 'text-slate-500'}`} />
        <span>{isWakeWordActive ? '"Hey Nexus" ON' : 'Wake Word'}</span>
      </button>

      {/* Push-to-Talk Mic Button */}
      <div className="relative flex items-center justify-center">
        {isRecording && (
          <span
            className="absolute inset-0 rounded-full bg-red-500/20 border-2 border-red-500/50 transition-transform duration-100"
            style={{ transform: `scale(${ringScale})` }}
          />
        )}
        <button
          onClick={handleToggle}
          disabled={isProcessing}
          title={isRecording ? `Stop Recording (${selectedOption.label})` : `Push to Talk (${selectedOption.label})`}
          className={`relative z-10 p-3 rounded-full border transition-all duration-200 shadow-lg ${
            isRecording
              ? 'bg-red-600 border-red-500 text-white shadow-red-600/30 scale-110'
              : isProcessing
              ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-wait'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-indigo-900/40 hover:border-indigo-500 hover:text-indigo-300'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Status Text */}
      {statusText && (
        <div className="text-xs font-mono text-slate-400 max-w-[220px] truncate">
          {isRecording && <span className="text-red-400 mr-1">●</span>}
          {isProcessing && <span className="text-cyan-400 mr-1">◎</span>}
          {statusText}
        </div>
      )}
    </div>
  );
}
