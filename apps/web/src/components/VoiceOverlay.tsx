'use client';

import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Sparkles, X, Volume2, Shield } from 'lucide-react';

interface VoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
  isProcessing: boolean;
  finalOutput: string | null;
}

export default function VoiceOverlay({
  isOpen,
  onClose,
  onTranscript,
  isProcessing,
  finalOutput
}: VoiceOverlayProps) {
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setLiveTranscript(current);

        if (event.results[event.results.length - 1].isFinal) {
          onTranscript(current);
          setLiveTranscript('');
        }
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      setRecognition(rec);
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setLiveTranscript('');
      recognition.start();
      setIsListening(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl p-6 font-mono select-none animate-in fade-in duration-300">
      
      {/* Top Header Bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-xs tracking-widest uppercase text-slate-400">
            JARVIS Holographic Voice HUD • Boss Edition
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 3D Holographic AI Arc Core Orb Display */}
      <div className="relative flex items-center justify-center my-12">
        {/* Outer Pulsing Rings */}
        <div className={`absolute w-80 h-80 rounded-full border border-cyan-500/30 transition-all duration-700 ${isListening ? 'animate-ping scale-110 opacity-40' : ''}`} />
        <div className={`absolute w-96 h-96 rounded-full border border-indigo-500/20 transition-all duration-1000 ${isListening ? 'animate-spin opacity-60' : 'opacity-20'}`} />
        <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-cyan-500/20 via-indigo-600/30 to-purple-600/20 blur-2xl animate-pulse" />

        {/* Center Glowing AI Core */}
        <button
          onClick={toggleListening}
          className={`relative z-10 w-48 h-48 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-2xl ${
            isListening
              ? 'bg-gradient-to-b from-cyan-950/80 to-indigo-950/90 border-cyan-400 shadow-cyan-500/50 scale-105'
              : isProcessing
              ? 'bg-gradient-to-b from-indigo-950 to-purple-950 border-purple-400 shadow-purple-500/40 animate-pulse'
              : 'bg-slate-950/90 border-indigo-500/40 hover:border-cyan-400 hover:scale-105 shadow-indigo-500/20'
          }`}
        >
          <div className="relative">
            {isListening ? (
              <Mic className="w-12 h-12 text-cyan-400 animate-pulse" />
            ) : isProcessing ? (
              <Sparkles className="w-12 h-12 text-purple-400 animate-spin" />
            ) : (
              <MicOff className="w-12 h-12 text-slate-400" />
            )}
          </div>
          <span className="mt-3 text-[10px] uppercase font-bold tracking-widest text-slate-300">
            {isListening ? 'LISTENING TO BOSS...' : isProcessing ? 'PROCESSING...' : 'TAP CORE TO SPEAK'}
          </span>
        </button>
      </div>

      {/* Live Audio Wave Visualizer Simulation */}
      {isListening && (
        <div className="flex items-center gap-1.5 h-10 mb-6">
          {[40, 70, 30, 90, 50, 80, 60, 100, 40, 85, 55, 75, 45].map((height, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-cyan-500 to-indigo-400 rounded-full animate-pulse"
              style={{
                height: `${height}%`,
                animationDelay: `${i * 0.08}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Live Transcript / Output Screen */}
      <div className="w-full max-w-2xl bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl text-center space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold flex items-center justify-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          {isListening ? 'Live Speech Recognition' : 'HEY Nexus Response'}
        </div>

        <div className="min-h-[60px] flex items-center justify-center">
          {liveTranscript ? (
            <p className="text-base text-cyan-300 font-medium tracking-wide">
              "{liveTranscript}"
            </p>
          ) : finalOutput ? (
            <p className="text-sm text-slate-200 leading-relaxed font-mono">
              {finalOutput}
            </p>
          ) : (
            <p className="text-xs text-slate-600">
              Speak out loud or tap the glowing core to start talking with HEY Nexus.
            </p>
          )}
        </div>
      </div>

      {/* Footer Instruction */}
      <div className="mt-8 text-[11px] text-slate-500">
        Say <span className="text-cyan-400 font-bold">"HEY Nexus"</span> • Response will be spoken back out loud to Boss
      </div>

    </div>
  );
}
