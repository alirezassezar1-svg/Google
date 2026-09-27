import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Sparkles,
  Loader2,
  Play,
  Pause,
  Download,
  Upload,
  Code,
  Check,
  Plus,
  Video as VideoIcon,
  RotateCcw,
  Sliders,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { Project } from '../types';

interface VideoStudioProps {
  project: Project;
  initialImage?: string | null;
  initialPrompt?: string;
  onSaveMediaAsset?: (path: string, content: string, isBinary: boolean, mimeType: string) => void;
  onInsertHtmlSnippet?: (snippet: string) => void;
}

type VeoAspectRatio = '16:9' | '9:16';

export const VideoStudio: React.FC<VideoStudioProps> = ({
  project,
  initialImage = null,
  initialPrompt = '',
  onSaveMediaAsset,
  onInsertHtmlSnippet,
}) => {
  const [sourceImage, setSourceImage] = useState<string | null>(initialImage);
  const [sourceImageName, setSourceImageName] = useState<string>('تصویر انتخابی');
  const [prompt, setPrompt] = useState<string>(initialPrompt || '');
  const [aspectRatio, setAspectRatio] = useState<VeoAspectRatio>('16:9');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [operationName, setOperationName] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update if initial props change
  useEffect(() => {
    if (initialImage) {
      setSourceImage(initialImage);
      setSourceImageName('تصویر منتقل شده از استودیو عکس');
    }
    if (initialPrompt && !prompt) {
      setPrompt('حرکت نرم سینمایی و تغییر زاویه نور: ' + initialPrompt);
    }
  }, [initialImage, initialPrompt]);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Suggested motion prompts
  const MOTION_PROMPTS = [
    'Cinematic slow zoom-in with fluid atmospheric lighting and subtle motion',
    'Dynamic 3D camera pan around the subject with soft motion blur',
    'Gentle organic breeze and ambient floating particle light trails',
    'Dramatic drone pull-back revealing surrounding landscape',
    'Futuristic holographic pulsing glow with neon reflections',
  ];

  // Pick from project images
  const projectImages = project.files.filter(
    (f) => f.type === 'image' && f.content && f.content.startsWith('data:image')
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSourceImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSourceImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const startVeoGeneration = async () => {
    if (!sourceImage || loading) return;

    setError(null);
    setLoading(true);
    setVideoUrl(null);
    setStatusMessage('در حال ارسال تصویر به مدل Veo (veo-3.1-fast-generate-preview)...');

    try {
      // Step 1: Start Operation
      const initRes = await fetch('/api/ai/video-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: sourceImage,
          prompt: prompt || 'Cinematic, fluid motion and natural lighting animation',
          aspectRatio,
        }),
      });

      if (!initRes.ok) {
        const errJson = await initRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to initiate Veo video generation');
      }

      const { operationName: opName, status, isSimulated } = await initRes.json();
      setOperationName(opName);

      if (status === 'simulated' || !opName) {
        setStatusMessage('در حال پردازش پیش‌نمایش فیلم...');
        // Mock download
        const dlRes = await fetch('/api/ai/video-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName: opName }),
        });
        const dlData = await dlRes.json();
        setVideoUrl(dlData.videoUrl);
        setLoading(false);
        return;
      }

      // Step 2: Poll status
      setStatusMessage('هوش مصنوعی در حال رندر فریم‌های ویدیویی (این عملیات ممکن است کمی زمان ببرد)...');
      let attempts = 0;

      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await fetch('/api/ai/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName: opName }),
          });

          if (!statusRes.ok) return;

          const statusData = await statusRes.json();

          if (statusData.done) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatusMessage('عملیات رندر به پایان رسید. در حال بارگیری ویدیوی نهایی...');

            // Step 3: Retrieve completed video
            const downloadRes = await fetch('/api/ai/video-download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName: opName, format: 'dataUrl' }),
            });

            if (!downloadRes.ok) {
              throw new Error('Failed to retrieve finalized video binary');
            }

            const downloadData = await downloadRes.json();
            setVideoUrl(downloadData.videoUrl);
            setLoading(false);
            setStatusMessage('');
          } else {
            setStatusMessage(`در حال متحرک‌سازی فریم‌ها... (${attempts * 5} ثانیه)`);
          }
        } catch (pollErr: any) {
          console.error('Polling error:', pollErr);
        }
      }, 5000);
    } catch (err: any) {
      console.error('Veo video error:', err);
      setError(err.message || 'خطا در تبدیل عکس به فیلم با Veo');
      setLoading(false);
      setStatusMessage('');
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  };

  const handleSaveToProject = () => {
    if (!videoUrl) return;

    const filename = `veo-${Date.now().toString(36)}.mp4`;
    const targetPath = `/assets/videos/${filename}`;

    if (onSaveMediaAsset) {
      onSaveMediaAsset(targetPath, videoUrl, true, 'video/mp4');
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleInsertHtml = () => {
    if (!videoUrl) return;

    const snippet = `\n<!-- Generated with NONONICK Veo (veo-3.1-fast-generate-preview) -->\n<video autoplay loop muted playsinline class="w-full rounded-2xl shadow-2xl border border-white/10 my-6 object-cover aspect-${aspectRatio === '16:9' ? 'video' : '[9/16]'}" src="${videoUrl}"></video>\n`;

    if (onInsertHtmlSnippet) {
      onInsertHtmlSnippet(snippet);
    }

    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `nononick-veo-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#07090f] text-slate-200 text-xs">
      {/* Header Info */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-blue-950/20 to-pink-950/40 border border-purple-500/20 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400">
              <Film className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm">استودیو تبدیل عکس به فیلم (Veo Video)</h3>
          </div>
          <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
            تبدیل هر عکس به ویدیوی متحرک سینمایی با مدل هوش مصنوعی <strong>veo-3.1-fast-generate-preview</strong> در نسبت‌های استاندارد 16:9 یا 9:16.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold shrink-0">
          VEO 3.1
        </span>
      </div>

      {/* Step 1: Source Photo */}
      <div className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-white flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>۱. انتخاب یا آپلود عکس اولیه:</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">الزامی برای ساخت فیلم</span>
        </div>

        {sourceImage ? (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0b0e17] border border-purple-500/30">
            <img
              src={sourceImage}
              alt="Source for Veo"
              className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-white truncate block text-[11px]">
                {sourceImageName}
              </span>
              <span className="text-[10px] text-purple-300 block mt-0.5">
                آماده برای متحرک‌سازی ویدیویی با هوش مصنوعی Veo
              </span>
            </div>
            <button
              onClick={() => setSourceImage(null)}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition cursor-pointer"
              title="حذف تصویر"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-3 rounded-xl border border-dashed border-white/15 hover:border-purple-500/50 hover:bg-purple-500/5 text-slate-400 hover:text-purple-300 transition flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              <Upload className="w-4 h-4" />
              <span>آپلود عکس برای تبدیل به فیلم (Upload Photo)</span>
            </button>

            {projectImages.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 block mb-1.5">یا انتخاب از تصاویر پروژه:</span>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                  {projectImages.map((img) => (
                    <button
                      key={img.path}
                      onClick={() => {
                        setSourceImage(img.content);
                        setSourceImageName(img.name);
                      }}
                      className="shrink-0 p-1 rounded-lg bg-[#0e121e] hover:border-purple-400 border border-white/10 transition group"
                      title={img.name}
                    >
                      <img
                        src={img.content}
                        alt={img.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Motion Prompt & Aspect Ratio */}
      <div className="space-y-3">
        {/* Motion Prompt */}
        <div className="space-y-1.5">
          <label className="font-semibold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>۲. نحوه حرکت و انیمیشن دوربین (Prompt):</span>
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="مثال: حرکت آرام دوربین به جلو، وزش باد ملایم و درخشش نورها..."
            className="w-full bg-[#0d101a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition"
          />

          <div className="flex flex-wrap gap-1.5 pt-1">
            {MOTION_PROMPTS.map((m, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(m)}
                className="text-[10px] px-2 py-1 rounded-lg bg-white/5 hover:bg-purple-500/10 hover:text-purple-300 text-slate-400 border border-white/5 transition truncate max-w-xs text-left cursor-pointer"
              >
                ✦ {m}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio Selection (16:9 or 9:16 as required) */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>نسبت تصویر ویدیو (Aspect Ratio):</span>
          </label>
          <div className="grid grid-cols-2 gap-2 bg-[#0c0f18] p-1.5 rounded-xl border border-white/5">
            <button
              onClick={() => setAspectRatio('16:9')}
              className={`py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                aspectRatio === '16:9'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>افقی (16:9 Widescreen / وب)</span>
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              className={`py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                aspectRatio === '9:16'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>عمودی (9:16 Portrait / موبایل)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generate Video Action Button */}
      <button
        onClick={startVeoGeneration}
        disabled={loading || !sourceImage}
        className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
          loading || !sourceImage
            ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
            : 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-purple-500/25 hover:scale-[1.01]'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
            <span>{statusMessage || 'در حال رندر فیلم با Veo...'}</span>
          </>
        ) : (
          <>
            <Film className="w-4 h-4 text-purple-200" />
            <span>تولید ویدیوی متحرک با هوش مصنوعی Veo</span>
          </>
        )}
      </button>

      {/* Loading Progress Bar */}
      {loading && (
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span>{statusMessage || 'در حال پردازش عملیات ویدیویی...'}</span>
            <span className="font-mono text-purple-400">veo-3.1-fast</span>
          </div>
          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 animate-pulse w-full rounded-full" />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Generated Video Player & Actions */}
      {videoUrl && (
        <div className="p-3 rounded-2xl bg-[#0c101c] border border-purple-500/30 space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>فیلم با موفقیت آماده شد</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold">
              {aspectRatio} • 720p HD
            </span>
          </div>

          {/* Video Player */}
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              controls
              className={`w-full rounded-xl object-contain max-h-80 ${
                aspectRatio === '9:16' ? 'max-w-xs mx-auto' : ''
              }`}
            />
          </div>

          {/* Video Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button
              onClick={handleSaveToProject}
              className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition text-[11px] cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30'
              }`}
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'ذخیره شد!' : 'افزودن فیلم به پروژه'}</span>
            </button>

            <button
              onClick={handleInsertHtml}
              className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition text-[11px] cursor-pointer ${
                copiedHtml
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
              }`}
            >
              {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copiedHtml ? 'درج شد!' : 'درج تگ <video> در HTML'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="py-2 px-3 rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center gap-1.5 transition text-[11px] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود MP4</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
