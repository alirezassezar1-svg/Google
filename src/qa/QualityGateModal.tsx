import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  X,
  FileCheck,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { QualityAuditResult } from '../orchestrator/types';

interface QualityGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  qaResult: QualityAuditResult | null;
  onRerunQA?: () => void;
  onProceedToDelivery?: () => void;
}

export const QualityGateModal: React.FC<QualityGateModalProps> = ({
  isOpen,
  onClose,
  qaResult,
  onRerunQA,
  onProceedToDelivery,
}) => {
  if (!isOpen || !qaResult) return null;

  const isReady = qaResult.overallStatus === 'READY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl max-h-[85vh] bg-[#090c14] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#0c101a]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">10-Point Quality Gate Audit</h3>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    isReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {qaResult.overallStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mandatory pre-release validation verifying structural, responsive, and accessibility invariants.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {qaResult.categories.map((cat) => (
              <div
                key={cat.category}
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  cat.status === 'passed'
                    ? 'bg-[#0d101a] border-emerald-500/20'
                    : cat.status === 'warning'
                    ? 'bg-amber-950/15 border-amber-500/30'
                    : cat.status === 'failed'
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-[#0d101a] border-white/5'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {cat.status === 'passed' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {cat.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                    {cat.status === 'failed' && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    <span className="text-xs font-bold text-white">{cat.title}</span>
                  </div>

                  {cat.score !== undefined ? (
                    <span
                      className={`text-xs font-mono font-bold ${
                        cat.score >= 80 ? 'text-emerald-400' : cat.score >= 60 ? 'text-amber-400' : 'text-rose-400'
                      }`}
                    >
                      {cat.score}/100
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">Not measured</span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">{cat.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 bg-[#0c101a] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Passed <span className="text-emerald-400 font-bold font-mono">{qaResult.passedChecks}</span> of{' '}
            <span className="font-mono">{qaResult.totalChecks}</span> checks ({qaResult.overallScore}% score)
          </div>

          <div className="flex items-center gap-3">
            {onRerunQA && (
              <button
                onClick={onRerunQA}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-verify</span>
              </button>
            )}

            {onProceedToDelivery && (
              <button
                onClick={onProceedToDelivery}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition hover:scale-105 active:scale-95 cursor-pointer ${
                  isReady
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950'
                    : 'bg-amber-500 text-slate-950'
                }`}
              >
                <span>{isReady ? 'Proceed to Delivery' : 'Proceed with Review'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
