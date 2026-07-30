'use client';

import React from 'react';
import { Shield, CheckCircle2, XCircle, Clock, ChevronRight, AlertTriangle } from 'lucide-react';

export interface ConsentEntry {
  id: string;
  created_at: string;
  agent: string;
  action_type: string;
  target: string;
  details: Record<string, any>;
  reasoning: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  resolved_at?: string;
}

interface ConsentLedgerProps {
  entries: ConsentEntry[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  PENDING_APPROVAL: {
    label: 'PENDING APPROVAL',
    icon: Clock,
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-400 animate-pulse',
  },
  APPROVED: {
    label: 'APPROVED & EXECUTED',
    icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
  REJECTED: {
    label: 'REJECTED',
    icon: XCircle,
    className: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    dotClass: 'bg-rose-400',
  },
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  SEND_EMAIL: '📧 Send Email',
  CALENDAR_DELETE: '🗓 Delete Calendar Event',
  FILE_WRITE: '📄 Write File',
  API_CALL: '🔌 External API Call',
};

export default function ConsentLedger({ entries, onApprove, onReject, isLoading }: ConsentLedgerProps) {
  const pending = entries.filter(e => e.status === 'PENDING_APPROVAL');
  const resolved = entries.filter(e => e.status !== 'PENDING_APPROVAL');

  return (
    <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-semibold tracking-wider text-slate-200 uppercase">
            Consent Ledger (Pillar 3: Accountable Autonomy)
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          {pending.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg">
              <AlertTriangle className="w-3 h-3" />
              {pending.length} PENDING
            </span>
          )}
          <span className="text-slate-500">{entries.length} total entries</span>
        </div>
      </div>

      {entries.length === 0 && !isLoading && (
        <div className="py-10 flex flex-col items-center justify-center text-slate-600 font-mono text-xs gap-2">
          <Shield className="w-8 h-8 text-slate-700" />
          <span>No consent entries yet.</span>
          <span className="text-slate-700">Irreversible actions will appear here for approval.</span>
        </div>
      )}

      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {/* Pending entries first — they need action */}
        {pending.map(entry => {
          const config = STATUS_CONFIG[entry.status];
          const StatusIcon = config.icon;
          return (
            <div
              key={entry.id}
              className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-xl shadow-inner"
            >
              {/* Action header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${config.className}`}>
                    {config.label}
                  </span>
                  <span className="text-xs font-mono text-slate-300 font-semibold">
                    {ACTION_TYPE_LABELS[entry.action_type] || entry.action_type}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(entry.created_at).toLocaleTimeString()}
                </span>
              </div>

              {/* Target */}
              <div className="flex items-center gap-2 text-xs font-mono mb-3">
                <span className="text-slate-400">Target:</span>
                <span className="text-slate-200 font-semibold">{entry.target}</span>
                <span className="text-[10px] text-slate-500">by {entry.agent}</span>
              </div>

              {/* Details preview */}
              {entry.details?.body && (
                <div className="bg-slate-950/80 border border-slate-800/60 rounded-lg p-3 mb-3 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-20 overflow-y-auto">
                  {entry.details.body}
                </div>
              )}

              {/* AI Reasoning */}
              <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3 mb-4">
                <div className="text-[10px] font-mono text-indigo-400 font-semibold mb-1 uppercase tracking-wider">
                  AI Reasoning
                </div>
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  {entry.reasoning}
                </div>
              </div>

              {/* Consent ID */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-600">
                  ID: <span className="text-slate-500">{entry.id}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onReject(entry.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 border border-rose-500/30 text-rose-400 text-[11px] font-mono font-bold rounded-lg hover:bg-rose-900/50 transition-all active:scale-95"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    REJECT
                  </button>
                  <button
                    onClick={() => onApprove(entry.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600/80 border border-emerald-500 text-white text-[11px] font-mono font-bold rounded-lg hover:bg-emerald-500 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    APPROVE & EXECUTE
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Resolved History */}
        {resolved.length > 0 && (
          <div className="mt-2">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 px-1">
              Audit History
            </div>
            {resolved.map(entry => {
              const config = STATUS_CONFIG[entry.status];
              return (
                <div
                  key={entry.id}
                  className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl mb-2 flex items-center justify-between opacity-70"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                    <span className="text-xs font-mono text-slate-400">
                      {ACTION_TYPE_LABELS[entry.action_type] || entry.action_type}
                    </span>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span className="text-xs font-mono text-slate-400">{entry.target}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${config.className}`}>
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
