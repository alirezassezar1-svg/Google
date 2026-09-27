import React, { useState } from 'react';
import {
  Globe,
  Search,
  ExternalLink,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Code,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Shield,
  Layers,
} from 'lucide-react';
import { Project } from '../types';

interface SearchGroundingStudioProps {
  project: Project;
  onInsertHtmlSnippet?: (snippet: string) => void;
  onProposalReady?: (proposal: any) => void;
}

interface GroundingSource {
  title: string;
  url: string;
}

export const SearchGroundingStudio: React.FC<SearchGroundingStudioProps> = ({
  project,
  onInsertHtmlSnippet,
  onProposalReady,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);

  // Suggested technical research queries
  const RESEARCH_IDEAS = [
    'جدیدترین استانداردهای Core Web Vitals گوگل در سال ۲۰۲۶ و نحوه بهینه‌سازی',
    'Tailwind CSS v4 modern utility classes for fluid typography and color tokens',
    'Best practices for PWA install prompt and offline caching strategies 2026',
    'Modern glassmorphism and bento grid layout best practices with Tailwind CSS',
    'Persian web fonts optimization: Vazirmatn and Shabnam subsetting for fast FCP',
  ];

  const handleSearch = async (searchPrompt?: string) => {
    const q = searchPrompt || query;
    if (!q.trim() || loading) return;

    setError(null);
    setLoading(true);
    setInserted(false);

    try {
      const res = await fetch('/api/ai/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          task: 'research',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to search Google');
      }

      const data = await res.json();
      setResultText(data.text);
      setSources(data.sources || []);
      setSearchQueries(data.searchQueries || [q]);
    } catch (err: any) {
      console.error('Search grounding error:', err);
      setError(err.message || 'خطا در برقراری ارتباط با سرویس سرچ گوگل');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsertAsComment = () => {
    if (!resultText || !onInsertHtmlSnippet) return;

    // Check if response contains code block
    const codeBlockMatch = resultText.match(/```(?:html|css|javascript|typescript)?([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      onInsertHtmlSnippet(`\n${codeBlockMatch[1].trim()}\n`);
    } else {
      const formattedSnippet = `\n<!-- Google Grounded Research Note:\n${resultText.slice(0, 300)}...\n-->\n`;
      onInsertHtmlSnippet(formattedSnippet);
    }

    setInserted(true);
    setTimeout(() => setInserted(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#07090f] text-slate-200 text-xs">
      {/* Header Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/20 to-emerald-950/40 border border-blue-500/20 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm">سرچ گوگل و داده‌های آنلاین (Search Grounding)</h3>
          </div>
          <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
            دسترسی مستقیم به داده‌ها و اسناد به‌روز وب با استفاده از مدل <strong>gemini-3.5-flash</strong> و ابزار <strong>Google Search Grounding</strong>.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold shrink-0">
          GOOGLE GROUNDED
        </span>
      </div>

      {/* Search Input */}
      <div className="space-y-1.5">
        <label className="font-semibold text-white flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-blue-400" />
          <span>جستجو و تحقیق آنلاین در گوگل:</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="مثال: آخرین متدهای Tailwind v4، بهینه‌سازی سرعت PWA یا ترندهای طراحی وب ۲۰۲۶..."
            className="flex-1 bg-[#0d101a] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition cursor-pointer shrink-0 ${
              loading || !query.trim()
                ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-500/20'
            }`}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>جستجو</span>
          </button>
        </div>

        {/* Suggested Research Prompts */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {RESEARCH_IDEAS.map((idea, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(idea);
                handleSearch(idea);
              }}
              className="text-[10px] px-2 py-1 rounded-lg bg-white/5 hover:bg-blue-500/10 hover:text-blue-300 text-slate-400 border border-white/5 transition truncate max-w-sm text-left cursor-pointer"
            >
              🔍 {idea}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3 text-blue-200">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold block text-white">در حال جستجوی بلادرنگ وب با Google Search...</span>
            <span className="text-[11px] text-blue-300">دریافت و سنتز نتایج موثق با مدل gemini-3.5-flash</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Grounded Results */}
      {resultText && !loading && (
        <div className="space-y-3 animate-in fade-in zoom-in-95">
          {/* Grounding Sources Badges */}
          {sources.length > 0 && (
            <div className="p-3 rounded-xl bg-[#0b0e18] border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>منابع مستند گوگل (Google Grounded Citations):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-blue-500/20 text-cyan-300 hover:text-cyan-200 border border-white/10 transition text-[10px] max-w-xs truncate"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{src.title || src.url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Search Queries Executed */}
          {searchQueries.length > 0 && (
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="font-mono">کوئری‌های اجرا شده:</span>
              {searchQueries.map((sq, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 font-mono text-slate-300">
                  {sq}
                </span>
              ))}
            </div>
          )}

          {/* Answer Markdown/Text Card */}
          <div className="p-4 rounded-2xl bg-[#0b0e18] border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>پاسخ تحلیل‌شده با داده‌های زنده وب</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1 text-[10px] cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'کپی شد' : 'کپی متن'}</span>
                </button>

                {onInsertHtmlSnippet && (
                  <button
                    onClick={handleInsertAsComment}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 transition flex items-center gap-1 text-[10px] cursor-pointer"
                  >
                    {inserted ? <Check className="w-3 h-3 text-emerald-400" /> : <Code className="w-3 h-3" />}
                    <span>{inserted ? 'درج شد' : 'درج کد در پروژه'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans max-h-96 overflow-y-auto custom-scrollbar pr-1">
              {resultText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
