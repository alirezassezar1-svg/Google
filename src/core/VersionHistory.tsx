import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  Plus,
  Clock,
  CheckCircle,
  FileCode,
  Calendar,
  X,
  AlertTriangle,
} from 'lucide-react';
import { VersionSnapshot, ProjectFile } from '../types';

interface VersionHistoryProps {
  versions: VersionSnapshot[];
  onRestoreVersion: (version: VersionSnapshot) => void;
  onCreateSnapshot: (label: string, description?: string) => void;
  onClose: () => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  onRestoreVersion,
  onCreateSnapshot,
  onClose,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionSnapshot | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<VersionSnapshot | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    onCreateSnapshot(newLabel.trim());
    setNewLabel('');
    setIsCreating(false);
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col glass-panel rounded-xl overflow-hidden border border-white/5 text-xs">
      {/* Top Header */}
      <div className="p-3 border-b border-white/5 bg-[#090c14] flex items-center justify-between">
        <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-cyan-400" />
          Version History ({versions.length})
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Create Snapshot</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline Create Snapshot Form */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-3 border-b border-cyan-500/20 bg-cyan-500/5 space-y-2">
          <span className="text-[10px] text-cyan-300 font-semibold block">Create Version Milestone</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              placeholder="e.g. Hero section redesign complete"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="flex-1 bg-[#0c101a] border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 cursor-pointer"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-2 py-1.5 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {versions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <Clock className="w-10 h-10 text-slate-600 mb-2" />
            <p>No saved snapshots yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Snapshots are automatically created before major AI revisions or manually created anytime.
            </p>
          </div>
        ) : (
          versions.map((ver, idx) => {
            const isLatest = idx === 0;
            return (
              <div
                key={ver.id}
                onClick={() => setSelectedVersion(ver)}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                  selectedVersion?.id === ver.id
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    {ver.label}
                    {isLatest && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                        CURRENT
                      </span>
                    )}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmRestore(ver);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
                    title="Rollback to this snapshot"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Rollback</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{formatTimestamp(ver.timestamp)}</span>
                  <span>{ver.files.length} files tracked</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rollback Confirmation Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl glass-dropdown p-5 border border-white/10 shadow-2xl text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Restore Version?</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to restore <strong>"{confirmRestore.label}"</strong>? All project files will rollback to this exact state.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmRestore(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRestoreVersion(confirmRestore);
                  setConfirmRestore(null);
                }}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
              >
                Yes, Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
