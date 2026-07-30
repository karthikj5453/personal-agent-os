'use client';

import React from 'react';
import { Cpu, Mail, Sliders, Search, MessageSquare, Camera, Sparkles } from 'lucide-react';

interface NodeGraphProps {
  activeNode: string | null;
  agentFlow: string[];
  isProcessing: boolean;
}

export default function NodeGraph({ activeNode, isProcessing }: NodeGraphProps) {
  const isSupervisorActive = activeNode === 'Supervisor (Ops)' || isProcessing;
  const isEmailActive = activeNode === 'EmailSubagent';
  const isSystemActive = activeNode === 'SystemSubagent';
  const isResearchActive = activeNode === 'ResearchSubagent';
  const isWhatsAppActive = activeNode === 'WhatsAppSubagent';
  const isVisionActive = activeNode === 'VisionSubagent';

  return (
    <div className="relative w-full h-[320px] bg-slate-950/80 border border-slate-800/90 rounded-xl p-5 flex flex-col justify-between overflow-hidden shadow-inner">
      {/* Background Dot Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>

      {/* Top Header Label */}
      <div className="relative z-10 flex justify-between items-center text-xs font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" /> 5-AGENT SWARM TOPOLOGY (LANGGRAPH)
        </span>
        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px]">
          {isProcessing ? 'FLOW ACTIVE' : 'SYSTEM READY'}
        </span>
      </div>

      {/* SVG Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {/* Supervisor -> Email */}
        <line x1="50%" y1="30%" x2="10%" y2="75%" stroke={isEmailActive ? '#10b981' : '#1e293b'} strokeWidth={isEmailActive ? '3' : '1.5'} strokeDasharray={isEmailActive ? '6 4' : 'none'} className={isEmailActive ? 'animate-pulse' : ''} />
        {/* Supervisor -> System */}
        <line x1="50%" y1="30%" x2="30%" y2="75%" stroke={isSystemActive ? '#06b6d4' : '#1e293b'} strokeWidth={isSystemActive ? '3' : '1.5'} strokeDasharray={isSystemActive ? '6 4' : 'none'} className={isSystemActive ? 'animate-pulse' : ''} />
        {/* Supervisor -> Research */}
        <line x1="50%" y1="30%" x2="50%" y2="75%" stroke={isResearchActive ? '#8b5cf6' : '#1e293b'} strokeWidth={isResearchActive ? '3' : '1.5'} strokeDasharray={isResearchActive ? '6 4' : 'none'} className={isResearchActive ? 'animate-pulse' : ''} />
        {/* Supervisor -> WhatsApp */}
        <line x1="50%" y1="30%" x2="70%" y2="75%" stroke={isWhatsAppActive ? '#f59e0b' : '#1e293b'} strokeWidth={isWhatsAppActive ? '3' : '1.5'} strokeDasharray={isWhatsAppActive ? '6 4' : 'none'} className={isWhatsAppActive ? 'animate-pulse' : ''} />
        {/* Supervisor -> Vision */}
        <line x1="50%" y1="30%" x2="90%" y2="75%" stroke={isVisionActive ? '#ec4899' : '#1e293b'} strokeWidth={isVisionActive ? '3' : '1.5'} strokeDasharray={isVisionActive ? '6 4' : 'none'} className={isVisionActive ? 'animate-pulse' : ''} />
      </svg>

      {/* Nodes Container */}
      <div className="relative z-10 grid grid-rows-2 h-full pt-3">
        
        {/* Level 1: Supervisor Node */}
        <div className="flex justify-center items-start">
          <div
            className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-300 backdrop-blur-md shadow-lg ${
              isSupervisorActive
                ? 'bg-indigo-950/70 border-indigo-500 text-indigo-200 ring-4 ring-indigo-500/20 shadow-indigo-500/20'
                : 'bg-slate-900/90 border-slate-800 text-slate-300'
            }`}
          >
            <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cpu className={`w-5 h-5 ${isSupervisorActive ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-wide">SUPERVISOR (OPS)</div>
              <div className="text-[10px] font-mono text-slate-400">GPT-4o-mini Swarm Router</div>
            </div>
          </div>
        </div>

        {/* Level 2: 5 Subagent Nodes */}
        <div className="grid grid-cols-5 gap-2 items-end pb-2">
          
          {/* Node 1: Email */}
          <div className="flex flex-col items-center">
            <div className={`w-full p-2 rounded-xl border flex items-center gap-1.5 transition-all ${isEmailActive ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/30' : 'bg-slate-900/90 border-slate-800 text-slate-400'}`}>
              <Mail className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <div className="overflow-hidden">
                <div className="text-[10px] font-mono font-semibold truncate">Email</div>
                <div className="text-[8px] font-mono text-slate-500">Inbox</div>
              </div>
            </div>
          </div>

          {/* Node 2: System */}
          <div className="flex flex-col items-center">
            <div className={`w-full p-2 rounded-xl border flex items-center gap-1.5 transition-all ${isSystemActive ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/30' : 'bg-slate-900/90 border-slate-800 text-slate-400'}`}>
              <Sliders className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <div className="overflow-hidden">
                <div className="text-[10px] font-mono font-semibold truncate">System</div>
                <div className="text-[8px] font-mono text-slate-500">Vol/Apps</div>
              </div>
            </div>
          </div>

          {/* Node 3: Research (YouTube & PDF) */}
          <div className="flex flex-col items-center">
            <div className={`w-full p-2 rounded-xl border flex items-center gap-1.5 transition-all ${isResearchActive ? 'bg-violet-950/70 border-violet-500 text-violet-200 ring-2 ring-violet-500/30' : 'bg-slate-900/90 border-slate-800 text-slate-400'}`}>
              <Search className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
              <div className="overflow-hidden">
                <div className="text-[10px] font-mono font-semibold truncate">Research</div>
                <div className="text-[8px] font-mono text-slate-500">YT & PDF</div>
              </div>
            </div>
          </div>

          {/* Node 4: WhatsApp */}
          <div className="flex flex-col items-center">
            <div className={`w-full p-2 rounded-xl border flex items-center gap-1.5 transition-all ${isWhatsAppActive ? 'bg-amber-950/70 border-amber-500 text-amber-200 ring-2 ring-amber-500/30' : 'bg-slate-900/90 border-slate-800 text-slate-400'}`}>
              <MessageSquare className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <div className="overflow-hidden">
                <div className="text-[10px] font-mono font-semibold truncate">WhatsApp</div>
                <div className="text-[8px] font-mono text-slate-500">Gated</div>
              </div>
            </div>
          </div>

          {/* Node 5: Vision / Mood */}
          <div className="flex flex-col items-center">
            <div className={`w-full p-2 rounded-xl border flex items-center gap-1.5 transition-all ${isVisionActive ? 'bg-pink-950/70 border-pink-500 text-pink-200 ring-2 ring-pink-500/30' : 'bg-slate-900/90 border-slate-800 text-slate-400'}`}>
              <Camera className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
              <div className="overflow-hidden">
                <div className="text-[10px] font-mono font-semibold truncate">Vision</div>
                <div className="text-[8px] font-mono text-slate-500">Mood AI</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
