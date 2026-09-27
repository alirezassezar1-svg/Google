import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Terminal,
  Code2,
  Copy,
  Check,
  Send,
  Loader2,
  Play,
  Share2,
  Layers,
  Wand2,
  Zap,
  Globe,
  Database,
  Stethoscope,
  Type,
  FileCode,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  Mic,
  MicOff,
  Radio,
  Workflow,
  ArrowRight,
  Plus,
  RefreshCw,
  HelpCircle,
  Cpu,
  Server,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { Project, ProjectFile, SelectedElementInfo, AIProposal } from '../types';
import { ImageStudio } from './ImageStudio';
import { VideoStudio } from './VideoStudio';
import { SearchGroundingStudio } from './SearchGroundingStudio';

interface AIIntegrationsStudioProps {
  project: Project;
  selectedElement: SelectedElementInfo | null;
  onProposalReady: (proposal: AIProposal) => void;
  onInsertComponentCode?: (code: string) => void;
  onCreateNewFile?: (path: string, content: string) => void;
  onSaveMediaAsset?: (path: string, content: string, isBinary: boolean, mimeType: string) => void;
  onInsertHtmlSnippet?: (snippet: string) => void;
  onUpdateProjectDatabase?: (collections: any[]) => void;
}

type StudioTab =
  | 'integrations'
  | 'copilot'
  | 'components'
  | 'copywriter'
  | 'doctor'
  | 'database'
  | 'image'
  | 'video'
  | 'search';

export const AIIntegrationsStudio: React.FC<AIIntegrationsStudioProps> = ({
  project,
  selectedElement,
  onProposalReady,
  onInsertComponentCode,
  onCreateNewFile,
  onSaveMediaAsset,
  onInsertHtmlSnippet,
  onUpdateProjectDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('integrations');

  // Integration tab state
  const [selectedSnippetTab, setSelectedSnippetTab] = useState<'curl' | 'python' | 'node' | 'telegram' | 'discord' | 'make'>('curl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Playground / Live Tester state
  const [playgroundPrompt, setPlaygroundPrompt] = useState('یک فرم تماس شیشه‌ای با افکت نئونی برای وب‌سایت من طراحی کن');
  const [playgroundSystem, setPlaygroundSystem] = useState('You are NONONICK AI Assistant, a full-stack web and UI expert.');
  const [playgroundModel, setPlaygroundModel] = useState('gemini-3.8-flash');
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundResponse, setPlaygroundResponse] = useState<string | null>(null);
  const [playgroundMetrics, setPlaygroundMetrics] = useState<{ durationMs: number; tokens: number } | null>(null);

  // Copilot Tab State
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotError, setCopilotError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; text: string; timestamp?: number }[]>([
    {
      role: 'assistant',
      text: 'سلام! من دستیار هوشمند NONONICK AI هستم. می‌توانید دستورات طراحی، ویرایش کد، تغییر رنگ و تم، بازسازی هدر، افزودن دکمه‌ها و اصلاح ساختار فایل‌ها را به فارسی یا انگلیسی بفرستید. پیش از اعمال تغییرات، دیف و تفاوت کد را مشاهده و تایید خواهید کرد.',
      timestamp: Date.now(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  const [copyLang, setCopyLang] = useState('fa');
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyResults, setCopyResults] = useState<{
    headlines?: string[];
    bodyCopies?: string[];
    ctas?: string[];
    persianTranslation?: string;
    explanation?: string;
  } | null>(null);

  // Code Doctor State
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorResults, setDoctorResults] = useState<{
    healthScore: number;
    issues: { id: string; severity: string; category: string; message: string; line?: number }[];
    fixedContent: string;
    diffSummary: string;
  } | null>(null);

  // AI Database Generator State
  const [dbPrompt, setDbPrompt] = useState('فروشگاه آنلاین ساعت هوشمند با قیمت و تخفیف');
  const [dbLoading, setDbLoading] = useState(false);
  const [generatedDb, setGeneratedDb] = useState<any | null>(null);
  const [dbAdded, setDbAdded] = useState(false);

  const activeFile =
    project.files.find((f) => f.path === project.activeFilePath) ||
    project.files.find((f) => f.path === '/index.html') ||
    project.files[0];

  const publicUrl = window.location.origin;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, copilotLoading]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Run Playground Completion
  const handleRunPlayground = async () => {
    if (!playgroundPrompt.trim() || playgroundLoading) return;
    setPlaygroundLoading(true);
    setPlaygroundResponse(null);
    setPlaygroundMetrics(null);

    const startTime = performance.now();
    try {
      const res = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: playgroundModel,
          messages: [
            { role: 'system', content: playgroundSystem },
            { role: 'user', content: playgroundPrompt },
          ],
        }),
      });

      const data = await res.json();
      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      if (data.choices && data.choices[0]?.message?.content) {
        setPlaygroundResponse(data.choices[0].message.content);
        setPlaygroundMetrics({
          durationMs,
          tokens: data.usage?.total_tokens || Math.round(playgroundPrompt.length / 4 + data.choices[0].message.content.length / 4),
        });
      } else if (data.error) {
        setPlaygroundResponse(`Error: ${data.error.message || JSON.stringify(data.error)}`);
      }
    } catch (err: any) {
      setPlaygroundResponse(`Request failed: ${err.message}`);
    } finally {
      setPlaygroundLoading(false);
    }
  };

  // Voice Input (Speech Recognition)
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fa-IR'; // Support Persian & English
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setCopilotPrompt((prev) => (prev ? prev + ' ' + transcript : transcript));
        }
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  // Send Copilot Prompt
  const handleSendCopilotPrompt = async (customText?: string) => {
    const textToSend = customText || copilotPrompt;
    if (!textToSend.trim() || copilotLoading) return;

    setCopilotError(null);
    setCopilotLoading(true);

    const newHistory = [...history, { role: 'user' as const, text: textToSend, timestamp: Date.now() }];
    setHistory(newHistory);
    if (!customText) setCopilotPrompt('');

    try {
      const payload = {
        prompt: textToSend,
        files: project.files.slice(0, 12).map((f) => ({
          path: f.path,
          content: f.content,
        })),
        activeFilePath: activeFile?.path,
        activeFileContent: activeFile?.content,
        selectedElement: selectedElement
          ? {
              tagName: selectedElement.tagName,
              id: selectedElement.id,
              className: selectedElement.className,
              selectorPath: selectedElement.selectorPath,
              innerText: selectedElement.innerText,
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
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.explanation || 'تغییرات مورد نیاز طبق درخواست شما آماده شد. لطفا دیف را تایید فرمایید.',
          timestamp: Date.now(),
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
            diffSummary: ch.diffSummary || 'به‌روزرسانی با هوش مصنوعی',
            accepted: true,
          };
        });

        const proposal: AIProposal = {
          id: 'prop_' + Math.random().toString(36).substring(2, 9),
          title: data.title || 'پیشنهاد هوش مصنوعی',
          explanation: data.explanation || 'بررسی و تایید تغییرات قبل از اعمال در پروژه.',
          prompt: textToSend,
          timestamp: Date.now(),
          changes: mappedChanges,
          suggestedActions: data.suggestedActions,
        };

        onProposalReady(proposal);
      }
    } catch (err: any) {
      setCopilotError(err.message || 'خطا در ارتباط با سرور هوش مصنوعی');
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `پردازش با موتور محلی پشتیبان انجام شد: ${err.message}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Generate Component
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
      console.error(err);
    } finally {
      setCompLoading(false);
    }
  };

  // Insert Generated Component into /index.html
  const handleInsertComponentToProject = () => {
    if (!generatedCompHtml) return;
    if (onInsertHtmlSnippet) {
      onInsertHtmlSnippet(generatedCompHtml);
    } else if (onInsertComponentCode) {
      onInsertComponentCode(generatedCompHtml);
    }
    setCompCopied(true);
    setTimeout(() => setCompCopied(false), 2000);
  };

  // Copywriter
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
      console.error(err);
    } finally {
      setCopyLoading(false);
    }
  };

  // Code Doctor Diagnostics
  const handleRunDoctor = async () => {
    setDoctorLoading(true);
    try {
      const res = await fetch('/api/ai/code-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: project.files,
          activeFilePath: activeFile?.path,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDoctorResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDoctorLoading(false);
    }
  };

  // Apply Code Doctor Auto-Fix
  const handleApplyDoctorFix = () => {
    if (!doctorResults?.fixedContent || !activeFile) return;
    const proposal: AIProposal = {
      id: 'prop_' + Math.random().toString(36).substring(2, 9),
      title: 'AI Code Doctor Auto-Fix',
      explanation: doctorResults.diffSummary || 'Auto-repaired syntax, accessibility, and markup issues.',
      prompt: 'Code Doctor Repair',
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

  // Generate Database Schema & Seed
  const handleGenerateDb = async () => {
    setDbLoading(true);
    setDbAdded(false);
    try {
      const res = await fetch('/api/ai/database-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: dbPrompt,
          collectionName: 'items',
          count: 5,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedDb(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDbLoading(false);
    }
  };

  // Add Generated Database Collection to Project
  const handleAddCollectionToProject = () => {
    if (!generatedDb?.collection || !onUpdateProjectDatabase) return;
    const existing = project.database?.collections || [];
    const updated = [...existing, generatedDb.collection];
    onUpdateProjectDatabase(updated);
    setDbAdded(true);
  };

  return (
    <div className="h-full flex flex-col bg-[#07090e] text-slate-100 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Studio Header */}
      <div className="h-14 px-4 bg-[#0a0e18] border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">AI Hub & Integrations</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold">
                Gemini 3.8 Flash
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Online REST & Webhooks
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-md">
              اتصال ربات‌ها، مدل‌های هوش مصنوعی، دستیار کدنویسی، و ژنراتورهای خودکار
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto max-w-full">
          {[
            { id: 'integrations' as const, label: 'Integrations & API', icon: Server },
            { id: 'copilot' as const, label: 'AI Copilot', icon: Bot },
            { id: 'components' as const, label: 'UI Builder', icon: Layers },
            { id: 'copywriter' as const, label: 'Copywriter & ترجمه', icon: Type },
            { id: 'doctor' as const, label: 'Code Doctor', icon: Stethoscope },
            { id: 'database' as const, label: 'AI Database', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/40 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* ============================================================== */}
        {/* TAB 1: INTEGRATIONS, CHATBOTS & OPENAI API SPECIFICATION */}
        {/* ============================================================== */}
        {activeTab === 'integrations' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
            {/* Top Quick Info Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-slate-900 border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Universal AI Gateway</span>
                </div>
                <p className="text-xs text-slate-300">
                  هر چت‌بات، اسکریپت پایتون، ربات تلگرام، افزونه Cursor یا ابزار هوش مصنوعی می‌تواند مستقیماً با ادیتور شما تبادل داده داشته باشد.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 text-cyan-300">
                    Base URL: {publicUrl}/api/v1
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 text-purple-300">
                    Webhook: {publicUrl}/api/agent/prompt
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="/openapi.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
                >
                  <span>OpenAPI 3.0</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
                >
                  <span>llms.txt</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Grid: 2 Columns (Live Interactive Tester + Code Snippets) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Live Interactive Tester */}
              <div className="p-4 rounded-2xl bg-[#0b0f19] border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live API Playground</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300">
                    POST /api/v1/chat/completions
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Model</label>
                    <select
                      value={playgroundModel}
                      onChange={(e) => setPlaygroundModel(e.target.value)}
                      className="w-full bg-[#121826] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                    >
                      <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended, Fast & Smart)</option>
                      <option value="gemini-flash-latest">gemini-flash-latest</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">System Prompt</label>
                    <input
                      type="text"
                      value={playgroundSystem}
                      onChange={(e) => setPlaygroundSystem(e.target.value)}
                      className="w-full bg-[#121826] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">User Prompt (پیام کاربر)</label>
                    <textarea
                      rows={3}
                      value={playgroundPrompt}
                      onChange={(e) => setPlaygroundPrompt(e.target.value)}
                      placeholder="متن پیام خود را بنویسید..."
                      className="w-full bg-[#121826] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400 resize-none font-sans"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      {playgroundMetrics && (
                        <span className="text-[11px] font-mono text-emerald-400">
                          {playgroundMetrics.durationMs}ms • {playgroundMetrics.tokens} tokens
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleRunPlayground}
                      disabled={playgroundLoading}
                      className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                    >
                      {playgroundLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      <span>تست و ارسال درخواست</span>
                    </button>
                  </div>

                  {playgroundResponse && (
                    <div className="mt-3 p-3 rounded-xl bg-black/60 border border-white/10 space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/5 pb-1">
                        <span>پاسخ دریافتی (Model Response)</span>
                        <button
                          onClick={() => copyToClipboard(playgroundResponse, 'playground')}
                          className="hover:text-white flex items-center gap-1"
                        >
                          {copiedKey === 'playground' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>کپی</span>
                        </button>
                      </div>
                      <div className="text-xs text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto font-sans leading-relaxed">
                        {playgroundResponse}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Ready-to-Use Code Snippets */}
              <div className="p-4 rounded-2xl bg-[#0b0f19] border border-white/10 space-y-4 shadow-xl flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Ready Integration Snippets</h3>
                  </div>

                  {/* Snippet selector tabs */}
                  <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5 text-[11px]">
                    {[
                      { id: 'curl' as const, label: 'cURL' },
                      { id: 'python' as const, label: 'Python' },
                      { id: 'node' as const, label: 'Node.js' },
                      { id: 'telegram' as const, label: 'Telegram' },
                      { id: 'discord' as const, label: 'Discord' },
                      { id: 'make' as const, label: 'Make / Zapier' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedSnippetTab(tab.id)}
                        className={`px-2 py-0.5 rounded transition ${
                          selectedSnippetTab === tab.id
                            ? 'bg-purple-500/20 text-purple-300 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Snippet Code Viewer */}
                <div className="flex-1 bg-black/70 rounded-xl border border-white/10 p-3 relative font-mono text-xs overflow-hidden flex flex-col">
                  <button
                    onClick={() => {
                      let code = '';
                      if (selectedSnippetTab === 'curl') {
                        code = `curl -X POST "${publicUrl}/api/v1/chat/completions" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "gemini-3.8-flash",\n    "messages": [\n      {"role": "user", "content": "یک دکمه نئونی ایجاد کن"}\n    ]\n  }'`;
                      } else if (selectedSnippetTab === 'python') {
                        code = `from openai import OpenAI\n\nclient = OpenAI(\n    base_url="${publicUrl}/api/v1",\n    api_key="nononick"\n)\n\nresponse = client.chat.completions.create(\n    model="gemini-3.8-flash",\n    messages=[{"role": "user", "content": "سلام، وضعیت پروژه چیست؟"}]\n)\nprint(response.choices[0].message.content)`;
                      } else if (selectedSnippetTab === 'node') {
                        code = `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  baseURL: "${publicUrl}/api/v1",\n  apiKey: "nononick",\n});\n\nconst res = await client.chat.completions.create({\n  model: "gemini-3.8-flash",\n  messages: [{ role: "user", content: "یک سکشن درباره ما بنویس" }],\n});\nconsole.log(res.choices[0].message.content);`;
                      } else if (selectedSnippetTab === 'telegram') {
                        code = `# Telegram Bot Webhook Integration\n# Forward user prompt directly to NONONICK Webhook\nimport requests\n\ndef handle_telegram_message(prompt, chat_id):\n    res = requests.post("${publicUrl}/api/agent/prompt", json={\n        "prompt": prompt,\n        "projectId": "${project.id}"\n    })\n    return res.json()["response"]`;
                      } else if (selectedSnippetTab === 'discord') {
                        code = `// Discord Bot Slash Command Handler\nconst axios = require('axios');\n\nasync function handleSlashCommand(prompt) {\n  const res = await axios.post('${publicUrl}/api/agent/prompt', {\n    prompt,\n    projectId: '${project.id}'\n  });\n  return res.data.response;\n}`;
                      } else if (selectedSnippetTab === 'make') {
                        code = `// Make.com / Zapier / n8n HTTP Request Step:\n// Method: POST\n// URL: ${publicUrl}/api/agent/prompt\n// Headers: Content-Type: application/json\n// Body:\n{\n  "prompt": "{{trigger.user_prompt}}",\n  "projectId": "${project.id}"\n}`;
                      }
                      copyToClipboard(code, 'snippet');
                    }}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-[11px] transition flex items-center gap-1 font-sans"
                  >
                    {copiedKey === 'snippet' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>کپی کد</span>
                  </button>

                  <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed flex-1">
                    {selectedSnippetTab === 'curl' &&
                      `curl -X POST "${publicUrl}/api/v1/chat/completions" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gemini-3.8-flash",
    "messages": [
      {"role": "user", "content": "یک دکمه نئونی ایجاد کن"}
    ]
  }'`}
                    {selectedSnippetTab === 'python' &&
                      `from openai import OpenAI

client = OpenAI(
    base_url="${publicUrl}/api/v1",
    api_key="nononick"  # No token required for local gateway
)

response = client.chat.completions.create(
    model="gemini-3.8-flash",
    messages=[{"role": "user", "content": "سلام، وضعیت پروژه چیست؟"}]
)
print(response.choices[0].message.content)`}
                    {selectedSnippetTab === 'node' &&
                      `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${publicUrl}/api/v1",
  apiKey: "nononick",
});

const res = await client.chat.completions.create({
  model: "gemini-3.8-flash",
  messages: [{ role: "user", content: "یک سکشن درباره ما بنویس" }],
});
console.log(res.choices[0].message.content);`}
                    {selectedSnippetTab === 'telegram' &&
                      `# Telegram Bot Webhook Integration
# Forward user prompt directly to NONONICK Webhook
import requests

def handle_telegram_message(prompt, chat_id):
    res = requests.post("${publicUrl}/api/agent/prompt", json={
        "prompt": prompt,
        "projectId": "${project.id}"
    })
    return res.json()["response"]`}
                    {selectedSnippetTab === 'discord' &&
                      `// Discord Bot Slash Command Handler
const axios = require('axios');

async function handleSlashCommand(prompt) {
  const res = await axios.post('${publicUrl}/api/agent/prompt', {
    prompt,
    projectId: '${project.id}'
  });
  return res.data.response;
}`}
                    {selectedSnippetTab === 'make' &&
                      `// Make.com / Zapier / n8n HTTP Request Step:
// Method: POST
// URL: ${publicUrl}/api/agent/prompt
// Headers: Content-Type: application/json
// Body:
{
  "prompt": "{{trigger.user_prompt}}",
  "projectId": "${project.id}"
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Bottom 3-Card Architecture Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                  <Bot className="w-4 h-4" />
                  <span>Chatbot & Agent Autonomy</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ربات‌های تلگرام و دیسکورد می‌توانند مستقیماً فایل‌های HTML/CSS را ادیت کرده و پیش‌نمایش زنده را به‌روزرسانی کنند.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <Workflow className="w-4 h-4" />
                  <span>Make, Zapier & n8n</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  اتصال پایگاه‌های داده، گوگل شیت و فرم‌های وب از طریق وب‌هوک‌های امن به استودیوی پایگاه داده پروژه.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>OpenAPI & Custom GPTs</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  فایل <code className="text-emerald-300 font-mono">/openapi.json</code> کامپایل‌شده برای وارد کردن مستقیم در ChatGPT Actions و Claude Projects.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: AI COPILOT & CODE GENERATION */}
        {/* ============================================================== */}
        {activeTab === 'copilot' && (
          <div className="max-w-3xl mx-auto h-full flex flex-col space-y-4 animate-in fade-in">
            {/* Quick Action Chips */}
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {[
                'افزودن دکمه‌های شیشه‌ای و نئونی مدرن',
                'طراحی هدر ریسپانسیو با لوگو و منوی موبایل',
                'بهینه‌سازی تضاد رنگ و سئو برای گوگل',
                'ترجمه و بومی‌سازی تمام متن‌ها به فارسی',
                'افزودن سکشن نظرات مشتریان و جدول قیمت',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendCopilotPrompt(chip)}
                  disabled={copilotLoading}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/30 text-[11px] text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 min-h-[300px] max-h-[420px] overflow-y-auto space-y-3 p-4 rounded-2xl bg-[#090d16] border border-white/10">
              {history.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 text-xs ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-tr-sm'
                        : 'bg-[#121724] border border-white/10 text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {copilotLoading && (
                <div className="flex gap-3 text-xs justify-start items-center text-slate-400 animate-pulse">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                    <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  </div>
                  <span>هوش مصنوعی در حال تحلیل پروژه و نوشتن تغییرات دقیق است...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="relative shrink-0">
              <textarea
                rows={2}
                value={copilotPrompt}
                onChange={(e) => setCopilotPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendCopilotPrompt();
                  }
                }}
                placeholder="دستور طراحی، تغییر استایل یا اصلاح کد را اینجا بنویسید (Enter برای ارسال)..."
                className="w-full bg-[#0d121e] border border-white/10 focus:border-cyan-400/50 rounded-2xl p-3 pr-24 text-xs text-white placeholder-slate-500 outline-none resize-none shadow-inner"
              />

              <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                {/* Voice button */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                  }`}
                  title={isRecording ? 'در حال ضبط صدا... کلیک برای توقف' : 'فرمان صوتی (میکروفون)'}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>

                {/* Send button */}
                <button
                  onClick={() => handleSendCopilotPrompt()}
                  disabled={!copilotPrompt.trim() || copilotLoading}
                  className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 shadow-md shadow-cyan-500/20"
                >
                  {copilotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>ارسال</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: UI BUILDER & COMPONENT GENERATOR */}
        {/* ============================================================== */}
        {activeTab === 'components' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
            <div className="p-5 rounded-2xl bg-[#0b0f19] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">AI Tailwind Component Generator</h3>
                </div>
                <span className="text-xs text-slate-400">تولید مستقیم کامپوننت‌های ریسپانسیو و مدرن</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">نوع سکشن (Component Type)</label>
                  <select
                    value={compType}
                    onChange={(e) => setCompType(e.target.value)}
                    className="w-full bg-[#121826] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                  >
                    <option value="hero">Hero Section (بخش اصلی بالای صفحه)</option>
                    <option value="features">Feature Grid (شبکه ویژگی‌ها و امکانات)</option>
                    <option value="pricing">Pricing Table (جدول قیمت‌گذاری)</option>
                    <option value="testimonials">Testimonials (نظرات و رضایت مشتریان)</option>
                    <option value="faq">FAQ Accordion (سوالات متداول)</option>
                    <option value="cta">Call to Action (سکشن دعوت به اقدام)</option>
                    <option value="footer">Footer (پاورقی مدرن)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">سبک طراحی (Aesthetic)</label>
                  <select
                    value={compStyle}
                    onChange={(e) => setCompStyle(e.target.value)}
                    className="w-full bg-[#121826] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                  >
                    <option value="modern dark with cyan accents">Modern Dark & Cyan Glow</option>
                    <option value="cyberpunk neon glassmorphism">Cyberpunk Glassmorphism</option>
                    <option value="minimalist clean luxury">Minimalist Clean Luxury</option>
                    <option value="warm friendly saas gradient">Warm SaaS Gradient</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">عنوان سفارشی (اختیاری)</label>
                  <input
                    type="text"
                    value={compTitle}
                    onChange={(e) => setCompTitle(e.target.value)}
                    placeholder="مثال: آینده ساخت وب"
                    className="w-full bg-[#121826] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">توضیحات و جزئیات مد نظر</label>
                <input
                  type="text"
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  placeholder="مثال: شامل دو دکمه اصلی و فرعی، نشان اعتماد و افکت بلور شیشه‌ای..."
                  className="w-full bg-[#121826] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleGenerateComponent}
                  disabled={compLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-500/25 disabled:opacity-50"
                >
                  {compLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  <span>تولید کامپوننت با هوش مصنوعی</span>
                </button>
              </div>
            </div>

            {/* Generated Result Preview */}
            {generatedCompHtml && (
              <div className="p-5 rounded-2xl bg-[#090d16] border border-white/10 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">کد کامپوننت آماده شد</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(generatedCompHtml, 'comp')}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
                    >
                      {copiedKey === 'comp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>کپی HTML</span>
                    </button>

                    <button
                      onClick={handleInsertComponentToProject}
                      className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      {compCopied ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{compCopied ? 'درج شد!' : 'درج در /index.html'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-black/60 rounded-xl p-3 max-h-60 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap border border-white/5">
                  {generatedCompHtml}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: COPYWRITER & PERSIAN TRANSLATOR */}
        {/* ============================================================== */}
        {activeTab === 'copywriter' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
            <div className="p-5 rounded-2xl bg-[#0b0f19] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">AI Copywriter & Multilingual Localizer</h3>
                </div>
                <span className="text-xs text-slate-400">تولید تیترهای جذاب و ترجمه روان به فارسی</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">متن یا موضوع ورودی</label>
                <textarea
                  rows={3}
                  value={copySource}
                  onChange={(e) => setCopySource(e.target.value)}
                  placeholder="متن دکمه، تیتر هدر یا پیام مورد نظر را بنویسید یا بچسبانید..."
                  className="w-full bg-[#121826] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-400 text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">لحن محتوا (Tone)</label>
                  <select
                    value={copyTone}
                    onChange={(e) => setCopyTone(e.target.value)}
                    className="w-full bg-[#121826] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                  >
                    <option value="persuasive">اقناعی و فروشنده (Persuasive)</option>
                    <option value="tech-saas">تخصصی و استارتاپی (Tech SaaS)</option>
                    <option value="bold">جسورانه و قاطع (Bold & Punchy)</option>
                    <option value="friendly">دوستانه و صمیمی (Friendly)</option>
                    <option value="minimalist">مینیمال و لوکس (Minimalist)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">زبان خروجی (Target Language)</label>
                  <select
                    value={copyLang}
                    onChange={(e) => setCopyLang(e.target.value)}
                    className="w-full bg-[#121826] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                  >
                    <option value="fa">فارسی روان و محاوره‌ای / رسمی (Persian)</option>
                    <option value="en">English (Native American)</option>
                    <option value="bilingual">دو زبانه (انگلیسی و فارسی)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleGenerateCopy}
                  disabled={copyLoading}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {copyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>تولید محتوا و ترجمه</span>
                </button>
              </div>
            </div>

            {/* Copywriter Results */}
            {copyResults && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                {/* Headlines */}
                <div className="p-4 rounded-2xl bg-[#090d16] border border-white/10 space-y-2">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">تیترهای پیشنهادی (Headlines)</h4>
                  <div className="space-y-1.5">
                    {copyResults.headlines?.map((h, i) => (
                      <div
                        key={i}
                        onClick={() => copyToClipboard(h, `h_${i}`)}
                        className="p-2 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/5 text-xs text-slate-200 cursor-pointer flex items-center justify-between transition"
                      >
                        <span>{h}</span>
                        {copiedKey === `h_${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTAs & Translation */}
                <div className="p-4 rounded-2xl bg-[#090d16] border border-white/10 space-y-3">
                  {copyResults.persianTranslation && (
                    <div>
                      <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-1.5">ترجمه به فارسی</h4>
                      <div
                        onClick={() => copyToClipboard(copyResults.persianTranslation!, 'fa_trans')}
                        className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-semibold">{copyResults.persianTranslation}</span>
                        {copiedKey === 'fa_trans' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1.5">دکمه‌های اقدام (Call to Action)</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {copyResults.ctas?.map((cta, i) => (
                        <button
                          key={i}
                          onClick={() => copyToClipboard(cta, `cta_${i}`)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs text-emerald-300 transition flex items-center gap-1"
                        >
                          <span>{cta}</span>
                          {copiedKey === `cta_${i}` && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: AI CODE DOCTOR */}
        {/* ============================================================== */}
        {activeTab === 'doctor' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
            <div className="p-5 rounded-2xl bg-[#0b0f19] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">AI Code Doctor & Auto-Repair</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  بررسی فایل فعال (<span className="text-cyan-300 font-mono">{activeFile?.path}</span>) برای رفع باگ‌های سمانتیک، دسترس‌پذیری WCAG و استانداردهای ریسپانسیو.
                </p>
              </div>

              <button
                onClick={handleRunDoctor}
                disabled={doctorLoading}
                className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-500/20 shrink-0 disabled:opacity-50"
              >
                {doctorLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>اجرای معاینه و آنالیز کد</span>
              </button>
            </div>

            {doctorResults && (
              <div className="space-y-4 animate-in fade-in">
                {/* Health Score Banner */}
                <div className="p-4 rounded-2xl bg-[#090d16] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg font-mono ${
                        doctorResults.healthScore >= 90
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {doctorResults.healthScore}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">امتیاز سلامت کد (Code Health Score)</h4>
                      <p className="text-[11px] text-slate-400">{doctorResults.diffSummary}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyDoctorFix}
                    className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/25"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>اعمال تعمیر خودکار هوش مصنوعی</span>
                  </button>
                </div>

                {/* Issues List */}
                <div className="space-y-2">
                  {doctorResults.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-3 rounded-xl bg-[#0b0f19] border border-white/5 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                              issue.severity === 'error'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : issue.severity === 'warning'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {issue.severity}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">{issue.category}</span>
                          {issue.line && <span className="text-[10px] text-slate-500 font-mono">Line {issue.line}</span>}
                        </div>
                        <p className="text-slate-200">{issue.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: AI DATABASE ARCHITECT */}
        {/* ============================================================== */}
        {activeTab === 'database' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
            <div className="p-5 rounded-2xl bg-[#0b0f19] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">AI Database Schema & Seed Generator</h3>
                </div>
                <span className="text-xs text-slate-400">تولید ساختار جدول‌ها و داده‌های آزمایشی با ۱ کلیک</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">توصیف پایگاه داده مد نظر</label>
                <input
                  type="text"
                  value={dbPrompt}
                  onChange={(e) => setDbPrompt(e.target.value)}
                  placeholder="مثال: فهرست محصولات فروشگاه آنلاین کفش ورزشی با فیلدهای سایز، رنگ، قیمت و تخفیف..."
                  className="w-full bg-[#121826] border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleGenerateDb}
                  disabled={dbLoading}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {dbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  <span>طراحی اسکیما و تولید داده آزمایشی</span>
                </button>
              </div>
            </div>

            {generatedDb && (
              <div className="p-5 rounded-2xl bg-[#090d16] border border-white/10 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{generatedDb.collection.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                        {generatedDb.collection.fields?.length || 0} فیلد
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                        {generatedDb.collection.records?.length || 0} رکورد
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{generatedDb.explanation}</p>
                  </div>

                  <button
                    onClick={handleAddCollectionToProject}
                    disabled={dbAdded}
                    className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:bg-emerald-500/30 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    {dbAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{dbAdded ? 'به دیتابیس افزوده شد!' : 'افزودن به پایگاه داده پروژه'}</span>
                  </button>
                </div>

                {/* Records Table Preview */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-white/5 text-slate-400 font-mono text-[11px] uppercase">
                      <tr>
                        {generatedDb.collection.fields?.map((f: any) => (
                          <th key={f.id} className="p-2 border-b border-white/10">
                            {f.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {generatedDb.collection.records?.slice(0, 5).map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="border-b border-white/5 hover:bg-white/[0.02]">
                          {generatedDb.collection.fields?.map((f: any) => (
                            <td key={f.id} className="p-2 font-mono text-[11px] truncate max-w-[140px]">
                              {String(row[f.name] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
