'use client';

import React from 'react';
import { Mail, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface EmailItem {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  is_read: boolean;
  priority: string;
  category: string;
  is_draft?: boolean;
}

interface EmailInspectorProps {
  emails: EmailItem[];
  drafts: EmailItem[];
  onRefresh?: () => void;
}

export default function EmailInspector({ emails, drafts }: EmailInspectorProps) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
          <Mail className="w-4 h-4 text-emerald-400" /> Mock Gmail Inbox Inspector
        </h2>
        <span className="text-xs font-mono text-slate-400">
          {emails.length} Messages • {drafts.length} Drafts
        </span>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {/* Render Generated Drafts First if any exist */}
        {drafts.map((draft) => (
          <div
            key={draft.id || draft.subject}
            className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col gap-1"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-amber-400 font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> DRAFT CREATED
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{draft.timestamp}</span>
            </div>
            <div className="text-xs font-semibold text-slate-200">{draft.subject}</div>
            <div className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded border border-amber-500/20 font-mono">
              {draft.body}
            </div>
          </div>
        ))}

        {/* Render Inbox Emails */}
        {emails.map((email) => {
          const isHigh = email.priority === 'high';

          return (
            <div
              key={email.id}
              className={`p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                isHigh
                  ? 'bg-rose-950/20 border-rose-900/50 text-slate-200'
                  : 'bg-slate-950/60 border-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-400 truncate max-w-[200px]">
                  From: <strong className="text-slate-200">{email.sender}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isHigh
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {email.priority.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{email.timestamp}</span>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5 mt-0.5">
                {isHigh && <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />}
                <span className="truncate">{email.subject}</span>
              </div>

              <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                {email.body}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
