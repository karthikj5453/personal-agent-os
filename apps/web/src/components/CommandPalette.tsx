'use client';

import React, { useEffect, useState } from 'react';
import { Search, Command, Cpu, Mail, Sliders, Camera, Monitor, Sparkles, X } from 'lucide-react';

interface CommandItem {
  id: string;
  category: 'System' | 'Email' | 'Research' | 'Vision' | 'Modes';
  label: string;
  command: string;
  icon: any;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (query: string) => void;
}

const COMMANDS: CommandItem[] = [
  { id: '1', category: 'System', label: 'Set Volume to 50%', command: 'Volume 50 percent kar do', icon: Sliders },
  { id: '2', category: 'System', label: 'Lock Workstation Desktop (Gate)', command: 'Lock my computer', icon: Sliders },
  { id: '3', category: 'System', label: 'Launch VS Code Workspace', command: 'Open vscode', icon: Monitor },
  { id: '4', category: 'Email', label: 'Check Urgent Inbox', command: 'Check my inbox for urgent messages', icon: Mail },
  { id: '5', category: 'Email', label: 'Draft Reply to Sarah', command: 'Draft a reply to Sarah regarding Redis rate limit', icon: Mail },
  { id: '6', category: 'Research', label: 'Summarize YouTube Video', command: 'Summarize youtube video https://youtube.com/watch?v=dQw4w9WgXcQ', icon: Search },
  { id: '7', category: 'Vision', label: 'Check My Mood & Facial Emotion', command: 'Check my mood and webcam emotion', icon: Camera },
  { id: '8', category: 'Modes', label: 'Activate Coding Mode Workspace', command: 'Open vscode and launch coding mode', icon: Cpu },
];

export default function CommandPalette({ isOpen, onClose, onSelectCommand }: CommandPaletteProps) {
  const [search, setSearch] = useState('');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-950/90 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl font-mono text-slate-100">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800/80 gap-3">
          <Search className="w-5 h-5 text-indigo-400" />
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or ask HEY Nexus (e.g. 'Set volume 50%')..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
            <Command className="w-3 h-3" /> ESC to close
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching commands. Press Enter to dispatch prompt to HEY Nexus.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectCommand(item.command);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-950/40 hover:border-indigo-500/30 border border-transparent text-xs text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200 group-hover:text-cyan-300">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.category} • {item.command}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-300 font-mono">
                    ↵ Execute
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> HEY Nexus Command Palette
          </span>
          <span>Shortcut: CTRL + SPACE</span>
        </div>

      </div>
    </div>
  );
}
