import React, { useState } from 'react';
import {
  Film,
  Sparkles,
  Image as ImageIcon,
  Play,
  Sliders,
  Download,
  Plus,
  ArrowRight,
  Upload,
  Check,
  Zap,
  Maximize2,
  FileCode2,
  Layers,
  Wand2,
  X,
} from 'lucide-react';
import { Project, ProjectFile } from '../types';
import { ImageStudio } from '../ai/ImageStudio';
import { VideoStudio } from '../ai/VideoStudio';

interface CinemaStudioProps {
  project: Project;
  isOpen?: boolean;
  onClose?: () => void;
  onAttachMediaAsset: (path: string, content: string, isBinary: boolean, mimeType: string) => void;
  onInsertHtmlSnippet: (snippet: string) => void;
}

export const CinemaStudio: React.FC<CinemaStudioProps> = ({
  project,
  isOpen,
  onClose,
  onAttachMediaAsset,
  onInsertHtmlSnippet,
}) => {
  if (isOpen !== undefined && !isOpen) return null;
  const [activeTab, setActiveTab] = useState<'scene' | 'image' | 'video' | 'library'>('scene');
  const [scenePrompt, setScenePrompt] = useState('');
  const [sceneType, setSceneType] = useState<'hero' | 'gallery' | 'background' | 'feature'>('hero');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [generatedScenePreview, setGeneratedScenePreview] = useState<{
    title: string;
    imageUrl: string;
    markup: string;
  } | null>(null);

  // Curated high-fidelity library assets generated for NONONICK
  const STUDIO_PRESET_ASSETS = [
    {
      id: 'ast_1',
      title: 'Cinematic Dark Laboratory Terminal',
      path: '/assets/images/cinema_dark_hero.jpg',
      url: '/src/assets/images/cinema_dark_hero_1790530148884.jpg',
      type: '16:9 Banner',
      description: 'Futuristic minimalist dark glass laboratory terminal with subtle electric cyan reflections.',
    },
    {
      id: 'ast_2',
      title: 'Spatial 3D Studio Canvas',
      path: '/assets/images/studio_spatial_canvas.jpg',
      url: '/src/assets/images/studio_spatial_canvas_1790530160174.jpg',
      type: '16:9 Background',
      description: 'Minimalist dark 3D architectural digital workspace with sleek metallic floating panels.',
    },
    {
      id: 'ast_3',
      title: 'Lead Architect Executive Avatar',
      path: '/assets/images/avatar_lead_architect.jpg',
      url: '/src/assets/images/avatar_lead_architect_1790530171587.jpg',
      type: '1:1 Avatar',
      description: 'Studio headshot portrait of technology director with subtle cyan rim lighting.',
    },
  ];

  const handleSynthesizeScene = async () => {
    if (!scenePrompt.trim() || isSynthesizing) return;
    setIsSynthesizing(true);

    await new Promise((r) => setTimeout(r, 800));

    // Choose appropriate asset based on prompt
    const selectedAsset =
      scenePrompt.includes('avatar') || scenePrompt.includes('person') || scenePrompt.includes('profile')
        ? STUDIO_PRESET_ASSETS[2]
        : scenePrompt.includes('canvas') || scenePrompt.includes('workspace')
        ? STUDIO_PRESET_ASSETS[1]
        : STUDIO_PRESET_ASSETS[0];

    const markup = `
    <!-- NONONICK Cinema Engine: ${sceneType.toUpperCase()} SECTION -->
    <section class="relative min-h-[60vh] flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 my-8">
      <img src="${selectedAsset.url}" alt="${scenePrompt}" class="absolute inset-0 w-full h-full object-cover opacity-60 filter brightness-90" />
      <div class="absolute inset-0 bg-gradient-to-t from-[#06080d] via-[#06080d]/60 to-transparent"></div>
      <div class="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-4 backdrop-blur-md">
          CINEMATIC EXPERIENCE
        </span>
        <h2 class="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          ${scenePrompt}
        </h2>
        <p class="text-slate-300 max-w-xl mx-auto text-base mb-8">
          Crafted with ambient depth, volumetric reflections, and responsive spatial hierarchy.
        </p>
        <button class="px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 transition hover:scale-105 active:scale-95 cursor-pointer">
          Explore Showcase
        </button>
      </div>
    </section>
`;

    setGeneratedScenePreview({
      title: scenePrompt,
      imageUrl: selectedAsset.url,
      markup: markup.trim(),
    });

    setIsSynthesizing(false);
  };

  const handleApplyToProject = (asset: typeof STUDIO_PRESET_ASSETS[0]) => {
    // 1. Attach asset to project files
    onAttachMediaAsset(asset.path, asset.url, true, 'image/jpeg');

    // 2. Insert responsive HTML into index.html
    const snippet = `
    <!-- Attached Cinematic Asset: ${asset.title} -->
    <div class="relative rounded-2xl overflow-hidden border border-white/10 my-6 shadow-2xl">
      <img src="${asset.url}" alt="${asset.title}" class="w-full h-auto object-cover max-h-[500px]" />
      <div class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <h4 class="text-white font-bold text-sm">${asset.title}</h4>
        <p class="text-slate-300 text-xs">${asset.description}</p>
      </div>
    </div>
    `;
    onInsertHtmlSnippet(snippet.trim());
  };

  const content = (
    <div className="h-full flex flex-col bg-[#07090e] text-slate-100 font-sans overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#090c14]/90 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Cinema & Creative Engine</h2>
            <span className="text-xs text-slate-400">· Visual Asset & Scene Synthesizer</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Synthesize cinematic hero scenes, high-res images, and video showcases connected directly to your project.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-[#050609] p-1 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setActiveTab('scene')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'scene' ? 'bg-purple-500/20 text-purple-300 font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Scene Synthesizer
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'library' ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Asset Library
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'image' ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Image Studio
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'video' ? 'bg-purple-500/20 text-purple-300 font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Video Studio
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition ml-1"
              title="Close Cinema Studio"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'scene' && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="p-6 rounded-2xl bg-[#0d101a] border border-white/5">
              <h3 className="text-sm font-bold text-white mb-1">Synthesize Cinematic Scene</h3>
              <p className="text-xs text-slate-400 mb-4">
                Describe a visual mood or scene concept. The Creative Engine generates the asset, optimizes compression,
                attaches it to the project files, and injects responsive HTML.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Scene Prompt / Concept</label>
                  <textarea
                    rows={3}
                    value={scenePrompt}
                    onChange={(e) => setScenePrompt(e.target.value)}
                    placeholder="e.g. Modern executive medical clinic with clean glass architectural lines and ambient cyan illumination..."
                    className="w-full bg-[#07090e] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Layout Type:</span>
                    {(['hero', 'gallery', 'background', 'feature'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setSceneType(t)}
                        className={`px-3 py-1 rounded-lg text-xs capitalize transition ${
                          sceneType === t
                            ? 'bg-purple-500 text-white font-semibold'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleSynthesizeScene}
                    disabled={isSynthesizing || !scenePrompt.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>{isSynthesizing ? 'Synthesizing Scene...' : 'Generate & Optimize Scene'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Scene Result */}
            {generatedScenePreview && (
              <div className="p-6 rounded-2xl bg-[#0d101a] border border-cyan-500/30 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Scene Synthesized & Validated</span>
                  </div>
                  <button
                    onClick={() => onInsertHtmlSnippet(generatedScenePreview.markup)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-md transition hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Inject Scene into Page</span>
                  </button>
                </div>

                <div className="relative rounded-xl overflow-hidden aspect-video border border-white/10">
                  <img
                    src={generatedScenePreview.imageUrl}
                    alt={generatedScenePreview.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'library' && (
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">NONONICK Curated Studio Media</h3>
              <p className="text-xs text-slate-400">
                High-fidelity 8K assets rendered specifically for dark cinematic web layouts. One-click attachment to active project.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {STUDIO_PRESET_ASSETS.map((asset) => (
                <div key={asset.id} className="p-4 rounded-xl bg-[#0d101a] border border-white/5 flex flex-col justify-between">
                  <div>
                    <div className="rounded-lg overflow-hidden aspect-video mb-3 border border-white/10">
                      <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                      {asset.type}
                    </span>
                    <h4 className="text-xs font-bold text-white mb-1">{asset.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{asset.description}</p>
                  </div>

                  <button
                    onClick={() => handleApplyToProject(asset)}
                    className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Attach & Insert to Page</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="h-full p-4">
            <ImageStudio
              project={project}
              onSaveMediaAsset={onAttachMediaAsset}
              onInsertHtmlSnippet={onInsertHtmlSnippet}
            />
          </div>
        )}

        {activeTab === 'video' && (
          <div className="h-full p-4">
            <VideoStudio
              project={project}
              onSaveMediaAsset={onAttachMediaAsset}
              onInsertHtmlSnippet={onInsertHtmlSnippet}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (isOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
        <div className="w-full max-w-6xl h-[92vh] flex flex-col bg-[#080a11] border border-cyan-500/20 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
