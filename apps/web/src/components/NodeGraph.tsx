'use client';

import React from 'react';
import { Cpu, Mail, Calendar, Search, Sparkles } from 'lucide-react';

interface NodeGraphProps {
  activeNode: string | null; // e.g. "Supervisor (Ops)", "EmailSubagent", etc.
  agentFlow: string[];
  isProcessing: boolean;
}

export default function NodeGraph({ activeNode, agentFlow, isProcessing }: NodeGraphProps) {
  const isSupervisorActive = activeNode === 'Supervisor (Ops)' || isProcessing;
  const isEmailActive = activeNode === 'EmailSubagent';

  return (
    <div className="relative w-full h-[320px] bg-slate-950/80 border border-slate-800/90 rounded-xl p-6 flex flex-col justify-between overflow-hidden shadow-inner">
      {/* Background Dot Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>

      {/* Top Header Label */}
      <div className="relative z-10 flex justify-between items-center text-xs font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" /> AGENT SWARM TOPOLOGY (LANGGRAPH)
        </span>
        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px]">
          {isProcessing ? 'FLOW ACTIVE' : 'SYSTEM READY'}
        </span>
      </div>

      {/* SVG Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Connection: Supervisor -> Email Agent */}
        <line
          x1="50%"
          y1="30%"
          x2="25%"
          y2="75%"
          stroke={isEmailActive ? '#6366f1' : '#1e293b'}
          strokeWidth={isEmailActive ? '3' : '1.5'}
          strokeDasharray={isEmailActive ? '6 4' : 'none'}
          className={isEmailActive ? 'animate-pulse' : ''}
        />

        {/* Connection: Supervisor -> Calendar Agent */}
        <line
          x1="50%"
          y1="30%"
          x2="50%"
          y2="75%"
          stroke="#1e293b"
          strokeWidth="1.5"
        />

        {/* Connection: Supervisor -> Research Agent */}
        <line
          x1="50%"
          y1="30%"
          x2="75%"
          y2="75%"
          stroke="#1e293b"
          strokeWidth="1.5"
        />
      </svg>

      {/* Nodes Container */}
      <div className="relative z-10 grid grid-rows-2 h-full pt-4">
        
        {/* Level 1: Supervisor Node */}
        <div className="flex justify-center items-start">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300 backdrop-blur-md shadow-lg ${
              isSupervisorActive
                ? 'bg-indigo-950/70 border-indigo-500 text-indigo-200 ring-4 ring-indigo-500/20 shadow-indigo-500/20'
                : 'bg-slate-900/90 border-slate-800 text-slate-300'
            }`}
          >
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cpu className={`w-5 h-5 ${isSupervisorActive ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-wide">SUPERVISOR (OPS)</div>
              <div className="text-[10px] font-mono text-slate-400">Intent Parsing & Routing</div>
            </div>
          </div>
        </div>

        {/* Level 2: Subagents Nodes */}
        <div className="grid grid-cols-3 gap-4 items-end pb-2">
          
          {/* Node: Email Subagent */}
          <div className="flex flex-col items-center">
            <div
              className={`w-full max-w-[170px] p-3 rounded-xl border flex items-center gap-2.5 transition-all duration-300 ${
                isEmailActive
                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900/90 border-slate-800 text-slate-400'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${isEmailActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                <Mail className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-mono font-semibold truncate">Email Subagent</div>
                <div className="text-[9px] font-mono text-slate-500">Gmail Mock Tools</div>
              </div>
            </div>
          </div>

          {/* Node: Calendar Subagent */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[170px] p-3 rounded-xl border border-slate-800/80 bg-slate-900/50 text-slate-500 flex items-center gap-2.5 opacity-60">
              <div className="p-1.5 rounded-lg bg-slate-800/80 text-slate-600">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-mono font-semibold truncate">Calendar</div>
                <div className="text-[9px] font-mono text-slate-600">GCal Integration</div>
              </div>
            </div>
          </div>

          {/* Node: Research Subagent */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[170px] p-3 rounded-xl border border-slate-800/80 bg-slate-900/50 text-slate-500 flex items-center gap-2.5 opacity-60">
              <div className="p-1.5 rounded-lg bg-slate-800/80 text-slate-600">
                <Search className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-mono font-semibold truncate">VaakEval</div>
                <div className="text-[9px] font-mono text-slate-600">Research Agent</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
