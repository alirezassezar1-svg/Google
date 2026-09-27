import React, { useState } from 'react';
import {
  Folder,
  Code2,
  Eye,
  Sliders,
  Sparkles,
  Layers,
  Database,
  Globe,
  BarChart3,
  Share2,
  Film,
  Activity,
  Zap,
  MoreHorizontal,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { ActiveModuleTab } from './EditorHeader';

export type EditorMobileTab = 'files' | 'code' | 'preview' | 'inspect' | 'ai' | 'cinema' | 'analyze' | 'automations' | 'assets';

interface MobileNavProps {
  activeTab: EditorMobileTab;
  onSelectTab: (tab: EditorMobileTab) => void;
  activeModuleTab: ActiveModuleTab;
  onSelectModuleTab: (tab: ActiveModuleTab) => void;
  hasSelectedElement: boolean;
  onOpenOrchestrator?: () => void;
  onOpenDatabase?: () => void;
  onOpenSEO?: () => void;
  onOpenAnalytics?: () => void;
  onOpenShare?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  activeModuleTab,
  onSelectModuleTab,
  hasSelectedElement,
  onOpenOrchestrator,
  onOpenDatabase,
  onOpenSEO,
  onOpenAnalytics,
  onOpenShare,
}) => {
  const [showDrawer, setShowDrawer] = useState(false);

  const primaryTabs = [
    { id: 'preview' as EditorMobileTab, label: 'Preview', icon: Eye },
    { id: 'code' as EditorMobileTab, label: 'Code', icon: Code2 },
    { id: 'inspect' as EditorMobileTab, label: 'Inspect', icon: Sliders, badge: hasSelectedElement },
    { id: 'ai' as EditorMobileTab, label: 'AI Assist', icon: Sparkles },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090b11]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1 flex items-center justify-around safe-area-pb">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition relative min-w-[48px] min-h-[44px] ${
                isActive ? 'text-cyan-400 font-semibold scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4 mb-0.5" />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-black animate-pulse" />
                )}
              </div>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* Orchestrator Quick Launch */}
        {onOpenOrchestrator && (
          <button
            onClick={onOpenOrchestrator}
            className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-purple-400 font-bold min-w-[48px] min-h-[44px]"
            title="Launch Orchestrator"
          >
            <Sparkles className="w-4 h-4 mb-0.5 animate-pulse" />
            <span className="text-[10px] tracking-tight">Orchestrate</span>
          </button>
        )}

        {/* More Modules Toggle Drawer */}
        <button
          onClick={() => setShowDrawer(!showDrawer)}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition min-w-[48px] min-h-[44px] ${
            showDrawer ? 'text-cyan-400' : 'text-slate-400'
          }`}
          title="All OS Modules"
        >
          <MoreHorizontal className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] tracking-tight">Modules</span>
        </button>
      </div>

      {/* Slide-up module selector for mobile */}
      {showDrawer && (
        <div className="md:hidden fixed inset-x-0 bottom-14 z-50 bg-[#0c101a] border-t border-white/10 p-4 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
            <span className="text-xs font-bold text-white uppercase tracking-wider">All Studio Capabilities</span>
            <button onClick={() => setShowDrawer(false)} className="text-xs text-slate-400 hover:text-white">
              Close
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs text-center">
            <button
              onClick={() => {
                onSelectModuleTab('cinema');
                setShowDrawer(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex flex-col items-center gap-1 text-slate-300"
            >
              <Film className="w-5 h-5 text-purple-400" />
              <span className="text-[10px]">Cinema</span>
            </button>

            <button
              onClick={() => {
                onSelectModuleTab('analyze');
                setShowDrawer(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex flex-col items-center gap-1 text-slate-300"
            >
              <Activity className="w-5 h-5 text-cyan-400" />
              <span className="text-[10px]">Analyze</span>
            </button>

            <button
              onClick={() => {
                onSelectModuleTab('seo');
                setShowDrawer(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex flex-col items-center gap-1 text-slate-300"
            >
              <Globe className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px]">SEO</span>
            </button>

            <button
              onClick={() => {
                onSelectModuleTab('automations');
                setShowDrawer(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex flex-col items-center gap-1 text-slate-300"
            >
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-[10px]">Automate</span>
            </button>

            <button
              onClick={() => {
                onSelectModuleTab('database');
                setShowDrawer(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex flex-col items-center gap-1 text-slate-300"
            >
              <Database className="w-5 h-5 text-cyan-400" />
              <span className="text-[10px]">Database</span>
            </button>

            <button
              onClick={() => {
                onSelectModuleTab('analytics');
                setShowDrawer(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex flex-col items-center gap-1 text-slate-300"
            >
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <span className="text-[10px]">Analytics</span>
            </button>

            <button
              onClick={() => {
                onSelectTab('files');
                onSelectModuleTab('editor');
                setShowDrawer(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex flex-col items-center gap-1 text-slate-300"
            >
              <Folder className="w-5 h-5 text-slate-400" />
              <span className="text-[10px]">Files</span>
            </button>

            {onOpenShare && (
              <button
                onClick={() => {
                  onOpenShare();
                  setShowDrawer(false);
                }}
                className="p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 flex flex-col items-center gap-1 text-cyan-300"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-[10px]">Share</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
