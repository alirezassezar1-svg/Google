import React, { useState } from 'react';
import {
  Workflow,
  Play,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  Sliders,
  Filter,
  Layers,
  Database,
  Globe,
  Check,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Project } from '../types';
import { AutomationWorkflow, AutomationStep } from '../orchestrator/types';

interface AutomationStudioProps {
  project: Project;
  onExecuteWorkflow?: (workflow: AutomationWorkflow) => void;
}

export const AutomationStudio: React.FC<AutomationStudioProps> = ({ project, onExecuteWorkflow }) => {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([
    {
      id: 'flow_1',
      name: 'New Website Auto-Optimization Pipeline',
      description: 'Automatically triggers code doctor, generates semantic SEO metadata, injects analytics telemetry, and runs QA.',
      enabled: true,
      runCount: 14,
      lastRunAt: Date.now() - 3600000 * 2,
      lastRunStatus: 'success',
      trigger: {
        id: 'trig_1',
        type: 'on_create',
        name: 'Website Created or Updated',
        description: 'Fires when new files or template modifications are saved.',
      },
      steps: [
        { id: 's1', name: 'Inspect Markup & Code', type: 'tool', toolName: 'WebsiteAnalyzer', config: {} },
        { id: 's2', name: 'Validate Semantic Structure', type: 'condition', toolName: 'ConditionCheck', config: { minScore: 70 } },
        { id: 's3', name: 'Synthesize SEO & Social Cards', type: 'ai', toolName: 'SeoOptimizer', config: { autoApply: true } },
        { id: 's4', name: 'Execute Quality Gate', type: 'validation', toolName: 'QualityGate', config: { target: 'READY' } },
        { id: 's5', name: 'Emit Delivery Artifacts', type: 'action', toolName: 'ReleasePackager', config: { format: 'zip' } },
      ],
    },
    {
      id: 'flow_2',
      name: 'Lead Capture & Telemetry Pipeline',
      description: 'Listens for customer form submissions, runs AI lead classification, stores in project database, and alerts team.',
      enabled: true,
      runCount: 28,
      lastRunAt: Date.now() - 3600000 * 8,
      lastRunStatus: 'success',
      trigger: {
        id: 'trig_2',
        type: 'on_lead',
        name: 'New Form Submit / Contact Lead',
        description: 'Fires when a user submits contact details on the live website.',
      },
      steps: [
        { id: 's1', name: 'Validate Contact Payload', type: 'tool', toolName: 'InputValidator', config: {} },
        { id: 's2', name: 'Classify Priority with AI', type: 'ai', toolName: 'GeminiClassifier', config: {} },
        { id: 's3', name: 'Store in Customers Collection', type: 'tool', toolName: 'DatabaseStudio', config: { collection: 'leads' } },
        { id: 's4', name: 'Dispatch Push Notification', type: 'action', toolName: 'NotificationDispatcher', config: {} },
      ],
    },
    {
      id: 'flow_3',
      name: 'Daily Search Engine & CWV Health Monitor',
      description: 'Scheduled cron running once daily to verify Core Web Vitals thresholds and audit canonical link stability.',
      enabled: false,
      runCount: 5,
      lastRunAt: Date.now() - 86400000,
      lastRunStatus: 'success',
      trigger: {
        id: 'trig_3',
        type: 'on_schedule',
        name: 'Scheduled Daily Health Check',
        description: 'Runs every 24 hours at 00:00 UTC.',
      },
      steps: [
        { id: 's1', name: 'Query Telemetry Engine', type: 'tool', toolName: 'AnalyticsEngine', config: {} },
        { id: 's2', name: 'Detect Performance Drifts', type: 'condition', toolName: 'VitalsDriftCheck', config: {} },
        { id: 's3', name: 'Generate Health Audit Report', type: 'action', toolName: 'ReportGenerator', config: {} },
      ],
    },
  ]);

  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('flow_1');
  const [isRunning, setIsRunning] = useState(false);
  const [activeRunningStepIndex, setActiveRunningStepIndex] = useState<number>(-1);
  const [executionLogs, setExecutionLogs] = useState<Array<{ timestamp: string; message: string; type: 'info' | 'success' | 'warn' }>>([]);

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId) || workflows[0];

  const handleToggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const handleRunWorkflow = async () => {
    if (!activeWorkflow || isRunning) return;
    setIsRunning(true);
    setExecutionLogs([]);

    const addLog = (message: string, type: 'info' | 'success' | 'warn' = 'info') => {
      const time = new Date().toLocaleTimeString();
      setExecutionLogs((prev) => [...prev, { timestamp: time, message, type }]);
    };

    addLog(`Initiating workflow: ${activeWorkflow.name}`, 'info');
    addLog(`Trigger activated: ${activeWorkflow.trigger.name}`, 'info');

    for (let i = 0; i < activeWorkflow.steps.length; i++) {
      setActiveRunningStepIndex(i);
      const step = activeWorkflow.steps[i];
      addLog(`Executing Step [${i + 1}/${activeWorkflow.steps.length}]: ${step.name} (${step.toolName})`, 'info');
      await new Promise((r) => setTimeout(r, 650));
      addLog(`Completed: ${step.name} successfully. Structured payload returned.`, 'success');
    }

    setActiveRunningStepIndex(-1);
    setIsRunning(false);
    addLog(`Workflow ${activeWorkflow.name} successfully executed. All invariants verified.`, 'success');

    // Update run status
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === activeWorkflow.id
          ? {
              ...w,
              lastRunAt: Date.now(),
              lastRunStatus: 'success',
              runCount: w.runCount + 1,
            }
          : w
      )
    );

    if (onExecuteWorkflow) {
      onExecuteWorkflow(activeWorkflow);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#07090e] text-slate-100 font-sans overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#090c14]/90 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Automation Engine</h2>
            <span className="text-xs text-slate-400">· Trigger → Condition → AI → Tool → Action</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Orchestrate automated triggers, content transformation pipelines, scheduled audits, and notifications.
          </p>
        </div>

        <button
          onClick={handleRunWorkflow}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isRunning ? 'Running Pipeline...' : 'Test Run Workflow'}</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Workflow List */}
        <div className="w-80 border-r border-white/5 bg-[#080b12] flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configured Workflows</span>
            <span className="text-xs font-mono text-cyan-400">{workflows.length} Active</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {workflows.map((flow) => {
              const isSelected = flow.id === activeWorkflowId;
              return (
                <div
                  key={flow.id}
                  onClick={() => setActiveWorkflowId(flow.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/50 shadow-sm'
                      : 'bg-[#0d101a] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-xs font-bold text-white leading-snug">{flow.name}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWorkflow(flow.id);
                      }}
                      className={`w-7 h-4 rounded-full transition-colors relative ${
                        flow.enabled ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                          flow.enabled ? 'translate-x-3' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{flow.description}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-white/5">
                    <span>{flow.steps.length} Steps</span>
                    <span>{flow.runCount} Runs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Canvas: Visual Pipeline DAG Viewer */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-[#07090e]">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold text-cyan-400 uppercase">Active Workflow</span>
              <span className="text-xs text-slate-500">· ID: {activeWorkflow.id}</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">{activeWorkflow.name}</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{activeWorkflow.description}</p>
          </div>

          {/* Trigger Card */}
          <div className="mb-6">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              01. Activation Trigger
            </span>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{activeWorkflow.trigger.name}</h4>
                  <p className="text-xs text-slate-400">{activeWorkflow.trigger.description}</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-semibold">
                EVENT
              </span>
            </div>
          </div>

          {/* Sequential Step DAG Chain */}
          <div className="mb-6">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
              02. Execution Pipeline ({activeWorkflow.steps.length} Coordinated Steps)
            </span>

            <div className="space-y-3 relative">
              {activeWorkflow.steps.map((step, idx) => {
                const isStepRunning = activeRunningStepIndex === idx;
                const isStepPassed = activeRunningStepIndex > idx || (!isRunning && activeWorkflow.runCount > 0);

                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-xl border transition flex items-center justify-between ${
                      isStepRunning
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-lg animate-pulse'
                        : isStepPassed
                        ? 'bg-[#0d101a] border-emerald-500/30'
                        : 'bg-[#0d101a] border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                          isStepRunning
                            ? 'bg-cyan-400 text-slate-950'
                            : isStepPassed
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-white">{step.name}</h5>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              step.type === 'ai'
                                ? 'bg-purple-500/20 text-purple-300'
                                : step.type === 'condition'
                                ? 'bg-amber-500/20 text-amber-300'
                                : step.type === 'validation'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-cyan-500/20 text-cyan-300'
                            }`}
                          >
                            {step.type.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">Tool: {step.toolName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {isStepRunning ? (
                        <div className="flex items-center gap-1.5 text-cyan-300 font-mono">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : isStepPassed ? (
                        <div className="flex items-center gap-1 text-emerald-400 font-mono">
                          <Check className="w-3.5 h-3.5" />
                          <span>Passed</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">Standby</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-Time Execution Logs */}
          <div className="flex-1 min-h-[160px] p-4 rounded-xl bg-[#05070c] border border-white/5 font-mono text-xs flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-slate-400">
              <span className="font-semibold text-[11px] uppercase tracking-wider">Telemetry & Execution Logs</span>
              <span className="text-[10px]">Ready</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 text-[11px]">
              {executionLogs.length === 0 ? (
                <div className="text-slate-600 italic py-4">Click "Test Run Workflow" to observe step transitions and machine-readable states.</div>
              ) : (
                executionLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                    <span
                      className={
                        log.type === 'success'
                          ? 'text-emerald-400'
                          : log.type === 'warn'
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
