import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  Code2,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Gauge,
  Activity,
  Zap,
  Download,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  MousePointerClick,
  ChevronRight,
  Database,
  ExternalLink,
} from 'lucide-react';
import { Project, ProjectAnalytics, AIAnalyticsInsight } from '../types';

interface AnalyticsStudioProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onInjectTrackerToProject?: () => void;
  onApplyCodePatch?: (filePath: string, patch: string, description: string) => void;
}

export const AnalyticsStudio: React.FC<AnalyticsStudioProps> = ({
  project,
  isOpen,
  onClose,
  onInjectTrackerToProject,
  onApplyCodePatch,
}) => {
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [chartMetric, setChartMetric] = useState<'views' | 'visitors'>('views');
  const [showEmbedSnippet, setShowEmbedSnippet] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [trackerInjected, setTrackerInjected] = useState(false);
  const [isAiAuditing, setIsAiAuditing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [appliedPatches, setAppliedPatches] = useState<Record<string, boolean>>({});

  // Check if project already has tracking script in index.html
  useEffect(() => {
    const indexHtml = project.files.find((f) => f.path === '/index.html')?.content || '';
    setTrackerInjected(indexHtml.includes('/api/analytics/tracker.js'));
  }, [project.files]);

  // Fetch project analytics
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/project/${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen, project.id]);

  if (!isOpen) return null;

  const trackerScriptSnippet = `<script src="/api/analytics/tracker.js" data-project-id="${project.id}" defer></script>`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(trackerScriptSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleInjectTracker = () => {
    if (onInjectTrackerToProject) {
      onInjectTrackerToProject();
      setTrackerInjected(true);
      setShowEmbedSnippet(false);
    }
  };

  const handleRunAiAudit = async () => {
    setIsAiAuditing(true);
    try {
      const res = await fetch('/api/ai/analytics-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, analytics }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) setAiSummary(data.summary);
        if (data.insights && analytics) {
          setAnalytics({
            ...analytics,
            aiInsights: data.insights,
          });
        }
      }
    } catch (err) {
      console.error('AI Analytics Audit failed:', err);
    } finally {
      setIsAiAuditing(false);
    }
  };

  const handleExportData = () => {
    if (!analytics) return;
    const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\\s+/g, '_')}_analytics.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Chart data calculations
  const historyData = analytics?.history || [];
  const maxChartValue = Math.max(
    ...historyData.map((d) => (chartMetric === 'views' ? d.views : d.visitors)),
    10
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-6xl h-[92vh] bg-[#090b11] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 text-xs">
        {/* Top Header */}
        <div className="p-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#0c0f17] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Analytics & Telemetry Studio
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE • {analytics?.activeNow || 3} active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Performance, visitor acquisition, Core Web Vitals, and Gemini Growth Copilot for{' '}
                <span className="text-white font-medium">{project.name}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time range switcher */}
            <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-0.5">
              {(['24h', '7d', '30d', 'all'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition ${
                    timeRange === r
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowEmbedSnippet(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                trackerInjected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
              }`}
              title="View or inject tracking script snippet"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{trackerInjected ? 'Tracker Injected' : 'Embed Tracker'}</span>
            </button>

            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExportData}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition cursor-pointer"
              title="Export analytics as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Studio Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Total Pageviews */}
            <div className="p-4 rounded-2xl bg-[#0f131f] border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-medium">Total Pageviews</span>
                <Eye className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono">
                  {analytics?.totalPageViews.toLocaleString() || '1,420'}
                </span>
                <span className="inline-flex items-center text-[11px] text-emerald-400 font-medium">
                  <ArrowUpRight className="w-3 h-3" /> +18.4%
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">vs previous period</span>
            </div>

            {/* Unique Visitors */}
            <div className="p-4 rounded-2xl bg-[#0f131f] border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-medium">Unique Visitors</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono">
                  {analytics?.uniqueVisitors.toLocaleString() || '980'}
                </span>
                <span className="inline-flex items-center text-[11px] text-emerald-400 font-medium">
                  <ArrowUpRight className="w-3 h-3" /> +14.2%
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">69% return visitor rate</span>
            </div>

            {/* Avg Session Duration */}
            <div className="p-4 rounded-2xl bg-[#0f131f] border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-medium">Avg Dwell Time</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono">
                  {Math.floor((analytics?.avgSessionDurationSec || 142) / 60)}m{' '}
                  {(analytics?.avgSessionDurationSec || 142) % 60}s
                </span>
                <span className="inline-flex items-center text-[11px] text-emerald-400 font-medium">
                  <ArrowUpRight className="w-3 h-3" /> +8.6%
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">High attention index</span>
            </div>

            {/* Bounce Rate */}
            <div className="p-4 rounded-2xl bg-[#0f131f] border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-medium">Bounce Rate</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono">
                  {analytics?.bounceRate || 36.8}%
                </span>
                <span className="inline-flex items-center text-[11px] text-emerald-400 font-medium">
                  <ArrowDownRight className="w-3 h-3" /> -4.1%
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">Industry avg: 45-55%</span>
            </div>

            {/* Live Active Now */}
            <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-[#0f131f] to-cyan-950/20 border border-emerald-500/20 relative overflow-hidden">
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                <span className="text-[11px] font-semibold">Active Sessions</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-300 font-mono">
                  {analytics?.activeNow || 4}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">online now</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">Real-time telemetry stream</span>
            </div>
          </div>

          {/* Interactive Chart Section */}
          <div className="p-5 rounded-2xl bg-[#0f131f] border border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Traffic Volume & Engagement Over Time
                </h3>
                <p className="text-slate-400 text-[11px]">
                  Daily telemetry breakdown over selected window
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-white/5 border border-white/10 p-0.5">
                  <button
                    onClick={() => setChartMetric('views')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      chartMetric === 'views'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Pageviews
                  </button>
                  <button
                    onClick={() => setChartMetric('visitors')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      chartMetric === 'visitors'
                        ? 'bg-purple-500 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Visitors
                  </button>
                </div>
              </div>
            </div>

            {/* Custom SVG Bar & Trend Chart */}
            <div className="h-48 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-white/10">
              {historyData.map((item, idx) => {
                const val = chartMetric === 'views' ? item.views : item.visitors;
                const heightPercent = Math.max(12, Math.round((val / maxChartValue) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none bg-slate-900 border border-white/20 px-2 py-1 rounded-lg text-[10px] text-white shadow-xl z-20 whitespace-nowrap">
                      <span className="font-bold">{val}</span> {chartMetric} on {item.date}
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[48px] rounded-t-lg transition-all duration-300 ${
                        chartMetric === 'views'
                          ? 'bg-gradient-to-t from-cyan-600/50 via-cyan-500/80 to-cyan-300 group-hover:from-cyan-500 group-hover:to-cyan-200'
                          : 'bg-gradient-to-t from-purple-600/50 via-purple-500/80 to-purple-300 group-hover:from-purple-500 group-hover:to-purple-200'
                      }`}
                    ></div>
                    <span className="text-[10px] text-slate-400 mt-2 font-mono">{item.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core Web Vitals & Real-Time Performance Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* LCP */}
            <div className="p-4 rounded-2xl bg-[#0f131f] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  LCP (Largest Contentful Paint)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                  GOOD
                </span>
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-3xl font-black text-white font-mono">
                  {analytics?.webVitals.lcp.value || 1.42}
                </span>
                <span className="text-xs text-slate-400 font-mono">s</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Target: {analytics?.webVitals.lcp.target || '< 2.5s'}. Fast image & font delivery.
              </p>
            </div>

            {/* FID / INP */}
            <div className="p-4 rounded-2xl bg-[#0f131f] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  FID / INP (Interactivity)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                  GOOD
                </span>
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-3xl font-black text-white font-mono">
                  {analytics?.webVitals.fid.value || 18}
                </span>
                <span className="text-xs text-slate-400 font-mono">ms</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '18%' }}></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Target: {analytics?.webVitals.fid.target || '< 100ms'}. Responsive main-thread execution.
              </p>
            </div>

            {/* CLS */}
            <div className="p-4 rounded-2xl bg-[#0f131f] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  CLS (Layout Shift)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                  GOOD
                </span>
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-3xl font-black text-white font-mono">
                  {analytics?.webVitals.cls.value || 0.024}
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '24%' }}></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Target: {analytics?.webVitals.cls.target || '< 0.1'}. Zero annoying layout jumps.
              </p>
            </div>

            {/* TTFB */}
            <div className="p-4 rounded-2xl bg-[#0f131f] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  TTFB (Server Response)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                  GOOD
                </span>
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-3xl font-black text-white font-mono">
                  {analytics?.webVitals.ttfb.value || 210}
                </span>
                <span className="text-xs text-slate-400 font-mono">ms</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '28%' }}></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Target: {analytics?.webVitals.ttfb.target || '< 800ms'}. Edge routing & cache hit.
              </p>
            </div>
          </div>

          {/* Gemini AI Analytics Copilot & Actionable Insights */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/20 via-[#0f131f] to-cyan-950/20 border border-purple-500/20">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Gemini AI Growth & Conversion Copilot</h3>
                  <p className="text-slate-400 text-[11px]">
                    Autonomous telemetry analysis with code recommendations
                  </p>
                </div>
              </div>

              <button
                onClick={handleRunAiAudit}
                disabled={isAiAuditing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiAuditing ? 'animate-spin' : ''}`} />
                <span>{isAiAuditing ? 'Auditing Telemetry...' : 'Run Gemini AI Audit'}</span>
              </button>
            </div>

            {aiSummary && (
              <div className="p-3 mb-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs">
                <span className="font-semibold block text-white mb-0.5">Gemini Executive Summary:</span>
                {aiSummary}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(analytics?.aiInsights || []).map((ins) => (
                <div
                  key={ins.id}
                  className="p-3.5 rounded-xl bg-[#090c14] border border-white/5 hover:border-purple-500/30 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[10px] font-mono uppercase font-bold">
                        {ins.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ins.impact === 'high'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {ins.impact.toUpperCase()} IMPACT
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-xs mb-1">{ins.title}</h4>
                    <p className="text-[11px] text-slate-400 mb-2">{ins.finding}</p>

                    <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-[11px] text-slate-300 mb-3">
                      <span className="font-semibold text-cyan-300 block mb-0.5">Recommended Action:</span>
                      {ins.action}
                    </div>
                  </div>

                  {ins.suggestedCodePatch && onApplyCodePatch && (
                    <button
                      onClick={() => {
                        onApplyCodePatch(
                          ins.suggestedCodePatch!.filePath,
                          ins.suggestedCodePatch!.patch,
                          ins.suggestedCodePatch!.description
                        );
                        setAppliedPatches((prev) => ({ ...prev, [ins.id]: true }));
                      }}
                      disabled={appliedPatches[ins.id]}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        appliedPatches[ins.id]
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {appliedPatches[ins.id] ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Patch Applied</span>
                        </>
                      ) : (
                        <>
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Apply Optimization Patch</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown Grids: Devices, Browsers, Referrers, Top Pages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Devices Breakdown */}
            <div className="p-4 rounded-2xl bg-[#0f131f] border border-white/5">
              <h4 className="font-bold text-white text-xs mb-3 flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                Device Distribution
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Smartphone className="w-3 h-3 text-cyan-400" /> Mobile
                    </span>
                    <span className="font-mono text-white font-bold">
                      {analytics?.deviceBreakdown.mobile || 56}%
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div
                      className="bg-cyan-400 h-1.5 rounded-full"
                      style={{ width: `${analytics?.deviceBreakdown.mobile || 56}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Monitor className="w-3 h-3 text-purple-400" /> Desktop
                    </span>
                    <span className="font-mono text-white font-bold">
                      {analytics?.deviceBreakdown.desktop || 38}%
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div
                      className="bg-purple-400 h-1.5 rounded-full"
                      style={{ width: `${analytics?.deviceBreakdown.desktop || 38}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Tablet className="w-3 h-3 text-amber-400" /> Tablet
                    </span>
                    <span className="font-mono text-white font-bold">
                      {analytics?.deviceBreakdown.tablet || 6}%
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div
                      className="bg-amber-400 h-1.5 rounded-full"
                      style={{ width: `${analytics?.deviceBreakdown.tablet || 6}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Traffic Referrers */}
            <div className="p-4 rounded-2xl bg-[#0f131f] border border-white/5">
              <h4 className="font-bold text-white text-xs mb-3 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Traffic Acquisition Channels
              </h4>
              <div className="space-y-2.5">
                {(analytics?.topReferrers || []).map((ref, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 truncate max-w-[150px]">{ref.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[10px]">
                        {ref.visitors} visits
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-cyan-300 font-mono font-bold text-[10px]">
                        {ref.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Visited Pages */}
            <div className="p-4 rounded-2xl bg-[#0f131f] border border-white/5">
              <h4 className="font-bold text-white text-xs mb-3 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                Top Visited Routes & Sections
              </h4>
              <div className="space-y-2.5">
                {(analytics?.topPages || []).map((pg, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-cyan-300 truncate max-w-[140px]">
                      {pg.path}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 font-mono font-semibold">
                        {pg.views.toLocaleString()} views
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {pg.bounceRate}% bounce
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Events Log Stream */}
          <div className="p-4 rounded-2xl bg-[#0f131f] border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <MousePointerClick className="w-3.5 h-3.5 text-amber-400" />
                Live Event & Interaction Feed
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                Recent user telemetry pings
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar font-mono text-[11px]">
              {analytics?.recentEvents && analytics.recentEvents.length > 0 ? (
                analytics.recentEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          evt.type === 'click'
                            ? 'bg-amber-500/10 text-amber-400'
                            : evt.type === 'web_vital'
                            ? 'bg-purple-500/10 text-purple-400'
                            : 'bg-cyan-500/10 text-cyan-400'
                        }`}
                      >
                        {evt.type}
                      </span>
                      <span className="text-slate-300 truncate">{evt.label}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-slate-500 text-[10px]">
                      <span className="text-slate-400">{evt.path}</span>
                      <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs font-sans">
                  No custom events recorded yet. Click or navigate in preview to trigger live telemetry!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Embed Snippet Drawer Modal */}
        {showEmbedSnippet && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-xl bg-[#0d101a] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm">Embed NONONICK Analytics Tracker</h3>
                </div>
                <button
                  onClick={() => setShowEmbedSnippet(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Add this lightweight cookieless telemetry script to your project&apos;s{' '}
                <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300">&lt;head&gt;</code>{' '}
                or before <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300">&lt;/body&gt;</code>.
                It tracks real pageviews, dwell time, button clicks, and Core Web Vitals without third-party cookies.
              </p>

              <div className="p-3 bg-black/60 rounded-xl border border-white/10 relative font-mono text-xs text-cyan-300 select-all overflow-x-auto">
                {trackerScriptSnippet}
              </div>

              <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-white/5">
                <button
                  onClick={handleCopySnippet}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition cursor-pointer"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet ? 'Copied to Clipboard' : 'Copy Snippet'}</span>
                </button>

                {onInjectTrackerToProject && (
                  <button
                    onClick={handleInjectTracker}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Auto-Inject into index.html</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
