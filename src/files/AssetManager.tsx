import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Video,
  FileCode,
  Upload,
  Trash2,
  Copy,
  Check,
  Maximize2,
  Sparkles,
  Download,
  Sliders,
  X,
  FileText,
} from 'lucide-react';
import { ProjectFile } from '../types';
import { optimizeImage, OptimizeResult } from '../utils/imageOptimizer';
import { exportSingleFile } from '../utils/zip';

interface AssetManagerProps {
  files: ProjectFile[];
  onUploadAssets: (files: FileList | File[]) => void;
  onDeleteAsset: (path: string) => void;
  onReplaceAsset: (path: string, newContent: string, newSize: number) => void;
}

export const AssetManager: React.FC<AssetManagerProps> = ({
  files,
  onUploadAssets,
  onDeleteAsset,
  onReplaceAsset,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<ProjectFile | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null);
  const [optQuality, setOptQuality] = useState(80);
  const [optFormat, setOptFormat] = useState<'image/webp' | 'image/jpeg' | 'image/png'>('image/webp');
  const [optMaxWidth, setOptMaxWidth] = useState(1280);

  // Filter for media assets (images, svg, videos, fonts)
  const mediaFiles = files.filter(
    (f) => f.type === 'image' || f.type === 'svg' || f.type === 'video' || f.type === 'font'
  );

  const handleCopyPath = (path: string) => {
    // Relative path suitable for src="" in html
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    navigator.clipboard.writeText(cleanPath);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleRunOptimization = async () => {
    if (!selectedAsset || selectedAsset.type !== 'image') return;
    setOptimizing(true);
    try {
      const res = await optimizeImage(selectedAsset.content, {
        maxWidth: optMaxWidth,
        quality: optQuality / 100,
        format: optFormat,
      });
      setOptimizeResult(res);
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setOptimizing(false);
    }
  };

  const handleApplyOptimization = () => {
    if (!selectedAsset || !optimizeResult) return;
    onReplaceAsset(selectedAsset.path, optimizeResult.dataUrl, optimizeResult.newSize);
    setSelectedAsset({
      ...selectedAsset,
      content: optimizeResult.dataUrl,
      size: optimizeResult.newSize,
    });
    setOptimizeResult(null);
  };

  return (
    <div className="h-full flex flex-col glass-panel rounded-xl overflow-hidden border border-white/5 text-xs">
      {/* Top Header */}
      <div className="p-3 border-b border-white/5 bg-[#090c14] flex items-center justify-between">
        <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          Asset & Media Manager ({mediaFiles.length})
        </span>

        <label className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium transition cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Media</span>
          <input
            type="file"
            multiple
            accept="image/*,video/*,.svg,.woff,.woff2,.ttf"
            className="hidden"
            onChange={(e) => e.target.files && onUploadAssets(e.target.files)}
          />
        </label>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {mediaFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <ImageIcon className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-400">No assets in project yet</p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Upload images, videos, SVGs, or custom web fonts to bundle directly into your website.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {mediaFiles.map((file) => {
              const isSelected = selectedAsset?.path === file.path;
              return (
                <div
                  key={file.path}
                  onClick={() => setSelectedAsset(file)}
                  className={`group relative rounded-xl border p-2 bg-[#090c14] cursor-pointer transition flex flex-col ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-400/20 shadow-lg shadow-cyan-500/10'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="h-28 w-full rounded-lg bg-black/40 flex items-center justify-center overflow-hidden mb-2 relative">
                    {file.type === 'image' || file.type === 'svg' ? (
                      <img
                        src={file.content}
                        alt={file.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : file.type === 'video' ? (
                      <div className="flex flex-col items-center text-slate-400">
                        <Video className="w-8 h-8 text-cyan-400 mb-1" />
                        <span className="text-[9px] uppercase font-mono">{file.extension}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <FileCode className="w-8 h-8 text-purple-400 mb-1" />
                        <span className="text-[9px] uppercase font-mono">{file.extension}</span>
                      </div>
                    )}

                    {/* Quick action overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyPath(file.path);
                        }}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"
                        title="Copy Relative Path"
                      >
                        {copiedPath === file.path ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportSingleFile(file);
                        }}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"
                        title="Download Asset"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <span className="font-mono text-[11px] text-slate-200 truncate" title={file.name}>
                      {file.name}
                    </span>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                      <span className="uppercase">{file.extension}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Asset Details Drawer / Modal */}
      {selectedAsset && (
        <div className="p-4 border-t border-white/5 bg-[#090c14] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono text-cyan-300 font-semibold truncate">{selectedAsset.path}</span>
              <span className="text-[10px] text-slate-500">({(selectedAsset.size / 1024).toFixed(1)} KB)</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleCopyPath(selectedAsset.path)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 transition"
              >
                {copiedPath === selectedAsset.path ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Path</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  onDeleteAsset(selectedAsset.path);
                  setSelectedAsset(null);
                }}
                className="p-1 rounded hover:bg-rose-500/20 text-rose-400"
                title="Delete Asset"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-1 rounded hover:bg-white/10 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Local Optimization Controls (for images) */}
          {selectedAsset.type === 'image' && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Local In-Browser Image Optimizer
                </span>
                <span className="text-[10px] text-slate-500">100% Client-Side Canvas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Target Format</span>
                  <select
                    value={optFormat}
                    onChange={(e) => setOptFormat(e.target.value as any)}
                    className="w-full bg-[#121622] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                  >
                    <option value="image/webp">WebP (High Compression)</option>
                    <option value="image/jpeg">JPEG (Standard)</option>
                    <option value="image/png">PNG (Lossless)</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Quality: {optQuality}%</span>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={optQuality}
                    onChange={(e) => setOptQuality(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 h-1 bg-white/10 rounded cursor-pointer mt-2"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Max Width: {optMaxWidth}px</span>
                  <select
                    value={optMaxWidth}
                    onChange={(e) => setOptMaxWidth(parseInt(e.target.value))}
                    className="w-full bg-[#121622] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                  >
                    <option value="1920">1920px (Desktop Full)</option>
                    <option value="1280">1280px (Standard)</option>
                    <option value="800">800px (Medium Card)</option>
                    <option value="400">400px (Thumbnail/Avatar)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleRunOptimization}
                  disabled={optimizing}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {optimizing ? 'Compressing...' : 'Test Optimize'}
                </button>

                {optimizeResult && (
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-semibold text-xs">
                      Saved {optimizeResult.savingsPercentage}% ({(optimizeResult.newSize / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      onClick={handleApplyOptimization}
                      className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                    >
                      Apply & Replace Asset
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
