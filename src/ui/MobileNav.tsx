import React from 'react';
import {
  Folder,
  Code2,
  Eye,
  Sliders,
  Sparkles,
  Layers,
  LayoutGrid,
} from 'lucide-react';

export type EditorMobileTab = 'files' | 'code' | 'preview' | 'inspect' | 'ai' | 'assets';

interface MobileNavProps {
  activeTab: EditorMobileTab;
  onSelectTab: (tab: EditorMobileTab) => void;
  hasSelectedElement: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  hasSelectedElement,
}) => {
  const tabs = [
    { id: 'files' as EditorMobileTab, label: 'Files', icon: Folder },
    { id: 'code' as EditorMobileTab, label: 'Code', icon: Code2 },
    { id: 'preview' as EditorMobileTab, label: 'Preview', icon: Eye },
    { id: 'inspect' as EditorMobileTab, label: 'Design', icon: Sliders, badge: hasSelectedElement },
    { id: 'ai' as EditorMobileTab, label: 'AI Assist', icon: Sparkles },
    { id: 'assets' as EditorMobileTab, label: 'Assets', icon: Layers },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090b11]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1 flex items-center justify-around safe-area-pb">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition relative min-w-[50px] min-h-[44px] ${
              isActive
                ? 'text-cyan-400 font-semibold scale-105'
                : 'text-slate-400 hover:text-slate-200'
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
    </div>
  );
};
