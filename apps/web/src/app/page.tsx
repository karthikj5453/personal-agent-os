'use client';

import { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Mic, Cpu, Database, Server, Radio, CheckCircle2, AlertTriangle } from 'lucide-react';

interface HealthData {
  status: string;
  service: string;
  environment: string;
  postgres: string;
  redis: string;
}

export default function Home() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/health`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setHealth(data);
      } catch (err: any) {
        setError(err.message || 'Failed to connect to FastAPI backend');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 p-6 md:p-10 font-sans">
      {/* Header Bar */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
              VYUHA
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              PERSONAL AGENT OS
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Observable Cognition • Code-Switched Indic Voice • Accountable Autonomy
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <div className="text-xs font-mono">
            <span className="text-slate-400">STATUS: </span>
            <span className={health?.status === 'healthy' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {loading ? 'CONNECTING...' : health?.status?.toUpperCase() || 'OFFLINE'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Card 1: System Infrastructure Status */}
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" /> Infrastructure Nodes
            </h2>
            <span className="text-xs font-mono text-slate-500">FastAPI / DB / Redis</span>
          </div>

          <div className="space-y-3">
            {/* FastAPI */}
            <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-200">FastAPI Backend</span>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-300">
                {error ? 'Unavailable' : '8000'}
              </span>
            </div>

            {/* PostgreSQL */}
            <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-slate-200">PostgreSQL DB</span>
              </div>
              <span className={`text-xs font-mono px-2 py-1 rounded ${health?.postgres === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                {health?.postgres || 'Checking...'}
              </span>
            </div>

            {/* Redis */}
            <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-slate-200">Redis Cache</span>
              </div>
              <span className={`text-xs font-mono px-2 py-1 rounded ${health?.redis === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                {health?.redis || 'Checking...'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Live Agent Swarm Topology (Pillar 1) */}
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" /> Agent Swarm Topology (Pillar 1)
            </h2>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              LangGraph Supervisor
            </span>
          </div>

          {/* Node Graph Mock Placeholder */}
          <div className="h-44 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex items-center justify-around relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
            
            {/* Orchestrator Node */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
                <Cpu className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-xs font-mono text-indigo-300 mt-2 font-semibold">Orchestrator (Ops)</span>
            </div>

            {/* Subagents */}
            <div className="relative z-10 grid grid-cols-3 gap-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  Mail
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1">Email Subagent</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  Cal
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1">Calendar</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  Research
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1">VaakEval</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Code-Switched Multilingual Voice Pipeline (Pillar 2) */}
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <Mic className="w-4 h-4 text-cyan-400" /> Indic Voice Pipeline (Pillar 2)
            </h2>
            <span className="text-xs font-mono text-cyan-400">Hindi / Telugu / En</span>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">WAKE WORD DETECTOR:</span>
              <span className="text-emerald-400">STANDBY</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">ASR ROUTER:</span>
              <span className="text-cyan-400">VaakEval Engine</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">TTS COMMS LOOP:</span>
              <span className="text-slate-300">ElevenLabs Multi-Voice</span>
            </div>
          </div>
        </div>

        {/* Card 4: Consent Ledger (Pillar 3) */}
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Accountable Consent Ledger (Pillar 3)
            </h2>
            <span className="text-xs font-mono text-amber-400">Audit Log & Gate</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 font-mono text-xs text-slate-400 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 text-slate-500">
              <span>TIMESTAMP</span>
              <span>AGENT</span>
              <span>ACTION</span>
              <span>STATUS</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">SYS_INIT</span>
              <span className="text-indigo-400">SYSTEM</span>
              <span>Repository Scaffolding initialized</span>
              <span className="text-emerald-400">VERIFIED</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
