import { Project, ProjectTemplateType } from '../types';

export interface TemplateDefinition {
  id: ProjectTemplateType;
  title: string;
  description: string;
  icon: string;
  badge: string;
  tags: string[];
  createProject: (name?: string) => Project;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'landing',
    title: 'Futuristic SaaS Landing Page',
    description: 'Dark-mode luxury aesthetic with glowing cards, interactive hero, feature showcase, and responsive navbar.',
    icon: 'Sparkles',
    badge: 'Popular',
    tags: ['Tailwind', 'Futuristic', 'Responsive', 'Glassmorphism'],
    createProject: (name = 'Apex Nova SaaS') => ({
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      name,
      description: 'Futuristic AI SaaS Landing Page with glassmorphism and ambient lighting',
      templateType: 'landing',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeFilePath: '/index.html',
      settings: {
        title: name,
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
          size: 4200,
          updatedAt: Date.now(),
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apex Nova - AI Intelligence Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body class="bg-[#090b11] text-slate-100 font-sans antialiased min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
  <!-- Glowing background elements -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl"></div>
    <div class="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl"></div>
  </div>

  <div class="relative z-10">
    <!-- Navbar -->
    <header class="border-b border-white/5 backdrop-blur-xl bg-[#090b11]/80 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span class="text-white font-black text-lg">A</span>
          </div>
          <span class="font-bold text-xl tracking-tight text-white">APEX<span class="text-cyan-400">NOVA</span></span>
        </div>

        <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" class="hover:text-cyan-400 transition">Features</a>
          <a href="#architecture" class="hover:text-cyan-400 transition">Architecture</a>
          <a href="#pricing" class="hover:text-cyan-400 transition">Pricing</a>
          <a href="#docs" class="hover:text-cyan-400 transition">Documentation</a>
        </nav>

        <div class="flex items-center gap-4">
          <button class="hidden sm:block text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 transition">Sign In</button>
          <button id="cta-header" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
            Get Started
          </button>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold tracking-wide uppercase mb-8 shadow-sm">
        <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        Apex 4.0 Neural Core Released
      </div>

      <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-8">
        The Autonomous Engine for <span class="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">Complex Workflows</span>
      </h1>

      <p class="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        Connect your data pipelines to next-generation models with zero latency, automated edge orchestration, and cryptographic governance.
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
        <button id="hero-primary-btn" class="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-base shadow-xl shadow-cyan-400/20 transition-all hover:scale-[1.02] cursor-pointer">
          Deploy Cluster Free
        </button>
        <button class="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-base transition backdrop-blur-md">
          Schedule Demo
        </button>
      </div>

      <!-- Hero Dashboard Visual Preview -->
      <div class="relative max-w-5xl mx-auto rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl p-4 shadow-2xl shadow-cyan-500/10">
        <div class="flex items-center justify-between border-b border-white/5 pb-3 mb-4 px-2">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div class="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div class="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <span class="text-xs text-slate-500 font-mono">cluster-node-eu-west-01.apex.internal</span>
          <div class="w-16"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div class="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <span class="text-xs text-slate-400 font-medium">Throughput Speed</span>
            <div class="text-3xl font-extrabold text-white mt-2">1.84M <span class="text-xs font-normal text-emerald-400">+18%</span></div>
            <div class="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
              <div class="bg-cyan-400 h-full w-4/5 rounded-full"></div>
            </div>
          </div>

          <div class="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <span class="text-xs text-slate-400 font-medium">Global Latency</span>
            <div class="text-3xl font-extrabold text-white mt-2">12.4ms <span class="text-xs font-normal text-cyan-400">Optimal</span></div>
            <div class="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
              <div class="bg-emerald-400 h-full w-9/10 rounded-full"></div>
            </div>
          </div>

          <div class="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <span class="text-xs text-slate-400 font-medium">Inference Efficiency</span>
            <div class="text-3xl font-extrabold text-white mt-2">99.98% <span class="text-xs font-normal text-purple-400">Tier 1</span></div>
            <div class="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
              <div class="bg-purple-400 h-full w-full rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <h2 class="text-3xl md:text-4xl font-extrabold text-white mb-4">Precision Engineered for Scale</h2>
        <p class="text-slate-400">Everything needed to orchestrate autonomous intelligence at enterprise scale.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/40 transition group">
          <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition">⚡</div>
          <h3 class="text-xl font-bold text-white mb-3">Ultra Low Latency</h3>
          <p class="text-slate-400 leading-relaxed text-sm">Edge routed across 240+ global points of presence for instantaneous response times.</p>
        </div>

        <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/40 transition group">
          <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition">🛡️</div>
          <h3 class="text-xl font-bold text-white mb-3">Cryptographic Safety</h3>
          <p class="text-slate-400 leading-relaxed text-sm">Hardware-isolated enclaves, zero-trust telemetry, and multi-tenant audit logs.</p>
        </div>

        <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/40 transition group">
          <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition">🌐</div>
          <h3 class="text-xl font-bold text-white mb-3">Multi-Cloud Mesh</h3>
          <p class="text-slate-400 leading-relaxed text-sm">Deploy seamlessly across AWS, GCP, Azure, and bare metal without vendor lock-in.</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-white/5 py-12 px-6">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
        <p>© 2026 Apex Nova Technologies. Designed with NONONICK Universal AI Editor.</p>
        <div class="flex gap-6">
          <a href="#" class="hover:text-cyan-400 transition">Privacy</a>
          <a href="#" class="hover:text-cyan-400 transition">Terms</a>
          <a href="#" class="hover:text-cyan-400 transition">Security</a>
        </div>
      </div>
    </footer>
  </div>

  <script src="script.js"></script>
</body>
</html>`,
        },
        {
          path: '/style.css',
          name: 'style.css',
          extension: 'css',
          type: 'css',
          size: 680,
          updatedAt: Date.now(),
          content: `/* Custom Design Tokens */
:root {
  --primary-glow: rgba(0, 242, 254, 0.4);
  --secondary-glow: rgba(127, 0, 255, 0.35);
}

body {
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* Glassmorphism card helpers */
.glass-effect {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Interactive hover shine */
.hover-glow:hover {
  box-shadow: 0 0 25px var(--primary-glow);
}
`,
        },
        {
          path: '/script.js',
          name: 'script.js',
          extension: 'js',
          type: 'js',
          size: 520,
          updatedAt: Date.now(),
          content: `// Apex Nova Client Interactions
document.addEventListener('DOMContentLoaded', () => {
  const ctaBtn = document.getElementById('cta-header');
  const heroBtn = document.getElementById('hero-primary-btn');

  if (heroBtn) {
    heroBtn.addEventListener('click', () => {
      console.log('Deploy cluster requested');
    });
  }

  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      console.log('Get started clicked');
    });
  }
});
`,
        },
      ],
    }),
  },
  {
    id: 'html-css-js',
    title: 'Clean HTML5 + CSS + JavaScript',
    description: 'Minimalist web project boilerplate with structured modular files, clean reset, and vanilla JS.',
    icon: 'Code2',
    badge: 'Standard',
    tags: ['Vanilla JS', 'Clean CSS', 'Modular'],
    createProject: (name = 'Modern Web Boilerplate') => ({
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      name,
      description: 'Standard modern HTML5, CSS3, and JavaScript project',
      templateType: 'html-css-js',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeFilePath: '/index.html',
      settings: {
        title: name,
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
          size: 1420,
          updatedAt: Date.now(),
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="container">
    <header class="header">
      <h1 class="title">Welcome to Your Project</h1>
      <p class="subtitle">Crafted with NONONICK Universal AI Editor</p>
    </header>

    <section class="card">
      <h2>Interactive Counter Component</h2>
      <p>Demonstrating vanilla JavaScript state and style synchronization.</p>
      <div class="counter-box">
        <button id="decrement" class="btn btn-outline">-</button>
        <span id="counter-value" class="counter-display">0</span>
        <button id="increment" class="btn btn-primary">+</button>
      </div>
    </section>
  </main>
  <script src="script.js"></script>
</body>
</html>`,
        },
        {
          path: '/style.css',
          name: 'style.css',
          extension: 'css',
          type: 'css',
          size: 1100,
          updatedAt: Date.now(),
          content: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #0b0f19;
  color: #f1f5f9;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px;
}

.container {
  max-width: 600px;
  width: 100%;
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #38bdf8;
  margin-bottom: 8px;
}

.subtitle {
  color: #94a3b8;
}

.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}

.card h2 {
  font-size: 1.25rem;
  margin-bottom: 8px;
}

.card p {
  color: #94a3b8;
  font-size: 0.95rem;
  margin-bottom: 24px;
}

.counter-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.counter-display {
  font-size: 2.5rem;
  font-weight: 700;
  min-width: 60px;
  text-align: center;
}

.btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #0284c7;
  color: white;
}

.btn-primary:hover {
  background: #0369a1;
}

.btn-outline {
  background: transparent;
  border: 1px solid #475569;
  color: #cbd5e1;
}

.btn-outline:hover {
  background: #334155;
}
`,
        },
        {
          path: '/script.js',
          name: 'script.js',
          extension: 'js',
          type: 'js',
          size: 480,
          updatedAt: Date.now(),
          content: `let count = 0;
const valDisplay = document.getElementById('counter-value');
const incBtn = document.getElementById('increment');
const decBtn = document.getElementById('decrement');

if (incBtn && decBtn && valDisplay) {
  incBtn.addEventListener('click', () => {
    count++;
    valDisplay.textContent = count;
  });

  decBtn.addEventListener('click', () => {
    count--;
    valDisplay.textContent = count;
  });
}
`,
        },
      ],
    }),
  },
  {
    id: 'portfolio',
    title: 'Creative Developer Portfolio',
    description: 'Showcase your work with project grids, skills badges, contact drawer, and sleek dark aesthetic.',
    icon: 'Briefcase',
    badge: 'Creative',
    tags: ['Portfolio', 'Showcase', 'Resume', 'Modern'],
    createProject: (name = 'Creative Portfolio') => ({
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      name,
      description: 'Modern developer portfolio with projects grid and contact form',
      templateType: 'portfolio',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeFilePath: '/index.html',
      settings: {
        title: name,
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
          size: 3200,
          updatedAt: Date.now(),
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elena Vance - Systems Architect & Designer</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0b0c10] text-[#c5c6c7] font-sans">
  <div class="max-w-4xl mx-auto px-6 py-20">
    <header class="mb-20">
      <div class="inline-block px-3 py-1 bg-[#1f2833] text-[#66fcf1] rounded-md text-xs font-mono font-semibold mb-4">AVAILABLE FOR WORK</div>
      <h1 class="text-4xl sm:text-6xl font-bold text-white tracking-tight mb-4">Elena Vance</h1>
      <p class="text-xl text-[#45a29e] mb-6">Staff Systems Architect & Creative Technologist</p>
      <p class="text-slate-400 max-w-2xl leading-relaxed">
        Building high-concurrency distributed platforms, edge compilers, and fluid spatial visual interfaces.
      </p>
    </header>

    <section class="mb-20">
      <h2 class="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4">Selected Works</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-[#1f2833]/40 border border-white/5 rounded-xl p-6 hover:border-[#66fcf1]/40 transition">
          <span class="text-xs text-[#45a29e] font-mono">01 / CLOUD INFRA</span>
          <h3 class="text-xl font-bold text-white mt-2 mb-2">Vortex Mesh Engine</h3>
          <p class="text-slate-400 text-sm mb-4">Real-time edge message router handling 40M events/second with Sub-millisecond latency.</p>
          <div class="flex gap-2">
            <span class="px-2 py-0.5 bg-black/40 text-xs text-slate-300 rounded">Rust</span>
            <span class="px-2 py-0.5 bg-black/40 text-xs text-slate-300 rounded">eBPF</span>
            <span class="px-2 py-0.5 bg-black/40 text-xs text-slate-300 rounded">gRPC</span>
          </div>
        </div>

        <div class="bg-[#1f2833]/40 border border-white/5 rounded-xl p-6 hover:border-[#66fcf1]/40 transition">
          <span class="text-xs text-[#45a29e] font-mono">02 / VISUAL AI</span>
          <h3 class="text-xl font-bold text-white mt-2 mb-2">Omni Canvas Studio</h3>
          <p class="text-slate-400 text-sm mb-4">Spatial canvas for generative layout synthesis and design system token distribution.</p>
          <div class="flex gap-2">
            <span class="px-2 py-0.5 bg-black/40 text-xs text-slate-300 rounded">TypeScript</span>
            <span class="px-2 py-0.5 bg-black/40 text-xs text-slate-300 rounded">WebGL</span>
            <span class="px-2 py-0.5 bg-black/40 text-xs text-slate-300 rounded">WASM</span>
          </div>
        </div>
      </div>
    </section>

    <footer class="border-t border-white/10 pt-8 flex justify-between items-center text-sm text-slate-500">
      <p>© 2026 Elena Vance</p>
      <div class="flex gap-4">
        <a href="#" class="hover:text-[#66fcf1]">GitHub</a>
        <a href="#" class="hover:text-[#66fcf1]">X / Twitter</a>
        <a href="#" class="hover:text-[#66fcf1]">LinkedIn</a>
      </div>
    </footer>
  </div>
</body>
</html>`,
        },
      ],
    }),
  },
  {
    id: 'pwa',
    title: 'Progressive Web App (PWA)',
    description: 'PWA-ready template complete with web app manifest, service worker offline shell, and install prompt.',
    icon: 'Smartphone',
    badge: 'Mobile First',
    tags: ['PWA', 'Offline Ready', 'Service Worker', 'Manifest'],
    createProject: (name = 'Omni PWA App') => ({
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      name,
      description: 'Installable Progressive Web App with offline service worker shell',
      templateType: 'pwa',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeFilePath: '/index.html',
      settings: {
        title: name,
        theme: 'dark',
        autoSave: true,
        autoSaveIntervalMs: 2000,
        fontSize: 14,
        tabSize: 2,
        wordWrap: true,
        viewportDevice: 'mobile',
        customViewportWidth: 393,
        previewScale: 1,
        aiProvider: 'gemini',
      },
      files: [
        {
          path: '/index.html',
          name: 'index.html',
          extension: 'html',
          type: 'html',
          size: 2600,
          updatedAt: Date.now(),
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0d1117">
  <title>Omni Task PWA</title>
  <link rel="manifest" href="manifest.json">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0d1117] text-slate-100 font-sans pb-20 select-none">
  <header class="p-6 border-b border-white/5 sticky top-0 bg-[#0d1117]/90 backdrop-blur z-20 flex justify-between items-center">
    <div>
      <h1 class="text-xl font-bold text-white">Omni Mobile</h1>
      <p class="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Offline Sync Active
      </p>
    </div>
    <button id="pwa-install-btn" class="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition">
      Install App
    </button>
  </header>

  <main class="p-6 max-w-md mx-auto space-y-4">
    <div class="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
      <span class="text-xs font-semibold uppercase tracking-wider text-cyan-400">Active Quick Notes</span>
      <div class="space-y-2" id="todo-list">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <input type="checkbox" checked class="rounded border-slate-700 text-cyan-500 focus:ring-0">
          <span class="text-sm line-through text-slate-500">Configure Service Worker precache</span>
        </div>
        <div class="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <input type="checkbox" class="rounded border-slate-700 text-cyan-500 focus:ring-0">
          <span class="text-sm text-slate-200">Test touch interactions on mobile</span>
        </div>
      </div>
    </div>
  </main>

  <script src="app.js"></script>
</body>
</html>`,
        },
        {
          path: '/manifest.json',
          name: 'manifest.json',
          extension: 'json',
          type: 'json',
          size: 450,
          updatedAt: Date.now(),
          content: `{
  "name": "Omni Task PWA",
  "short_name": "OmniTask",
  "description": "Installable offline-first task tracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0d1117",
  "theme_color": "#0d1117",
  "icons": [
    {
      "src": "icon.svg",
      "sizes": "192x192 512x512",
      "type": "image/svg+xml"
    }
  ]
}`,
        },
        {
          path: '/sw.js',
          name: 'sw.js',
          extension: 'js',
          type: 'js',
          size: 680,
          updatedAt: Date.now(),
          content: `const CACHE_NAME = 'omni-pwa-v1';
const ASSETS = ['/', '/index.html', '/manifest.json', '/app.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});`,
        },
        {
          path: '/app.js',
          name: 'app.js',
          extension: 'js',
          type: 'js',
          size: 450,
          updatedAt: Date.now(),
          content: `if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(console.error);
}
console.log('Omni PWA Initialized');
`,
        },
      ],
    }),
  },
  {
    id: 'blank',
    title: 'Blank Canvas',
    description: 'Start with an empty workspace. Absolute creative freedom to build anything from scratch.',
    icon: 'FilePlus',
    badge: 'Clean',
    tags: ['Empty', 'Custom'],
    createProject: (name = 'Untitled Project') => ({
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      name,
      description: 'Empty project workspace',
      templateType: 'blank',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeFilePath: '/index.html',
      settings: {
        title: name,
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
          size: 320,
          updatedAt: Date.now(),
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Start building with NONONICK</h1>
  <script src="script.js"></script>
</body>
</html>`,
        },
        {
          path: '/style.css',
          name: 'style.css',
          extension: 'css',
          type: 'css',
          size: 120,
          updatedAt: Date.now(),
          content: `body {
  margin: 0;
  padding: 32px;
  font-family: sans-serif;
  background: #0b0d13;
  color: #fff;
}`,
        },
        {
          path: '/script.js',
          name: 'script.js',
          extension: 'js',
          type: 'js',
          size: 50,
          updatedAt: Date.now(),
          content: `console.log("Ready");`,
        },
      ],
    }),
  },
];
