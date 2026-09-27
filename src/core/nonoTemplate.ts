import { Project } from '../types';

export const NONO_HTML_CONTENT = `<!DOCTYPE html>
<html lang="fa" dir="rtl" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>NONONICK® – Digital Experience Studio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
</head>
<body class="bg-[#050811] text-slate-100 font-sans antialiased min-h-screen flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden relative">

  <!-- Ambient Blue Radial Glow & Orbit Lines -->
  <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-b from-blue-700/20 via-indigo-950/20 to-transparent rounded-full blur-[100px]"></div>
    <svg class="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="orbit-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#1e1b4b" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="50%" cy="48%" rx="320" ry="240" fill="none" stroke="url(#orbit-grad)" stroke-width="1" stroke-dasharray="4 6"/>
      <ellipse cx="50%" cy="48%" rx="480" ry="340" fill="none" stroke="#2563eb" stroke-width="0.75" stroke-opacity="0.3"/>
    </svg>
  </div>

  <!-- Top Navbar -->
  <header class="relative z-10 w-full px-6 py-6 flex items-center justify-between">
    <!-- Brand Mark with Crescent Arc -->
    <div class="flex items-center gap-3">
      <!-- Top-left subtle crescent curve -->
      <svg class="w-5 h-5 text-white/70 -mt-2 -mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M 6 4 A 12 12 0 0 0 4 14" />
      </svg>
      <div class="flex items-center">
        <span class="font-black text-xl tracking-tight text-white font-sans">NONONICK</span>
        <span class="text-[9px] font-bold text-white/80 align-super ml-0.5 -mt-2">®</span>
      </div>
    </div>

    <!-- Right Controls: Sun Toggle & Hamburger -->
    <div class="flex items-center gap-5 text-white/80">
      <button id="theme-toggle" class="hover:text-cyan-400 transition cursor-pointer p-1" title="Toggle Lighting">
        <svg class="w-5 h-5 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      </button>

      <button id="menu-toggle" class="hover:text-cyan-400 transition cursor-pointer p-1" title="Menu">
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="7" x2="21" y2="7"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="17" x2="21" y2="17"/>
        </svg>
      </button>
    </div>
  </header>

  <!-- Tehran 2026 Tagline -->
  <div class="relative z-10 w-full px-6 pt-2 text-right">
    <span class="text-[11px] font-mono tracking-[0.3em] text-slate-400 font-semibold uppercase">
      TEHRAN / ۲۰۲۶
    </span>
  </div>

  <!-- Hero Content with Floating Visual Wireframe Cards -->
  <main class="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 text-center max-w-4xl mx-auto w-full">
    
    <!-- Floating Cyber Wireframe Graphic Containers (Background Cards matching screenshot) -->
    <div class="relative w-full max-w-md py-6 flex flex-col items-center justify-center">

      <!-- Background Card 1 (Top Left tilted) -->
      <div class="absolute -top-6 -left-8 sm:-left-12 w-52 sm:w-64 h-32 rounded-2xl bg-[#0b1633]/60 border border-blue-500/30 backdrop-blur-md p-3.5 flex flex-col gap-2 -rotate-3 pointer-events-none shadow-xl shadow-blue-950/40">
        <div class="w-20 h-2 rounded-full bg-blue-400/40"></div>
        <div class="w-32 h-2 rounded-full bg-blue-500/20"></div>
        <div class="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
      </div>

      <!-- Background Card 2 (Top Right tilted) -->
      <div class="absolute -top-3 -right-6 sm:-right-10 w-56 sm:w-72 h-36 rounded-2xl bg-[#0f1d44]/60 border border-blue-500/30 backdrop-blur-md p-4 flex flex-col gap-2.5 rotate-2 pointer-events-none shadow-xl shadow-blue-950/40">
        <div class="w-28 h-2 rounded-full bg-blue-400/35"></div>
        <div class="w-40 h-2 rounded-full bg-blue-500/15"></div>
        <div class="w-20 h-2 rounded-full bg-blue-500/15"></div>
        <div class="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
      </div>

      <!-- Background Card 3 (Bottom Center behind text) -->
      <div class="absolute -bottom-6 w-72 sm:w-96 h-28 rounded-2xl bg-[#0a142e]/60 border border-blue-400/25 backdrop-blur-md p-4 flex flex-col gap-2 pointer-events-none">
        <div class="w-36 h-2 rounded-full bg-blue-400/30"></div>
        <div class="w-48 h-2 rounded-full bg-blue-500/15"></div>
        <div class="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
      </div>

      <!-- Foreground Central Typographic Badge -->
      <div class="relative z-10 flex flex-col items-center">
        <!-- Sub-label with blue glowing dot -->
        <div class="inline-flex items-center gap-2 mb-2">
          <span class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f2fe]"></span>
          <span class="text-xs font-mono font-bold tracking-[0.25em] text-cyan-300 uppercase">
            DIGITAL EXPERIENCE STUDIO
          </span>
        </div>

        <!-- Giant Stylized NONO NICK Typography (Solid Top, Wireframe Bottom) -->
        <div class="flex flex-col items-center justify-center my-1 select-none">
          <h1 class="text-6xl sm:text-7xl md:text-8xl font-black text-white tracking-tighter leading-none m-0 font-sans">
            NONO
          </h1>
          <h2 class="text-6xl sm:text-7xl md:text-8xl font-black text-transparent tracking-tighter leading-none m-0 font-sans wireframe-nick">
            NICK
          </h2>
        </div>
      </div>
    </div>

    <!-- Persian Tagline -->
    <div class="relative z-20 mt-6 space-y-2">
      <p class="text-xl sm:text-2xl font-extrabold text-white tracking-normal font-sans">
        ایده را به تجربه دیجیتال تبدیل می‌کنیم.
      </p>
      <p class="text-xs font-mono tracking-[0.25em] text-slate-400 font-semibold uppercase">
        FROM IDEA TO DIGITAL EXPERIENCE.
      </p>
    </div>

    <!-- CTA Buttons (Matching White High-Contrast + Dark Ghost) -->
    <div class="relative z-20 flex items-center justify-center gap-4 mt-8 flex-wrap">
      <a href="#projects" class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-white/10 hover:scale-[1.02] active:scale-[0.98]">
        <span>مشاهده پروژه‌ها</span>
        <span class="text-base leading-none">↗</span>
      </a>

      <a href="#contact" class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm bg-transparent hover:bg-white/5 text-slate-200 hover:text-white font-semibold text-sm transition-all">
        <span>شروع پروژه</span>
        <span class="text-base leading-none">↗</span>
      </a>
    </div>

  </main>

  <!-- Bottom Bar (SCROLL TO EXPLORE & NONONICK.IR) -->
  <footer class="relative z-10 w-full px-6 py-6 flex items-center justify-between text-[11px] font-mono tracking-[0.25em] text-slate-500 uppercase">
    <div class="flex items-center gap-3">
      <div class="w-8 h-[1px] bg-slate-600"></div>
      <span>SCROLL TO EXPLORE</span>
    </div>
    <div>
      <span class="hover:text-cyan-400 transition cursor-pointer">NONONICK.IR</span>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>`;

export const NONO_CSS_CONTENT = `:root {
  --color-primary: #00f2fe;
  --color-secondary: #2563eb;
  --color-bg: #050811;
  --color-surface: #0b1633;
  --color-text: #ffffff;
  --color-muted: #94a3b8;
  --font-sans: 'Vazirmatn', 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-bg);
  color: var(--color-text);
}

.wireframe-nick {
  -webkit-text-stroke: 1.5px #ffffff;
  text-stroke: 1.5px #ffffff;
  color: transparent;
}

@media (min-width: 768px) {
  .wireframe-nick {
    -webkit-text-stroke: 2px #ffffff;
    text-stroke: 2px #ffffff;
  }
}
`;

export const NONO_JS_CONTENT = `// NONONICK Digital Experience Studio Client Script
document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('bg-[#080d1e]');
    });
  }

  const menuBtn = document.getElementById('menu-toggle');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      console.log('NONONICK Navigation opened');
    });
  }
});
`;

export function createNonoProject(customName = 'nono'): Project {
  return {
    id: 'proj_nono_' + Math.random().toString(36).substring(2, 8),
    name: customName,
    description: 'NONONICK Digital Experience Studio - Tehran 2026',
    templateType: 'landing',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    activeFilePath: '/index.html',
    settings: {
      title: customName,
      theme: 'dark',
      autoSave: true,
      autoSaveIntervalMs: 2000,
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
      viewportDevice: 'desktop',
      customViewportWidth: 1200,
      previewScale: 1,
      aiProvider: 'gemini',
    },
    files: [
      {
        path: '/index.html',
        name: 'index.html',
        extension: 'html',
        type: 'html',
        size: NONO_HTML_CONTENT.length,
        updatedAt: Date.now(),
        content: NONO_HTML_CONTENT,
      },
      {
        path: '/style.css',
        name: 'style.css',
        extension: 'css',
        type: 'css',
        size: NONO_CSS_CONTENT.length,
        updatedAt: Date.now(),
        content: NONO_CSS_CONTENT,
      },
      {
        path: '/script.js',
        name: 'script.js',
        extension: 'js',
        type: 'js',
        size: NONO_JS_CONTENT.length,
        updatedAt: Date.now(),
        content: NONO_JS_CONTENT,
      },
    ],
  };
}
