'use client';

import React, { useEffect, useState } from 'react';
import { Radio, Play, Sparkles, Send, RefreshCw, Cpu, Server, Database, Activity } from 'lucide-react';
import NodeGraph from '@/components/NodeGraph';
import TerminalStrip, { LogEntry } from '@/components/TerminalStrip';
import EmailInspector, { EmailItem } from '@/components/EmailInspector';

interface HealthData {
  status: string;
  service: string;
  environment: string;
  postgres: string;
  redis: string;
}

export default function Home() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // Agent Execution State
  const [prompt, setPrompt] = useState('Check my inbox for urgent messages');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [agentFlow, setAgentFlow] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [finalOutput, setFinalOutput] = useState<string | null>(null);

  // Email Inbox Data
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [drafts, setDrafts] = useState<EmailItem[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Fetch Health & Emails on Load
  const fetchHealthAndEmails = async () => {
    try {
      // 1. Health
      const healthRes = await fetch(`${API_URL}/api/v1/health`);
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }

      // 2. Emails
      const emailRes = await fetch(`${API_URL}/api/v1/agent/emails`);
      if (emailRes.ok) {
        const emailData = await emailRes.json();
        setEmails(emailData.emails || []);
        setDrafts(emailData.drafts || []);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndEmails();
  }, []);

  // Execute Agent Query Flow
  const handleExecuteQuery = async (queryToRun?: string) => {
    const targetQuery = queryToRun || prompt;
    if (!targetQuery.trim() || isProcessing) return;

    setIsProcessing(true);
    setActiveNode('Supervisor (Ops)');
    setFinalOutput(null);

    try {
      const res = await fetch(`${API_URL}/api/v1/agent/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetQuery }),
      });

      if (!res.ok) throw new Error(`Agent API Error: ${res.statusText}`);

      const data = await res.json();

      // Simulate step-by-step visual node graph transitions
      setLogs((prev) => [...prev, ...data.logs]);
      setActiveNode('EmailSubagent');

      setTimeout(() => {
        setActiveNode('Supervisor (Ops)');
        setFinalOutput(data.final_output);
        setAgentFlow(data.agent_flow || []);
        setIsProcessing(false);
        fetchHealthAndEmails(); // Refresh drafts/inbox
      }, 1000);
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        {
          agent: 'Supervisor (Ops)',
          action: 'error',
          details: err.message || 'Execution error',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsProcessing(false);
      setActiveNode(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 p-4 md:p-8 font-sans">
      {/* Top Navigation Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
              VYUHA
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              MISSION CONTROL UI
            </span>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Observable Cognition • LangGraph Supervisor Swarm • Accountable Autonomy
          </p>
        </div>

        {/* System Health Status */}
        <div className="flex items-center gap-4">
          <button
            onClick={fetchHealthAndEmails}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh System Status"
          >
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

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto space-y-6 mt-6">
        
        {/* Interactive Query Prompt Bar */}
        <section className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-300 uppercase">
              Command Dispatcher
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecuteQuery()}
              placeholder="Enter voice command or prompt (e.g. Check my inbox for urgent emails)..."
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
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> EXECUTING FLOW...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> DISPATCH COMMAND
                </>
              )}
            </button>
          </div>

          {/* Quick Preset Prompts */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs font-mono">
            <span className="text-slate-500 text-[11px]">PRESETS:</span>
            <button
              onClick={() => {
                setPrompt('Check my inbox for urgent messages');
                handleExecuteQuery('Check my inbox for urgent messages');
              }}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors text-[11px]"
            >
              Check Urgent Inbox
            </button>
            <button
              onClick={() => {
                setPrompt('Draft a reply to Sarah regarding Redis rate limit');
                handleExecuteQuery('Draft a reply to Sarah regarding Redis rate limit');
              }}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors text-[11px]"
            >
              Draft Reply to Sarah
            </button>
            <button
              onClick={() => {
                setPrompt('Search emails for VaakEval benchmark results');
                handleExecuteQuery('Search emails for VaakEval benchmark results');
              }}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors text-[11px]"
            >
              Search VaakEval
            </button>
          </div>
        </section>

        {/* Live Visualizers Grid: Node Graph & Observable Cognition Log Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NodeGraph activeNode={activeNode} agentFlow={agentFlow} isProcessing={isProcessing} />
          <TerminalStrip logs={logs} isProcessing={isProcessing} />
        </div>

        {/* Final Response & Inspector Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Final Supervisor Output */}
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" /> Orchestrator Output
              </h2>
              <span className="text-xs font-mono text-slate-500">Consolidated Result</span>
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

          {/* Email Inbox & Drafts Inspector */}
          <div className="lg:col-span-2">
            <EmailInspector emails={emails} drafts={drafts} onRefresh={fetchHealthAndEmails} />
          </div>

        </div>

      </div>
    </main>
  );
}
