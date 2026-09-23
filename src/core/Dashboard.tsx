import React, { useState } from 'react';
import {
  Folder,
  Plus,
  Upload,
  Sparkles,
  FileCode,
  Smartphone,
  ExternalLink,
  Trash2,
  Copy,
  Clock,
  HardDrive,
  Download,
  Settings,
  Search,
  ChevronRight,
  Code2,
  Briefcase,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Project, ProjectTemplateType } from '../types';
import { TEMPLATES } from './templates';
import { exportProjectAsZip } from '../utils/zip';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface DashboardProps {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onCreateProjectFromTemplate: (templateId: ProjectTemplateType, customName?: string) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onImportZip: (file: File) => void;
  onImportFiles: (files: FileList | File[]) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onOpenProject,
  onCreateProjectFromTemplate,
  onDeleteProject,
  onDuplicateProject,
  onImportZip,
  onImportFiles,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [customProjectName, setCustomProjectName] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateProjectSize = (project: Project) => {
    const totalBytes = project.files.reduce((acc, f) => acc + f.size, 0);
    if (totalBytes < 1024) return `${totalBytes} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatLastModified = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleCreateWithAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    // Creates a new SaaS/Landing project initialized with the AI prompt
    onCreateProjectFromTemplate('landing', aiPrompt.slice(0, 30));
    setAiPrompt('');
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background ambient neon glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px]"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Navbar Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <span className="text-slate-950 font-black text-xl">N</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-xl tracking-tight text-white">
                  NONONICK <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">UNIVERSAL AI EDITOR</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-[10px]">
                  v2.5
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                The Autonomous Web, File, and Visual Design Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <PWAInstallButton />
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold transition cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import ZIP</span>
              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onImportZip(e.target.files[0])}
              />
            </label>

            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        </header>

        {/* AI Quick Generator Banner */}
        <section className="mt-8 p-6 rounded-2xl glass-panel border border-cyan-500/20 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-semibold border border-cyan-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NONONICK Neural Web Architect</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">What website or web app do you want to build?</h2>
            <p className="text-slate-400 text-xs mb-4">
              Describe your idea. The engine will scaffold the files, visual layouts, and responsive components automatically.
            </p>

            <form onSubmit={handleCreateWithAi} className="flex gap-2">
              <input
                type="text"
                placeholder='e.g. "Futuristic AI robotics landing page with dark glassmorphic cards and live pricing"'
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 bg-[#090b12] border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition whitespace-nowrap cursor-pointer"
              >
                Generate Project
              </button>
            </form>
          </div>
        </section>

        {/* Projects Section */}
        <section className="mt-10 flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white">Your Web Projects</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400 font-mono">
                {projects.length}
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0b0e17] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-white/10 glass-panel">
              <Folder className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-base font-semibold text-white mb-1">No Projects Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-6">
                Create a new project from our curated responsive templates, import a ZIP file, or ask AI to generate one.
              </p>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Browse Starter Templates
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => onOpenProject(project.id)}
                  className="group relative rounded-2xl glass-panel border border-white/5 hover:border-cyan-500/40 p-5 transition-all hover:shadow-2xl hover:shadow-cyan-500/10 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Tag badge & Quick Actions */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300 uppercase">
                        {project.templateType}
                      </span>

                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                      >
                        <button
                          onClick={() => onDuplicateProject(project.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => exportProjectAsZip(project)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-400"
                          title="Export ZIP"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProject(project.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {project.description || 'Custom web project created in NONONICK.'}
                    </p>
                  </div>

                  {/* Bottom Stats Footer */}
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatLastModified(project.updatedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileCode className="w-3 h-3 text-slate-400" />
                      {project.files.length} files
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-slate-400" />
                      {calculateProjectSize(project)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Template Selector Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[85vh] rounded-2xl glass-dropdown border border-white/10 shadow-2xl overflow-hidden flex flex-col text-xs">
            <div className="p-5 border-b border-white/10 bg-[#090c14] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Create New Web Project</h3>
                <p className="text-slate-400 text-xs mt-0.5">Select a pre-architected starting template</p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4 custom-scrollbar">
              {TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    onCreateProjectFromTemplate(tmpl.id);
                    setShowTemplateModal(false);
                  }}
                  className="p-5 rounded-2xl glass-panel border border-white/5 hover:border-cyan-400/60 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono text-[10px] uppercase">
                        {tmpl.badge}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                      {tmpl.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-1.5">
                    {tmpl.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
