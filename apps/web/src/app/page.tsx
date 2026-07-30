'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Radio, Send, RefreshCw, Cpu, Sun, Shield, Command, Monitor, Code, Search, Target, Sparkles, Volume2, Camera } from 'lucide-react';
import NodeGraph from '@/components/NodeGraph';
import TerminalStrip, { LogEntry } from '@/components/TerminalStrip';
import EmailInspector, { EmailItem } from '@/components/EmailInspector';
import ConsentLedger, { ConsentEntry } from '@/components/ConsentLedger';
import VoiceInput from '@/components/VoiceInput';
import WebcamFeed from '@/components/WebcamFeed';
import BootSequence from '@/components/BootSequence';
import ThreeGlobe from '@/components/ThreeGlobe';
import CommandPalette from '@/components/CommandPalette';
import VoiceOverlay from '@/components/VoiceOverlay';

interface HealthData {
  status: string;
  service: string;
  environment: string;
  postgres: string;
  redis: string;
}

interface MorningBrief {
  brief_text: string;
  urgent_email_count: number;
  pending_consent_count: number;
}

type OSMode = 'ALL' | 'CODING' | 'RESEARCH' | 'FOCUS';

export default function Home() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

  // Boot & System State
  const [booting, setBooting] = useState(true);
  const [osMode, setOsMode] = useState<OSMode>('ALL');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(true);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [morningBrief, setMorningBrief] = useState<MorningBrief | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Automatic Smooth Female Voice Speech Output
  const speakText = useCallback((text: string) => {
    if (!isVoiceOutputEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop current speech

    const cleanText = text.replace(/[*#_`]/g, '').replace(/https?:\/\/\S+/g, 'link').slice(0, 300);
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Find smooth female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v =>
      /female|zira|samantha|victoria|karen|fiona|moira|google uk english female|google us english female/i.test(v.name)
    ) || voices.find(v => v.lang.includes('en') && !/male|david|george|mark/i.test(v.name));

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.15; // Elegant, smooth female tone
    window.speechSynthesis.speak(utterance);
  }, [isVoiceOutputEnabled]);

  // Agent Execution State
  const [prompt, setPrompt] = useState('HEY Nexus');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [agentFlow, setAgentFlow] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [finalOutput, setFinalOutput] = useState<string | null>("Hey Boss. Systems are online and standing by.");

  // Email & Consent State
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [drafts, setDrafts] = useState<EmailItem[]>([]);
  const [consentEntries, setConsentEntries] = useState<ConsentEntry[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // ─── Global Keyboard Shortcuts (CTRL + SPACE) ───────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── WebSocket Setup ────────────────────────────────────
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket(`${WS_URL}/ws/agent-stream`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === 'node_activation') {
          setActiveNode(msg.payload.node);
        }
        if (msg.type === 'log_entry') {
          setLogs(prev => [...prev, msg.payload]);
        }
        if (msg.type === 'execution_complete') {
          const { final_output, agent_flow, consent_pending } = msg.payload;
          setFinalOutput(final_output);
          setAgentFlow(agent_flow || []);
          setIsProcessing(false);
          setActiveNode(null);

          if (final_output) speakText(final_output);
          if (consent_pending) fetchConsentLedger();
          fetchEmails();
        }
        if (msg.type === 'error') {
          setIsProcessing(false);
          setActiveNode(null);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWebSocket, 2000);
      };
    } catch (e) {
      setWsConnected(false);
    }
  }, [WS_URL]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      wsRef.current?.close();
    };
  }, [connectWebSocket]);

  // ─── Data Fetches ────────────────────────────────────────
  const fetchEmails = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/agent/emails`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
        setDrafts(data.drafts || []);
      }
    } catch {}
  };

  const fetchConsentLedger = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/consent/ledger`);
      if (res.ok) {
        const data = await res.json();
        setConsentEntries(data.entries || []);
        setPendingCount(data.pending || 0);
      }
    } catch {}
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/health`);
      if (res.ok) setHealth(await res.json());
    } catch {} finally {
      setHealthLoading(false);
    }
  };

  const fetchMorningBrief = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/brief?language_code=en-IN`);
      if (res.ok) {
        const data = await res.json();
        setMorningBrief(data);
        setShowBrief(true);
      }
    } catch {}
  };

  useEffect(() => {
    fetchHealth();
    fetchEmails();
    fetchConsentLedger();
    const interval = setInterval(fetchConsentLedger, 5000);
    return () => clearInterval(interval);
  }, []);

  // ─── Agent Execution ──────────────────────────────────────
  const handleExecuteQuery = async (queryToRun?: string) => {
    const targetQuery = queryToRun || prompt;
    if (!targetQuery.trim() || isProcessing) return;

    setIsProcessing(true);
    setActiveNode('Supervisor (Ops)');

    if (wsConnected && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'execute_query', query: targetQuery }));
    } else {
      try {
        const res = await fetch(`${API_URL}/api/v1/agent/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: targetQuery }),
        });
        const data = await res.json();
        setLogs(prev => [...prev, ...data.logs]);
        setFinalOutput(data.final_output);
        if (data.consent_pending) fetchConsentLedger();
        fetchEmails();
      } catch (err: any) {
        setLogs(prev => [...prev, {
          agent: 'System',
          action: 'error',
          details: err.message,
          timestamp: new Date().toLocaleTimeString(),
        }]);
      } finally {
        setIsProcessing(false);
        setActiveNode(null);
      }
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/v1/consent/approve/${id}`, { method: 'POST' });
      await fetchConsentLedger();
      await fetchEmails();
    } catch {}
  };

  const handleReject = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/v1/consent/reject/${id}`, { method: 'POST' });
      await fetchConsentLedger();
    } catch {}
  };

  // Render Boot Sequence
  if (booting) {
    return <BootSequence onComplete={() => setBooting(false)} />;
  }

  return (
    <main className="min-h-screen bg-[#05070d] text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500 selection:text-white">

      {/* Voice Overlay (Full-screen JARVIS Holographic Arc Core HUD) */}
      <VoiceOverlay
        isOpen={isVoiceOverlayOpen}
        onClose={() => setIsVoiceOverlayOpen(false)}
        isProcessing={isProcessing}
        finalOutput={finalOutput}
        onTranscript={(text) => {
          setPrompt(text);
          handleExecuteQuery(text);
        }}
      />

      {/* Command Palette Overlay (CTRL + SPACE) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectCommand={(cmd) => {
          setPrompt(cmd);
          handleExecuteQuery(cmd);
        }}
      />

      {/* Webcam Feed Modal Overlay */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <WebcamFeed apiUrl={API_URL} onClose={() => setShowCamera(false)} />
        </div>
      )}

      {/* Morning Brief Banner */}
      {showBrief && morningBrief && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className="relative bg-indigo-950/60 border border-indigo-500/30 rounded-2xl p-4 font-mono text-xs text-slate-300 shadow-xl">
            <button onClick={() => setShowBrief(false)} className="absolute top-3 right-4 text-slate-500 hover:text-slate-300">✕</button>
            <div className="text-indigo-400 font-semibold mb-2 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" /> Morning Intelligence Brief — Boss Edition
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed text-slate-300">{morningBrief.brief_text}</pre>
          </div>
        </div>
      )}

      {/* ── Header Bar ─────────────────────────────────────────── */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
              HEY Nexus
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              JARVIS AI OS v2.5
            </span>
            {wsConnected && (
              <span className="px-2.5 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> WS LIVE
              </span>
            )}
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" /> {pendingCount} CONSENT PENDING
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-1 font-mono">
            Welcome back, <span className="text-cyan-400 font-bold">Boss</span> • 5-Agent Swarm • Sarvam Indic Voice • Consent Ledger
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsVoiceOverlayOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 border border-cyan-400/50 rounded-xl text-xs font-mono font-bold text-white transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" /> 🎙 JARVIS Voice HUD
          </button>

          <button
            onClick={() => setIsVoiceOutputEnabled(!isVoiceOutputEnabled)}
            className={`px-3 py-2 border rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 ${
              isVoiceOutputEnabled
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={isVoiceOutputEnabled ? 'Voice Audio Speech ON' : 'Voice Audio Speech Muted'}
          >
            <Volume2 className={`w-3.5 h-3.5 ${isVoiceOutputEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            {isVoiceOutputEnabled ? 'Audio Speech ON' : 'Audio Muted'}
          </button>

          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="px-3 py-2 bg-indigo-950/60 border border-indigo-500/30 rounded-xl text-xs font-mono text-indigo-300 hover:border-indigo-400 transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/10"
          >
            <Command className="w-3.5 h-3.5 text-indigo-400" /> CTRL + SPACE
          </button>

          <button onClick={() => setShowCamera(!showCamera)} className="px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 hover:text-pink-400 hover:border-pink-500/30 transition-colors flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-pink-400" /> Camera Feed
          </button>

          <button onClick={fetchMorningBrief} className="px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 hover:text-yellow-400 hover:border-yellow-500/30 transition-colors flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-yellow-400" /> Morning Brief
          </button>

          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl shadow-md">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div className="text-xs font-mono">
              <span className="text-slate-400">STATUS: </span>
              <span className={health?.status === 'healthy' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {healthLoading ? 'CONNECTING...' : health?.status?.toUpperCase() || 'ONLINE'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mode Selector Bar ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto mt-4 flex items-center justify-between bg-slate-900/40 border border-slate-800/80 p-2 rounded-2xl">
        <div className="flex items-center gap-2 font-mono text-xs">
          {[
            { mode: 'ALL' as OSMode, label: '⚡ All Swarm', icon: Sparkles },
            { mode: 'CODING' as OSMode, label: '🛠 Coding Mode', icon: Code },
            { mode: 'RESEARCH' as OSMode, label: '🔬 Research Mode', icon: Search },
            { mode: 'FOCUS' as OSMode, label: '🎯 Focus Mode', icon: Target },
          ].map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setOsMode(mode)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                osMode === mode
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
        <div className="text-xs font-mono text-slate-500 hidden md:block">
          Owner: <span className="text-slate-300 font-bold">Karthik (Boss)</span>
        </div>
      </div>

      {/* ── Main Workspace Grid ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto space-y-6 mt-5">

        {/* Command Dispatcher */}
        <section className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-mono font-semibold tracking-wider text-slate-300 uppercase">
                JARVIS Command Dispatcher
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Speak "HEY Nexus" or type command for Boss
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecuteQuery()}
              placeholder="e.g. 'HEY Nexus' or 'Volume 50 percent kar do Boss'..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
            />
            <button
              onClick={() => handleExecuteQuery()}
              disabled={isProcessing}
              className={`px-6 py-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                isProcessing
                  ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/50 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95'
              }`}
            >
              {isProcessing ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> EXECUTING...</>
              ) : (
                <><Send className="w-4 h-4" /> DISPATCH</>
              )}
            </button>
          </div>

          {/* Voice Input + Presets */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <VoiceInput
              apiUrl={API_URL}
              onTranscript={(text) => {
                setPrompt(text);
                handleExecuteQuery(text);
              }}
            />
            <div className="h-5 w-px bg-slate-800" />
            {[
              { label: 'HEY Nexus Wake', q: 'HEY Nexus' },
              { label: 'Hardware Specs', q: 'Read system hardware metrics and CPU RAM usage' },
              { label: 'Urgent Inbox', q: 'Check my inbox for urgent messages' },
              { label: 'Set Volume 50%', q: 'Volume 50 percent kar do' },
              { label: 'Summarize YouTube', q: 'Summarize youtube video https://youtube.com/watch?v=dQw4w9WgXcQ' },
              { label: 'WhatsApp Msg (Gate)', q: 'Send a WhatsApp message to Rahul saying meeting is confirmed' },
              { label: 'Check My Mood', q: 'Check my mood and webcam emotion' },
              { label: 'Lock Desktop (Gate)', q: 'Lock my computer' },
            ].map(({ label, q }) => (
              <button
                key={label}
                onClick={() => { setPrompt(q); handleExecuteQuery(q); }}
                className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-slate-200 rounded-lg transition-colors text-[11px] font-mono"
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Visualizers Grid: 3D Globe + Node Graph + Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ThreeGlobe />
          <div className="lg:col-span-2">
            <NodeGraph activeNode={activeNode} agentFlow={agentFlow} isProcessing={isProcessing} />
          </div>
        </div>

        {/* Terminal Trace Log Strip */}
        <TerminalStrip logs={logs} isProcessing={isProcessing} />

        {/* Consent Ledger */}
        <ConsentLedger
          entries={consentEntries}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        {/* Orchestrator Output + Email Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2 font-mono">
                <Cpu className="w-4 h-4 text-indigo-400" /> HEY Nexus Response
              </h2>
              {finalOutput && (
                <button
                  onClick={() => speakText(finalOutput)}
                  className="px-2.5 py-1 bg-indigo-950/80 border border-indigo-500/30 hover:border-indigo-400 rounded-lg text-[10px] font-mono text-indigo-300 transition-colors flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3 text-emerald-400" /> Speak Out Loud
                </button>
              )}
            </div>
            {finalOutput ? (
              <div className="p-4 bg-slate-950/90 border border-indigo-500/30 rounded-xl font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                {finalOutput}
              </div>
            ) : (
              <div className="p-8 bg-slate-950/40 border border-slate-800/50 rounded-xl text-center text-xs font-mono text-slate-600">
                Dispatch a command to view response for Boss.
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <EmailInspector emails={emails} drafts={drafts} onRefresh={fetchEmails} />
          </div>
        </div>

      </div>
    </main>
  );
}
