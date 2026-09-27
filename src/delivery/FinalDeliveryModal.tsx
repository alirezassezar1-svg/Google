import React, { useState } from 'react';
import {
  Download,
  Check,
  Copy,
  ExternalLink,
  X,
  FileCode,
  PackageCheck,
  ArrowRight,
  ShieldCheck,
  Globe,
  FileCheck,
} from 'lucide-react';
import { Project } from '../types';
import { OrchestratorDeliveryContract } from '../orchestrator/types';
import { exportProjectAsZip, exportSingleBundledHtml } from '../utils/zip';

interface FinalDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  contract: OrchestratorDeliveryContract | null;
}

export const FinalDeliveryModal: React.FC<FinalDeliveryModalProps> = ({
  isOpen,
  onClose,
  project,
  contract,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingSingle, setIsExportingSingle] = useState(false);

  if (!isOpen || !contract) return null;

  const handleCopyReport = () => {
    navigator.clipboard.writeText(contract.rawDeliveryReportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsExportingZip(true);
      await exportProjectAsZip(project);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleDownloadSingle = async () => {
    try {
      setIsExportingSingle(true);
      await exportSingleBundledHtml(project);
    } finally {
      setIsExportingSingle(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#080b12] border border-cyan-500/30 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="p-5 border-b border-white/5 bg-[#0b0f19] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <PackageCheck className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">NONONICK AI Studio · Final Delivery</h3>
              <p className="text-xs text-slate-400">Production-ready build, quality gates verified, packaged for release.</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contract Body View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 font-sans">
          {/* Exact Section 30 Delivery Terminal Card */}
          <div className="rounded-xl bg-[#05070c] border border-white/10 p-5 font-mono text-xs leading-relaxed text-slate-300 relative select-text">
            <button
              onClick={handleCopyReport}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Report'}</span>
            </button>

            <pre className="whitespace-pre-wrap font-mono text-[11px] sm:text-xs text-slate-300">
              {contract.rawDeliveryReportText}
            </pre>
          </div>

          {/* Quick Release Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0d101a] border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white">Production Clean ZIP</h4>
                </div>
                <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                  Clean directory hierarchy (/assets, /css, /js, index.html, README.md). Zero debug flags, secrets, or temporary files.
                </p>
              </div>

              <button
                onClick={handleDownloadZip}
                disabled={isExportingZip}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-md transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingZip ? 'Packaging ZIP...' : `Download ${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.zip`}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#0d101a] border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-white">Single-File Mode (Section 28)</h4>
                </div>
                <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                  Self-contained HTML file with embedded styling, scripts, and media. Requires zero node_modules or build steps.
                </p>
              </div>

              <button
                onClick={handleDownloadSingle}
                disabled={isExportingSingle}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition cursor-pointer"
              >
                <FileCode className="w-4 h-4" />
                <span>{isExportingSingle ? 'Bundling...' : 'Download Single-File HTML'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0b0f19] flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Primary Host: <a href="https://nononick.ir/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">nononick.ir</a>
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
