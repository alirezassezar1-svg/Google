import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FilePlus,
  FolderPlus,
  Download,
  Eye,
  Code,
  Sparkles,
  Layers,
  Folder,
  History,
  Smartphone,
  Maximize2,
  Trash2,
  Sliders,
} from 'lucide-react';
import { ProjectFile } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onSelectFile: (path: string) => void;
  onAction: (actionKey: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  files,
  onSelectFile,
  onAction,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const defaultCommands = [
    { id: 'new-file', title: 'New File', icon: FilePlus, group: 'Actions' },
    { id: 'new-folder', title: 'New Folder', icon: FolderPlus, group: 'Actions' },
    { id: 'export-zip', title: 'Export Full Project ZIP', icon: Download, group: 'Actions' },
    { id: 'export-single', title: 'Export Single HTML File', icon: Download, group: 'Actions' },
    { id: 'toggle-inspect', title: 'Toggle Visual Inspector', icon: Eye, group: 'Views' },
    { id: 'toggle-ai', title: 'Open NONONICK AI Assistant', icon: Sparkles, group: 'Views' },
    { id: 'toggle-assets', title: 'Open Asset & Media Manager', icon: Layers, group: 'Views' },
    { id: 'toggle-history', title: 'Open Version History', icon: History, group: 'Views' },
  ];

  // Combine commands and matched files
  const filteredCommands = defaultCommands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase())
  );

  const matchedFiles = files.filter((f) =>
    f.path.toLowerCase().includes(query.toLowerCase())
  );

  const combinedItems = [
    ...filteredCommands.map((c) => ({ type: 'command' as const, item: c })),
    ...matchedFiles.map((f) => ({ type: 'file' as const, item: f })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(combinedItems.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + combinedItems.length) % Math.max(combinedItems.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = combinedItems[selectedIndex];
      if (current) {
        if (current.type === 'command') {
          onAction(current.item.id);
        } else {
          onSelectFile(current.item.path);
        }
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl glass-dropdown border border-white/10 shadow-2xl overflow-hidden text-xs flex flex-col"
      >
        {/* Search Input Bar */}
        <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-[#090c14]">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search files... (Esc to exit)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-white/10 text-slate-400 text-[10px] font-mono">ESC</kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {combinedItems.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No commands or files match "{query}"</div>
          ) : (
            combinedItems.map((entry, idx) => {
              const isSelected = selectedIndex === idx;

              if (entry.type === 'command') {
                const cmd = entry.item;
                const Icon = cmd.icon;
                return (
                  <div
                    key={cmd.id}
                    onClick={() => {
                      onAction(cmd.id);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition ${
                      isSelected ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-cyan-400">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-xs text-white">{cmd.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">{cmd.group}</span>
                  </div>
                );
              }

              const file = entry.item;
              return (
                <div
                  key={file.path}
                  onClick={() => {
                    onSelectFile(file.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition ${
                    isSelected ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-amber-400">
                      <Folder className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-mono text-xs text-white truncate">{file.path}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono shrink-0">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-white/5 bg-[#07090e] text-[10px] text-slate-500 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span className="text-cyan-400 font-mono">NONONICK Palette</span>
        </div>
      </div>
    </div>
  );
};
