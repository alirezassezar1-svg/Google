import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Wand2,
  FileCode,
  ShieldCheck,
  CheckCircle,
  Bug,
  Layout,
  Smartphone,
  Eye,
  Type,
  Stethoscope,
  Shapes,
  Copy,
  Check,
  Plus,
  ArrowRight,
  Code2,
  RefreshCw,
  Zap,
  Image as ImageIcon,
  Film,
  Globe,
} from 'lucide-react';
import { Project, ProjectFile, SelectedElementInfo, AIProposal } from '../types';
import { ImageStudio } from './ImageStudio';
import { VideoStudio } from './VideoStudio';
import { SearchGroundingStudio } from './SearchGroundingStudio';

interface AIAssistantProps {
  project: Project;
  selectedElement: SelectedElementInfo | null;
  onProposalReady: (proposal: AIProposal) => void;
  onInsertComponentCode?: (code: string) => void;
  onCreateNewFile?: (path: string, content: string) => void;
  onSaveMediaAsset?: (path: string, content: string, isBinary: boolean, mimeType: string) => void;
  onInsertHtmlSnippet?: (snippet: string) => void;
}

type AITab = 'copilot' | 'image' | 'video' | 'search' | 'components' | 'copywriter' | 'doctor' | 'svg';

export const AIAssistant: React.FC<AIAssistantProps> = ({
  project,
  selectedElement,
  onProposalReady,
  onInsertComponentCode,
  onCreateNewFile,
  onSaveMediaAsset,
  onInsertHtmlSnippet,
}) => {
  const [activeTab, setActiveTab] = useState<AITab>('copilot');

  // Video & Image cross-studio state
  const [videoInitialImage, setVideoInitialImage] = useState<string | null>(null);
  const [videoInitialPrompt, setVideoInitialPrompt] = useState<string>('');

  // Copilot Tab State
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestProposal, setLatestProposal] = useState<AIProposal | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: "سلام! من دستیار هوشمند UNIVERSAL NONONICK AI هستم. می‌توانید دستورات طراحی، ویرایش کد، تغییر رنگ و تم، بازسازی هدر، افزودن دکمه‌ها و اصلاح ساختار فایل‌ها را به فارسی یا انگلیسی بفرستید. پیش از اعمال تغییرات، دیف و تفاوت کد را مشاهده و تایید خواهید کرد.",
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading, latestProposal]);

  // Component Generator State
  const [compType, setCompType] = useState('hero');
  const [compStyle, setCompStyle] = useState('modern dark with cyan accents');
  const [compTitle, setCompTitle] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compLoading, setCompLoading] = useState(false);
  const [generatedCompHtml, setGeneratedCompHtml] = useState<string | null>(null);
  const [compCopied, setCompCopied] = useState(false);

  // Copywriter State
  const [copySource, setCopySource] = useState(selectedElement?.innerText || '');
  const [copyTone, setCopyTone] = useState('persuasive');
  const [copyLang, setCopyLang] = useState('en');
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyResults, setCopyResults] = useState<{
    headlines?: string[];
    bodyCopies?: string[];
    ctas?: string[];
    persianTranslation?: string;
  } | null>(null);

  // Code Doctor State
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorResults, setDoctorResults] = useState<{
    healthScore: number;
    issues: { id: string; severity: string; category: string; message: string; line?: number }[];
    fixedContent: string;
    diffSummary: string;
  } | null>(null);

  // SVG Generator State
  const [svgPrompt, setSvgPrompt] = useState('modern cyber shield badge');
  const [svgStyle, setSvgStyle] = useState('neon outline cyan');
  const [svgLoading, setSvgLoading] = useState(false);
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
  const [svgCopied, setSvgCopied] = useState(false);

  const activeFile =
    project.files.find((f) => f.path === project.activeFilePath) ||
    project.files.find((f) => f.path === '/index.html') ||
    project.files[0];

  // Copilot Send Prompt Handler
  const handleSendPrompt = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() || loading) return;

    setError(null);
    setLoading(true);

    const newHistory = [...history, { role: 'user' as const, text: textToSend }];
    setHistory(newHistory);
    if (!customPrompt) setPrompt('');

    try {
      const fileTreeSummary = project.files.map((f) => ({
        path: f.path,
        size: f.size,
        type: f.type,
      }));

      const payload = {
        prompt: textToSend,
        files: project.files.slice(0, 10).map((f) => ({
          path: f.path,
          content: f.content,
        })),
        activeFilePath: activeFile?.path,
        activeFileContent: activeFile?.content,
        fileTree: fileTreeSummary,
        selectedElement: selectedElement
          ? {
              tagName: selectedElement.tagName,
              id: selectedElement.id,
              className: selectedElement.className,
              selectorPath: selectedElement.selectorPath,
              outerHTML: selectedElement.outerHTML,
            }
          : null,
      };

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();

      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.explanation || 'I have prepared the changes based on your request. Please review the diff.',
        },
      ]);

      if (data.changes && data.changes.length > 0) {
        const mappedChanges = data.changes.map((ch: any) => {
          const original = project.files.find((f) => f.path === ch.filePath);
          return {
            filePath: ch.filePath,
            action: ch.action || 'modify',
            oldContent: original ? original.content : '',
            newContent: ch.newContent,
            diffSummary: ch.diffSummary || 'Updated by AI',
            accepted: true,
          };
        });

        const proposal: AIProposal = {
          id: 'prop_' + Math.random().toString(36).substring(2, 9),
          title: data.title || 'AI Update',
          explanation: data.explanation || 'Review the proposed modifications before applying.',
          prompt: textToSend,
          timestamp: Date.now(),
          changes: mappedChanges,
          suggestedActions: data.suggestedActions,
        };

        setLatestProposal(proposal);
        onProposalReady(proposal);
      }
    } catch (err: any) {
      console.error('AI assistant error:', err);
      setError(err.message || 'Failed to complete request');
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Notice: ${err.message}. Fallback heuristic applied.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Generate UI Component Handler
  const handleGenerateComponent = async () => {
    setCompLoading(true);
    try {
      const res = await fetch('/api/ai/component-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentType: compType,
          style: compStyle,
          title: compTitle,
          description: compDesc,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedCompHtml(data.html);
      }
    } catch (err) {
      console.error('Failed to generate component:', err);
    } finally {
      setCompLoading(false);
    }
  };

  // Copywriting Handler
  const handleGenerateCopy = async () => {
    setCopyLoading(true);
    try {
      const res = await fetch('/api/ai/copywrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentText: copySource || project.name,
          targetTone: copyTone,
          targetLanguage: copyLang,
          task: 'improve',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCopyResults(data);
      }
    } catch (err) {
      console.error('Copywrite error:', err);
    } finally {
      setCopyLoading(false);
    }
  };

  // Code Doctor Handler
  const handleRunCodeDoctor = async () => {
    if (!activeFile) return;
    setDoctorLoading(true);
    try {
      const res = await fetch('/api/ai/code-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: project.files,
          activeFilePath: activeFile.path,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDoctorResults(data);
      }
    } catch (err) {
      console.error('Code doctor error:', err);
    } finally {
      setDoctorLoading(false);
    }
  };

  // Apply Code Doctor Auto-Fix
  const handleApplyDoctorFix = () => {
    if (!doctorResults || !activeFile) return;
    const proposal: AIProposal = {
      id: 'prop_' + Math.random().toString(36).substring(2, 9),
      title: 'Code Doctor Auto-Remediation',
      explanation: doctorResults.diffSummary || 'Auto-repaired HTML, ARIA, and syntax standards.',
      prompt: 'Code Doctor Diagnostic Repair',
      timestamp: Date.now(),
      changes: [
        {
          filePath: activeFile.path,
          action: 'modify',
          oldContent: activeFile.content,
          newContent: doctorResults.fixedContent,
          diffSummary: doctorResults.diffSummary,
          accepted: true,
        },
      ],
    };
    onProposalReady(proposal);
  };

  // Generate SVG Vector Handler
  const handleGenerateSvg = async () => {
    setSvgLoading(true);
    try {
      const res = await fetch('/api/ai/generate-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: svgPrompt,
          style: svgStyle,
          width: 240,
          height: 240,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedSvg(data.svg);
      }
    } catch (err) {
      console.error('SVG generator error:', err);
    } finally {
      setSvgLoading(false);
    }
  };

  const QUICK_ACTIONS = [
    { label: 'Glassmorphic Styling', prompt: 'Convert current UI cards and headers to modern frosted glassmorphic styling with cyan glow accents.' },
    { label: 'Responsive for Mobile', prompt: 'Optimize layout and typography for mobile screens with touch-friendly spacing and responsive navigation.' },
    { label: 'Hero Section', prompt: 'Create an engaging futuristic hero section with high-contrast headline, badge, and CTA buttons.' },
    { label: 'Validate & Clean HTML', prompt: 'Inspect active file, fix any unclosed tags or syntax issues, and format clean semantic code.' },
  ];

  return (
    <div className="h-full flex flex-col glass-panel rounded-xl overflow-hidden border border-white/5 text-xs bg-[#07090f]">
      {/* Top Header */}
      <div className="p-3 border-b border-white/5 bg-[#090c14] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white flex items-center gap-1.5">
              NONONICK AI
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                GEMINI 3.8
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Approval Guard On</span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center border-b border-white/5 bg-[#090b11] px-1 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('copilot')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'copilot'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Copilot</span>
        </button>

        <button
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'image'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          title="ساخت و ویرایش تصاویر با هوش مصنوعی (gemini-3.1-flash-image-preview)"
        >
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>تصویر (Image)</span>
        </button>

        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'video'
              ? 'border-purple-400 text-purple-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          title="تبدیل عکس به فیلم با Veo (veo-3.1-fast-generate-preview)"
        >
          <Film className="w-3.5 h-3.5 text-purple-400" />
          <span>فیلم Veo</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'search'
              ? 'border-blue-400 text-blue-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          title="سرچ آنلاین گوگل و دریافت داده‌های مستند وب (gemini-3.5-flash)"
        >
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span>سرچ گوگل</span>
        </button>

        <button
          onClick={() => setActiveTab('components')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'components'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Sections</span>
        </button>

        <button
          onClick={() => setActiveTab('copywriter')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'copywriter'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Copywriting</span>
        </button>

        <button
          onClick={() => setActiveTab('doctor')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'doctor'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Code Doctor</span>
        </button>

        <button
          onClick={() => setActiveTab('svg')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'svg'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shapes className="w-3.5 h-3.5" />
          <span>Vector SVG</span>
        </button>
      </div>

      {/* Scoped Element Banner */}
      {selectedElement && activeTab === 'copilot' && (
        <div className="px-3 py-2 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center justify-between text-[11px] text-cyan-200">
          <span className="truncate">
            Target: &lt;{selectedElement.tagName.toLowerCase()}&gt;{' '}
            {selectedElement.className ? `.${selectedElement.className.split(' ')[0]}` : ''}
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">Scoped</span>
        </div>
      )}

      {/* TAB 1: COPILOT & CHAT */}
      {activeTab === 'copilot' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {history.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] p-3 rounded-xl leading-relaxed text-xs ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                      : 'bg-white/[0.04] border border-white/10 text-slate-200'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {latestProposal && (
              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col gap-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cyan-300 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    {latestProposal.title}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                    {latestProposal.changes.length} {latestProposal.changes.length === 1 ? 'فایل' : 'فایل‌ها'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{latestProposal.explanation}</p>
                <button
                  type="button"
                  onClick={() => onProposalReady(latestProposal)}
                  className="mt-1 w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>مشاهده و تایید تغییرات (Review & Apply Diff)</span>
                </button>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 w-fit">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>در حال تحلیل پروژه و آماده‌سازی تغییرات... (Analyzing...)</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="px-3 py-2 border-t border-white/5 bg-[#080b12] overflow-x-auto whitespace-nowrap space-x-1.5 custom-scrollbar">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSendPrompt(action.prompt)}
                disabled={loading}
                className="inline-block px-2.5 py-1 rounded-full bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/40 text-[10px] text-slate-300 hover:text-cyan-300 transition cursor-pointer"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Input Prompt Box */}
          <div className="p-3 border-t border-white/5 bg-[#090c14]">
            {error && (
              <div className="mb-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center justify-between">
                <span className="truncate">{error}</span>
                <button
                  type="button"
                  onClick={() => handleSendPrompt()}
                  className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[10px] font-semibold transition cursor-pointer shrink-0 ml-2"
                >
                  تلاش مجدد (Retry)
                </button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="flex flex-col gap-2"
            >
              <div className="relative">
                <textarea
                  rows={2}
                  dir="auto"
                  placeholder={
                    selectedElement
                      ? `دستور هوش مصنوعی برای <${selectedElement.tagName.toLowerCase()}>... / Instruct AI...`
                      : 'درخواست خود را برای طراحی، تغییر کد یا تم بنویسید... / Ask AI to edit, design or create...'
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendPrompt();
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-[#121622] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 resize-none custom-scrollbar leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="opacity-80">
                  <span className="font-mono bg-white/5 px-1 py-0.5 rounded">Enter ↵</span> برای ارسال • <span className="font-mono bg-white/5 px-1 py-0.5 rounded">Shift+Enter</span> خط بعد
                </span>

                <button
                  type="submit"
                  disabled={!prompt.trim() || loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 text-white font-bold transition shadow-sm cursor-pointer"
                  title="ارسال پرامپت (Send Prompt)"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال پردازش...</span>
                    </>
                  ) : (
                    <>
                      <span>ارسال</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: IMAGE CREATION & EDITING (gemini-3.1-flash-image-preview) */}
      {activeTab === 'image' && (
        <ImageStudio
          project={project}
          onSaveMediaAsset={onSaveMediaAsset}
          onInsertHtmlSnippet={onInsertHtmlSnippet}
          onSendToVeo={(imageUrl, initialPromptText) => {
            setVideoInitialImage(imageUrl);
            setVideoInitialPrompt(initialPromptText || '');
            setActiveTab('video');
          }}
        />
      )}

      {/* TAB: VEO PHOTO-TO-VIDEO ANIMATION (veo-3.1-fast-generate-preview) */}
      {activeTab === 'video' && (
        <VideoStudio
          project={project}
          initialImage={videoInitialImage}
          initialPrompt={videoInitialPrompt}
          onSaveMediaAsset={onSaveMediaAsset}
          onInsertHtmlSnippet={onInsertHtmlSnippet}
        />
      )}

      {/* TAB: GOOGLE SEARCH GROUNDING (gemini-3.5-flash with googleSearch) */}
      {activeTab === 'search' && (
        <SearchGroundingStudio
          project={project}
          onInsertHtmlSnippet={onInsertHtmlSnippet}
          onProposalReady={onProposalReady}
        />
      )}

      {/* TAB 2: COMPONENT GENERATOR */}
      {activeTab === 'components' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Section / Component Type
            </label>
            <select
              value={compType}
              onChange={(e) => setCompType(e.target.value)}
              className="w-full bg-[#121622] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
            >
              <option value="hero">Hero Showcase Section</option>
              <option value="bento-grid">Feature Bento Grid</option>
              <option value="pricing-table">Pricing Table with Billing Toggle</option>
              <option value="testimonials">Testimonials Carousel / Grid</option>
              <option value="faq-accordion">Interactive FAQ Accordion</option>
              <option value="navbar">Modern Sticky Navigation Bar</option>
              <option value="contact-form">Contact Form with Validation</option>
              <option value="stats-counter">Metrics & Stats Counter Grid</option>
              <option value="newsletter-cta">Newsletter Subscription Banner</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Visual Style</label>
            <input
              type="text"
              value={compStyle}
              onChange={(e) => setCompStyle(e.target.value)}
              placeholder="e.g. frosted glassmorphism with emerald neon glow"
              className="w-full bg-[#121622] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Custom Headline (Optional)
            </label>
            <input
              type="text"
              value={compTitle}
              onChange={(e) => setCompTitle(e.target.value)}
              placeholder="e.g. Next-Generation Cloud Intelligence"
              className="w-full bg-[#121622] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
            />
          </div>

          <button
            onClick={handleGenerateComponent}
            disabled={compLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${compLoading ? 'animate-spin' : ''}`} />
            <span>{compLoading ? 'Generating with Gemini...' : 'Generate Section Component'}</span>
          </button>

          {generatedCompHtml && (
            <div className="mt-4 p-3 bg-black/60 rounded-xl border border-white/10 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-cyan-300">Generated Markup</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCompHtml);
                      setCompCopied(true);
                      setTimeout(() => setCompCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5"
                  >
                    {compCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{compCopied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => {
                      // Propose adding to active file
                      if (!activeFile) return;
                      const updatedHtml = activeFile.content.includes('</body>')
                        ? activeFile.content.replace('</body>', `${generatedCompHtml}\n</body>`)
                        : activeFile.content + '\n' + generatedCompHtml;

                      const proposal: AIProposal = {
                        id: 'prop_' + Math.random().toString(36).substring(2, 9),
                        title: `Add ${compType} Section`,
                        explanation: `Injected generated ${compType} section into ${activeFile.path}`,
                        prompt: `Insert ${compType}`,
                        timestamp: Date.now(),
                        changes: [
                          {
                            filePath: activeFile.path,
                            action: 'modify',
                            oldContent: activeFile.content,
                            newContent: updatedHtml,
                            diffSummary: `Appended ${compType} section`,
                            accepted: true,
                          },
                        ],
                      };
                      onProposalReady(proposal);
                    }}
                    className="flex items-center gap-1 text-[10px] text-slate-950 font-bold px-2 py-1 rounded bg-cyan-400 hover:bg-cyan-300"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Insert via Diff</span>
                  </button>
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto font-mono text-[10px] text-slate-300 bg-[#06080d] p-2 rounded-lg border border-white/5 custom-scrollbar">
                {generatedCompHtml}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI COPYWRITER & LOCALIZER */}
      {activeTab === 'copywriter' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Source Text or Product Topic
            </label>
            <textarea
              rows={3}
              value={copySource}
              onChange={(e) => setCopySource(e.target.value)}
              placeholder="e.g. Ultra-fast autonomous website editor with visual drag and AI code generation..."
              className="w-full bg-[#121622] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Tone of Voice</label>
              <select
                value={copyTone}
                onChange={(e) => setCopyTone(e.target.value)}
                className="w-full bg-[#121622] border border-white/10 rounded-xl px-2.5 py-1.5 text-white outline-none focus:border-cyan-400"
              >
                <option value="persuasive">High-Converting & Bold</option>
                <option value="tech-saas">Clean Tech / SaaS</option>
                <option value="minimalist">Minimalist Apple-style</option>
                <option value="friendly">Warm & Approachable</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Language</label>
              <select
                value={copyLang}
                onChange={(e) => setCopyLang(e.target.value)}
                className="w-full bg-[#121622] border border-white/10 rounded-xl px-2.5 py-1.5 text-white outline-none focus:border-cyan-400"
              >
                <option value="en">English</option>
                <option value="fa">فارسی (Persian)</option>
                <option value="bilingual">Bilingual (EN + FA)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateCopy}
            disabled={copyLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Type className={`w-3.5 h-3.5 ${copyLoading ? 'animate-spin' : ''}`} />
            <span>{copyLoading ? 'Crafting Copy...' : 'Generate High-Converting Copy'}</span>
          </button>

          {copyResults && (
            <div className="space-y-3 pt-2">
              {copyResults.headlines && (
                <div className="p-3 bg-[#0d101a] rounded-xl border border-white/5">
                  <span className="text-[11px] font-bold text-cyan-300 block mb-2">Headline Variations:</span>
                  <div className="space-y-1.5">
                    {copyResults.headlines.map((hl, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] flex items-center justify-between group cursor-pointer"
                        onClick={() => navigator.clipboard.writeText(hl)}
                      >
                        <span>{hl}</span>
                        <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {copyResults.ctas && (
                <div className="p-3 bg-[#0d101a] rounded-xl border border-white/5">
                  <span className="text-[11px] font-bold text-amber-300 block mb-2">Call to Action Buttons:</span>
                  <div className="flex flex-wrap gap-2">
                    {copyResults.ctas.map((cta, i) => (
                      <button
                        key={i}
                        onClick={() => navigator.clipboard.writeText(cta)}
                        className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-[11px] font-semibold"
                      >
                        {cta}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {copyResults.persianTranslation && (
                <div className="p-3 bg-[#0d101a] rounded-xl border border-white/5 text-right font-sans" dir="rtl">
                  <span className="text-[11px] font-bold text-emerald-300 block mb-1">ترجمه و بومی‌سازی فارسی:</span>
                  <p className="text-white text-xs leading-relaxed">{copyResults.persianTranslation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CODE DOCTOR */}
      {activeTab === 'doctor' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200">
            <span className="font-bold block text-white mb-0.5">Automated Code Doctor</span>
            <p className="text-[11px] text-slate-300">
              Scans <span className="font-mono text-cyan-300">{activeFile?.path}</span> for syntax defects, WCAG
              accessibility, mobile responsive traps, and broken HTML attributes.
            </p>
          </div>

          <button
            onClick={handleRunCodeDoctor}
            disabled={doctorLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Stethoscope className={`w-4 h-4 ${doctorLoading ? 'animate-spin' : ''}`} />
            <span>{doctorLoading ? 'Diagnosing File...' : 'Run Diagnostics on Active File'}</span>
          </button>

          {doctorResults && (
            <div className="space-y-4 pt-2 animate-in fade-in">
              <div className="p-4 rounded-xl bg-[#0f131f] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">File Health Score</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-white font-mono">
                      {doctorResults.healthScore}
                    </span>
                    <span className="text-xs text-slate-500">/100</span>
                  </div>
                </div>

                <button
                  onClick={handleApplyDoctorFix}
                  className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition cursor-pointer"
                >
                  Review Auto-Fix Diff
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">
                  Diagnostic Findings ({doctorResults.issues.length})
                </span>
                {doctorResults.issues.map((iss, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#0d101a] border border-white/5 flex items-start gap-2.5"
                  >
                    <Bug
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        iss.severity === 'error' ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                          {iss.category}
                        </span>
                        {iss.line && <span className="text-[10px] text-slate-500 font-mono">Line {iss.line}</span>}
                      </div>
                      <p className="text-white text-[11px] mt-0.5">{iss.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AI VECTOR SVG GENERATOR */}
      {activeTab === 'svg' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Vector Graphic Description
            </label>
            <input
              type="text"
              value={svgPrompt}
              onChange={(e) => setSvgPrompt(e.target.value)}
              placeholder="e.g. geometric cyber shield icon with circuit lines"
              className="w-full bg-[#121622] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Visual Style</label>
            <input
              type="text"
              value={svgStyle}
              onChange={(e) => setSvgStyle(e.target.value)}
              placeholder="e.g. minimalist gradient neon outline"
              className="w-full bg-[#121622] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
            />
          </div>

          <button
            onClick={handleGenerateSvg}
            disabled={svgLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shapes className={`w-3.5 h-3.5 ${svgLoading ? 'animate-spin' : ''}`} />
            <span>{svgLoading ? 'Illustrating SVG...' : 'Generate Scalable Vector SVG'}</span>
          </button>

          {generatedSvg && (
            <div className="p-4 rounded-xl bg-[#0d101a] border border-white/10 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white">SVG Preview</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedSvg);
                    setSvgCopied(true);
                    setTimeout(() => setSvgCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5"
                >
                  {svgCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{svgCopied ? 'Copied' : 'Copy SVG'}</span>
                </button>
              </div>

              {/* Rendered SVG Preview */}
              <div
                className="w-full h-44 bg-[#05070c] rounded-xl border border-white/5 flex items-center justify-center p-4 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: generatedSvg }}
              />

              {onCreateNewFile && (
                <button
                  onClick={() => {
                    const cleanName = svgPrompt.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 20) + '.svg';
                    onCreateNewFile(`/assets/${cleanName}`, generatedSvg);
                  }}
                  className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Save as Asset (/assets/icon.svg)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
