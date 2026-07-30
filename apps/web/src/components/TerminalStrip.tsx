'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal, Shield, CheckCircle } from 'lucide-react';

export interface LogEntry {
  agent: string;
  action: string;
  details: string;
  timestamp: string;
  requires_consent?: boolean;
}

interface TerminalStripProps {
  logs: LogEntry[];
  isProcessing: boolean;
}

export default function TerminalStrip({ logs, isProcessing }: TerminalStripProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-4 font-mono text-xs shadow-xl flex flex-col h-[320px]">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider">
            Observable Cognition Log Stream (Pillar 1)
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-500">LIVE FEED</span>
        </div>
      </div>

      {/* Log Output Console */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 italic">
            Waiting for agent execution prompt...
          </div>
        ) : (
          logs.map((log, index) => {
            const isSupervisor = log.agent.includes('Supervisor');
            const isEmail = log.agent.includes('Email');

            return (
              <div
                key={index}
                className="p-2 rounded bg-slate-900/60 border border-slate-800/50 flex flex-col gap-1 transition-all"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">[{log.timestamp}]</span>
                    <span
                      className={`font-semibold px-1.5 py-0.5 rounded ${
                        isSupervisor
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : isEmail
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {log.agent}
                    </span>
                    <span className="text-slate-400 font-mono">:: {log.action}</span>
                  </div>

                  {log.requires_consent && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      <Shield className="w-3 h-3" /> CONSENT GATE
                    </span>
                  )}
                </div>

                <div className="text-slate-300 pl-2 border-l-2 border-slate-800 text-[11px] leading-relaxed">
                  {log.details}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
