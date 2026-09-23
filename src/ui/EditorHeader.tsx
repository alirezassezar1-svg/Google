import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  Share2,
  Play,
  RotateCcw,
  RotateCw,
  Sparkles,
  Command,
  Check,
  Save,
  HardDrive,
  FileCode,
  Layers,
  History,
  Eye,
  Columns2,
  ChevronDown,
} from 'lucide-react';
import { Project } from '../types';
import { exportProjectAsZip, exportSingleBundledHtml, exportSingleFile } from '../utils/zip';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

export type DesktopLayoutMode = 'split' | 'code' | 'preview';

interface EditorHeaderProps {
  project: Project;
  onBackToDashboard: () => void;
  onOpenCommandPalette: () => void;
  onOpenVersionHistory: () => void;
  onOpenAssets: () => void;
  onOpenAIAssistant: () => void;
  layoutMode: DesktopLayoutMode;
  onChangeLayoutMode: (mode: DesktopLayoutMode) => void;
  isSaving: boolean;
  onRenameProject: (name: string) => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  project,
  onBackToDashboard,
  onOpenCommandPalette,
  onOpenVersionHistory,
  onOpenAssets,
  onOpenAIAssistant,
  layoutMode,
  onChangeLayoutMode,
  isSaving,
  onRenameProject,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(project.name);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleValue.trim()) {
      onRenameProject(titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const activeFile =
    project.files.find((f) => f.path === project.activeFilePath) || project.files[0];

  return (
    <header className="h-13 bg-[#080a10]/90 backdrop-blur-xl border-b border-white/5 px-3 sm:px-4 flex items-center justify-between text-xs select-none z-30">
      {/* Left: Back & Project Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
          title="Back to Projects Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit}>
              <input
                type="text"
                autoFocus
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                className="bg-[#121622] border border-cyan-400/50 rounded px-2 py-0.5 text-xs text-white outline-none font-semibold"
              />
            </form>
          ) : (
            <span
              onClick={() => setIsEditingTitle(true)}
              className="font-bold text-white text-sm tracking-tight hover:text-cyan-300 cursor-pointer truncate max-w-[180px] sm:max-w-xs"
              title="Click to rename project"
            >
              {project.name}
            </span>
          )}

          {/* Auto-save status indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-400 font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
            <span>{isSaving ? 'Saving...' : 'Saved'}</span>
          </div>
        </div>
      </div>

      {/* Center: Desktop Layout Switcher (Split, Code Only, Preview Only) */}
      <div className="hidden md:flex items-center gap-1 bg-[#050609] p-0.5 rounded-xl border border-white/5">
        <button
          onClick={() => onChangeLayoutMode('code')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition ${
            layoutMode === 'code' ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
          title="Code Editor Only"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Code</span>
        </button>

        <button
          onClick={() => onChangeLayoutMode('split')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition ${
            layoutMode === 'split' ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
          title="Split View (Code & Visual Preview)"
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span>Split</span>
        </button>

        <button
          onClick={() => onChangeLayoutMode('preview')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition ${
            layoutMode === 'preview' ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
          title="Visual Website & Live Preview Only"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview</span>
        </button>
      </div>

      {/* Right: Quick Tools & Export */}
      <div className="flex items-center gap-2">
        {/* Command Palette shortcut button */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 text-xs transition"
          title="Open Command Palette (Cmd + K)"
        >
          <Command className="w-3 h-3 text-cyan-400" />
          <span className="font-mono text-[10px]">⌘K</span>
        </button>

        <button
          onClick={onOpenAssets}
          className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition"
          title="Media & Assets"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Assets</span>
        </button>

        <button
          onClick={onOpenVersionHistory}
          className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition"
          title="Version History"
        >
          <History className="w-3.5 h-3.5 text-purple-400" />
          <span>History</span>
        </button>

        <button
          onClick={onOpenAIAssistant}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-purple-600/15 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI Assist</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {showExportMenu && (
            <div
              onClick={() => setShowExportMenu(false)}
              className="absolute right-0 top-9 w-56 rounded-xl glass-dropdown p-1.5 shadow-2xl border border-white/10 text-xs z-50 animate-in fade-in"
            >
              <button
                onClick={() => exportProjectAsZip(project)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition text-left"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <div>
                  <span className="font-semibold block">Full Project ZIP</span>
                  <span className="text-[10px] text-slate-400 block">All folders, styles & scripts</span>
                </div>
              </button>

              <button
                onClick={() => exportSingleBundledHtml(project)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition text-left"
              >
                <FileCode className="w-3.5 h-3.5 text-purple-400" />
                <div>
                  <span className="font-semibold block">Standalone HTML</span>
                  <span className="text-[10px] text-slate-400 block">Single inlined file</span>
                </div>
              </button>

              {activeFile && (
                <button
                  onClick={() => exportSingleFile(activeFile)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition text-left"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <span className="font-semibold block">Download {activeFile.name}</span>
                    <span className="text-[10px] text-slate-400 block">Current active file</span>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        <PWAInstallButton compact />
      </div>
    </header>
  );
};
