import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Check,
  X,
  FileCheck,
  Maximize2,
  Terminal,
  Cpu,
} from 'lucide-react';
import { Project } from '../types';
import {
  OrchestratorTaskState,
  OrchestratorStep,
  OrchestratorApprovalRequest,
  OrchestratorDeliveryContract,
} from './types';
import { UniversalOrchestrator } from './UniversalOrchestrator';

interface OrchestratorViewProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onOpenDeliveryContract: (contract: OrchestratorDeliveryContract) => void;
  initialPrompt?: string;
  initialMode?: 'build' | 'fix' | 'improve' | 'ship';
}

export const OrchestratorView: React.FC<OrchestratorViewProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  onOpenDeliveryContract,
  initialPrompt = '',
  initialMode,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [taskState, setTaskState] = useState<OrchestratorTaskState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [approvalRequest, setApprovalRequest] = useState<OrchestratorApprovalRequest | null>(null);
  const [approvalResolver, setApprovalResolver] = useState<((approved: boolean) => void) | null>(null);
  const [selectedStep, setSelectedStep] = useState<OrchestratorStep | null>(null);

  if (!isOpen) return null;

  const handleStartOrchestration = async (overridePrompt?: string, mode?: 'build' | 'fix' | 'improve' | 'ship') => {
    const p = overridePrompt || prompt;
    if (!p.trim() || isRunning) return;

    setIsRunning(true);
    // 1. Plan task
    const task = UniversalOrchestrator.planTask(p, project, mode || initialMode);
    setTaskState(task);
    setSelectedStep(task.steps[0]);

    // 2. Execute pipeline
    await UniversalOrchestrator.executeTask(task, project, {
      onStepUpdate: (updatedStep, allSteps) => {
        setTaskState((prev) => (prev ? { ...prev, steps: [...allSteps] } : null));
        setSelectedStep(updatedStep);
      },
      onRequestApproval: (req) => {
        return new Promise<boolean>((resolve) => {
          setApprovalRequest(req);
          setApprovalResolver(() => resolve);
        });
      },
      onTaskComplete: (updatedProject, contract) => {
        setIsRunning(false);
        onUpdateProject(updatedProject);
        setTaskState((prev) => (prev ? { ...prev, status: 'completed', final_result: contract } : null));
      },
      onError: (err) => {
        setIsRunning(false);
        console.error('Orchestrator error:', err);
      },
    });
  };

  const handleApprovalResponse = (approved: boolean) => {
    if (approvalResolver) {
      approvalResolver(approved);
      setApprovalResolver(null);
      setApprovalRequest(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[88vh] bg-[#07090e] border border-cyan-500/30 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 bg-[#0a0d17] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Cpu className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Universal AI Orchestrator</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  {taskState ? taskState.status.toUpperCase() : 'STANDBY'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                REQUEST → UNDERSTAND → PLAN → EXECUTE → VERIFY → OPTIMIZE → PACKAGE → DELIVER
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Bar or Active Task Overview */}
        <div className="p-4 border-b border-white/5 bg-[#090b13]">
          {!taskState || taskState.status === 'completed' || taskState.status === 'failed' ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartOrchestration()}
                  placeholder="Give NONONICK any goal (e.g. 'Build a website for a clinic in Tehran', 'Improve mobile responsiveness', 'Optimize for SEO')..."
                  className="flex-1 bg-[#05070c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition"
                />
                <button
                  onClick={() => handleStartOrchestration()}
                  disabled={!prompt.trim() || isRunning}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  Orchestrate
                </button>
              </div>

              {/* Productivity Mode Quick Triggers (Section 29) */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-mono text-[11px]">Productivity Mode:</span>
                <button
                  onClick={() => {
                    const p = 'Build full modern responsive website with high-converting sections and SEO';
                    setPrompt(p);
                    handleStartOrchestration(p, 'build');
                  }}
                  className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold transition"
                >
                  ⚡ "Build it"
                </button>
                <button
                  onClick={() => {
                    const p = 'Scan codebase, identify all defects and broken links, and auto-repair them';
                    setPrompt(p);
                    handleStartOrchestration(p, 'fix');
                  }}
                  className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold transition"
                >
                  🔧 "Fix it"
                </button>
                <button
                  onClick={() => {
                    const p = 'Audit multi-category performance, improve contrast, and optimize Core Web Vitals';
                    setPrompt(p);
                    handleStartOrchestration(p, 'improve');
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold transition"
                >
                  📈 "Improve it"
                </button>
                <button
                  onClick={() => {
                    const p = 'Run full 10-point Quality Gate, package production ZIP, and prepare release';
                    setPrompt(p);
                    handleStartOrchestration(p, 'ship');
                  }}
                  className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold transition"
                >
                  🚀 "Ship it"
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Active Goal</span>
                <h4 className="text-xs font-bold text-white">{taskState.goal}</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">
                  {taskState.steps.filter((s) => s.status === 'completed' || s.status === 'repaired').length} /{' '}
                  {taskState.steps.length} Steps
                </span>
                {isRunning && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
              </div>
            </div>
          )}
        </div>

        {/* Content Area: Split between DAG Step Chain and Step Inspector */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Sequential DAG Steps */}
          <div className="w-1/2 border-r border-white/5 overflow-y-auto p-4 space-y-2 bg-[#06080d]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Execution Graph (DAG)
            </span>

            {taskState ? (
              taskState.steps.map((step, idx) => {
                const isSelected = selectedStep?.id === step.id;
                return (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStep(step)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-400 shadow-md'
                        : 'bg-[#0d101a] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                          step.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : step.status === 'running'
                            ? 'bg-cyan-400 text-slate-950 animate-pulse'
                            : step.status === 'repaired'
                            ? 'bg-amber-500/20 text-amber-400'
                            : step.status === 'failed'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {step.status === 'completed' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : step.status === 'running' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-white">{step.name}</h5>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span className="text-cyan-300 font-semibold">{step.agent}</span>
                          <span>·</span>
                          <span>{step.tool}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                        step.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : step.status === 'running'
                          ? 'bg-cyan-500/10 text-cyan-300'
                          : step.status === 'repaired'
                          ? 'bg-amber-500/10 text-amber-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                Choose a productivity preset above or enter a custom prompt to generate an intelligent DAG pipeline.
              </div>
            )}
          </div>

          {/* Right: Step Inspector & Output Viewer */}
          <div className="w-1/2 p-4 overflow-y-auto bg-[#080a10] flex flex-col justify-between">
            {selectedStep ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      AGENT: {selectedStep.agent}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Tool: {selectedStep.tool}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{selectedStep.name}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedStep.description}</p>
                </div>

                {selectedStep.output && (
                  <div className="rounded-xl bg-[#05070c] border border-white/10 p-3 font-mono text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Structured Tool Output
                    </span>
                    <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedStep.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-500 text-xs italic py-12">Select a step to inspect machine output.</div>
            )}

            {/* If task is completed, show button to view Final Delivery Contract */}
            {taskState?.final_result && (
              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => onOpenDeliveryContract(taskState.final_result!)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-bold text-xs shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>View Final Delivery Report & Artifacts</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Approval Modal Gate (Section 7) */}
        {approvalRequest && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0d101a] border border-amber-500/40 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-3 text-amber-400">
                <ShieldAlert className="w-6 h-6" />
                <h4 className="text-base font-bold text-white">Approval Required</h4>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">{approvalRequest.description}</p>

              <div className="p-3 rounded-lg bg-black/50 border border-white/5 text-xs font-mono text-amber-300 mb-6">
                Impact: {approvalRequest.impact.toUpperCase()}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => handleApprovalResponse(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleApprovalResponse(true)}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
                >
                  Approve Action
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
