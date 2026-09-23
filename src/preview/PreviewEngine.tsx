import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Monitor,
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
  Layers,
} from 'lucide-react';
import { Project, ProjectFile, SelectedElementInfo } from '../types';

interface PreviewEngineProps {
  project: Project;
  isInspectMode: boolean;
  onToggleInspect: () => void;
  selectedElement: SelectedElementInfo | null;
  onSelectElement: (info: SelectedElementInfo | null) => void;
  onUpdateElementInlineText?: (selectorPath: string, newText: string) => void;
}

export const PreviewEngine: React.FC<PreviewEngineProps> = ({
  project,
  isInspectMode,
  onToggleInspect,
  selectedElement,
  onSelectElement,
  onUpdateElementInlineText,
}) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'iphone' | 'custom'>('desktop');
  const [customWidth, setCustomWidth] = useState(1200);
  const [zoom, setZoom] = useState(100);
  const [key, setKey] = useState(0); // For forcing refresh
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Construct self-contained HTML payload with all project assets, css and visual editor scripts
  const bundledHtml = useMemo(() => {
    const htmlFile =
      project.files.find((f) => f.path === project.activeFilePath && f.extension === 'html') ||
      project.files.find((f) => f.path === '/index.html' || f.extension === 'html') ||
      project.files[0];

    if (!htmlFile) {
      return '<html><body style="background:#090a0f;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">No HTML file found in project.</body></html>';
    }

    let doc = htmlFile.content;

    // Inline all project CSS files
    const cssFiles = project.files.filter((f) => f.type === 'css');
    let cssBlock = '<style id="nononick-project-styles">\n';
    for (const css of cssFiles) {
      cssBlock += `/* Inlined from ${css.path} */\n${css.content}\n`;
    }
    cssBlock += '</style>\n';

    if (doc.includes('</head>')) {
      doc = doc.replace('</head>', `${cssBlock}</head>`);
    } else {
      doc = `${cssBlock}${doc}`;
    }

    // Replace relative image sources with their base64 content
    const imageFiles = project.files.filter((f) => f.type === 'image' || f.type === 'svg');
    for (const img of imageFiles) {
      const cleanPath = img.path.replace(/^\/+/, '');
      const baseName = img.name;
      // replace src="assets/image.png" or src="./assets/image.png" or src="image.png"
      const regex1 = new RegExp(`src=["'](\\.\\/)?${cleanPath}["']`, 'g');
      const regex2 = new RegExp(`src=["'](\\.\\/)?${baseName}["']`, 'g');
      doc = doc.replace(regex1, `src="${img.content}"`);
      doc = doc.replace(regex2, `src="${img.content}"`);
    }

    // Inject Visual Inspector and Interactivity Bridge Script
    const bridgeScript = `
    <script id="nononick-visual-bridge">
    (function() {
      let isInspectActive = ${isInspectMode ? 'true' : 'false'};
      let hoveredEl = null;

      // Create inspection overlay element inside iframe
      const outline = document.createElement('div');
      outline.id = 'nononick-hover-outline';
      outline.style.position = 'fixed';
      outline.style.pointerEvents = 'none';
      outline.style.border = '2px solid #00f2fe';
      outline.style.backgroundColor = 'rgba(0, 242, 254, 0.08)';
      outline.style.zIndex = '999999';
      outline.style.display = 'none';
      outline.style.transition = 'all 0.08s ease-out';
      outline.style.boxShadow = '0 0 12px rgba(0, 242, 254, 0.4)';
      
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

      window.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(outline);
      });

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
        if (target === document.body || target.id === 'nononick-hover-outline') return;
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

      // Listen for updates from parent inspector to reflect changes instantly on the element
      window.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'NONONICK_UPDATE_STYLE') {
          const { selector, property, value } = e.data.payload;
          try {
            const el = document.querySelector(selector);
            if (el) {
              el.style[property] = value;
              // Reposition outline
              if (outline.style.display === 'block') {
                const rect = el.getBoundingClientRect();
                outline.style.top = rect.top + 'px';
                outline.style.left = rect.left + 'px';
                outline.style.width = rect.width + 'px';
                outline.style.height = rect.height + 'px';
              }
            }
          } catch(err) {
            console.error('Style apply error', err);
          }
        } else if (e.data && e.data.type === 'NONONICK_UPDATE_TEXT') {
          const { selector, newText } = e.data.payload;
          try {
            const el = document.querySelector(selector);
            if (el) el.innerText = newText;
          } catch(err) {}
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
  }, [project.files, project.activeFilePath, isInspectMode, key]);

  // Listen to postMessage from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'NONONICK_ELEMENT_SELECTED') {
        onSelectElement(e.data.payload);
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

  const getDeviceDimensions = () => {
    switch (device) {
      case 'iphone':
        return { width: 393, height: 852, isPhone: true };
      case 'tablet':
        return { width: 768, height: 1024, isPhone: false };
      case 'custom':
        return { width: customWidth, height: '100%', isPhone: false };
      case 'desktop':
      default:
        return { width: '100%', height: '100%', isPhone: false };
    }
  };

  const currentDims = getDeviceDimensions();

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col bg-[#07090e] rounded-xl overflow-hidden border border-white/5 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Top Preview Controls Bar */}
      <div className="h-10 px-3 border-b border-white/5 bg-[#090c14] flex items-center justify-between text-xs select-none">
        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-md transition ${
              device === 'desktop' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop View (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
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

        {/* Visual Inspection Toggle & Status */}
        <div className="flex items-center gap-2">
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
            <span>{isInspectMode ? 'Inspect Active' : 'Inspect'}</span>
          </button>

          {selectedElement && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-mono">
              <span>{selectedElement.tagName}</span>
            </div>
          )}
        </div>

        {/* Zoom, Refresh & Fullscreen */}
        <div className="flex items-center gap-1">
          {device === 'custom' && (
            <div className="hidden md:flex items-center gap-1.5 mr-2">
              <span className="text-[10px] text-slate-500 font-mono">{customWidth}px</span>
              <input
                type="range"
                min="320"
                max="1600"
                value={customWidth}
                onChange={(e) => setCustomWidth(parseInt(e.target.value))}
                className="w-20 accent-cyan-400 h-1 bg-white/10 rounded cursor-pointer"
              />
            </div>
          )}

          <div className="flex items-center text-slate-400">
            <button
              onClick={() => setZoom((prev) => Math.max(prev - 10, 50))}
              className="p-1 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] px-1 font-mono">{zoom}%</span>
            <button
              onClick={() => setZoom((prev) => Math.min(prev + 10, 150))}
              className="p-1 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => setKey((k) => k + 1)}
            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition"
            title="Reload Preview"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Preview Viewport Area */}
      <div className="flex-1 bg-[#050609] overflow-auto flex items-center justify-center p-4 custom-scrollbar">
        <div
          style={{
            width: typeof currentDims.width === 'number' ? `${currentDims.width}px` : currentDims.width,
            height: typeof currentDims.height === 'number' ? `${currentDims.height}px` : currentDims.height,
            transform: zoom !== 100 ? `scale(${zoom / 100})` : 'none',
            transformOrigin: 'top center',
            transition: 'width 0.25s ease, height 0.25s ease',
          }}
          className={`relative max-w-full ${
            currentDims.isPhone
              ? 'rounded-[44px] border-[8px] border-[#1f2433] shadow-2xl overflow-hidden bg-black ring-1 ring-white/10'
              : device === 'tablet'
              ? 'rounded-[28px] border-[6px] border-[#1f2433] shadow-2xl overflow-hidden bg-black'
              : 'w-full h-full'
          }`}
        >
          {/* Realistic iPhone Notch / Dynamic Island when in iPhone mode */}
          {currentDims.isPhone && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-end pr-2 pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
            </div>
          )}

          <iframe
            ref={iframeRef}
            key={key}
            title="Live Preview"
            srcDoc={bundledHtml}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            className="w-full h-full border-none bg-white"
          />
        </div>
      </div>
    </div>
  );
};
