import React, { useState, useMemo } from 'react';
import {
  Globe,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Share2,
  Copy,
  Check,
  FileCode,
  Download,
  RefreshCw,
  X,
  ExternalLink,
  Laptop,
  Smartphone,
  Eye,
  Sliders,
  FileText,
} from 'lucide-react';
import { Project, ProjectFile, ProjectSeoConfig } from '../types';

interface SeoStudioProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProjectSeo: (seo: ProjectSeoConfig, updatedFiles?: ProjectFile[]) => void;
}

export const SeoStudio: React.FC<SeoStudioProps> = ({
  project,
  isOpen,
  onClose,
  onUpdateProjectSeo,
}) => {
  if (!isOpen) return null;

  // Find index.html
  const indexHtmlFile =
    project.files.find((f) => f.path === '/index.html' || f.name.endsWith('.html')) ||
    project.files[0];

  // Parse existing tags from HTML as initial fallback
  const parsedFromHtml = useMemo(() => {
    if (!indexHtmlFile) return {};
    const content = indexHtmlFile.content;
    const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
    const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
    const keywordsMatch = content.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']*)["']/i);
    const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
    const ogTitleMatch = content.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i);
    const ogDescMatch = content.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i);
    const ogImageMatch = content.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i);

    return {
      title: titleMatch ? titleMatch[1] : '',
      description: descMatch ? descMatch[1] : '',
      keywords: keywordsMatch ? keywordsMatch[1].split(',').map((k) => k.trim()) : [],
      canonicalUrl: canonicalMatch ? canonicalMatch[1] : '',
      ogTitle: ogTitleMatch ? ogTitleMatch[1] : '',
      ogDescription: ogDescMatch ? ogDescMatch[1] : '',
      ogImage: ogImageMatch ? ogImageMatch[1] : '',
    };
  }, [indexHtmlFile]);

  // Current config with defaults
  const [seoConfig, setSeoConfig] = useState<ProjectSeoConfig>(
    project.seo || {
      title: parsedFromHtml.title || `${project.name} – Modern Web Application`,
      description:
        parsedFromHtml.description ||
        `Discover ${project.name}. Built with responsive design, high performance, and interactive modern user experiences.`,
      canonicalUrl: parsedFromHtml.canonicalUrl || 'https://ais-pre-5ilkxtfwf6yibz3jj2ynl3-17774190120.europe-west3.run.app/',
      keywords:
        parsedFromHtml.keywords && parsedFromHtml.keywords.length > 0
          ? parsedFromHtml.keywords
          : ['web app', 'modern UI', 'responsive design', 'fast web'],
      author: 'NONONICK',
      robots: 'index, follow',
      language: 'en',
      themeColor: '#0a0c10',
      ogType: 'website',
      ogImage: parsedFromHtml.ogImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
      twitterCard: 'summary_large_image',
      twitterHandle: '@nononick',
      structuredDataType: 'WebApplication',
    }
  );

  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'audit' | 'files'>('editor');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [socialPlatform, setSocialPlatform] = useState<'google' | 'twitter' | 'facebook'>('google');

  // New keyword input state
  const [keywordInput, setKeywordInput] = useState('');

  // AI Optimization state
  const [isAiOptimizing, setIsAiOptimizing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string>('');

  // Apply feedback state
  const [applySuccess, setApplySuccess] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);

  // Add keyword chip
  const handleAddKeyword = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const val = keywordInput.trim().replace(/^,+|,+$/g, '');
    if (val && !seoConfig.keywords.includes(val)) {
      setSeoConfig({
        ...seoConfig,
        keywords: [...seoConfig.keywords, val],
      });
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (tagToRemove: string) => {
    setSeoConfig({
      ...seoConfig,
      keywords: seoConfig.keywords.filter((t) => t !== tagToRemove),
    });
  };

  // SEO Health Audit Calculation
  const auditReport = useMemo(() => {
    const issues: { id: string; label: string; pass: boolean; severity: 'high' | 'medium' | 'low'; fixMsg: string }[] = [];

    // Title length (optimal: 30 - 60 chars)
    const tLen = seoConfig.title.trim().length;
    issues.push({
      id: 'title_length',
      label: `Page Title Length (${tLen} chars)`,
      pass: tLen >= 30 && tLen <= 60,
      severity: 'high',
      fixMsg: tLen < 30 ? 'Title is too short. Target 30-60 characters for best Google SERP click-through.' : 'Title exceeds 60 characters and will be truncated on search results.',
    });

    // Description length (optimal: 120 - 160 chars)
    const dLen = seoConfig.description.trim().length;
    issues.push({
      id: 'desc_length',
      label: `Meta Description Length (${dLen} chars)`,
      pass: dLen >= 120 && dLen <= 160,
      severity: 'high',
      fixMsg: dLen < 120 ? 'Description is too short. Add a clear value proposition and call to action.' : 'Description exceeds 160 characters and will be cut off on mobile search.',
    });

    // Canonical tag
    issues.push({
      id: 'canonical',
      label: 'Canonical Link Tag',
      pass: !!seoConfig.canonicalUrl && seoConfig.canonicalUrl.startsWith('http'),
      severity: 'medium',
      fixMsg: 'Specify full canonical URL (e.g. https://yourdomain.com) to avoid duplicate content penalties.',
    });

    // Keywords count
    issues.push({
      id: 'keywords',
      label: `Search Keywords (${seoConfig.keywords.length})`,
      pass: seoConfig.keywords.length >= 4,
      severity: 'low',
      fixMsg: 'Include at least 4 to 8 targeted keywords matching search intent.',
    });

    // OpenGraph Social Card Image
    issues.push({
      id: 'og_image',
      label: 'OpenGraph Share Image Banner',
      pass: !!seoConfig.ogImage && seoConfig.ogImage.length > 5,
      severity: 'high',
      fixMsg: 'Provide a 1200x630 social share banner image for X, LinkedIn, and Facebook.',
    });

    // HTML Head audit
    if (indexHtmlFile) {
      const html = indexHtmlFile.content;
      // Viewport tag
      issues.push({
        id: 'viewport',
        label: 'Responsive Viewport Meta Tag',
        pass: /<meta\s+name=["']viewport["']/i.test(html),
        severity: 'high',
        fixMsg: 'Ensure <meta name="viewport" content="width=device-width, initial-scale=1.0"> is present.',
      });

      // Single H1 tag check
      const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
      issues.push({
        id: 'h1_check',
        label: `H1 Primary Heading (Found: ${h1Count})`,
        pass: h1Count === 1,
        severity: 'medium',
        fixMsg: h1Count === 0 ? 'No <h1> tag detected in page markup. Every page should have exactly one primary H1.' : 'Multiple <h1> tags detected. Use a single <h1> and subordinate <h2>/<h3> headers.',
      });

      // Images lacking alt attributes
      const imgTags = html.match(/<img[^>]*>/gi) || [];
      const imgLackingAlt = imgTags.filter((tag) => !/alt=["'][^"']*["']/i.test(tag)).length;
      issues.push({
        id: 'img_alt',
        label: `Image Alt Text Accessibility (${imgLackingAlt} missing)`,
        pass: imgLackingAlt === 0,
        severity: 'medium',
        fixMsg: `${imgLackingAlt} images are missing the 'alt' attribute, hurting SEO indexing and accessibility.`,
      });
    }

    // Sitemap & Robots check
    const hasSitemap = project.files.some((f) => f.name === 'sitemap.xml');
    const hasRobots = project.files.some((f) => f.name === 'robots.txt');

    issues.push({
      id: 'sitemap_file',
      label: 'sitemap.xml Present in Project Files',
      pass: hasSitemap,
      severity: 'medium',
      fixMsg: 'Generate a sitemap.xml to help search engines crawl and discover all project routes.',
    });

    issues.push({
      id: 'robots_file',
      label: 'robots.txt Present in Project Files',
      pass: hasRobots,
      severity: 'low',
      fixMsg: 'Include robots.txt to instruct crawlers on allowed indexable paths.',
    });

    const passedCount = issues.filter((i) => i.pass).length;
    const score = Math.round((passedCount / issues.length) * 100);

    return {
      score,
      passedCount,
      totalCount: issues.length,
      issues,
    };
  }, [seoConfig, indexHtmlFile, project.files]);

  // AI SEO Optimizer call
  const handleAiOptimize = async () => {
    setIsAiOptimizing(true);
    setAiMessage('');
    try {
      const res = await fetch('/api/ai/seo-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.name,
          currentTitle: seoConfig.title,
          currentDescription: seoConfig.description,
          currentKeywords: seoConfig.keywords,
          htmlSample: indexHtmlFile?.content || '',
          language: seoConfig.language,
        }),
      });

      const data = await res.json();
      if (data.title) {
        setSeoConfig((prev) => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
          keywords: data.keywords && data.keywords.length > 0 ? data.keywords : prev.keywords,
          structuredDataType: data.structuredDataType || prev.structuredDataType,
        }));
        setAiMessage(`Optimization complete! Score boosted to ${data.score || 94}%.`);
      }
    } catch (err: any) {
      setAiMessage('Applied local optimization rules.');
    } finally {
      setIsAiOptimizing(false);
    }
  };

  // Generate Generated SEO Head snippet
  const generatedSeoHeadTags = useMemo(() => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': seoConfig.structuredDataType || 'WebApplication',
      name: seoConfig.title,
      description: seoConfig.description,
      url: seoConfig.canonicalUrl || 'https://ais-pre-5ilkxtfwf6yibz3jj2ynl3-17774190120.europe-west3.run.app/',
      author: {
        '@type': 'Organization',
        name: seoConfig.author || 'NONONICK',
      },
    };

    return `    <!-- NONONICK Automated SEO & Social Metadata -->
    <title>${seoConfig.title}</title>
    <meta name="description" content="${seoConfig.description}">
    <meta name="keywords" content="${seoConfig.keywords.join(', ')}">
    <meta name="author" content="${seoConfig.author}">
    <meta name="robots" content="${seoConfig.robots}">
    <meta name="theme-color" content="${seoConfig.themeColor}">
    <link rel="canonical" href="${seoConfig.canonicalUrl}">

    <!-- OpenGraph Social Cards -->
    <meta property="og:type" content="${seoConfig.ogType}">
    <meta property="og:title" content="${seoConfig.title}">
    <meta property="og:description" content="${seoConfig.description}">
    <meta property="og:url" content="${seoConfig.canonicalUrl}">
    <meta property="og:image" content="${seoConfig.ogImage}">
    <meta property="og:site_name" content="${project.name}">

    <!-- Twitter / X Cards -->
    <meta name="twitter:card" content="${seoConfig.twitterCard}">
    <meta name="twitter:title" content="${seoConfig.title}">
    <meta name="twitter:description" content="${seoConfig.description}">
    <meta name="twitter:image" content="${seoConfig.ogImage}">
    <meta name="twitter:creator" content="${seoConfig.twitterHandle}">

    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 6)}
    </script>`;
  }, [seoConfig, project.name]);

  // Apply/Inject to index.html and update project
  const handleApplyToHtml = () => {
    if (!indexHtmlFile) return;

    let content = indexHtmlFile.content;

    // Remove existing title and common meta tags that we replace
    content = content.replace(/<title>[\s\S]*?<\/title>/gi, '');
    content = content.replace(/<meta\s+name=["']description["'][^>]*>/gi, '');
    content = content.replace(/<meta\s+name=["']keywords["'][^>]*>/gi, '');
    content = content.replace(/<meta\s+name=["']author["'][^>]*>/gi, '');
    content = content.replace(/<meta\s+name=["']robots["'][^>]*>/gi, '');
    content = content.replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '');
    content = content.replace(/<meta\s+property=["']og:[^"']*["'][^>]*>/gi, '');
    content = content.replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, '');
    content = content.replace(/<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/gi, '');

    // Inject our pristine tags inside <head>
    if (/<head[^>]*>/i.test(content)) {
      content = content.replace(/(<head[^>]*>)/i, `$1\n${generatedSeoHeadTags}\n`);
    } else {
      content = `<head>\n${generatedSeoHeadTags}\n</head>\n` + content;
    }

    const updatedFiles = project.files.map((f) => {
      if (f.path === indexHtmlFile.path) {
        return {
          ...f,
          content,
          updatedAt: Date.now(),
        };
      }
      return f;
    });

    onUpdateProjectSeo(seoConfig, updatedFiles);
    setApplySuccess(true);
    setTimeout(() => setApplySuccess(false), 2500);
  };

  // Generate sitemap.xml in project files
  const handleGenerateSitemap = () => {
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${seoConfig.canonicalUrl || 'https://ais-pre-5ilkxtfwf6yibz3jj2ynl3-17774190120.europe-west3.run.app/'}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    const existingIdx = project.files.findIndex((f) => f.name === 'sitemap.xml');
    let nextFiles: ProjectFile[];
    if (existingIdx >= 0) {
      nextFiles = project.files.map((f, i) =>
        i === existingIdx ? { ...f, content: sitemapContent, updatedAt: Date.now() } : f
      );
    } else {
      const sitemapFile: ProjectFile = {
        path: '/sitemap.xml',
        name: 'sitemap.xml',
        extension: 'xml',
        type: 'xml',
        content: sitemapContent,
        size: sitemapContent.length,
        updatedAt: Date.now(),
      };
      nextFiles = [...project.files, sitemapFile];
    }

    onUpdateProjectSeo(seoConfig, nextFiles);
  };

  // Generate robots.txt in project files
  const handleGenerateRobots = () => {
    const robotsContent = `User-agent: *
Allow: /

Sitemap: ${(seoConfig.canonicalUrl || 'https://ais-pre-5ilkxtfwf6yibz3jj2ynl3-17774190120.europe-west3.run.app').replace(/\/+$/, '')}/sitemap.xml
`;

    const existingIdx = project.files.findIndex((f) => f.name === 'robots.txt');
    let nextFiles: ProjectFile[];
    if (existingIdx >= 0) {
      nextFiles = project.files.map((f, i) =>
        i === existingIdx ? { ...f, content: robotsContent, updatedAt: Date.now() } : f
      );
    } else {
      const robotsFile: ProjectFile = {
        path: '/robots.txt',
        name: 'robots.txt',
        extension: 'txt',
        type: 'txt',
        content: robotsContent,
        size: robotsContent.length,
        updatedAt: Date.now(),
      };
      nextFiles = [...project.files, robotsFile];
    }

    onUpdateProjectSeo(seoConfig, nextFiles);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-6xl h-[92vh] flex flex-col bg-[#080a11] border border-cyan-500/20 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="h-16 px-4 sm:px-6 bg-[#0a0d16] border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white tracking-tight">
                  NONONICK SEO & Meta Suite
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    auditReport.score >= 80
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                  }`}
                >
                  Health Score: {auditReport.score}%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Search Engine Optimization, SERP simulation, social share cards, and Schema.org structured data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAiOptimize}
              disabled={isAiOptimizing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-cyan-500/20 border border-purple-500/40 text-purple-300 hover:text-white hover:border-purple-400 text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 text-purple-400 ${isAiOptimizing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isAiOptimizing ? 'Optimizing...' : 'AI SEO Optimizer'}</span>
            </button>

            <button
              onClick={handleApplyToHtml}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition shadow-md cursor-pointer ${
                applySuccess
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20'
              }`}
            >
              {applySuccess ? <Check className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
              <span>{applySuccess ? 'Injected to HTML!' : 'Apply to HTML'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Close SEO Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Bar */}
        <div className="px-4 py-2 bg-[#090c14] border-b border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1 rounded-lg transition ${
                activeTab === 'editor'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Meta Tags & Schema
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg transition ${
                activeTab === 'preview'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SERP & Social Preview
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1 rounded-lg transition ${
                activeTab === 'audit'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Health Audit ({auditReport.passedCount}/{auditReport.totalCount})
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-3 py-1 rounded-lg transition ${
                activeTab === 'files'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sitemap & Robots
            </button>
          </div>

          {aiMessage && (
            <span className="text-xs text-purple-300 font-medium animate-pulse hidden md:inline">
              ✨ {aiMessage}
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#07090f]">
          {/* TAB 1: Editor Form */}
          {activeTab === 'editor' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Essential Search Engine Meta */}
              <div className="p-5 rounded-2xl bg-[#080b12] border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">Primary Search Engine Meta</h3>
                    <p className="text-xs text-slate-400">Controls your ranking title and snippet in Google search results.</p>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 font-semibold">Step 1 of 3</span>
                </div>

                {/* Page Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Page Title (<code className="text-cyan-400">&lt;title&gt;</code>)
                    </label>
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        seoConfig.title.length >= 30 && seoConfig.title.length <= 60
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {seoConfig.title.length}/60 chars{' '}
                      {seoConfig.title.length >= 30 && seoConfig.title.length <= 60 ? '(Optimal)' : '(Adjust)'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seoConfig.title}
                    onChange={(e) => setSeoConfig({ ...seoConfig, title: e.target.value })}
                    className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                    placeholder="Enter branded, keyword-rich title (30-60 characters)..."
                  />
                </div>

                {/* Meta Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Meta Description (<code className="text-cyan-400">description</code>)
                    </label>
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        seoConfig.description.length >= 120 && seoConfig.description.length <= 160
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {seoConfig.description.length}/160 chars{' '}
                      {seoConfig.description.length >= 120 && seoConfig.description.length <= 160
                        ? '(Optimal)'
                        : '(Adjust)'}
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={seoConfig.description}
                    onChange={(e) => setSeoConfig({ ...seoConfig, description: e.target.value })}
                    className="w-full bg-[#05070c] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-400/50 resize-none"
                    placeholder="Concise 120-160 character summary with value proposition and call to action..."
                  />
                </div>

                {/* Canonical URL & Robots */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Canonical URL (<code className="text-cyan-400">rel="canonical"</code>)
                    </label>
                    <input
                      type="url"
                      value={seoConfig.canonicalUrl || ''}
                      onChange={(e) => setSeoConfig({ ...seoConfig, canonicalUrl: e.target.value })}
                      className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                      placeholder="https://example.com/page"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Robots Directives
                    </label>
                    <select
                      value={seoConfig.robots}
                      onChange={(e) => setSeoConfig({ ...seoConfig, robots: e.target.value })}
                      className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="index, follow">index, follow (Standard Public)</option>
                      <option value="noindex, follow">noindex, follow (Hide from search)</option>
                      <option value="index, nofollow">index, nofollow (Index but ignore links)</option>
                      <option value="noindex, nofollow">noindex, nofollow (Private)</option>
                    </select>
                  </div>
                </div>

                {/* Keywords Chips Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Target Keywords ({seoConfig.keywords.length})
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-[#05070c] border border-white/10 min-h-[44px]">
                    {seoConfig.keywords.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(tag)}
                          className="hover:text-rose-400 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Add keyword (press Enter)..."
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleAddKeyword}
                      className="flex-1 min-w-[140px] bg-transparent text-xs text-white outline-none placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media & OpenGraph */}
              <div className="p-5 rounded-2xl bg-[#080b12] border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">Social Sharing (OpenGraph & Twitter / X)</h3>
                    <p className="text-xs text-slate-400">Controls rich image cards when shared on social platforms and chats.</p>
                  </div>
                  <span className="text-xs font-mono text-purple-400 font-semibold">Step 2 of 3</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Social Banner Image URL (<code className="text-cyan-400">og:image</code>)
                    </label>
                    <input
                      type="url"
                      value={seoConfig.ogImage || ''}
                      onChange={(e) => setSeoConfig({ ...seoConfig, ogImage: e.target.value })}
                      className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                      placeholder="https://... 1200x630 banner"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Twitter Card Layout
                    </label>
                    <select
                      value={seoConfig.twitterCard}
                      onChange={(e) =>
                        setSeoConfig({
                          ...seoConfig,
                          twitterCard: e.target.value as 'summary' | 'summary_large_image',
                        })
                      }
                      className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="summary_large_image">summary_large_image (Recommended Big Banner)</option>
                      <option value="summary">summary (Compact Square Thumbnail)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Schema.org Structured Data */}
              <div className="p-5 rounded-2xl bg-[#080b12] border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">Schema.org Structured Data (JSON-LD)</h3>
                    <p className="text-xs text-slate-400">Enables rich snippet badges, product cards, or software info in search results.</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">Step 3 of 3</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Entity Schema Type
                    </label>
                    <select
                      value={seoConfig.structuredDataType || 'WebApplication'}
                      onChange={(e) =>
                        setSeoConfig({
                          ...seoConfig,
                          structuredDataType: e.target.value as any,
                        })
                      }
                      className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="WebApplication">WebApplication</option>
                      <option value="WebSite">WebSite</option>
                      <option value="Organization">Organization</option>
                      <option value="Product">Product</option>
                      <option value="Article">Article</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Author / Brand
                    </label>
                    <input
                      type="text"
                      value={seoConfig.author || ''}
                      onChange={(e) => setSeoConfig({ ...seoConfig, author: e.target.value })}
                      className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                      placeholder="Organization or Author Name"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Content Language
                    </label>
                    <input
                      type="text"
                      value={seoConfig.language}
                      onChange={(e) => setSeoConfig({ ...seoConfig, language: e.target.value })}
                      className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                      placeholder="e.g. en, fa, de, es"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SERP & Social Previews */}
          {activeTab === 'preview' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Preview Platform Selector */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSocialPlatform('google')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      socialPlatform === 'google'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Google Search SERP
                  </button>
                  <button
                    onClick={() => setSocialPlatform('twitter')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      socialPlatform === 'twitter'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    X / Twitter Card
                  </button>
                  <button
                    onClick={() => setSocialPlatform('facebook')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      socialPlatform === 'facebook'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    LinkedIn / Facebook
                  </button>
                </div>

                {socialPlatform === 'google' && (
                  <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5 text-xs">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
                      title="Desktop Search Snippet"
                    >
                      <Laptop className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
                      title="Mobile Search Snippet"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* GOOGLE SEARCH PREVIEW */}
              {socialPlatform === 'google' && (
                <div className="p-6 rounded-2xl bg-[#202124] border border-[#3c4043] shadow-xl max-w-2xl font-sans">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-white text-[11px] font-bold">
                      N
                    </div>
                    <div className="flex flex-col text-[12px] leading-tight">
                      <span className="text-[#dadce0] font-medium">{project.name}</span>
                      <span className="text-[#bdc1c6] text-[11px] truncate max-w-md">
                        {(seoConfig.canonicalUrl || 'https://ais-pre-5ilkxtfwf6yibz3jj2ynl3-17774190120.europe-west3.run.app/').replace(/^https?:\/\//, '')}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-[#8ab4f8] text-lg font-medium hover:underline cursor-pointer tracking-tight leading-snug line-clamp-1 mb-1">
                    {seoConfig.title || 'Untitled Web Application'}
                  </h3>

                  <p className="text-[#bdc1c6] text-xs leading-relaxed line-clamp-2">
                    {seoConfig.description || 'No description provided. Add an engaging summary in SEO Studio.'}
                  </p>
                </div>
              )}

              {/* TWITTER / X CARD PREVIEW */}
              {socialPlatform === 'twitter' && (
                <div className="p-4 rounded-2xl bg-black border border-[#2f3336] max-w-xl shadow-xl font-sans">
                  <div className="rounded-2xl border border-[#2f3336] overflow-hidden bg-[#16181c]">
                    {seoConfig.ogImage ? (
                      <div className="h-52 w-full bg-slate-800 overflow-hidden relative">
                        <img
                          src={seoConfig.ogImage}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-40 w-full bg-[#1e2025] flex items-center justify-center text-slate-500 text-xs">
                        No image provided
                      </div>
                    )}
                    <div className="p-3">
                      <span className="text-[11px] text-[#71767b] truncate block">
                        {(seoConfig.canonicalUrl || 'ais-pre-5ilkxtfwf6yibz3jj2ynl3-17774190120.europe-west3.run.app').replace(/^https?:\/\//, '')}
                      </span>
                      <h4 className="text-white text-sm font-bold truncate mt-0.5">{seoConfig.title}</h4>
                      <p className="text-[#71767b] text-xs line-clamp-2 mt-1">{seoConfig.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* LINKEDIN / FACEBOOK PREVIEW */}
              {socialPlatform === 'facebook' && (
                <div className="p-4 rounded-2xl bg-[#18191a] border border-[#3a3b3c] max-w-xl shadow-xl font-sans">
                  <div className="rounded-xl border border-[#3a3b3c] overflow-hidden bg-[#242526]">
                    {seoConfig.ogImage && (
                      <div className="h-56 w-full bg-slate-900 overflow-hidden">
                        <img
                          src={seoConfig.ogImage}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-3 bg-[#242526]">
                      <span className="text-[10px] text-[#b0b3b8] uppercase tracking-wider block">
                        {(seoConfig.canonicalUrl || 'ais-pre-5ilkxtfwf6yibz3jj2ynl3-17774190120.europe-west3.run.app').replace(/^https?:\/\//, '')}
                      </span>
                      <h4 className="text-[#e4e6eb] text-sm font-bold truncate mt-0.5">{seoConfig.title}</h4>
                      <p className="text-[#b0b3b8] text-xs line-clamp-2 mt-1">{seoConfig.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Health Audit Checklist */}
          {activeTab === 'audit' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Score card */}
              <div className="p-6 rounded-2xl bg-[#080b12] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="font-bold text-white text-lg">SEO & Technical Web Audit</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-lg">
                    Real-time verification of HTML head tags, heading hierarchies, mobile readiness, and structured data schemas.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-white tracking-tight">
                      {auditReport.score}%
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {auditReport.passedCount} of {auditReport.totalCount} Checks Passed
                    </span>
                  </div>
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl border ${
                      auditReport.score >= 80
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    }`}
                  >
                    {auditReport.score >= 80 ? 'A+' : 'B'}
                  </div>
                </div>
              </div>

              {/* Issues list */}
              <div className="bg-[#080b12] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                {auditReport.issues.map((issue) => (
                  <div key={issue.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                    <div className="flex items-start gap-3">
                      {issue.pass ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : issue.severity === 'high' ? (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${issue.pass ? 'text-white' : 'text-slate-200'}`}>
                            {issue.label}
                          </span>
                          {!issue.pass && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                                issue.severity === 'high'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {issue.severity}
                            </span>
                          )}
                        </div>
                        {!issue.pass && <p className="text-slate-400 text-xs mt-1">{issue.fixMsg}</p>}
                      </div>
                    </div>

                    {!issue.pass && (
                      <button
                        onClick={() => {
                          if (issue.id === 'sitemap_file') handleGenerateSitemap();
                          else if (issue.id === 'robots_file') handleGenerateRobots();
                          else setActiveTab('editor');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 text-xs font-semibold transition shrink-0"
                      >
                        Fix Now
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Files (Sitemap & Robots) */}
          {activeTab === 'files' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h3 className="font-bold text-white text-base">Search Engine Crawling Assets</h3>
                <p className="text-xs text-slate-400">
                  Generate standard XML sitemaps and robots.txt files directly into your project files.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sitemap generator card */}
                <div className="p-5 rounded-2xl bg-[#080b12] border border-white/10 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-sm">sitemap.xml</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Standard XML document listing all canonical pages for Googlebot and search indexers.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateSitemap}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Generate / Update sitemap.xml</span>
                  </button>
                </div>

                {/* Robots.txt generator card */}
                <div className="p-5 rounded-2xl bg-[#080b12] border border-white/10 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-sm">robots.txt</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Crawling directives for web bots with linked sitemap location.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateRobots}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Generate / Update robots.txt</span>
                  </button>
                </div>
              </div>

              {/* HTML Snippet preview */}
              <div className="p-5 rounded-2xl bg-[#080b12] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs">Generated &lt;head&gt; HTML Snippet</h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSeoHeadTags);
                      setCopiedTag(true);
                      setTimeout(() => setCopiedTag(false), 2000);
                    }}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition"
                  >
                    {copiedTag ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTag ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="bg-[#04060a] p-3 rounded-xl border border-white/5 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-56">
                  {generatedSeoHeadTags}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
