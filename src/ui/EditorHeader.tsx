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
  Loader2,
  Database,
  Globe,
  BarChart3,
  User,
  Flame,
  Zap,
  Activity,
  Film,
} from 'lucide-react';
import { Project, ActiveModuleTab } from '../types';
import { exportProjectAsZip, exportSingleBundledHtml, exportSingleFile } from '../utils/zip';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { UserProfile } from '../firebase/config';

export type { ActiveModuleTab };
export type DesktopLayoutMode = 'split' | 'code' | 'preview';

interface EditorHeaderProps {
  project: Project;
  onBackToDashboard: () => void;
  onOpenCommandPalette: () => void;
  onOpenVersionHistory: () => void;
  onOpenAssets: () => void;
  onOpenAIAssistant: () => void;
  onOpenDatabase: () => void;
  onOpenSEO: () => void;
  onOpenAnalytics: () => void;
  onOpenAutomations?: () => void;
  onOpenAnalyze?: () => void;
  onOpenCinema?: () => void;
  onOpenShare?: () => void;
  onOpenAuth?: () => void;
  currentUser?: UserProfile | null;
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
  onOpenDatabase,
  onOpenSEO,
  onOpenAnalytics,
  onOpenAutomations,
  onOpenAnalyze,
  onOpenCinema,
  onOpenShare,
  onOpenAuth,
  currentUser,
  layoutMode,
  onChangeLayoutMode,
  isSaving,
  onRenameProject,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(project.name);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

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
          className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition"
          title="Media & Assets"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Assets</span>
        </button>

        <button
          onClick={onOpenDatabase}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/20 transition cursor-pointer"
          title="Open Database Studio & Collections"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Database</span>
        </button>

        <button
          onClick={onOpenSEO}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/20 transition cursor-pointer"
          title="Open SEO Suite & Meta Manager"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>SEO</span>
        </button>

        <button
          onClick={onOpenAnalytics}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/20 transition cursor-pointer"
          title="Open Analytics, Core Web Vitals & Telemetry"
        >
          <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          <span>Analytics</span>
        </button>

        {onOpenAutomations && (
          <button
            onClick={onOpenAutomations}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/20 transition cursor-pointer"
            title="Open Automation Engine"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Automate</span>
          </button>
        )}

        {onOpenAnalyze && (
          <button
            onClick={onOpenAnalyze}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/20 transition cursor-pointer"
            title="Open Website Code Analyzer"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Analyze</span>
          </button>
        )}

        {onOpenCinema && (
          <button
            onClick={onOpenCinema}
            className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/20 transition cursor-pointer"
            title="Open Cinema & Creative Scene Engine"
          >
            <Film className="w-3.5 h-3.5 text-purple-400" />
            <span>Cinema</span>
          </button>
        )}

        <button
          onClick={onOpenVersionHistory}
          className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition"
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

        {onOpenShare && (
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
            title="اشتراک‌گذاری و لینک عمومی / Share Public Live Link"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">لینک عمومی (Share)</span>
            <span className="sm:hidden">عمومی</span>
          </button>
        )}

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer ${
              exportSuccess
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                : isExporting
                ? 'bg-cyan-600/80 text-white cursor-wait'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20'
            }`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : exportSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Exported!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </>
            )}
          </button>

          {showExportMenu && (
            <div
              onClick={() => setShowExportMenu(false)}
              className="absolute right-0 top-9 w-60 rounded-xl glass-dropdown p-1.5 shadow-2xl border border-white/10 text-xs z-50 animate-in fade-in"
            >
              <button
                onClick={handleExportZip}
                disabled={isExporting}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition text-left"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-semibold block">Full Project ZIP</span>
                  <span className="text-[10px] text-slate-400 block">Compress all HTML, CSS, JS & assets</span>
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

              <a
                href="/api/download-app-source-zip"
                download="nononick-editor-source.zip"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-cyan-500/10 text-cyan-300 hover:text-cyan-200 transition text-left"
              >
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <div>
                  <span className="font-semibold block">App Source ZIP (سورس کامل)</span>
                  <span className="text-[10px] text-slate-400 block">Complete studio repository</span>
                </div>
              </a>

              {onOpenShare && (
                <button
                  onClick={onOpenShare}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-cyan-500/10 text-cyan-300 hover:text-cyan-200 transition text-left"
                >
                  <Share2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <div>
                    <span className="font-semibold block">لینک عمومی و اشتراک (Public URL)</span>
                    <span className="text-[10px] text-slate-400 block">Copy & share live app link</span>
                  </div>
                </button>
              )}

              <div className="my-1 border-t border-white/5"></div>

              <button
                onClick={onOpenDatabase}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-cyan-500/10 text-cyan-300 hover:text-cyan-200 transition text-left"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-semibold block">Database Studio</span>
                  <span className="text-[10px] text-slate-400 block">Manage collections, schemas & REST API</span>
                </div>
              </button>

              <button
                onClick={onOpenSEO}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-emerald-500/10 text-emerald-300 hover:text-emerald-200 transition text-left"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold block">SEO & Meta Studio</span>
                  <span className="text-[10px] text-slate-400 block">SERP preview, audit & sitemap</span>
                </div>
              </button>

              <div className="my-1 border-t border-white/5"></div>

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

        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              currentUser
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            title={currentUser ? `Logged in: ${currentUser.email || currentUser.displayName}` : 'Sign in with Firebase'}
          >
            <Flame className={`w-3.5 h-3.5 ${currentUser ? 'text-orange-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">
              {currentUser ? (currentUser.displayName?.split(' ')[0] || 'Account') : 'Sign In'}
            </span>
          </button>
        )}

        <PWAInstallButton compact />
      </div>
    </header>
  );
};
