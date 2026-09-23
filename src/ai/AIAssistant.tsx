import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Wand2,
  FileCode,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Bug,
  Layout,
  Smartphone,
  Eye,
} from 'lucide-react';
import { Project, ProjectFile, SelectedElementInfo, AIProposal } from '../types';

interface AIAssistantProps {
  project: Project;
  selectedElement: SelectedElementInfo | null;
  onProposalReady: (proposal: AIProposal) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  project,
  selectedElement,
  onProposalReady,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: "I am NONONICK AI. I can generate code, refactor layouts, fix responsive issues, and optimize your web files. I will always show you a code diff to review before anything is changed.",
    },
  ]);

  const activeFile =
    project.files.find((f) => f.path === project.activeFilePath) ||
    project.files.find((f) => f.path === '/index.html') ||
    project.files[0];

  const handleSendPrompt = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() || loading) return;

    setError(null);
    setLoading(true);

    const newHistory = [...history, { role: 'user' as const, text: textToSend }];
    setHistory(newHistory);
    if (!customPrompt) setPrompt('');

    try {
      // Prepare compact project context
      const fileTreeSummary = project.files.map((f) => ({
        path: f.path,
        size: f.size,
        type: f.type,
      }));

      const payload = {
        prompt: textToSend,
        activeFilePath: activeFile?.path,
        activeFileContent: activeFile?.content,
        fileTree: fileTreeSummary,
        selectedElement: selectedElement
          ? {
              tagName: selectedElement.tagName,
              id: selectedElement.id,
              className: selectedElement.className,
              selectorPath: selectedElement.selectorPath,
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
        // Map changes and ensure oldContent is present
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

        onProposalReady(proposal);
      }
    } catch (err: any) {
      console.error('AI assistant error:', err);
      setError(err.message || 'Failed to complete request');
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Request notice: ${err.message}. If the Gemini API is offline or unconfigured, you can continue visual editing, manual coding, and ZIP exporting seamlessly.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK_ACTIONS = [
    { label: 'Glassmorphic Styling', prompt: 'Convert current UI cards and headers to modern frosted glassmorphic styling with cyan glow accents.' },
    { label: 'Responsive for iPhone', prompt: 'Optimize layout and typography for mobile screens with touch-friendly spacing and responsive navigation.' },
    { label: 'Hero Section', prompt: 'Create an engaging futuristic hero section with high-contrast headline, badge, and CTA buttons.' },
    { label: 'Validate & Clean HTML', prompt: 'Inspect index.html, fix any unclosed tags or syntax issues, and format clean semantic code.' },
  ];

  return (
    <div className="h-full flex flex-col glass-panel rounded-xl overflow-hidden border border-white/5 text-xs">
      {/* Top Header */}
      <div className="p-3 border-b border-white/5 bg-[#090c14] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white flex items-center gap-1.5">
              NONONICK AI
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">2.5 PRO</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Approval Guard On</span>
        </div>
      </div>

      {/* Selected Element Notice Banner if element selected */}
      {selectedElement && (
        <div className="px-3 py-2 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center justify-between text-[11px] text-cyan-200">
          <span className="truncate">Target: &lt;{selectedElement.tagName.toLowerCase()}&gt; {selectedElement.className ? `.${selectedElement.className.split(' ')[0]}` : ''}</span>
          <span className="text-[10px] text-cyan-400 font-mono">Scoped</span>
        </div>
      )}

      {/* Chat Messages Scroll Area */}
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

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 w-fit">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Analyzing project & generating safe diff...</span>
          </div>
        )}
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            placeholder={selectedElement ? `Instruct AI on <${selectedElement.tagName.toLowerCase()}>...` : "Ask AI to edit, design, or create..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            className="w-full bg-[#121622] border border-white/15 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="absolute right-1.5 p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
