import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  Share2,
  Sparkles,
  Command,
  Check,
  Save,
  FileCode,
  Layers,
  History,
  Eye,
  Columns2,
  ChevronDown,
  Loader2,
  Database,
  Globe,
  BarChart3,
  Film,
  Activity,
  Zap,
  ShieldCheck,
  PackageCheck,
  Sliders,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { Project } from '../types';
import { exportProjectAsZip, exportSingleBundledHtml, exportSingleFile } from '../utils/zip';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

export type DesktopLayoutMode = 'split' | 'code' | 'preview';
export type ActiveModuleTab =
  | 'home'
  | 'editor'
  | 'cinema'
  | 'analyze'
  | 'seo'
  | 'analytics'
  | 'automations'
  | 'database'
  | 'assets'
  | 'ai';

interface EditorHeaderProps {
  project: Project;
  activeModuleTab: ActiveModuleTab;
  onSelectModuleTab: (tab: ActiveModuleTab) => void;
  onBackToDashboard: () => void;
  onOpenCommandPalette: () => void;
  onOpenVersionHistory: () => void;
  onOpenAssets: () => void;
  onOpenAIAssistant: () => void;
  onOpenDatabase: () => void;
  onOpenSEO: () => void;
  onOpenAnalytics: () => void;
  onOpenShare?: () => void;
  onOpenOrchestrator: () => void;
  onOpenQualityGate: () => void;
  onOpenDeliveryContract: () => void;
  layoutMode: DesktopLayoutMode;
  onChangeLayoutMode: (mode: DesktopLayoutMode) => void;
  isSaving: boolean;
  onRenameProject: (name: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  undoCount?: number;
  redoCount?: number;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  project,
  activeModuleTab,
  onSelectModuleTab,
  onBackToDashboard,
  onOpenCommandPalette,
  onOpenVersionHistory,
  onOpenAssets,
  onOpenAIAssistant,
  onOpenDatabase,
  onOpenSEO,
  onOpenAnalytics,
  onOpenShare,
  onOpenOrchestrator,
  onOpenQualityGate,
  onOpenDeliveryContract,
  layoutMode,
  onChangeLayoutMode,
  isSaving,
  onRenameProject,
  canUndo = false,
  canRedo = false,
  undoCount = 0,
  redoCount = 0,
  onUndo,
  onRedo,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(project.name);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showMoreNav, setShowMoreNav] = useState(false);

  const handleExportZip = async () => {
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      await exportProjectAsZip(project);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to export project ZIP:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleValue.trim()) {
      onRenameProject(titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const navLinks: Array<{ id: ActiveModuleTab; label: string; badge?: string }> = [
    { id: 'editor', label: 'Editor' },
    { id: 'ai', label: 'AI Hub & Integrations', badge: 'AI' },
    { id: 'cinema', label: 'Cinema' },
    { id: 'analyze', label: 'Analyze' },
    { id: 'seo', label: 'SEO' },
    { id: 'automations', label: 'Automations' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'database', label: 'Database' },
  ];

  const qaStatus = project.qa?.overallStatus || 'READY';
  const qaScore = project.qa?.overallScore || 94;

  return (
    <header className="h-14 bg-[#07090e]/95 backdrop-blur-xl border-b border-white/5 px-3 sm:px-5 flex items-center justify-between text-xs select-none z-30 shrink-0">
      {/* Zone 1: Single text element wordmark / Brand, Project Title & Undo/Redo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 text-white hover:text-cyan-300 font-extrabold text-sm tracking-tight transition cursor-pointer"
          title="NONONICK AI STUDIO Operating System Dashboard"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-400">
            NONONICK
          </span>
          <span className="text-[10px] font-mono text-cyan-400/90 font-semibold uppercase tracking-wider ml-1">
            STUDIO
          </span>
        </button>

        <span className="text-slate-600 hidden sm:inline">/</span>

        {/* Project Title */}
        <div className="hidden sm:flex items-center gap-2">
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
              className="font-semibold text-slate-300 text-xs hover:text-white cursor-pointer truncate max-w-[120px] md:max-w-[180px]"
              title="Click to rename project"
            >
              {project.name}
            </span>
          )}

          {/* Auto-save indicator */}
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSaving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
            }`}
            title={isSaving ? 'Auto-saving...' : 'All changes saved locally'}
          />
        </div>

        {/* Undo / Redo (دکمه‌های قبل و بعد / واگرد و بازانجام) */}
        <div className="flex items-center gap-0.5 bg-[#0e1320] border border-white/10 rounded-lg p-0.5 shadow-sm">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition select-none cursor-pointer ${
              canUndo
                ? 'hover:bg-white/10 text-slate-200 hover:text-cyan-300 font-semibold'
                : 'opacity-30 cursor-not-allowed text-slate-500 font-normal'
            }`}
            title="قبل / واگرد (Undo - Ctrl+Z)"
            aria-label="قبل / واگرد"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[11px]">قبل</span>
            {undoCount > 0 && (
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold hidden sm:inline leading-none">
                {undoCount}
              </span>
            )}
          </button>

          <div className="w-px h-3.5 bg-white/10 mx-0.5" />

          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition select-none cursor-pointer ${
              canRedo
                ? 'hover:bg-white/10 text-slate-200 hover:text-purple-300 font-semibold'
                : 'opacity-30 cursor-not-allowed text-slate-500 font-normal'
            }`}
            title="بعد / بازانجام (Redo - Ctrl+Y)"
            aria-label="بعد / بازانجام"
          >
            <span className="text-[11px]">بعد</span>
            <RotateCw className="w-3.5 h-3.5" />
            {redoCount > 0 && (
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold hidden sm:inline leading-none">
                {redoCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Zone 2: Navigation Links (Clean text links with active indicator) */}
      <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
        {navLinks.map((link) => {
          const isActive = activeModuleTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onSelectModuleTab(link.id)}
              className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-300 border border-cyan-400/30 font-bold uppercase leading-none">
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Actions (Orchestrator, QA Gate, Export, Share) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quality Gate Status Indicator */}
        <button
          onClick={onOpenQualityGate}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition cursor-pointer ${
            qaStatus === 'READY'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
          }`}
          title="Open 10-Point Quality Gate"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-bold">{qaStatus}</span>
          <span className="text-[10px] text-slate-400">({qaScore}%)</span>
        </button>

        {/* Universal Orchestrator Trigger (Primary Operating System Brain) */}
        <button
          onClick={onOpenOrchestrator}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          title="Universal Task Orchestrator (Cmd + K)"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline">Orchestrate</span>
          <span className="sm:hidden">AI</span>
          <span className="hidden md:inline font-mono text-[10px] bg-black/40 px-1 rounded text-cyan-400">⌘K</span>
        </button>

        {/* If in Editor mode, show Split/Code/Preview Layout Switcher */}
        {activeModuleTab === 'editor' && (
          <div className="hidden xl:flex items-center gap-0.5 bg-[#050609] p-0.5 rounded-lg border border-white/5">
            <button
              onClick={() => onChangeLayoutMode('code')}
              className={`p-1.5 rounded transition ${
                layoutMode === 'code' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Code View Only"
            >
              <FileCode className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeLayoutMode('split')}
              className={`p-1.5 rounded transition ${
                layoutMode === 'split' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Split View"
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeLayoutMode('preview')}
              className={`p-1.5 rounded transition ${
                layoutMode === 'preview' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Live Preview Only"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Share Button */}
        {onOpenShare && (
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs transition cursor-pointer"
            title="Public Share Link"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Share</span>
          </button>
        )}

        {/* Export / Ship Menu */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : exportSuccess ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{exportSuccess ? 'Exported' : 'Ship / Export'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#0c101a] border border-white/10 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in">
              <button
                onClick={handleExportZip}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 rounded-lg transition flex items-center justify-between"
              >
                <span>Clean Project ZIP</span>
                <span className="font-mono text-[10px] text-slate-500">.zip</span>
              </button>

              <button
                onClick={() => {
                  setShowExportMenu(false);
                  exportSingleBundledHtml(project);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 rounded-lg transition flex items-center justify-between"
              >
                <span>Single-File HTML Bundle</span>
                <span className="font-mono text-[10px] text-slate-500">.html</span>
              </button>

              <div className="h-px bg-white/5 my-1" />

              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onOpenDeliveryContract();
                }}
                className="w-full text-left px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition flex items-center gap-1.5 font-semibold"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>View Delivery Report</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
