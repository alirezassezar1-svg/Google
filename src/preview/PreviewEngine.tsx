import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  RotateCw,
  Maximize2,
  Minimize2,
  MousePointer,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Sliders,
  Palette,
  Terminal,
  Play,
  Pause,
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle2,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Grid,
} from 'lucide-react';
import { Project, ProjectFile, SelectedElementInfo } from '../types';

interface PreviewEngineProps {
  project: Project;
  isInspectMode: boolean;
  onToggleInspect: () => void;
  selectedElement: SelectedElementInfo | null;
  onSelectElement: (info: SelectedElementInfo | null) => void;
  onUpdateElementInlineText?: (selectorPath: string, newText: string) => void;
  onOpenThemeBuilder?: () => void;
}

export interface PreviewConsoleLog {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

export type ViewportDevice = 'desktop' | 'laptop' | 'tablet' | 'iphone' | 'android' | 'custom';
export type CanvasBackdrop = 'dark' | 'light' | 'checkerboard';

export const PreviewEngine: React.FC<PreviewEngineProps> = ({
  project,
  isInspectMode,
  onToggleInspect,
  selectedElement,
  onSelectElement,
  onOpenThemeBuilder,
}) => {
  const [device, setDevice] = useState<ViewportDevice>('desktop');
  const [customWidth, setCustomWidth] = useState(1200);
  const [zoom, setZoom] = useState(100);
  const [key, setKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoReload, setAutoReload] = useState(true);
  const [canvasBackdrop, setCanvasBackdrop] = useState<CanvasBackdrop>('dark');
  const [showConsole, setShowConsole] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<PreviewConsoleLog[]>([]);
  const [activeConsoleFilter, setActiveConsoleFilter] = useState<'all' | 'error' | 'warn'>('all');
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [safeModeNoJs, setSafeModeNoJs] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Debounced refresh trigger
  const triggerDebouncedReload = useCallback(() => {
    if (!autoReload) return;
    setIsCompiling(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setKey((k) => k + 1);
      setIsCompiling(false);
    }, 280);
  }, [autoReload]);

  useEffect(() => {
    triggerDebouncedReload();
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [project.files, autoReload, triggerDebouncedReload]);

  // Construct ultra-resilient self-contained HTML payload
  const bundledHtml = useMemo(() => {
    const htmlFile =
      project.files.find((f) => f.path === project.activeFilePath && (f.extension === 'html' || f.type === 'html')) ||
      project.files.find((f) => f.path === '/index.html' || f.name === 'index.html') ||
      project.files.find((f) => f.extension === 'html' || f.type === 'html') ||
      project.files[0];

    if (!htmlFile) {
      return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>body{margin:0;background:#090a0f;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:12px;}h3{color:#fff;margin:0;}p{font-size:12px;margin:0;}</style></head>
<body>
  <h3>No HTML entrypoint found</h3>
  <p>Create an index.html or select an HTML file to preview.</p>
</body>
</html>`;
    }

    let doc = htmlFile.content || '';

    // If document lacks html/head/body boilerplate, wrap it properly
    if (!doc.includes('<html') && !doc.includes('<body')) {
      doc = `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>\n<body>\n${doc}\n</body>\n</html>`;
    }

    // 1. Process and inline linked or existing CSS files
    const cssFiles = project.files.filter((f) => f.type === 'css' || f.extension === 'css');
    
    // Replace <link rel="stylesheet" href="..."> tags matching project files
    for (const css of cssFiles) {
      const cleanPath = css.path.replace(/^\/+/, '');
      const baseName = css.name;
      const linkRegex1 = new RegExp(`<link[^>]*href=["'](\\.\\/)?${cleanPath}["'][^>]*>`, 'gi');
      const linkRegex2 = new RegExp(`<link[^>]*href=["'](\\.\\/)?${baseName}["'][^>]*>`, 'gi');
      doc = doc.replace(linkRegex1, `<style data-source="${css.name}">\n${css.content}\n</style>`);
      doc = doc.replace(linkRegex2, `<style data-source="${css.name}">\n${css.content}\n</style>`);
    }

    // Combine all project CSS into head as well
    let combinedCssBlock = '<style id="nononick-project-styles">\n';
    for (const css of cssFiles) {
      combinedCssBlock += `/* Inlined from ${css.path} */\n${css.content}\n`;
    }
    combinedCssBlock += '</style>\n';

    if (doc.includes('</head>')) {
      doc = doc.replace('</head>', `${combinedCssBlock}</head>`);
    } else if (doc.includes('<body')) {
      doc = doc.replace('<body', `${combinedCssBlock}<body`);
    } else {
      doc = `${combinedCssBlock}${doc}`;
    }

    // 2. Replace relative image/asset sources with base64 data URLs
    const imageFiles = project.files.filter(
      (f) => f.type === 'image' || f.type === 'svg' || f.extension === 'svg' || f.extension === 'png' || f.extension === 'jpg'
    );
    for (const img of imageFiles) {
      const cleanPath = img.path.replace(/^\/+/, '');
      const baseName = img.name;
      const regex1 = new RegExp(`src=["'](\\.\\/)?${cleanPath}["']`, 'g');
      const regex2 = new RegExp(`src=["'](\\.\\/)?${baseName}["']`, 'g');
      const bgRegex1 = new RegExp(`url\\(["']?(\\.\\/)?${cleanPath}["']?\\)`, 'g');
      const bgRegex2 = new RegExp(`url\\(["']?(\\.\\/)?${baseName}["']?\\)`, 'g');

      doc = doc.replace(regex1, `src="${img.content}"`);
      doc = doc.replace(regex2, `src="${img.content}"`);
      doc = doc.replace(bgRegex1, `url("${img.content}")`);
      doc = doc.replace(bgRegex2, `url("${img.content}")`);
    }

    // 3. Process and inline JavaScript scripts (unless safe mode is on)
    if (!safeModeNoJs) {
      const jsFiles = project.files.filter((f) => f.type === 'js' || f.extension === 'js' || f.extension === 'ts');
      
      // Inline matching <script src="..."> tags
      for (const js of jsFiles) {
        const cleanPath = js.path.replace(/^\/+/, '');
        const baseName = js.name;
        const scriptRegex1 = new RegExp(`<script[^>]*src=["'](\\.\\/)?${cleanPath}["'][^>]*>\\s*<\\/script>`, 'gi');
        const scriptRegex2 = new RegExp(`<script[^>]*src=["'](\\.\\/)?${baseName}["'][^>]*>\\s*<\\/script>`, 'gi');
        const safeJs = (js.content || '').replace(/<\/script>/gi, '<\\/script>');
        doc = doc.replace(scriptRegex1, `<script data-source="${js.name}">\ntry {\n${safeJs}\n} catch(err) { console.error("[Script Error in ${js.name}]:", err); }\n</script>`);
        doc = doc.replace(scriptRegex2, `<script data-source="${js.name}">\ntry {\n${safeJs}\n} catch(err) { console.error("[Script Error in ${js.name}]:", err); }\n</script>`);
      }

      // If project has standalone scripts not explicitly linked, safely load them before closing body
      const unlinkedScripts = jsFiles.filter(
        (f) => !doc.includes(f.name) && (f.name === 'script.js' || f.name === 'main.js' || f.name === 'app.js')
      );
      if (unlinkedScripts.length > 0) {
        let unlinkedBlock = '<script id="nononick-autoload-scripts">\n';
        for (const s of unlinkedScripts) {
          const safeJs = (s.content || '').replace(/<\/script>/gi, '<\\/script>');
          unlinkedBlock += `/* Auto-loaded from ${s.path} */\ntry {\n${safeJs}\n} catch(e){ console.error("[Runtime in ${s.name}]:", e); }\n`;
        }
        unlinkedBlock += '</script>\n';
        if (doc.includes('</body>')) {
          doc = doc.replace('</body>', `${unlinkedBlock}</body>`);
        } else {
          doc += unlinkedBlock;
        }
      }
    }

    // 4. Inject Visual Inspector, Console Interceptor & Error Bridge
    const bridgeScript = `
    <script id="nononick-visual-bridge">
    (function() {
      // 1. Intercept console logs to parent
      const _origLog = console.log;
      const _origWarn = console.warn;
      const _origError = console.error;
      const _origInfo = console.info;

      function sendLog(type, args) {
        try {
          const message = Array.from(args).map(a => {
            if (typeof a === 'object') {
              try { return JSON.stringify(a); } catch(e) { return String(a); }
            }
            return String(a);
          }).join(' ');

          window.parent.postMessage({
            type: 'NONONICK_CONSOLE_LOG',
            payload: { type, message, timestamp: Date.now() }
          }, '*');
        } catch(e) {}
      }

      console.log = function() { sendLog('log', arguments); _origLog.apply(console, arguments); };
      console.warn = function() { sendLog('warn', arguments); _origWarn.apply(console, arguments); };
      console.error = function() { sendLog('error', arguments); _origError.apply(console, arguments); };
      console.info = function() { sendLog('info', arguments); _origInfo.apply(console, arguments); };

      // 2. Global Error & Rejection Handler
      window.addEventListener('error', function(e) {
        // If event was triggered by an HTML element (like <img> or <link> 404), it is a resource load warning, not a script crash
        if (e.target && (e.target.nodeType === 1 || e.target instanceof HTMLElement)) {
          return;
        }

        // Generic opaque browser cross-origin message with no details
        const msg = e.message;
        if (!msg || msg === 'Script error.' || msg === 'Script error' || msg === 'ResizeObserver loop completed with undelivered notifications.') {
          return;
        }

        window.parent.postMessage({
          type: 'NONONICK_RUNTIME_ERROR',
          payload: { message: msg, filename: e.filename || '', lineno: e.lineno || 0 }
        }, '*');
      }, true);

      window.addEventListener('unhandledrejection', function(e) {
        const msg = (e.reason && e.reason.message) || (typeof e.reason === 'string' ? e.reason : '');
        if (!msg || msg === 'Script error.' || msg === 'Script error') return;
        window.parent.postMessage({
          type: 'NONONICK_RUNTIME_ERROR',
          payload: { message: msg }
        }, '*');
      });

      // 3. Visual Element Inspector
      let isInspectActive = ${isInspectMode ? 'true' : 'false'};
      let hoveredEl = null;

      const outline = document.createElement('div');
      outline.id = 'nononick-hover-outline';
      outline.style.position = 'fixed';
      outline.style.pointerEvents = 'none';
      outline.style.border = '2px solid #00f2fe';
      outline.style.backgroundColor = 'rgba(0, 242, 254, 0.08)';
      outline.style.zIndex = '999999';
      outline.style.display = 'none';
      outline.style.transition = 'all 0.06s ease-out';
      outline.style.boxShadow = '0 0 14px rgba(0, 242, 254, 0.4)';
      
      const badge = document.createElement('div');
      badge.style.position = 'absolute';
      badge.style.top = '-22px';
      badge.style.left = '-2px';
      badge.style.background = '#00f2fe';
      badge.style.color = '#080a11';
      badge.style.fontFamily = 'monospace';
      badge.style.fontSize = '10px';
      badge.style.fontWeight = 'bold';
      badge.style.padding = '2px 6px';
      badge.style.borderRadius = '4px 4px 0 0';
      badge.style.whiteSpace = 'nowrap';
      outline.appendChild(badge);

      const appendOutline = () => {
        if (document.body && !document.getElementById('nononick-hover-outline')) {
          document.body.appendChild(outline);
        }
      };

      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', appendOutline);
      } else {
        appendOutline();
      }

      function getCssSelector(el) {
        if (!el || el === document.body) return 'body';
        if (el.id) return '#' + el.id;
        let path = [];
        while (el && el.nodeType === Node.ELEMENT_NODE && el !== document.body) {
          let selector = el.nodeName.toLowerCase();
          if (el.className && typeof el.className === 'string') {
            const firstClass = el.className.trim().split(/\\s+/)[0];
            if (firstClass && !firstClass.includes(':') && !firstClass.includes('/')) {
              selector += '.' + firstClass;
            }
          }
          let siblingIndex = 1;
          let sibling = el.previousElementSibling;
          while (sibling) {
            if (sibling.nodeName === el.nodeName) siblingIndex++;
            sibling = sibling.previousElementSibling;
          }
          if (siblingIndex > 1) selector += ':nth-of-type(' + siblingIndex + ')';
          path.unshift(selector);
          el = el.parentElement;
        }
        return path.join(' > ');
      }

      function extractStyles(el) {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          fontFamily: computed.fontFamily,
          textAlign: computed.textAlign,
          padding: computed.padding,
          margin: computed.margin,
          width: computed.width,
          height: computed.height,
          display: computed.display,
          flexDirection: computed.flexDirection,
          justifyContent: computed.justifyContent,
          alignItems: computed.alignItems,
          borderRadius: computed.borderRadius,
          borderWidth: computed.borderWidth,
          borderColor: computed.borderColor,
          borderStyle: computed.borderStyle,
          boxShadow: computed.boxShadow,
          opacity: computed.opacity,
        };
      }

      document.addEventListener('mouseover', (e) => {
        if (!isInspectActive) return;
        const target = e.target;
        if (!target || target === document.body || target.id === 'nononick-hover-outline') return;
        hoveredEl = target;
        const rect = target.getBoundingClientRect();
        outline.style.display = 'block';
        outline.style.top = rect.top + 'px';
        outline.style.left = rect.left + 'px';
        outline.style.width = rect.width + 'px';
        outline.style.height = rect.height + 'px';
        badge.textContent = target.tagName.toLowerCase() + (target.className ? '.' + target.className.split(' ')[0] : '');
      }, true);

      document.addEventListener('mouseout', (e) => {
        if (!isInspectActive) return;
        outline.style.display = 'none';
      }, true);

      document.addEventListener('click', (e) => {
        if (!isInspectActive) return;
        e.preventDefault();
        e.stopPropagation();
        const target = e.target;
        if (!target || target === document.body) return;

        const selector = getCssSelector(target);
        const styles = extractStyles(target);
        const rect = target.getBoundingClientRect();

        window.parent.postMessage({
          type: 'NONONICK_ELEMENT_SELECTED',
          payload: {
            tagName: target.tagName,
            id: target.id || '',
            className: target.className || '',
            innerText: target.innerText || '',
            outerHTML: target.outerHTML.slice(0, 1000),
            selectorPath: selector,
            styles: styles,
            rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
          }
        }, '*');
      }, true);

      // Listen for updates from parent inspector
      window.addEventListener('message', (e) => {
        if (!e.data) return;
        if (e.data.type === 'NONONICK_UPDATE_STYLE') {
          const { selector, property, value } = e.data.payload;
          try {
            const el = document.querySelector(selector);
            if (el) {
              el.style[property] = value;
              if (outline.style.display === 'block') {
                const rect = el.getBoundingClientRect();
                outline.style.top = rect.top + 'px';
                outline.style.left = rect.left + 'px';
                outline.style.width = rect.width + 'px';
                outline.style.height = rect.height + 'px';
              }
            }
          } catch(err) {}
        } else if (e.data.type === 'NONONICK_UPDATE_TEXT') {
          const { selector, newText } = e.data.payload;
          try {
            const el = document.querySelector(selector);
            if (el) el.innerText = newText;
          } catch(err) {}
        } else if (e.data.type === 'NONONICK_UPDATE_CSS_VARIABLES') {
          const { variables } = e.data.payload || {};
          if (Array.isArray(variables)) {
            for (const v of variables) {
              if (v && v.name && v.value) {
                document.documentElement.style.setProperty(v.name, v.value);
              }
            }
          }
        }
      });
    })();
    </script>
    `;

    if (doc.includes('</body>')) {
      doc = doc.replace('</body>', `${bridgeScript}</body>`);
    } else {
      doc = `${doc}${bridgeScript}`;
    }

    return doc;
  }, [project.files, project.activeFilePath, isInspectMode, safeModeNoJs]);

  // Listen to postMessage from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;

      if (e.data.type === 'NONONICK_ELEMENT_SELECTED') {
        onSelectElement(e.data.payload);
      } else if (e.data.type === 'NONONICK_CONSOLE_LOG') {
        const logItem: PreviewConsoleLog = {
          id: 'log_' + Math.random().toString(36).substring(2, 9),
          type: e.data.payload.type,
          message: e.data.payload.message,
          timestamp: e.data.payload.timestamp || Date.now(),
        };
        setConsoleLogs((prev) => [logItem, ...prev].slice(0, 100));
      } else if (e.data.type === 'NONONICK_RUNTIME_ERROR') {
        const rawMsg = e.data.payload?.message;
        if (!rawMsg || rawMsg === 'Script error.' || rawMsg === 'Script error') {
          return;
        }
        setRuntimeError(rawMsg);
        const errLog: PreviewConsoleLog = {
          id: 'err_' + Math.random().toString(36).substring(2, 9),
          type: 'error',
          message: `${rawMsg} ${e.data.payload.filename ? `(${e.data.payload.filename}:${e.data.payload.lineno})` : ''}`,
          timestamp: Date.now(),
        };
        setConsoleLogs((prev) => [errLog, ...prev].slice(0, 100));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSelectElement]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const openInNewTab = () => {
    try {
      const blob = new Blob([bundledHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      // Fallback
      const w = window.open('', '_blank');
      if (w) {
        w.document.open();
        w.document.write(bundledHtml);
        w.document.close();
      }
    }
  };

  const getDeviceDimensions = () => {
    switch (device) {
      case 'iphone':
        return { width: 393, height: 852, isPhone: true, label: 'iPhone 15 Pro (393px)' };
      case 'android':
        return { width: 412, height: 915, isPhone: true, label: 'Pixel Android (412px)' };
      case 'tablet':
        return { width: 768, height: 1024, isPhone: false, label: 'iPad Tablet (768px)' };
      case 'laptop':
        return { width: 1366, height: 768, isPhone: false, label: 'Laptop (1366px)' };
      case 'custom':
        return { width: customWidth, height: '100%', isPhone: false, label: `Custom (${customWidth}px)` };
      case 'desktop':
      default:
        return { width: '100%', height: '100%', isPhone: false, label: 'Fluid Desktop' };
    }
  };

  const currentDims = getDeviceDimensions();
  const errorCount = consoleLogs.filter((l) => l.type === 'error').length;
  const warnCount = consoleLogs.filter((l) => l.type === 'warn').length;

  const filteredLogs = consoleLogs.filter((l) => {
    if (activeConsoleFilter === 'error') return l.type === 'error';
    if (activeConsoleFilter === 'warn') return l.type === 'warn';
    return true;
  });

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col bg-[#07090e] rounded-xl overflow-hidden border border-white/5 relative ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Top Preview Controls Bar */}
      <div className="h-10 px-3 border-b border-white/5 bg-[#090c14] flex items-center justify-between text-xs select-none gap-2">
        {/* Left: Device Switcher */}
        <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-lg shrink-0">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-md transition ${
              device === 'desktop' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop View (Fluid 100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('laptop')}
            className={`p-1.5 rounded-md transition ${
              device === 'laptop' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            title="Laptop View (1366px)"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded-md transition ${
              device === 'tablet' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet iPad View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('iphone')}
            className={`p-1.5 rounded-md transition ${
              device === 'iphone' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile iPhone View (393px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('custom')}
            className={`p-1.5 rounded-md transition ${
              device === 'custom' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            title="Custom Responsive Resizer"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Inspect Mode, Live Compilation Status & Theme */}
        <div className="flex items-center gap-2">
          {/* Compilation Pulse Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-mono text-slate-400">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCompiling ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span>{isCompiling ? 'Rendering...' : 'Live Sync'}</span>
          </div>

          <button
            onClick={onToggleInspect}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              isInspectMode
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-400/20'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
            title="Toggle Visual Click & Inspect Mode"
          >
            <MousePointer className="w-3 h-3" />
            <span className="hidden sm:inline">{isInspectMode ? 'Inspect Active' : 'Inspect'}</span>
          </button>

          {selectedElement && (
            <div className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-mono truncate max-w-[140px]">
              <span>{selectedElement.tagName}</span>
            </div>
          )}

          {onOpenThemeBuilder && (
            <button
              onClick={onOpenThemeBuilder}
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/20 transition cursor-pointer"
              title="Open Visual Theme Builder & CSS Variables"
            >
              <Palette className="w-3 h-3 text-pink-400" />
              <span>Theme</span>
            </button>
          )}
        </div>

        {/* Right: Auto-reload, Backdrop, Zoom, Fullscreen & Controls */}
        <div className="flex items-center gap-1.5">
          {device === 'custom' && (
            <div className="hidden xl:flex items-center gap-1.5 mr-2">
              <span className="text-[10px] text-slate-500 font-mono">{customWidth}px</span>
              <input
                type="range"
                min="320"
                max="1920"
                value={customWidth}
                onChange={(e) => setCustomWidth(parseInt(e.target.value))}
                className="w-20 accent-cyan-400 h-1 bg-white/10 rounded cursor-pointer"
              />
            </div>
          )}

          {/* Auto Reload Toggle */}
          <button
            onClick={() => setAutoReload(!autoReload)}
            className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
              autoReload
                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
            }`}
            title={autoReload ? 'Auto-render ON (Pause)' : 'Auto-render PAUSED (Resume)'}
          >
            {autoReload ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
          </button>

          {/* Canvas Backdrop Selector */}
          <button
            onClick={() => {
              if (canvasBackdrop === 'dark') setCanvasBackdrop('light');
              else if (canvasBackdrop === 'light') setCanvasBackdrop('checkerboard');
              else setCanvasBackdrop('dark');
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
            title={`Canvas backdrop: ${canvasBackdrop}`}
          >
            {canvasBackdrop === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-slate-400" />
            ) : canvasBackdrop === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Grid className="w-3.5 h-3.5 text-cyan-400" />
            )}
          </button>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center text-slate-400 bg-white/5 rounded-lg px-1">
            <button
              onClick={() => setZoom((prev) => Math.max(prev - 10, 50))}
              className="p-1 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] px-1 font-mono">{zoom}%</span>
            <button
              onClick={() => setZoom((prev) => Math.min(prev + 10, 150))}
              className="p-1 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Force Reload */}
          <button
            onClick={() => {
              setRuntimeError(null);
              setKey((k) => k + 1);
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition cursor-pointer"
            title="Hard Reload Preview"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Open in Separate Tab */}
          <button
            onClick={openInNewTab}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Open in new window / tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Runtime Error Banner if caught */}
      {runtimeError && (
        <div className="bg-rose-950/80 border-b border-rose-500/30 px-3 py-2 text-xs flex items-center justify-between text-rose-200 z-30">
          <div className="flex items-center gap-2 truncate">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold text-rose-300">Runtime Error:</span>
            <span className="truncate">{runtimeError}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSafeModeNoJs(!safeModeNoJs)}
              className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-mono cursor-pointer"
            >
              {safeModeNoJs ? 'Enable JS' : 'Safe Mode (No JS)'}
            </button>
            <button
              onClick={() => setRuntimeError(null)}
              className="p-1 text-rose-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <div
        className={`flex-1 overflow-auto flex items-center justify-center p-4 custom-scrollbar transition-colors ${
          canvasBackdrop === 'dark'
            ? 'bg-[#050609]'
            : canvasBackdrop === 'light'
            ? 'bg-[#e2e8f0]'
            : 'bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] bg-[#0b0f19]'
        }`}
      >
        <div
          style={{
            width: typeof currentDims.width === 'number' ? `${currentDims.width}px` : currentDims.width,
            height: typeof currentDims.height === 'number' ? `${currentDims.height}px` : currentDims.height,
            transform: zoom !== 100 ? `scale(${zoom / 100})` : 'none',
            transformOrigin: 'top center',
            transition: 'width 0.2s ease, height 0.2s ease',
          }}
          className={`relative max-w-full ${
            currentDims.isPhone
              ? 'rounded-[44px] border-[8px] border-[#181d28] shadow-2xl overflow-hidden bg-black ring-1 ring-white/10'
              : device === 'tablet'
              ? 'rounded-[28px] border-[6px] border-[#181d28] shadow-2xl overflow-hidden bg-black'
              : device === 'laptop'
              ? 'rounded-xl border-[4px] border-[#181d28] shadow-2xl overflow-hidden bg-black'
              : 'w-full h-full'
          }`}
        >
          {/* Dynamic Island / Notch simulation */}
          {currentDims.isPhone && device === 'iphone' && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-end pr-2 pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
            </div>
          )}

          <iframe
            ref={iframeRef}
            key={key}
            title="Live Preview Engine"
            srcDoc={bundledHtml}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            className="w-full h-full border-none bg-white"
          />
        </div>
      </div>

      {/* Floating Bottom Console & Logs Drawer Toggle */}
      <div className="absolute bottom-2 left-3 z-30 flex items-center gap-2">
        <button
          onClick={() => setShowConsole(!showConsole)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg backdrop-blur-md text-[11px] font-mono border transition shadow-lg cursor-pointer ${
            errorCount > 0
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              : warnCount > 0
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-black/70 border-white/10 text-slate-300 hover:text-white'
          }`}
        >
          <Terminal className="w-3 h-3 text-cyan-400" />
          <span>Console</span>
          {errorCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-slate-950 font-bold text-[9px]">
              {errorCount}
            </span>
          )}
          {showConsole ? <ChevronDown className="w-3 h-3 ml-1" /> : <ChevronUp className="w-3 h-3 ml-1" />}
        </button>
      </div>

      {/* Expandable Console Logs Drawer */}
      {showConsole && (
        <div className="absolute bottom-10 left-3 right-3 max-h-48 z-40 bg-[#090c14]/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl flex flex-col overflow-hidden text-[11px] font-mono animate-in slide-in-from-bottom-2">
          {/* Console Header */}
          <div className="p-2 border-b border-white/10 bg-[#06080d] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-[11px]">Runtime Logs</span>
              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded">
                <button
                  onClick={() => setActiveConsoleFilter('all')}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    activeConsoleFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  All ({consoleLogs.length})
                </button>
                <button
                  onClick={() => setActiveConsoleFilter('error')}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    activeConsoleFilter === 'error' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'
                  }`}
                >
                  Errors ({errorCount})
                </button>
                <button
                  onClick={() => setActiveConsoleFilter('warn')}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    activeConsoleFilter === 'warn' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
                  }`}
                >
                  Warns ({warnCount})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setConsoleLogs([])}
                className="p-1 hover:text-white text-slate-400 cursor-pointer"
                title="Clear Logs"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowConsole(false)}
                className="p-1 hover:text-white text-slate-400 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Console List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-36 custom-scrollbar">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-500 p-3 text-center">No logs recorded yet.</div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`px-2 py-1 rounded flex items-start gap-2 leading-relaxed ${
                    log.type === 'error'
                      ? 'bg-rose-500/10 text-rose-300 border-l-2 border-rose-500'
                      : log.type === 'warn'
                      ? 'bg-amber-500/10 text-amber-300 border-l-2 border-amber-500'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {log.type === 'error' ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  ) : log.type === 'warn' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  )}
                  <span className="break-all flex-1">{log.message}</span>
                  <span className="text-[9px] text-slate-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
