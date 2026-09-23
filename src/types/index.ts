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
