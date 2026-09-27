import { ProjectFile, ProjectSeoConfig, ProjectAnalytics, ProjectDatabase, VersionSnapshot } from '../types';

export type OrchestratorStatus =
  | 'idle'
  | 'planning'
  | 'running'
  | 'waiting'
  | 'failed'
  | 'repairing'
  | 'validating'
  | 'optimizing'
  | 'packaging'
  | 'completed';

export type AgentRole =
  | 'PLANNER'
  | 'DESIGNER'
  | 'DEVELOPER'
  | 'SEO'
  | 'ANALYZER'
  | 'CREATIVE'
  | 'DATA'
  | 'QA'
  | 'SECURITY'
  | 'RELEASE';

export interface OrchestratorStep {
  id: string;
  name: string;
  agent: AgentRole;
  tool: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'repaired';
  dependsOn?: string[];
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  durationMs?: number;
}

export interface OrchestratorApprovalRequest {
  id: string;
  action: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'destructive';
  preview: string;
  stepId: string;
  payload: Record<string, any>;
}

export interface QualityCategoryScore {
  category:
    | 'functional'
    | 'visual'
    | 'responsive'
    | 'seo'
    | 'accessibility'
    | 'performance'
    | 'file'
    | 'security'
    | 'link'
    | 'content';
  title: string;
  status: 'passed' | 'warning' | 'failed' | 'not_measured';
  score?: number; // 0-100 if measurable, undefined if not measured
  details: string;
  issuesCount: number;
}

export interface QualityAuditResult {
  overallStatus: 'READY' | 'NEEDS REVIEW';
  overallScore: number;
  categories: QualityCategoryScore[];
  timestamp: number;
  totalChecks: number;
  passedChecks: number;
  warnings: string[];
  criticalIssues: string[];
}

export interface OrchestratorArtifact {
  name: string;
  type: 'html' | 'zip' | 'json' | 'image' | 'video' | 'report' | 'config';
  location: string;
  sizeBytes?: number;
  description: string;
}

export interface OrchestratorDeliveryContract {
  success: boolean;
  project: {
    id: string;
    name: string;
    type: string;
  };
  summary: string;
  status: 'READY' | 'NEEDS REVIEW';
  completed_steps: string[];
  artifacts: OrchestratorArtifact[];
  validation: {
    functional: string;
    responsive: string;
    seo: string;
    performance: string;
    accessibility: string;
    links: string;
    security: string;
    content: string;
  };
  issues: string[];
  warnings: string[];
  next_actions: string[];
  delivery: {
    preview: string;
    download: string;
    deployment: string;
  };
  rawDeliveryReportText: string;
}

export interface OrchestratorTaskState {
  task_id: string;
  status: OrchestratorStatus;
  goal: string;
  intent_category: string;
  inputs: Array<{ name: string; value: any }>;
  steps: OrchestratorStep[];
  tools: string[];
  outputs: Array<{ tool: string; result: any; summary: string }>;
  errors: Array<{ step_id: string; error: string; recovered: boolean; recovery_action?: string }>;
  validation: Partial<Record<string, string>>;
  artifacts: OrchestratorArtifact[];
  final_result: OrchestratorDeliveryContract | null;
  approval_required?: OrchestratorApprovalRequest | null;
}

export interface AutomationTrigger {
  id: string;
  type: 'on_create' | 'on_lead' | 'on_seo_drop' | 'on_schedule' | 'manual_webhook';
  name: string;
  description: string;
  config?: Record<string, any>;
}

export interface AutomationStep {
  id: string;
  name: string;
  type: 'ai' | 'tool' | 'condition' | 'validation' | 'action';
  toolName: string;
  config: Record<string, any>;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  steps: AutomationStep[];
  lastRunAt?: number;
  lastRunStatus?: 'success' | 'failed' | 'warning';
  runCount: number;
}
