'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Radio, Send, RefreshCw, Cpu, Sun, Shield } from 'lucide-react';
import NodeGraph from '@/components/NodeGraph';
import TerminalStrip, { LogEntry } from '@/components/TerminalStrip';
import EmailInspector, { EmailItem } from '@/components/EmailInspector';
import ConsentLedger, { ConsentEntry } from '@/components/ConsentLedger';
import VoiceInput from '@/components/VoiceInput';
import WebcamFeed from '@/components/WebcamFeed';
import { Camera } from 'lucide-react';

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

export default function Home() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

  // System State
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [morningBrief, setMorningBrief] = useState<MorningBrief | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Agent Execution State
  const [prompt, setPrompt] = useState('Check my inbox for urgent messages');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [agentFlow, setAgentFlow] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [finalOutput, setFinalOutput] = useState<string | null>(null);

  // Email State
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [drafts, setDrafts] = useState<EmailItem[]>([]);

  // Consent Ledger State
  const [consentEntries, setConsentEntries] = useState<ConsentEntry[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

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
          const { final_output, agent_flow, email_context, consent_pending } = msg.payload;
          setFinalOutput(final_output);
          setAgentFlow(agent_flow || []);
          setIsProcessing(false);
          setActiveNode(null);

          // Refresh consent ledger if a gate was created
          if (consent_pending) {
            fetchConsentLedger();
          }
          fetchEmails();
        }
        if (msg.type === 'error') {
          setIsProcessing(false);
          setActiveNode(null);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Reconnect after 2s
        setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = () => {
        ws.close();
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
    // Poll consent ledger every 5s for live pending gate updates
    const interval = setInterval(fetchConsentLedger, 5000);
    return () => clearInterval(interval);
  }, []);

  // ─── Agent Execution ──────────────────────────────────────
  const handleExecuteQuery = async (queryToRun?: string) => {
    const targetQuery = queryToRun || prompt;
    if (!targetQuery.trim() || isProcessing) return;

    setIsProcessing(true);
    setActiveNode('Supervisor (Ops)');
    setFinalOutput(null);

    if (wsConnected && wsRef.current?.readyState === WebSocket.OPEN) {
      // Stream via WebSocket for live node graph animation
      wsRef.current.send(JSON.stringify({ type: 'execute_query', query: targetQuery }));
    } else {
      // Fallback to REST API
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

  // ─── Consent Actions ──────────────────────────────────────
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

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 p-4 md:p-8 font-sans">

      {/* Morning Brief Banner */}
      {showBrief && morningBrief && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className="relative bg-indigo-950/60 border border-indigo-500/30 rounded-2xl p-4 font-mono text-xs text-slate-300 shadow-xl">
            <button onClick={() => setShowBrief(false)} className="absolute top-3 right-4 text-slate-500 hover:text-slate-300">✕</button>
            <div className="text-indigo-400 font-semibold mb-2 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" /> Morning Intelligence Brief
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed text-slate-300">{morningBrief.brief_text}</pre>
          </div>
        </div>
      )}

      {/* Webcam Feed Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <WebcamFeed apiUrl={API_URL} onClose={() => setShowCamera(false)} />
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
              NEXUS
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              MISSION CONTROL v2.0
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
          <p className="text-slate-400 text-xs mt-1">
            LangGraph Swarm • Sarvam Indic Voice • Consent Ledger • Morning Brief
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setShowCamera(!showCamera)} className="px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 hover:text-pink-400 hover:border-pink-500/30 transition-colors flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-pink-400" /> Camera Feed
          </button>
          <button onClick={fetchMorningBrief} className="px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 hover:text-yellow-400 hover:border-yellow-500/30 transition-colors flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-yellow-400" /> Morning Brief
          </button>
          <button onClick={() => { fetchHealth(); fetchEmails(); fetchConsentLedger(); }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
            <RefreshCw className="w-4 h-4" />
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

      {/* ── Main Grid ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto space-y-6 mt-6">

        {/* Command Dispatcher */}
        <section className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-300 uppercase">
              Command Dispatcher
            </span>
            <span className="text-[10px] font-mono text-slate-500 ml-2">
              Type or use Push-to-Talk (Hindi / Telugu / Tamil / Kannada / English)
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecuteQuery()}
              placeholder="e.g. 'Mera inbox check karo' or 'Draft a reply to Sarah'..."
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

        {/* Live Visualizers: Node Graph + Terminal Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NodeGraph activeNode={activeNode} agentFlow={agentFlow} isProcessing={isProcessing} />
          <TerminalStrip logs={logs} isProcessing={isProcessing} />
        </div>

        {/* Consent Ledger */}
        <ConsentLedger
          entries={consentEntries}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        {/* Bottom Row: Orchestrator Output + Email Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" /> Orchestrator Output
              </h2>
            </div>
            {finalOutput ? (
              <div className="p-4 bg-slate-950/90 border border-indigo-500/30 rounded-xl font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                {finalOutput}
              </div>
            ) : (
              <div className="p-8 bg-slate-950/40 border border-slate-800/50 rounded-xl text-center text-xs font-mono text-slate-600">
                Dispatch a query to view consolidated response.
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
