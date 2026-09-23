import React, { useState } from 'react';
import {
  Check,
  X,
  FileCode,
  ArrowRight,
  Eye,
  GitCommit,
  CheckCircle2,
  XCircle,
  FilePlus,
  FileEdit,
  Trash2,
} from 'lucide-react';
import { AIProposal, AIProposedChange } from '../types';

interface AIDiffViewerProps {
  proposal: AIProposal;
  onAccept: (acceptedChanges: AIProposedChange[]) => void;
  onCancel: () => void;
}

export const AIDiffViewer: React.FC<AIDiffViewerProps> = ({
  proposal,
  onAccept,
  onCancel,
}) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [selectedChangesState, setSelectedChangesState] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    proposal.changes.forEach((c) => {
      init[c.filePath] = true;
    });
    return init;
  });

  const activeChange = proposal.changes[selectedFileIdx] || proposal.changes[0];

  const toggleFileAcceptance = (path: string) => {
    setSelectedChangesState((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleConfirm = () => {
    const accepted = proposal.changes.filter((c) => selectedChangesState[c.filePath]);
    onAccept(accepted);
  };

  // Basic diff generator splitting into lines
  const renderLineDiff = (oldText = '', newText = '') => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const maxLines = Math.max(oldLines.length, newLines.length);

    return (
      <div className="grid grid-cols-2 divide-x divide-white/10 font-mono text-[11px] leading-5 overflow-auto custom-scrollbar h-full bg-[#07090e]">
        {/* Left Column: BEFORE */}
        <div className="p-3">
          <div className="text-[10px] uppercase font-bold text-rose-400/80 mb-2 pb-1 border-b border-rose-500/20 sticky top-0 bg-[#07090e] z-10 flex items-center justify-between">
            <span>BEFORE (Current Code)</span>
            <span>{oldLines.length} lines</span>
          </div>
          <div className="space-y-0.5">
            {oldLines.map((line, i) => {
              const isDifferent = newLines[i] !== line;
              return (
                <div
                  key={'old_' + i}
                  className={`flex ${isDifferent ? 'bg-rose-500/10 text-rose-200' : 'text-slate-400'}`}
                >
                  <span className="w-8 select-none text-right pr-2 text-slate-600 shrink-0">{i + 1}</span>
                  <span className="whitespace-pre overflow-x-auto">{line || ' '}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AFTER */}
        <div className="p-3">
          <div className="text-[10px] uppercase font-bold text-emerald-400/80 mb-2 pb-1 border-b border-emerald-500/20 sticky top-0 bg-[#07090e] z-10 flex items-center justify-between">
            <span>AFTER (Proposed by NONONICK AI)</span>
            <span>{newLines.length} lines</span>
          </div>
          <div className="space-y-0.5">
            {newLines.map((line, i) => {
              const isDifferent = oldLines[i] !== line;
              return (
                <div
                  key={'new_' + i}
                  className={`flex ${isDifferent ? 'bg-emerald-500/15 text-emerald-200 font-semibold' : 'text-slate-400'}`}
                >
                  <span className="w-8 select-none text-right pr-2 text-slate-600 shrink-0">{i + 1}</span>
                  <span className="whitespace-pre overflow-x-auto">{line || ' '}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <FilePlus className="w-3.5 h-3.5 text-emerald-400" />;
      case 'delete':
        return <Trash2 className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <FileEdit className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95">
      <div className="w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl glass-dropdown border border-cyan-500/30 shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-[#0a0d16] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold text-[10px] tracking-wide uppercase border border-cyan-500/30">
                AI Change Preview & Approval
              </span>
              <span className="text-slate-400 text-xs">User Approval Required Before Applying</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{proposal.title}</h2>
            <p className="text-slate-300 text-xs mt-0.5">{proposal.explanation}</p>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Left File List + Right Code Diff */}
        <div className="flex-1 flex overflow-hidden">
          {/* Files column */}
          <div className="w-64 border-r border-white/10 bg-[#080a10] p-3 space-y-2 overflow-y-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Modified Files ({proposal.changes.length})
            </span>

            <div className="space-y-1">
              {proposal.changes.map((change, idx) => {
                const isSelected = selectedFileIdx === idx;
                const isAccepted = selectedChangesState[change.filePath];

                return (
                  <div
                    key={change.filePath}
                    onClick={() => setSelectedFileIdx(idx)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'border-cyan-400/80 bg-cyan-500/10'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getActionIcon(change.action)}
                      <div className="truncate">
                        <span className="font-mono text-[11px] text-white block truncate">
                          {change.filePath}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {change.diffSummary}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFileAcceptance(change.filePath);
                      }}
                      className={`p-1 rounded shrink-0 ${
                        isAccepted
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-white/10 text-slate-500 hover:text-slate-300'
                      }`}
                      title={isAccepted ? 'Change Included' : 'Change Skipped'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diff viewer */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#07090e]">
            {activeChange ? (
              renderLineDiff(activeChange.oldContent, activeChange.newContent)
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                No file selected
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#0a0d16] flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <GitCommit className="w-4 h-4 text-cyan-400" />
            <span>
              {Object.values(selectedChangesState).filter(Boolean).length} of {proposal.changes.length} files approved
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-medium transition cursor-pointer"
            >
              Cancel & Discard
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Approved Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
