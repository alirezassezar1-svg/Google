export type FileType =
  | 'html'
  | 'css'
  | 'js'
  | 'ts'
  | 'jsx'
  | 'tsx'
  | 'json'
  | 'svg'
  | 'xml'
  | 'txt'
  | 'md'
  | 'csv'
  | 'scss'
  | 'less'
  | 'yaml'
  | 'image'
  | 'video'
  | 'font'
  | 'other';

export interface ProjectFile {
  path: string; // e.g. "/index.html" or "/css/style.css"
  name: string;
  extension: string;
  type: FileType;
  content: string; // text content or base64 data URL for binary assets
  isBinary?: boolean;
  mimeType?: string;
  size: number;
  updatedAt: number;
}

export type ProjectTemplateType =
  | 'blank'
  | 'html-css-js'
  | 'landing'
  | 'business'
  | 'portfolio'
  | 'saas'
  | 'webapp'
  | 'pwa'
  | 'custom';

export interface Project {
  id: string;
  name: string;
  description: string;
  templateType: ProjectTemplateType;
  createdAt: number;
  updatedAt: number;
  files: ProjectFile[];
  activeFilePath: string;
  settings: ProjectSettings;
  thumbnail?: string;
  database?: ProjectDatabase;
  seo?: ProjectSeoConfig;
  analytics?: ProjectAnalytics;
  theme?: ProjectThemeConfig;
  brand?: {
    name: string;
    slogan?: string;
    primaryDomain?: string;
    colors?: { primary: string; secondary: string; accent: string; background: string };
    logo?: string;
  };
  design_system?: {
    theme: 'dark' | 'light';
    typography?: { heading: string; body: string; mono: string };
    radii?: string;
    spacing?: string;
  };
  pages?: Array<{ id: string; title: string; slug: string; path: string; isHome?: boolean }>;
  components?: Array<{ id: string; name: string; type: string; code: string }>;
  assets?: Array<{ id: string; name: string; path: string; type: string; size: number; url?: string }>;
  content?: Record<string, any>;
  workflows?: any[];
  deployment?: {
    status: 'idle' | 'building' | 'deployed' | 'failed';
    url?: string;
    provider?: 'vercel' | 'netlify' | 'static' | 'docker';
    lastDeployedAt?: number;
    instructions?: string;
  };
  qa?: any;
  status?: 'draft' | 'in_progress' | 'ready' | 'needs_review' | 'archived';
}

export type DatabaseFieldType = 'string' | 'number' | 'boolean' | 'date' | 'json' | 'image' | 'relation';

export interface DatabaseField {
  id: string;
  name: string;
  type: DatabaseFieldType;
  required?: boolean;
  defaultValue?: any;
  description?: string;
}

export interface DatabaseCollection {
  id: string;
  name: string;
  description?: string;
  fields: DatabaseField[];
  records: Record<string, any>[];
  createdAt?: number;
  updatedAt?: number;
}

export interface ProjectDatabase {
  collections: DatabaseCollection[];
  version?: number;
  lastSyncedAt?: number;
  lastSync?: number;
}

export interface ProjectSeoConfig {
  title: string;
  description: string;
  canonicalUrl?: string;
  keywords: string[];
  author?: string;
  robots: string; // e.g. 'index, follow'
  language: string; // e.g. 'en', 'fa'
  themeColor: string;
  ogType: 'website' | 'article' | 'product';
  ogImage?: string;
  twitterCard: 'summary' | 'summary_large_image';
  twitterHandle?: string;
  structuredDataType?: 'WebApplication' | 'WebSite' | 'Organization' | 'Product' | 'Article';
}

export interface ProjectSettings {
  title: string;
  theme: 'dark' | 'light';
  autoSave: boolean;
  autoSaveIntervalMs: number;
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  viewportDevice: 'desktop' | 'tablet' | 'mobile' | 'iphone' | 'custom';
  customViewportWidth: number;
  previewScale: number;
  aiProvider: 'gemini' | 'local' | 'custom';
}

export type CSSVariableCategory = 'colors' | 'typography' | 'spacing' | 'borders' | 'shadows' | 'other';

export interface CSSVariableItem {
  id: string;
  name: string; // e.g. "--color-primary"
  value: string; // e.g. "#00f2fe"
  category: CSSVariableCategory;
  label?: string;
  description?: string;
  type?: 'color' | 'font' | 'dimension' | 'shadow' | 'text' | 'number';
}

export interface ProjectThemeConfig {
  activePresetId?: string;
  presetName?: string;
  variables: CSSVariableItem[];
  targetCssFile?: string; // e.g. "/style.css"
  updatedAt?: number;
}

export interface VersionSnapshot {
  id: string;
  projectId: string;
  timestamp: number;
  label: string;
  description?: string;
  files: ProjectFile[];
}

export interface AIProposedChange {
  filePath: string;
  action: 'modify' | 'create' | 'delete';
  oldContent?: string;
  newContent: string;
  diffSummary: string;
  accepted: boolean;
}

export interface AIProposal {
  id: string;
  title: string;
  explanation: string;
  prompt: string;
  timestamp: number;
  changes: AIProposedChange[];
  suggestedActions?: string[];
}

export interface SelectedElementInfo {
  tagName: string;
  id: string;
  className: string;
  innerText?: string;
  outerHTML?: string;
  selectorPath: string;
  styles: Record<string, string>;
  rect?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface ProjectProblem {
  id: string;
  filePath: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  source: 'html' | 'css' | 'js' | 'json';
}

export interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  unit: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  target: string;
  description: string;
}

export interface AnalyticsTimePoint {
  date: string;
  views: number;
  visitors: number;
  bounceRate: number;
  avgDurationSec: number;
}

export interface AnalyticsEvent {
  id: string;
  type: 'pageview' | 'click' | 'db_query' | 'form_submit' | 'download' | 'custom' | 'web_vital' | 'session_ping';
  label: string;
  path: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface AIAnalyticsInsight {
  id: string;
  title: string;
  impact: 'high' | 'medium' | 'low';
  category: 'performance' | 'conversion' | 'ux' | 'seo';
  metric: string;
  finding: string;
  action: string;
  suggestedCodePatch?: {
    filePath: string;
    description: string;
    patch: string;
  };
}

export interface ProjectAnalytics {
  projectId: string;
  enabled: boolean;
  totalPageViews: number;
  uniqueVisitors: number;
  avgSessionDurationSec: number;
  bounceRate: number;
  activeNow: number;
  timeRange: '24h' | '7d' | '30d' | 'all';
  history: AnalyticsTimePoint[];
  webVitals: {
    lcp: WebVitalMetric;
    fid: WebVitalMetric;
    cls: WebVitalMetric;
    ttfb: WebVitalMetric;
  };
  deviceBreakdown: {
    mobile: number; // percentage
    desktop: number;
    tablet: number;
  };
  browserBreakdown: {
    name: string;
    percentage: number;
    count: number;
  }[];
  topPages: {
    path: string;
    views: number;
    visitors: number;
    avgTimeSec: number;
    bounceRate: number;
  }[];
  topReferrers: {
    source: string;
    visitors: number;
    percentage: number;
  }[];
  recentEvents: AnalyticsEvent[];
  aiInsights: AIAnalyticsInsight[];
  lastUpdated: number;
}

