import React, { useState } from 'react';
import {
  Type,
  Palette,
  Layout,
  Maximize,
  Sliders,
  Sparkles,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  Smartphone,
  Tablet,
  Monitor,
  Layers,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
} from 'lucide-react';
import { SelectedElementInfo } from '../types';

interface ElementInspectorProps {
  element: SelectedElementInfo | null;
  onClose: () => void;
  onApplyStyle: (property: string, value: string) => void;
  onUpdateText: (newText: string) => void;
  onDeleteElement: () => void;
  onDuplicateElement: () => void;
  onMoveElement: (direction: 'up' | 'down') => void;
  onAskAIAboutElement: (instruction: string) => void;
}

export const ElementInspector: React.FC<ElementInspectorProps> = ({
  element,
  onClose,
  onApplyStyle,
  onUpdateText,
  onDeleteElement,
  onDuplicateElement,
  onMoveElement,
  onAskAIAboutElement,
}) => {
  const [activeTab, setActiveTab] = useState<'style' | 'content' | 'layout' | 'effects'>('style');
  const [responsiveBreakpoint, setResponsiveBreakpoint] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [aiPromptInput, setAiPromptInput] = useState('');

  if (!element) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 glass-panel rounded-xl border border-white/5">
        <Sliders className="w-10 h-10 text-slate-600 mb-3" />
        <p className="text-xs font-medium">Click any element in the live preview to inspect and visually style it</p>
      </div>
    );
  }

  const styles = element.styles || {};

  const handleColorChange = (prop: string, val: string) => {
    onApplyStyle(prop, val);
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptInput.trim()) return;
    onAskAIAboutElement(aiPromptInput);
    setAiPromptInput('');
  };

  return (
    <div className="h-full flex flex-col glass-panel rounded-xl overflow-hidden border border-white/5 select-none text-xs">
      {/* Top Header */}
      <div className="p-3 border-b border-white/5 bg-[#090c14] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold uppercase text-[11px]">
            {element.tagName}
          </span>
          <span className="text-slate-400 font-mono truncate max-w-[140px] text-[10px]">
            {element.id ? `#${element.id}` : element.className ? `.${element.className.split(' ')[0]}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onDuplicateElement}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
            title="Duplicate Element"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveElement('up')}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
            title="Move Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveElement('down')}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
            title="Move Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDeleteElement}
            className="p-1 rounded hover:bg-rose-500/20 text-rose-400"
            title="Delete Element"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Responsive Breakpoint Switcher */}
      <div className="px-3 py-1.5 border-b border-white/5 bg-[#07090e] flex items-center justify-between text-[11px] text-slate-400">
        <span>Target:</span>
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded">
          <button
            onClick={() => setResponsiveBreakpoint('desktop')}
            className={`p-1 rounded ${responsiveBreakpoint === 'desktop' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:text-white'}`}
            title="Desktop (>1024px)"
          >
            <Monitor className="w-3 h-3" />
          </button>
          <button
            onClick={() => setResponsiveBreakpoint('tablet')}
            className={`p-1 rounded ${responsiveBreakpoint === 'tablet' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:text-white'}`}
            title="Tablet (768px-1024px)"
          >
            <Tablet className="w-3 h-3" />
          </button>
          <button
            onClick={() => setResponsiveBreakpoint('mobile')}
            className={`p-1 rounded ${responsiveBreakpoint === 'mobile' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:text-white'}`}
            title="Mobile (<768px)"
          >
            <Smartphone className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-[#090c14] text-[11px] font-medium">
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-2 text-center transition border-b-2 ${
            activeTab === 'style'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Style & Color
        </button>
        <button
          onClick={() => setActiveTab('layout')}
          className={`flex-1 py-2 text-center transition border-b-2 ${
            activeTab === 'layout'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Layout
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-2 text-center transition border-b-2 ${
            activeTab === 'content'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab('effects')}
          className={`flex-1 py-2 text-center transition border-b-2 ${
            activeTab === 'effects'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          FX & AI
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {/* TAB 1: STYLE & COLOR */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            {/* Colors */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Palette className="w-3 h-3 text-cyan-400" />
                Colors & Fill
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block mb-1">Text Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      defaultValue="#ffffff"
                      onChange={(e) => handleColorChange('color', e.target.value)}
                      className="w-6 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-slate-300">{styles.color || 'Inherit'}</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block mb-1">Background</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      defaultValue="#090b11"
                      onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                      className="w-6 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-slate-300">{styles.backgroundColor || 'None'}</span>
                  </div>
                </div>
              </div>

              {/* Glassmorphism Presets */}
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 block mb-1.5">Glass Presets</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => {
                      onApplyStyle('backgroundColor', 'rgba(255, 255, 255, 0.05)');
                      onApplyStyle('backdropFilter', 'blur(16px)');
                      onApplyStyle('border', '1px solid rgba(255, 255, 255, 0.1)');
                    }}
                    className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400/50 bg-white/5 text-[10px] text-slate-300 transition"
                  >
                    Frost Glass
                  </button>
                  <button
                    onClick={() => {
                      onApplyStyle('backgroundColor', 'rgba(0, 229, 255, 0.1)');
                      onApplyStyle('backdropFilter', 'blur(20px)');
                      onApplyStyle('border', '1px solid rgba(0, 229, 255, 0.3)');
                    }}
                    className="p-1.5 rounded-lg border border-cyan-500/20 hover:border-cyan-400/50 bg-cyan-500/10 text-[10px] text-cyan-300 transition"
                  >
                    Cyan Aura
                  </button>
                  <button
                    onClick={() => {
                      onApplyStyle('backgroundColor', 'rgba(139, 92, 246, 0.1)');
                      onApplyStyle('backdropFilter', 'blur(20px)');
                      onApplyStyle('border', '1px solid rgba(139, 92, 246, 0.3)');
                    }}
                    className="p-1.5 rounded-lg border border-purple-500/20 hover:border-purple-400/50 bg-purple-500/10 text-[10px] text-purple-300 transition"
                  >
                    Purple Nebula
                  </button>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Type className="w-3 h-3 text-cyan-400" />
                Typography
              </span>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Font Size</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="range"
                      min="10"
                      max="72"
                      defaultValue={parseInt(styles.fontSize || '16')}
                      onChange={(e) => onApplyStyle('fontSize', `${e.target.value}px`)}
                      className="w-20 accent-cyan-400 h-1 bg-white/10 rounded cursor-pointer"
                    />
                    <span className="font-mono text-[10px] w-8 text-right text-cyan-400">{styles.fontSize || '16px'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Font Weight</span>
                  <select
                    defaultValue={styles.fontWeight || '400'}
                    onChange={(e) => onApplyStyle('fontWeight', e.target.value)}
                    className="bg-[#121622] border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none"
                  >
                    <option value="300">Light (300)</option>
                    <option value="400">Regular (400)</option>
                    <option value="600">SemiBold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">ExtraBold (800)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Alignment</span>
                  <div className="flex gap-1 bg-white/5 p-0.5 rounded">
                    {['left', 'center', 'right', 'justify'].map((align) => (
                      <button
                        key={align}
                        onClick={() => onApplyStyle('textAlign', align)}
                        className={`px-2 py-0.5 rounded text-[10px] capitalize ${
                          styles.textAlign === align ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {align[0].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Borders & Radius */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Border & Radius</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Corner Radius</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="range"
                      min="0"
                      max="60"
                      defaultValue={parseInt(styles.borderRadius || '0')}
                      onChange={(e) => onApplyStyle('borderRadius', `${e.target.value}px`)}
                      className="w-20 accent-cyan-400 h-1 bg-white/10 rounded cursor-pointer"
                    />
                    <span className="font-mono text-[10px] w-8 text-right text-cyan-400">{styles.borderRadius || '0px'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Border Width</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="range"
                      min="0"
                      max="8"
                      defaultValue={parseInt(styles.borderWidth || '0')}
                      onChange={(e) => {
                        onApplyStyle('borderWidth', `${e.target.value}px`);
                        onApplyStyle('borderStyle', 'solid');
                      }}
                      className="w-20 accent-cyan-400 h-1 bg-white/10 rounded cursor-pointer"
                    />
                    <span className="font-mono text-[10px] w-8 text-right text-cyan-400">{styles.borderWidth || '0px'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LAYOUT */}
        {activeTab === 'layout' && (
          <div className="space-y-4">
            {/* Dimensions */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Maximize className="w-3 h-3 text-cyan-400" />
                Dimensions
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block mb-1">Width</span>
                  <input
                    type="text"
                    defaultValue={styles.width || 'auto'}
                    onBlur={(e) => onApplyStyle('width', e.target.value)}
                    className="w-full bg-[#121622] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                  />
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block mb-1">Height</span>
                  <input
                    type="text"
                    defaultValue={styles.height || 'auto'}
                    onBlur={(e) => onApplyStyle('height', e.target.value)}
                    className="w-full bg-[#121622] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Display / Flex */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layout className="w-3 h-3 text-cyan-400" />
                Display & Flex
              </span>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Display Mode</span>
                  <select
                    defaultValue={styles.display || 'block'}
                    onChange={(e) => onApplyStyle('display', e.target.value)}
                    className="bg-[#121622] border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none"
                  >
                    <option value="block">block</option>
                    <option value="flex">flex</option>
                    <option value="grid">grid</option>
                    <option value="inline-block">inline-block</option>
                    <option value="none">none</option>
                  </select>
                </div>

                {styles.display === 'flex' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Direction</span>
                      <div className="flex gap-1 bg-white/5 p-0.5 rounded">
                        <button
                          onClick={() => onApplyStyle('flexDirection', 'row')}
                          className="px-2 py-0.5 rounded text-[10px] hover:text-white"
                        >
                          Row
                        </button>
                        <button
                          onClick={() => onApplyStyle('flexDirection', 'column')}
                          className="px-2 py-0.5 rounded text-[10px] hover:text-white"
                        >
                          Col
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Justify Content</span>
                      <select
                        defaultValue={styles.justifyContent || 'flex-start'}
                        onChange={(e) => onApplyStyle('justifyContent', e.target.value)}
                        className="bg-[#121622] border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none"
                      >
                        <option value="flex-start">start</option>
                        <option value="center">center</option>
                        <option value="space-between">space-between</option>
                        <option value="flex-end">end</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Spacing (Padding & Margin) */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Box Spacing</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block mb-1">Padding</span>
                  <input
                    type="text"
                    defaultValue={styles.padding || '0px'}
                    onBlur={(e) => onApplyStyle('padding', e.target.value)}
                    className="w-full bg-[#121622] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                  />
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block mb-1">Margin</span>
                  <input
                    type="text"
                    defaultValue={styles.margin || '0px'}
                    onBlur={(e) => onApplyStyle('margin', e.target.value)}
                    className="w-full bg-[#121622] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONTENT */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inline Text</span>
              <textarea
                rows={4}
                defaultValue={element.innerText || ''}
                onBlur={(e) => onUpdateText(e.target.value)}
                placeholder="Edit text content..."
                className="w-full bg-[#121622] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-400 resize-none font-sans"
              />
              <p className="text-[10px] text-slate-500">Changes apply directly to DOM and save to project files.</p>
            </div>

            {element.tagName === 'IMG' && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-cyan-400" />
                  Image Source
                </span>
                <input
                  type="text"
                  placeholder="https://... or assets/image.png"
                  onBlur={(e) => onApplyStyle('src', e.target.value)}
                  className="w-full bg-[#121622] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EFFECTS & AI */}
        {activeTab === 'effects' && (
          <div className="space-y-4">
            {/* Natural Language Visual AI */}
            <div className="p-3 rounded-xl bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20 space-y-2.5">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Visual Transformer</span>
              </div>
              <p className="text-[11px] text-slate-400">Describe what you want this element to look like:</p>
              <form onSubmit={handleAiSubmit} className="space-y-2">
                <input
                  type="text"
                  placeholder='e.g. "Make button neon cyan with glowing hover"'
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  className="w-full bg-[#0d1017] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-md shadow-cyan-500/20 transition cursor-pointer"
                >
                  Transform with NONONICK AI
                </button>
              </form>
            </div>

            {/* Quick Shadows */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shadow Presets</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onApplyStyle('boxShadow', '0 0 25px rgba(0, 242, 254, 0.4)')}
                  className="p-2 rounded-lg border border-white/10 hover:border-cyan-400 bg-white/5 text-[11px] text-cyan-300"
                >
                  Cyan Glow
                </button>
                <button
                  onClick={() => onApplyStyle('boxShadow', '0 0 25px rgba(139, 92, 246, 0.4)')}
                  className="p-2 rounded-lg border border-white/10 hover:border-purple-400 bg-white/5 text-[11px] text-purple-300"
                >
                  Purple Glow
                </button>
                <button
                  onClick={() => onApplyStyle('boxShadow', '0 20px 40px -15px rgba(0,0,0,0.7)')}
                  className="p-2 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 text-[11px] text-slate-300"
                >
                  Deep Drop
                </button>
                <button
                  onClick={() => onApplyStyle('boxShadow', 'none')}
                  className="p-2 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 text-[11px] text-slate-400"
                >
                  Clear Shadow
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
