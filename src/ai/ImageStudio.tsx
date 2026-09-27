import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Download,
  Plus,
  ArrowRight,
  Upload,
  Film,
  Code,
  Check,
  RefreshCw,
  Sliders,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { Project, ProjectFile } from '../types';

interface ImageStudioProps {
  project: Project;
  onSaveMediaAsset?: (path: string, content: string, isBinary: boolean, mimeType: string) => void;
  onInsertHtmlSnippet?: (snippet: string) => void;
  onSendToVeo?: (imageUrl: string, prompt?: string) => void;
}

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
type Resolution = '1K' | '2K' | '512px';

export const ImageStudio: React.FC<ImageStudioProps> = ({
  project,
  onSaveMediaAsset,
  onInsertHtmlSnippet,
  onSendToVeo,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageSize, setImageSize] = useState<Resolution>('1K');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [inputImageName, setInputImageName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>('gemini-3.1-flash-image-preview');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suggested Prompts
  const PROMPT_IDEAS = [
    'Futuristic glassmorphic web dashboard with glowing cyan charts on dark slate',
    'Cinematic cyberpunk city skyline with holographic neon banners and light trails',
    'Minimalist 3D geometric abstract icon with violet and cyan gradient aura',
    'Ultra-clean modern SaaS hero header illustration with floating UI widgets',
    'Dark luxury tech product showcase pedestal with cinematic rim lighting',
  ];

  // Pick an image from project files
  const projectImages = project.files.filter(
    (f) => f.type === 'image' && f.content && f.content.startsWith('data:image')
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setInputImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setInputImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    setError(null);
    setLoading(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          inputImage: inputImage || undefined,
          aspectRatio,
          imageSize,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Generation failed: ${res.statusText}`);
      }

      const data = await res.json();
      setGeneratedImage(data.imageUrl);
      if (data.modelUsed) setModelUsed(data.modelUsed);
    } catch (err: any) {
      console.error('Image Generation error:', err);
      setError(err.message || 'Failed to generate image. Please try another prompt.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToProject = () => {
    if (!generatedImage) return;

    const filename = `img-${Date.now().toString(36)}.png`;
    const targetPath = `/assets/images/${filename}`;

    if (onSaveMediaAsset) {
      onSaveMediaAsset(targetPath, generatedImage, true, 'image/png');
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleInsertHtml = () => {
    if (!generatedImage) return;

    const altText = prompt.slice(0, 60).replace(/"/g, '&quot;');
    const snippet = `\n<!-- Generated with NONONICK AI (gemini-3.1-flash-image-preview) -->\n<img src="${generatedImage}" alt="${altText}" class="w-full rounded-2xl shadow-2xl border border-white/10 object-cover my-6 transition-all hover:scale-[1.01]" />\n`;

    if (onInsertHtmlSnippet) {
      onInsertHtmlSnippet(snippet);
    }

    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `nononick-ai-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#07090f] text-slate-200 text-xs">
      {/* Header Info */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-purple-950/40 border border-cyan-500/20 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm">استودیو ساخت و ویرایش تصویر</h3>
          </div>
          <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
            تولید تصاویر مدرن و تغییر تصاویر با پرامپت متنی بر پایه هوش مصنوعی <strong>gemini-3.1-flash-image-preview</strong>.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold shrink-0">
          FLASH IMAGE
        </span>
      </div>

      {/* Prompt Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>دستور متنی (Prompt):</span>
          </label>
          <span className="text-[10px] text-slate-400">توصیف دقیق تصویر دلخواه</span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="مثال: طراحی هدر مدرن با جلوه شیشه‌ای نئونی، پس‌زمینه تیره و دکمه‌های نورانی..."
          rows={3}
          className="w-full bg-[#0d101a] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition resize-none leading-relaxed"
        />

        {/* Prompt Suggestions */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PROMPT_IDEAS.map((idea, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(idea)}
              className="text-[10px] px-2 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-300 text-slate-400 border border-white/5 transition truncate max-w-xs text-left cursor-pointer"
            >
              ✦ {idea}
            </button>
          ))}
        </div>
      </div>

      {/* Image-to-Image / Reference Image Section */}
      <div className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>ویرایش تصویر یا مرجع ورودی (Image-to-Image):</span>
          </span>
          <span className="text-[10px] text-slate-400">(اختیاری)</span>
        </div>

        {inputImage ? (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#0b0e17] border border-cyan-500/30">
            <img
              src={inputImage}
              alt="Reference"
              className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-white truncate block text-[11px]">
                {inputImageName || 'تصویر مرجع انتخاب شده'}
              </span>
              <span className="text-[10px] text-cyan-300 block">آماده برای بازطراحی و ویرایش هوشمند</span>
            </div>
            <button
              onClick={() => {
                setInputImage(null);
                setInputImageName('');
              }}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition cursor-pointer"
              title="حذف تصویر مرجع"
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
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-white/15 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-slate-400 hover:text-cyan-300 transition flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>آپلود تصویر برای ویرایش یا افزودن افکت با AI</span>
            </button>

            {/* Quick Pick from Project Images */}
            {projectImages.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 block mb-1.5">یا انتخاب از تصاویر پروژه:</span>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                  {projectImages.map((img) => (
                    <button
                      key={img.path}
                      onClick={() => {
                        setInputImage(img.content);
                        setInputImageName(img.name);
                      }}
                      className="shrink-0 p-1 rounded-lg bg-[#0e121e] hover:border-cyan-400 border border-white/10 transition group"
                      title={img.name}
                    >
                      <img
                        src={img.content}
                        alt={img.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Aspect Ratio & Resolution Config */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Aspect Ratio */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>نسبت تصویر (Aspect Ratio):</span>
          </label>
          <div className="grid grid-cols-5 gap-1 bg-[#0c0f18] p-1 rounded-xl border border-white/5">
            {(['1:1', '16:9', '9:16', '4:3', '3:4'] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`py-1.5 rounded-lg font-mono text-[10px] transition cursor-pointer text-center ${
                  aspectRatio === ratio
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
            <span>کیفیت (Resolution):</span>
          </label>
          <div className="grid grid-cols-3 gap-1 bg-[#0c0f18] p-1 rounded-xl border border-white/5">
            {(['512px', '1K', '2K'] as Resolution[]).map((res) => (
              <button
                key={res}
                onClick={() => setImageSize(res)}
                className={`py-1.5 rounded-lg font-mono text-[10px] transition cursor-pointer text-center ${
                  imageSize === res
                    ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Action Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
          loading || !prompt.trim()
            ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
            : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-cyan-500/20 hover:scale-[1.01]'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
            <span>در حال تولید تصویر با هوش مصنوعی...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>{inputImage ? 'تولید تصویر مجدد با تغییرات' : 'ساخت تصویر با هوش مصنوعی'}</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Generated Result Preview */}
      {generatedImage && (
        <div className="p-3 rounded-2xl bg-[#0c101c] border border-cyan-500/30 space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>تصویر تولید شده با موفقیت</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono">
                {aspectRatio}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-mono">
                {modelUsed}
              </span>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center group">
            <img
              src={generatedImage}
              alt={prompt}
              className="w-full max-h-80 object-contain rounded-xl"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              onClick={handleSaveToProject}
              className={`py-2 px-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition text-[11px] cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20'
              }`}
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'ذخیره شد!' : 'افزودن به پروژه'}</span>
            </button>

            <button
              onClick={handleInsertHtml}
              className={`py-2 px-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition text-[11px] cursor-pointer ${
                copiedHtml
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
              }`}
            >
              {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copiedHtml ? 'درج شد!' : 'درج در HTML'}</span>
            </button>

            <button
              onClick={() => onSendToVeo?.(generatedImage, prompt)}
              className="py-2 px-2.5 rounded-xl font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 border border-purple-500/30 flex items-center justify-center gap-1.5 transition text-[11px] cursor-pointer"
              title="تبدیل مستقیم این تصویر به فیلم با مدل هوش مصنوعی Veo"
            >
              <Film className="w-3.5 h-3.5 text-pink-400" />
              <span>تبدیل به فیلم (Veo)</span>
            </button>

            <button
              onClick={handleDownload}
              className="py-2 px-2.5 rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center gap-1.5 transition text-[11px] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود PNG</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
