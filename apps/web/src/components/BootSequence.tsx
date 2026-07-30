'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, ShieldCheck, CheckCircle2, Scan, Sparkles, UserCheck } from 'lucide-react';

interface BootSequenceProps {
  onComplete: () => void;
}

const DIAGNOSTICS = [
  { key: 'memory', label: 'Memory Engine & Vector Store', status: 'ONLINE' },
  { key: 'speech', label: 'Sarvam Indic Speech & TTS Engine', status: 'ONLINE' },
  { key: 'vision', label: 'Vision & Facial Mesh Analytics', status: 'ONLINE' },
  { key: 'coding', label: 'Coding & Terminal Agent Swarm', status: 'ONLINE' },
  { key: 'research', label: 'Research & Document Summarizer', status: 'ONLINE' },
  { key: 'whatsapp', label: 'WhatsApp & Gated Communications', status: 'ONLINE' },
  { key: 'security', label: 'Accountable Autonomy Consent Ledger', status: 'VERIFIED' },
];

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Step-by-step diagnostic sequence
    if (stepIndex < DIAGNOSTICS.length) {
      const timer = setTimeout(() => {
        setStepIndex(prev => prev + 1);
      }, 400);
      return () => clearTimeout(timer);
    } else if (!isFaceScanning && !isVerified) {
      // Start face scan HUD
      const scanTimer = setTimeout(() => {
        setIsFaceScanning(true);
      }, 300);
      return () => clearTimeout(scanTimer);
    }
  }, [stepIndex, isFaceScanning, isVerified]);

  useEffect(() => {
    if (isFaceScanning) {
      const verifyTimer = setTimeout(() => {
        setIsVerified(true);
      }, 1800);
      return () => clearTimeout(verifyTimer);
    }
  }, [isFaceScanning]);

  useEffect(() => {
    if (isVerified) {
      const unlockTimer = setTimeout(() => {
        onComplete();
      }, 1200);
      return () => clearTimeout(unlockTimer);
    }
  }, [isVerified, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#05070d] text-slate-100 flex flex-col items-center justify-center p-6 font-mono select-none">
      {/* Background Matrix/Particle Ambient Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 animate-pulse"></div>

      {/* Main Container */}
      <div className="relative z-10 max-w-xl w-full bg-slate-950/90 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center">

        {/* HEY Nexus Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 shadow-lg shadow-indigo-500/20">
            <Cpu className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
              HEY Nexus
            </h1>
            <p className="text-[10px] text-slate-500 tracking-wider uppercase mt-0.5">
              Personal Intelligence Operating System
            </p>
          </div>
        </div>

        {/* Diagnostics Checklist */}
        {!isFaceScanning && !isVerified && (
          <div className="w-full space-y-2 mb-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-inner">
            <div className="text-[11px] text-indigo-400 font-semibold mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> SYSTEM DIAGNOSTICS</span>
              <span className="text-[10px] text-slate-500">{Math.min(100, Math.round((stepIndex / DIAGNOSTICS.length) * 100))}%</span>
            </div>
            {DIAGNOSTICS.map((item, idx) => {
              const isDone = idx < stepIndex;
              const isCurrent = idx === stepIndex;
              return (
                <div key={item.key} className="flex items-center justify-between text-xs transition-opacity duration-200">
                  <div className="flex items-center gap-2">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-800 flex-shrink-0" />
                    )}
                    <span className={isDone ? 'text-slate-300' : isCurrent ? 'text-cyan-300 font-bold' : 'text-slate-600'}>
                      {item.label}
                    </span>
                  </div>
                  <span className={`text-[10px] ${isDone ? 'text-emerald-400 font-bold' : 'text-slate-600'}`}>
                    {isDone ? item.status : 'PENDING'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Holographic Face Scan HUD */}
        {(isFaceScanning || isVerified) && (
          <div className="w-full flex flex-col items-center my-4 py-6 bg-slate-900/80 border border-cyan-500/30 rounded-2xl relative overflow-hidden shadow-2xl">
            {/* Scan Laser Line Animation */}
            {!isVerified && (
              <div className="absolute inset-x-0 h-1 bg-cyan-400/80 shadow-[0_0_15px_#22d3ee] animate-[bounce_2s_infinite]" />
            )}

            <div className="relative p-6 rounded-full border-2 border-dashed border-cyan-500/40 bg-cyan-950/20 mb-4 flex items-center justify-center">
              {isVerified ? (
                <UserCheck className="w-16 h-16 text-emerald-400 animate-pulse" />
              ) : (
                <Scan className="w-16 h-16 text-cyan-400 animate-pulse" />
              )}
            </div>

            <div className="text-center">
              <div className="text-sm font-bold tracking-wider text-slate-200 uppercase">
                {isVerified ? 'Identity Verified' : 'Facial & Voice Biometrics'}
              </div>
              <div className="text-xs text-cyan-400 mt-1">
                {isVerified ? 'Welcome back, Boss.' : 'Scanning facial mesh & voiceprint...'}
              </div>
            </div>
          </div>
        )}

        {/* Boot Footer Message */}
        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>NEXUS Core • Zero-Trust Accountable OS</span>
        </div>

      </div>
    </div>
  );
}
