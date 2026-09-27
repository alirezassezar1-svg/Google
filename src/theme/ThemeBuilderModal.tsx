import React, { useState, useEffect, useMemo } from 'react';
import {
  Palette,
  Type,
  Maximize2,
  Sliders,
  Code2,
  Sparkles,
  Check,
  Copy,
  Plus,
  Trash2,
  RotateCcw,
  Download,
  X,
  Eye,
  FileCode,
  Layers,
  ArrowRight,
  Sun,
  Moon,
  Search,
} from 'lucide-react';
import { Project, CSSVariableItem, CSSVariableCategory, ProjectThemeConfig } from '../types';
import { THEME_PRESETS, ThemePreset } from './presets';
import {
  extractCssVariables,
  generateRootCssBlock,
  applyVariablesToCssContent,
  ensureGoogleFontsAndCssInHtml,
  generateTailwindThemeExtension,
} from './cssVariableParser';

interface ThemeBuilderModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onApplyTheme: (updatedProject: Project) => void;
  onBroadcastVariables?: (variables: CSSVariableItem[]) => void;
}

export const FONT_OPTIONS = [
  { name: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Modern Clean)', group: 'Sans' },
  { name: 'Inter', label: 'Inter (System Standard)', group: 'Sans' },
  { name: 'Outfit', label: 'Outfit (Futuristic Geometric)', group: 'Sans' },
  { name: 'Poppins', label: 'Poppins (Friendly Geometric)', group: 'Sans' },
  { name: 'Roboto', label: 'Roboto (Neutral Neo-Grotesque)', group: 'Sans' },
  { name: 'Vazirmatn', label: 'Vazirmatn (وزیرمتن فارسی / عالی)', group: 'Persian / RTL' },
  { name: 'Playfair Display', label: 'Playfair Display (Luxury Editorial Serif)', group: 'Serif' },
  { name: 'Space Grotesk', label: 'Space Grotesk (Brutalist Tech)', group: 'Display' },
  { name: 'Fira Code', label: 'Fira Code (Developer Monospace)', group: 'Mono' },
  { name: 'system-ui, -apple-system, sans-serif', label: 'System Native (No Webfont)', group: 'Native' },
];

export const QUICK_SWATCHES = [
  '#00f2fe',
  '#7928ca',
  '#a855f7',
  '#ec4899',
  '#10b981',
  '#06b6d4',
  '#f59e0b',
  '#f43f5e',
  '#0284c7',
  '#6366f1',
  '#d4af37',
  '#ffffff',
  '#090b11',
  '#111827',
];

export const ThemeBuilderModal: React.FC<ThemeBuilderModalProps> = ({
  project,
  isOpen,
  onClose,
  onApplyTheme,
  onBroadcastVariables,
}) => {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing' | 'presets' | 'custom'>('colors');
  const [variables, setVariables] = useState<CSSVariableItem[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('cyber-cyan');
  const [liveSync, setLiveSync] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New custom variable form
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [newVarCategory, setNewVarCategory] = useState<CSSVariableCategory>('colors');

  // Detect project CSS file
  const targetCssFile = useMemo(() => {
    return (
      project.files.find((f) => f.path === '/style.css' || f.path === 'style.css') ||
      project.files.find((f) => f.type === 'css') ||
      project.files.find((f) => f.name.endsWith('.css')) || {
        path: '/style.css',
        name: 'style.css',
        extension: 'css',
        type: 'css',
        content: '',
        size: 0,
        updatedAt: Date.now(),
      }
    );
  }, [project.files]);

  // Initialize variables from project or preset on open
  useEffect(() => {
    if (!isOpen) return;

    // Check if project has stored theme config
    if (project.theme && project.theme.variables && project.theme.variables.length > 0) {
      setVariables(project.theme.variables);
      setActivePresetId(project.theme.activePresetId || 'cyber-cyan');
      return;
    }

    // Try extracting from CSS file
    const cssFile = project.files.find((f) => f.type === 'css');
    if (cssFile && cssFile.content.includes(':root')) {
      const extracted = extractCssVariables(cssFile.content);
      if (extracted.length > 0) {
        // Merge with default preset if some are missing
        const defaultPreset = THEME_PRESETS[0];
        const merged = [...extracted];
        for (const pv of defaultPreset.variables) {
          if (!merged.find((m) => m.name === pv.name)) {
            merged.push(pv);
          }
        }
        setVariables(merged);
        return;
      }
    }

    // Default to Cyber Cyan preset
    const defaultPreset = THEME_PRESETS[0];
    setVariables(defaultPreset.variables);
    setActivePresetId(defaultPreset.id);
  }, [isOpen, project]);

  // Broadcast live changes to iframe if liveSync is enabled
  useEffect(() => {
    if (liveSync && onBroadcastVariables && variables.length > 0) {
      onBroadcastVariables(variables);
    }
  }, [variables, liveSync, onBroadcastVariables]);

  if (!isOpen) return null;

  // Helper to get variable value
  const getVar = (name: string, fallback = ''): string => {
    const v = variables.find((item) => item.name === name);
    return v ? v.value : fallback;
  };

  // Helper to update a variable
  const updateVariable = (name: string, value: string, category?: CSSVariableCategory) => {
    setVariables((prev) => {
      const exists = prev.some((v) => v.name === name);
      if (exists) {
        return prev.map((v) => (v.name === name ? { ...v, value } : v));
      } else {
        return [
          ...prev,
          {
            id: 'v_' + Math.random().toString(36).substring(2, 9),
            name,
            value,
            category: category || 'colors',
            label: name.replace(/^--/, ''),
          },
        ];
      }
    });
  };

  // Delete variable
  const handleDeleteVariable = (name: string) => {
    setVariables((prev) => prev.filter((v) => v.name !== name));
  };

  // Add custom variable
  const handleAddCustomVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarName.trim() || !newVarValue.trim()) return;

    const formattedName = newVarName.startsWith('--') ? newVarName.trim() : `--${newVarName.trim()}`;
    updateVariable(formattedName, newVarValue.trim(), newVarCategory);
    setNewVarName('');
    setNewVarValue('');
  };

  // Apply a theme preset
  const handleApplyPreset = (preset: ThemePreset) => {
    setActivePresetId(preset.id);
    setVariables(preset.variables);
  };

  // Reset to original cyber preset
  const handleResetDefaults = () => {
    const defaultPreset = THEME_PRESETS[0];
    setActivePresetId(defaultPreset.id);
    setVariables(defaultPreset.variables);
  };

  // Save to project files
  const handleSaveToProject = () => {
    try {
      const rootCss = generateRootCssBlock(variables);
      const fontHeading = getVar('--font-heading', "'Plus Jakarta Sans', sans-serif");
      const fontBody = getVar('--font-body', "'Plus Jakarta Sans', sans-serif");

      let updatedFiles = [...project.files];

      // 1. Update or create the target CSS file
      const existingCssIdx = updatedFiles.findIndex(
        (f) => f.path === targetCssFile.path || f.name === targetCssFile.name || f.type === 'css'
      );

      const targetPath = existingCssIdx >= 0 ? updatedFiles[existingCssIdx].path : '/style.css';
      const existingContent = existingCssIdx >= 0 ? updatedFiles[existingCssIdx].content : '';
      const updatedCssContent = applyVariablesToCssContent(existingContent, variables);

      const newCssFile = {
        path: targetPath,
        name: targetPath.split('/').pop() || 'style.css',
        extension: 'css',
        type: 'css' as const,
        content: updatedCssContent,
        size: updatedCssContent.length,
        updatedAt: Date.now(),
      };

      if (existingCssIdx >= 0) {
        updatedFiles[existingCssIdx] = newCssFile;
      } else {
        updatedFiles.push(newCssFile);
      }

      // 2. Ensure HTML files link the CSS file and Google Fonts
      updatedFiles = updatedFiles.map((f) => {
        if (f.extension === 'html' || f.type === 'html') {
          return {
            ...f,
            content: ensureGoogleFontsAndCssInHtml(f.content, targetPath, [fontHeading, fontBody]),
            updatedAt: Date.now(),
          };
        }
        return f;
      });

      // 3. Save Theme metadata inside Project
      const themeConfig: ProjectThemeConfig = {
        activePresetId,
        presetName: THEME_PRESETS.find((p) => p.id === activePresetId)?.name || 'Custom Theme',
        variables,
        targetCssFile: targetPath,
        updatedAt: Date.now(),
      };

      const updatedProject: Project = {
        ...project,
        files: updatedFiles,
        theme: themeConfig,
        updatedAt: Date.now(),
      };

      onApplyTheme(updatedProject);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to apply theme to project:', err);
    }
  };

  // Copy CSS block
  const handleCopyCss = () => {
    const css = generateRootCssBlock(variables);
    navigator.clipboard.writeText(css);
    setCopiedCode('css');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Copy Tailwind Config
  const handleCopyTailwind = () => {
    const tw = generateTailwindThemeExtension(variables);
    navigator.clipboard.writeText(tw);
    setCopiedCode('tailwind');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered variables for search
  const filteredVariables = variables.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.label && v.label.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-5xl h-[92vh] flex flex-col rounded-2xl bg-[#090b11] border border-white/10 shadow-2xl overflow-hidden text-xs">
        {/* Modal Top Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-white/5 bg-[#0e111a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-sm tracking-tight">Theme Studio & CSS Variable Manager</h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-[10px]">
                  Design Tokens
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Visual styling, Google fonts, dynamic palettes & live CSS variable injection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Sync Toggle */}
            <label
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition"
              title="Broadcast changes directly to live preview in real time"
            >
              <input
                type="checkbox"
                checked={liveSync}
                onChange={(e) => setLiveSync(e.target.checked)}
                className="w-3.5 h-3.5 accent-cyan-400 rounded cursor-pointer"
              />
              <span className="text-[11px] text-slate-300 font-medium">Live Sync Preview</span>
            </label>

            {/* Reset */}
            <button
              onClick={handleResetDefaults}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="Reset to default theme tokens"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Copy CSS */}
            <button
              onClick={handleCopyCss}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition"
            >
              {copiedCode === 'css' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'css' ? 'Copied :root' : 'Copy CSS'}</span>
            </button>

            {/* Apply & Save Button */}
            <button
              onClick={handleSaveToProject}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold shadow-lg transition-all ${
                saveSuccess
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 active:scale-95'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Applied to Project!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Apply to Project</span>
                </>
              )}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
              title="Close Theme Studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-white/5 bg-[#0b0e17] px-4 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 font-semibold transition shrink-0 ${
              activeTab === 'colors'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4 text-cyan-400" />
            <span>Colors & Glow</span>
          </button>

          <button
            onClick={() => setActiveTab('typography')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 font-semibold transition shrink-0 ${
              activeTab === 'typography'
                ? 'border-purple-400 text-purple-300 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-4 h-4 text-purple-400" />
            <span>Typography & Scale</span>
          </button>

          <button
            onClick={() => setActiveTab('spacing')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 font-semibold transition shrink-0 ${
              activeTab === 'spacing'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Spacing & Borders</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 font-semibold transition shrink-0 ${
              activeTab === 'presets'
                ? 'border-pink-400 text-pink-300 bg-pink-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Curated Presets ({THEME_PRESETS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 font-semibold transition shrink-0 ${
              activeTab === 'custom'
                ? 'border-amber-400 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4 text-amber-400" />
            <span>Raw CSS & Custom Vars</span>
          </button>
        </div>

        {/* Content Body Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[#080a10]">
          {/* TAB 1: COLORS */}
          {activeTab === 'colors' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Color Controls */}
              <div className="lg:col-span-8 space-y-6">
                {/* Brand Colors */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    Brand & Accent Colors
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Primary */}
                    <ColorPickerCard
                      label="Primary Brand Color"
                      cssVar="--color-primary"
                      value={getVar('--color-primary', '#00f2fe')}
                      description="Buttons, high-contrast highlights, logos"
                      onChange={(val) => updateVariable('--color-primary', val, 'colors')}
                    />

                    {/* Secondary */}
                    <ColorPickerCard
                      label="Secondary Accent"
                      cssVar="--color-secondary"
                      value={getVar('--color-secondary', '#7928ca')}
                      description="Gradients, secondary actions, badges"
                      onChange={(val) => updateVariable('--color-secondary', val, 'colors')}
                    />

                    {/* Accent Glow */}
                    <ColorPickerCard
                      label="Accent Glow & Reflection"
                      cssVar="--color-accent-glow"
                      value={getVar('--color-accent-glow', 'rgba(0, 242, 254, 0.4)')}
                      description="Card hovering, interactive shadow rings"
                      onChange={(val) => updateVariable('--color-accent-glow', val, 'colors')}
                      allowRgba
                    />

                    {/* Success */}
                    <ColorPickerCard
                      label="Success State"
                      cssVar="--color-success"
                      value={getVar('--color-success', '#10b981')}
                      description="Confirmed actions, positive metrics"
                      onChange={(val) => updateVariable('--color-success', val, 'colors')}
                    />
                  </div>
                </div>

                {/* Surface & Background */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    Surface, Background & Borders
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Background */}
                    <ColorPickerCard
                      label="Page Background"
                      cssVar="--color-bg"
                      value={getVar('--color-bg', '#090b11')}
                      description="Main body canvas backdrop"
                      onChange={(val) => updateVariable('--color-bg', val, 'colors')}
                    />

                    {/* Surface */}
                    <ColorPickerCard
                      label="Card & Container Surface"
                      cssVar="--color-surface"
                      value={getVar('--color-surface', 'rgba(255, 255, 255, 0.04)')}
                      description="Panels, modals, card containers"
                      onChange={(val) => updateVariable('--color-surface', val, 'colors')}
                      allowRgba
                    />

                    {/* Border */}
                    <ColorPickerCard
                      label="Border & Separator Line"
                      cssVar="--color-border"
                      value={getVar('--color-border', 'rgba(255, 255, 255, 0.08)')}
                      description="Outlines, dividing lines, inputs"
                      onChange={(val) => updateVariable('--color-border', val, 'colors')}
                      allowRgba
                    />

                    {/* Danger / Warning */}
                    <ColorPickerCard
                      label="Warning / Alert State"
                      cssVar="--color-warning"
                      value={getVar('--color-warning', '#f59e0b')}
                      description="Alert notifications, badges"
                      onChange={(val) => updateVariable('--color-warning', val, 'colors')}
                    />
                  </div>
                </div>

                {/* Typography Colors */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Typography Text Colors
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ColorPickerCard
                      label="Primary Text Color"
                      cssVar="--color-text-main"
                      value={getVar('--color-text-main', '#f8fafc')}
                      description="High-contrast headings, main body text"
                      onChange={(val) => updateVariable('--color-text-main', val, 'colors')}
                    />

                    <ColorPickerCard
                      label="Muted Text Color"
                      cssVar="--color-text-muted"
                      value={getVar('--color-text-muted', '#94a3b8')}
                      description="Subtitles, placeholders, secondary labels"
                      onChange={(val) => updateVariable('--color-text-muted', val, 'colors')}
                    />
                  </div>
                </div>

                {/* Quick Swatches Bar */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="text-[11px] text-slate-400 font-semibold block">Quick Color Swatches</span>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SWATCHES.map((hex) => (
                      <button
                        key={hex}
                        onClick={() => updateVariable('--color-primary', hex, 'colors')}
                        style={{ backgroundColor: hex }}
                        className="w-7 h-7 rounded-lg border border-white/20 shadow hover:scale-110 active:scale-95 transition cursor-pointer"
                        title={`Set Primary to ${hex}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Component Theme Preview */}
              <div className="lg:col-span-4 space-y-4">
                <div className="sticky top-2 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    Live Component Specimen
                  </span>

                  {/* Specimen Box */}
                  <div
                    style={{
                      backgroundColor: getVar('--color-bg', '#090b11'),
                      color: getVar('--color-text-main', '#f8fafc'),
                      borderColor: getVar('--color-border', 'rgba(255,255,255,0.1)'),
                      fontFamily: getVar('--font-body', "'Plus Jakarta Sans', sans-serif"),
                    }}
                    className="p-5 rounded-2xl border shadow-2xl space-y-4 transition-all"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            background: `linear-gradient(135deg, ${getVar('--color-primary', '#00f2fe')}, ${getVar(
                              '--color-secondary',
                              '#7928ca'
                            )})`,
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-md"
                        >
                          ✦
                        </div>
                        <div>
                          <span
                            style={{ fontFamily: getVar('--font-heading', "'Plus Jakarta Sans', sans-serif") }}
                            className="font-bold text-sm block"
                          >
                            Nova Engine
                          </span>
                          <span
                            style={{ color: getVar('--color-text-muted', '#94a3b8') }}
                            className="text-[10px] block"
                          >
                            Autonomous Systems
                          </span>
                        </div>
                      </div>

                      <span
                        style={{
                          backgroundColor: `${getVar('--color-primary', '#00f2fe')}22`,
                          color: getVar('--color-primary', '#00f2fe'),
                          borderColor: `${getVar('--color-primary', '#00f2fe')}44`,
                        }}
                        className="px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold"
                      >
                        v4.2 PRO
                      </span>
                    </div>

                    {/* Card Surface Specimen */}
                    <div
                      style={{
                        backgroundColor: getVar('--color-surface', 'rgba(255,255,255,0.04)'),
                        borderColor: getVar('--color-border', 'rgba(255,255,255,0.1)'),
                        borderRadius: getVar('--radius-md', '12px'),
                        boxShadow: `0 0 20px ${getVar('--color-accent-glow', 'rgba(0, 242, 254, 0.2)')}`,
                      }}
                      className="p-4 border backdrop-blur-md space-y-2 transition-all"
                    >
                      <h4
                        style={{
                          fontFamily: getVar('--font-heading', "'Plus Jakarta Sans', sans-serif"),
                        }}
                        className="font-bold text-sm"
                      >
                        Interactive Theme Card
                      </h4>
                      <p
                        style={{
                          color: getVar('--color-text-muted', '#94a3b8'),
                          fontSize: '11px',
                        }}
                        className="leading-relaxed"
                      >
                        This preview reflects your design tokens in real time. Notice border radii, glows, and contrast.
                      </p>

                      <div className="pt-2 flex items-center gap-2">
                        {/* Primary Button */}
                        <button
                          style={{
                            backgroundColor: getVar('--color-primary', '#00f2fe'),
                            color: '#080a11',
                            borderRadius: getVar('--radius-sm', '6px'),
                          }}
                          className="px-3 py-1.5 font-bold text-xs shadow-md transition hover:opacity-90 cursor-pointer"
                        >
                          Primary Action
                        </button>

                        {/* Secondary Button */}
                        <button
                          style={{
                            borderColor: getVar('--color-border', 'rgba(255,255,255,0.2)'),
                            color: getVar('--color-text-main', '#f8fafc'),
                            borderRadius: getVar('--radius-sm', '6px'),
                          }}
                          className="px-3 py-1.5 border font-semibold text-xs hover:bg-white/10 transition cursor-pointer"
                        >
                          Secondary
                        </button>
                      </div>
                    </div>

                    {/* Status Pill Badges */}
                    <div className="flex items-center gap-2 pt-1 text-[10px]">
                      <span
                        style={{
                          color: getVar('--color-success', '#10b981'),
                          backgroundColor: `${getVar('--color-success', '#10b981')}20`,
                        }}
                        className="px-2 py-0.5 rounded-full font-semibold"
                      >
                        ● Operational
                      </span>
                      <span
                        style={{
                          color: getVar('--color-warning', '#f59e0b'),
                          backgroundColor: `${getVar('--color-warning', '#f59e0b')}20`,
                        }}
                        className="px-2 py-0.5 rounded-full font-semibold"
                      >
                        ▲ 99.98% Latency
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TYPOGRAPHY */}
          {activeTab === 'typography' && (
            <div className="space-y-6 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Heading Font Family */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <label className="text-xs font-bold text-white block">
                    Headings Font Family (<span className="text-purple-400 font-mono">--font-heading</span>)
                  </label>
                  <select
                    value={getVar('--font-heading', "'Plus Jakarta Sans', sans-serif").replace(/['"]/g, '')}
                    onChange={(e) => updateVariable('--font-heading', `'${e.target.value}', sans-serif`, 'typography')}
                    className="w-full bg-[#121622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    Applied to &lt;h1&gt;, &lt;h2&gt;, &lt;h3&gt;, and hero headers.
                  </span>
                </div>

                {/* Body Font Family */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <label className="text-xs font-bold text-white block">
                    Body & UI Font Family (<span className="text-purple-400 font-mono">--font-body</span>)
                  </label>
                  <select
                    value={getVar('--font-body', "'Plus Jakarta Sans', sans-serif").replace(/['"]/g, '')}
                    onChange={(e) => updateVariable('--font-body', `'${e.target.value}', sans-serif`, 'typography')}
                    className="w-full bg-[#121622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    Applied to paragraphs, buttons, navigation items, and inputs.
                  </span>
                </div>
              </div>

              {/* Sliders: Base font size & Scales */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Modular Scale & Sizing</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Base Size */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">Base Font Size (--font-size-base)</span>
                      <span className="font-mono text-cyan-400">{getVar('--font-size-base', '16px')}</span>
                    </div>
                    <input
                      type="range"
                      min="13"
                      max="22"
                      value={parseInt(getVar('--font-size-base', '16px')) || 16}
                      onChange={(e) => updateVariable('--font-size-base', `${e.target.value}px`, 'typography')}
                      className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>

                  {/* H1 Display Size */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">Display H1 (--font-size-h1)</span>
                      <span className="font-mono text-cyan-400">{getVar('--font-size-h1', '3.5rem')}</span>
                    </div>
                    <input
                      type="range"
                      min="2.0"
                      max="5.0"
                      step="0.25"
                      value={parseFloat(getVar('--font-size-h1', '3.5rem')) || 3.5}
                      onChange={(e) => updateVariable('--font-size-h1', `${e.target.value}rem`, 'typography')}
                      className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>

                  {/* H2 Section Size */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">Section H2 (--font-size-h2)</span>
                      <span className="font-mono text-cyan-400">{getVar('--font-size-h2', '2.25rem')}</span>
                    </div>
                    <input
                      type="range"
                      min="1.5"
                      max="3.5"
                      step="0.15"
                      value={parseFloat(getVar('--font-size-h2', '2.25rem')) || 2.25}
                      onChange={(e) => updateVariable('--font-size-h2', `${e.target.value}rem`, 'typography')}
                      className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>

                  {/* Line Height Body */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">Line Height Body (--line-height-base)</span>
                      <span className="font-mono text-cyan-400">{getVar('--line-height-base', '1.6')}</span>
                    </div>
                    <input
                      type="range"
                      min="1.2"
                      max="2.0"
                      step="0.05"
                      value={parseFloat(getVar('--line-height-base', '1.6')) || 1.6}
                      onChange={(e) => updateVariable('--line-height-base', e.target.value, 'typography')}
                      className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Typography Preview Box */}
              <div
                style={{
                  fontFamily: getVar('--font-body', "'Plus Jakarta Sans', sans-serif"),
                  backgroundColor: getVar('--color-bg', '#090b11'),
                  color: getVar('--color-text-main', '#f8fafc'),
                  borderColor: getVar('--color-border', 'rgba(255,255,255,0.1)'),
                }}
                className="p-6 rounded-2xl border space-y-4"
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                  Typography Specimen
                </span>
                <h1
                  style={{
                    fontFamily: getVar('--font-heading', "'Plus Jakarta Sans', sans-serif"),
                    fontSize: getVar('--font-size-h1', '3.5rem'),
                    lineHeight: getVar('--line-height-heading', '1.15'),
                  }}
                  className="font-extrabold tracking-tight"
                >
                  Building the Next Web
                </h1>
                <h2
                  style={{
                    fontFamily: getVar('--font-heading', "'Plus Jakarta Sans', sans-serif"),
                    fontSize: getVar('--font-size-h2', '2.25rem'),
                  }}
                  className="font-bold tracking-tight text-slate-200"
                >
                  Intelligent Architecture & Fluid Scale
                </h2>
                <p
                  style={{
                    fontSize: getVar('--font-size-base', '16px'),
                    lineHeight: getVar('--line-height-base', '1.6'),
                    color: getVar('--color-text-muted', '#94a3b8'),
                  }}
                  className="max-w-2xl"
                >
                  Experience seamless real-time design tokens with standard CSS variables. These tokens can be consumed by Tailwind classes, custom stylesheets, and inline React components effortlessly.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SPACING & BORDERS */}
          {activeTab === 'spacing' && (
            <div className="space-y-6 max-w-4xl">
              {/* Corner Radii Section */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Corner Radii Scale (--radius-*)
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        updateVariable('--radius-sm', '0px', 'borders');
                        updateVariable('--radius-md', '0px', 'borders');
                        updateVariable('--radius-lg', '0px', 'borders');
                        updateVariable('--radius-full', '0px', 'borders');
                      }}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-slate-300 transition"
                    >
                      Sharp Brutalist (0px)
                    </button>
                    <button
                      onClick={() => {
                        updateVariable('--radius-sm', '8px', 'borders');
                        updateVariable('--radius-md', '16px', 'borders');
                        updateVariable('--radius-lg', '24px', 'borders');
                        updateVariable('--radius-full', '9999px', 'borders');
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] font-semibold text-cyan-300 transition"
                    >
                      Soft Rounded Pill
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Small Radius */}
                  <div className="p-3 rounded-xl bg-[#121622] border border-white/5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Small (--radius-sm)</span>
                      <span className="font-mono text-cyan-400">{getVar('--radius-sm', '6px')}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="16"
                      value={parseInt(getVar('--radius-sm', '6px')) || 0}
                      onChange={(e) => updateVariable('--radius-sm', `${e.target.value}px`, 'borders')}
                      className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                    <div
                      style={{ borderRadius: getVar('--radius-sm', '6px') }}
                      className="w-full h-8 bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-[10px] text-cyan-300"
                    >
                      Preview Button
                    </div>
                  </div>

                  {/* Medium Radius */}
                  <div className="p-3 rounded-xl bg-[#121622] border border-white/5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Medium (--radius-md)</span>
                      <span className="font-mono text-cyan-400">{getVar('--radius-md', '12px')}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="28"
                      value={parseInt(getVar('--radius-md', '12px')) || 0}
                      onChange={(e) => updateVariable('--radius-md', `${e.target.value}px`, 'borders')}
                      className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                    <div
                      style={{ borderRadius: getVar('--radius-md', '12px') }}
                      className="w-full h-8 bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-[10px] text-purple-300"
                    >
                      Card Element
                    </div>
                  </div>

                  {/* Large Radius */}
                  <div className="p-3 rounded-xl bg-[#121622] border border-white/5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Large (--radius-lg)</span>
                      <span className="font-mono text-cyan-400">{getVar('--radius-lg', '20px')}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={parseInt(getVar('--radius-lg', '20px')) || 0}
                      onChange={(e) => updateVariable('--radius-lg', `${e.target.value}px`, 'borders')}
                      className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                    <div
                      style={{ borderRadius: getVar('--radius-lg', '20px') }}
                      className="w-full h-8 bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-[10px] text-emerald-300"
                    >
                      Modal / Hero Banner
                    </div>
                  </div>
                </div>
              </div>

              {/* Spacing & Layout Section */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Spacing & Layout Scale</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Spacing Unit */}
                  <div className="p-3 rounded-xl bg-[#121622] border border-white/5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Base Unit (--spacing-unit)</span>
                      <span className="font-mono text-cyan-400">{getVar('--spacing-unit', '8px')}</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="16"
                      value={parseInt(getVar('--spacing-unit', '8px')) || 8}
                      onChange={(e) => updateVariable('--spacing-unit', `${e.target.value}px`, 'spacing')}
                      className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded cursor-pointer"
                    />
                  </div>

                  {/* Container Max Width */}
                  <div className="p-3 rounded-xl bg-[#121622] border border-white/5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Container Max Width (--container-max-width)</span>
                      <span className="font-mono text-cyan-400">{getVar('--container-max-width', '1280px')}</span>
                    </div>
                    <select
                      value={getVar('--container-max-width', '1280px')}
                      onChange={(e) => updateVariable('--container-max-width', e.target.value, 'spacing')}
                      className="w-full bg-[#0a0d14] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none"
                    >
                      <option value="1024px">1024px (Compact Desktop)</option>
                      <option value="1200px">1200px (Standard Desktop)</option>
                      <option value="1280px">1280px (Tailwind 7XL Standard)</option>
                      <option value="1440px">1440px (Wide Screen)</option>
                      <option value="1600px">1600px (Ultra-Wide Cinematic)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Pre-Engineered Design System Presets</h3>
                  <p className="text-[11px] text-slate-400">
                    Switch between curated visual themes with harmonious palettes, typography and elevations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {THEME_PRESETS.map((preset) => {
                  const isCurrent = activePresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                        isCurrent
                          ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white text-sm block">{preset.name}</span>
                            <span className="text-[11px] text-slate-400 block font-medium">{preset.nameFa}</span>
                          </div>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-bold text-[10px]">
                              Active
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">{preset.description}</p>

                        {/* Color Swatches */}
                        <div className="flex items-center gap-1.5 pt-1">
                          {preset.previewColors.map((color, idx) => (
                            <div
                              key={idx}
                              style={{ backgroundColor: color }}
                              className="w-6 h-6 rounded-lg border border-white/20 shadow-sm"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {preset.variables.length} Tokens
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyPreset(preset);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                            isCurrent
                              ? 'bg-cyan-400 text-slate-950 font-bold'
                              : 'bg-white/5 hover:bg-white/10 text-slate-200'
                          }`}
                        >
                          {isCurrent ? 'Current Theme' : 'Apply Preset'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: RAW CSS & CUSTOM VARIABLES */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              {/* Add Custom Variable Form */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  Add New Custom CSS Variable
                </span>
                <form onSubmit={handleAddCustomVariable} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="--variable-name (e.g. --badge-bg)"
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    className="bg-[#121622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. rgba(0, 242, 254, 0.2))"
                    value={newVarValue}
                    onChange={(e) => setNewVarValue(e.target.value)}
                    className="bg-[#121622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
                  />
                  <select
                    value={newVarCategory}
                    onChange={(e) => setNewVarCategory(e.target.value as CSSVariableCategory)}
                    className="bg-[#121622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="colors">Colors</option>
                    <option value="typography">Typography</option>
                    <option value="spacing">Spacing</option>
                    <option value="borders">Borders</option>
                    <option value="shadows">Shadows</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20 cursor-pointer"
                  >
                    Add Variable
                  </button>
                </form>
              </div>

              {/* Search & Variables Table */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Declared CSS Tokens ({variables.length})
                  </span>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter variables..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-[#121622] border border-white/10 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 outline-none w-48"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-60 custom-scrollbar border border-white/5 rounded-xl">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#121622] text-slate-400 uppercase text-[10px] border-b border-white/5">
                      <tr>
                        <th className="p-2.5">Variable Name</th>
                        <th className="p-2.5">Value</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredVariables.map((v) => (
                        <tr key={v.name} className="hover:bg-white/[0.02]">
                          <td className="p-2.5 text-cyan-300 font-semibold">{v.name}</td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={v.value}
                              onChange={(e) => updateVariable(v.name, e.target.value, v.category)}
                              className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-cyan-400 outline-none text-white text-xs w-full py-0.5"
                            />
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 text-[10px] uppercase">
                              {v.category}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => handleDeleteVariable(v.name)}
                              className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition"
                              title="Delete Variable"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Code Preview & Export */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-purple-400" />
                    Target CSS Output (:root Block)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyCss}
                      className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition flex items-center gap-1"
                    >
                      {copiedCode === 'css' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy CSS</span>
                    </button>
                    <button
                      onClick={handleCopyTailwind}
                      className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 text-xs transition flex items-center gap-1"
                    >
                      {copiedCode === 'tailwind' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code2 className="w-3.5 h-3.5" />}
                      <span>Copy Tailwind Config</span>
                    </button>
                  </div>
                </div>

                <pre className="p-4 rounded-xl bg-[#050609] border border-white/5 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-56 custom-scrollbar">
                  <code>{generateRootCssBlock(variables)}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Status Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-white/5 bg-[#0e111a] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>Target stylesheet:</span>
            <span className="px-2 py-0.5 rounded bg-white/5 font-mono text-cyan-300">{targetCssFile.path}</span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline">Active Preset: {THEME_PRESETS.find((p) => p.id === activePresetId)?.name || 'Custom'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 transition"
            >
              Close
            </button>
            <button
              onClick={handleSaveToProject}
              className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold shadow-md shadow-cyan-400/20 transition cursor-pointer"
            >
              Apply to Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ColorPickerCardProps {
  label: string;
  cssVar: string;
  value: string;
  description: string;
  onChange: (val: string) => void;
  allowRgba?: boolean;
}

const ColorPickerCard: React.FC<ColorPickerCardProps> = ({
  label,
  cssVar,
  value,
  description,
  onChange,
  allowRgba,
}) => {
  // Convert value to hex if possible for input type="color"
  const hexValue = useMemo(() => {
    if (value.startsWith('#')) return value.slice(0, 7);
    if (value.startsWith('rgba') || value.startsWith('rgb')) {
      const match = value.match(/\d+/g);
      if (match && match.length >= 3) {
        const r = parseInt(match[0]).toString(16).padStart(2, '0');
        const g = parseInt(match[1]).toString(16).padStart(2, '0');
        const b = parseInt(match[2]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
      }
    }
    return '#00f2fe';
  }, [value]);

  return (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 hover:border-white/10 transition">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-white block">{label}</span>
          <span className="text-[10px] text-slate-400 block font-mono text-cyan-300/80">{cssVar}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Native Color Picker */}
          <input
            type="color"
            value={hexValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-7 h-7 rounded-lg border border-white/20 bg-transparent cursor-pointer"
            title="Pick Color"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-[#121622] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono outline-none focus:border-cyan-400/50"
        />
        <div style={{ backgroundColor: value }} className="w-5 h-5 rounded border border-white/20 shadow-sm" />
      </div>

      <span className="text-[10px] text-slate-400 block leading-tight">{description}</span>
    </div>
  );
};
