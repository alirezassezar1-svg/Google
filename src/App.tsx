/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Project,
  ProjectFile,
  ProjectTemplateType,
  SelectedElementInfo,
  AIProposal,
  AIProposedChange,
  VersionSnapshot,
} from './types';
import { dbManager } from './storage/db';
import { TEMPLATES } from './core/templates';
import { Dashboard } from './core/Dashboard';
import { EditorHeader, DesktopLayoutMode } from './ui/EditorHeader';
import { FileManager } from './files/FileManager';
import { CodeEditor } from './editor/CodeEditor';
import { PreviewEngine } from './preview/PreviewEngine';
import { ElementInspector } from './visual/ElementInspector';
import { AssetManager } from './files/AssetManager';
import { AIAssistant } from './ai/AIAssistant';
import { AIDiffViewer } from './ai/AIDiffViewer';
import { VersionHistory } from './core/VersionHistory';
import { CommandPalette } from './ui/CommandPalette';
import { MobileNav, EditorMobileTab } from './ui/MobileNav';
import { extractZipToProjectFiles, detectFileType } from './utils/zip';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Desktop & Mobile View State
  const [layoutMode, setLayoutMode] = useState<DesktopLayoutMode>('split');
  const [mobileTab, setMobileTab] = useState<EditorMobileTab>('preview');

  // Inspection & Visual Editor State
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null);

  // Modals & Drawers
  const [activeProposal, setActiveProposal] = useState<AIProposal | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);

  // Load projects from IndexedDB on startup
  useEffect(() => {
    async function loadInitialData() {
      try {
        const storedProjects = await dbManager.getAllProjects();
        if (storedProjects.length > 0) {
          setProjects(storedProjects);
          // Restore last project if available
          const lastActiveId = await dbManager.getSetting<string>('last_active_project_id', '');
          const found = storedProjects.find((p) => p.id === lastActiveId) || storedProjects[0];
          setActiveProjectId(found.id);
          setActiveProject(found);
        } else {
          // Initialize with default template projects so user immediately has rich projects to explore
          const defaultLanding = TEMPLATES[0].createProject('Apex Nova SaaS');
          const defaultBoilerplate = TEMPLATES[1].createProject('Modern Web Boilerplate');
          const defaultPortfolio = TEMPLATES[2].createProject('Creative Portfolio');

          await dbManager.saveProject(defaultLanding);
          await dbManager.saveProject(defaultBoilerplate);
          await dbManager.saveProject(defaultPortfolio);

          const initialList = [defaultLanding, defaultBoilerplate, defaultPortfolio];
          setProjects(initialList);
          setActiveProjectId(defaultLanding.id);
          setActiveProject(defaultLanding);
        }
      } catch (err) {
        console.error('Error loading stored projects:', err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadInitialData();
  }, []);

  // Sync active project state
  useEffect(() => {
    if (activeProjectId && projects.length > 0) {
      const found = projects.find((p) => p.id === activeProjectId);
      if (found) {
        setActiveProject(found);
        dbManager.setSetting('last_active_project_id', activeProjectId);
        // Load version snapshots for this project
        dbManager.getVersions(found.id).then(setVersions);
      }
    }
  }, [activeProjectId, projects]);

  // Debounced Auto-Save to IndexedDB
  useEffect(() => {
    if (!activeProject || !isLoaded) return;

    setIsSaving(true);
    const timer = setTimeout(async () => {
      try {
        await dbManager.saveProject(activeProject);
        // Update in projects list
        setProjects((prev) =>
          prev.map((p) => (p.id === activeProject.id ? activeProject : p))
        );
      } catch (err) {
        console.error('Auto-save error:', err);
      } finally {
        setIsSaving(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [activeProject, isLoaded]);

  // Global Keyboard Shortcuts (Cmd+K, Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (activeProject) {
          dbManager.saveProject(activeProject);
          createSnapshot('Manual Save');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProject]);

  // Snapshot Creation Helper
  const createSnapshot = useCallback(
    async (label: string, description?: string) => {
      if (!activeProject) return;
      const snapshot: VersionSnapshot = {
        id: 'ver_' + Math.random().toString(36).substring(2, 9),
        projectId: activeProject.id,
        timestamp: Date.now(),
        label,
        description,
        files: JSON.parse(JSON.stringify(activeProject.files)),
      };
      await dbManager.saveVersion(snapshot);
      setVersions((prev) => [snapshot, ...prev]);
    },
    [activeProject]
  );

  // Restore Snapshot Helper
  const handleRestoreVersion = (version: VersionSnapshot) => {
    if (!activeProject) return;
    setActiveProject({
      ...activeProject,
      files: JSON.parse(JSON.stringify(version.files)),
      updatedAt: Date.now(),
    });
    setShowVersionHistory(false);
  };

  // --- Project CRUD ---
  const handleCreateProjectFromTemplate = (templateType: ProjectTemplateType, customName?: string) => {
    const tmpl = TEMPLATES.find((t) => t.id === templateType) || TEMPLATES[0];
    const newProj = tmpl.createProject(customName || tmpl.title);
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setActiveProject(newProj);
    dbManager.saveProject(newProj);
  };

  const handleDeleteProject = async (id: string) => {
    await dbManager.deleteProject(id);
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    if (activeProjectId === id) {
      if (remaining.length > 0) {
        setActiveProjectId(remaining[0].id);
        setActiveProject(remaining[0]);
      } else {
        setActiveProjectId(null);
        setActiveProject(null);
      }
    }
  };

  const handleDuplicateProject = async (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    const duplicated: Project = {
      ...target,
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      name: `${target.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      files: JSON.parse(JSON.stringify(target.files)),
    };
    await dbManager.saveProject(duplicated);
    setProjects((prev) => [duplicated, ...prev]);
  };

  const handleRenameProject = (name: string) => {
    if (!activeProject) return;
    setActiveProject({ ...activeProject, name, updatedAt: Date.now() });
  };

  // --- ZIP & File Import Handlers ---
  const handleImportZip = async (file: File) => {
    try {
      const extractedFiles = await extractZipToProjectFiles(file);
      const name = file.name.replace(/\.zip$/i, '') || 'Imported Project';
      const newProj: Project = {
        id: 'proj_' + Math.random().toString(36).substring(2, 9),
        name,
        description: `Imported from ${file.name}`,
        templateType: 'custom',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        activeFilePath: extractedFiles.find((f) => f.path === '/index.html')?.path || extractedFiles[0]?.path || '/index.html',
        settings: {
          title: name,
          theme: 'dark',
          autoSave: true,
          autoSaveIntervalMs: 2000,
          fontSize: 14,
          tabSize: 2,
          wordWrap: true,
          viewportDevice: 'desktop',
          customViewportWidth: 1200,
          previewScale: 1,
          aiProvider: 'gemini',
        },
        files: extractedFiles,
      };

      await dbManager.saveProject(newProj);
      setProjects((prev) => [newProj, ...prev]);
      setActiveProjectId(newProj.id);
      setActiveProject(newProj);
    } catch (err) {
      console.error('ZIP import error:', err);
    }
  };

  const handleUploadFilesToCurrentProject = async (uploadedFiles: FileList | File[]) => {
    if (!activeProject) return;
    const newFiles: ProjectFile[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const f = uploadedFiles[i];
      const path = '/' + f.name;
      const { type, extension, mimeType, isBinary } = detectFileType(path);

      if (isBinary) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(f);
        });
        newFiles.push({
          path,
          name: f.name,
          extension,
          type,
          content: dataUrl,
          isBinary: true,
          mimeType,
          size: f.size,
          updatedAt: Date.now(),
        });
      } else {
        const text = await f.text();
        newFiles.push({
          path,
          name: f.name,
          extension,
          type,
          content: text,
          isBinary: false,
          mimeType,
          size: text.length,
          updatedAt: Date.now(),
        });
      }
    }

    // Merge or replace
    const updated = [...activeProject.files];
    for (const nf of newFiles) {
      const idx = updated.findIndex((x) => x.path === nf.path);
      if (idx >= 0) updated[idx] = nf;
      else updated.push(nf);
    }

    setActiveProject({
      ...activeProject,
      files: updated,
      updatedAt: Date.now(),
    });
  };

  // --- Project File Modifications ---
  const handleUpdateActiveFileContent = (newContent: string) => {
    if (!activeProject) return;
    const path = activeProject.activeFilePath;
    const updatedFiles = activeProject.files.map((f) =>
      f.path === path ? { ...f, content: newContent, size: newContent.length, updatedAt: Date.now() } : f
    );
    setActiveProject({ ...activeProject, files: updatedFiles, updatedAt: Date.now() });
  };

  const handleCreateFile = (path: string, initialContent = '') => {
    if (!activeProject) return;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    const name = cleanPath.split('/').pop() || 'file';
    const { type, extension, mimeType, isBinary } = detectFileType(cleanPath);

    const newFile: ProjectFile = {
      path: cleanPath,
      name,
      extension,
      type,
      content: initialContent,
      isBinary,
      mimeType,
      size: initialContent.length,
      updatedAt: Date.now(),
    };

    setActiveProject({
      ...activeProject,
      files: [...activeProject.files, newFile],
      activeFilePath: cleanPath,
      updatedAt: Date.now(),
    });
  };

  const handleDeleteFile = (path: string) => {
    if (!activeProject) return;
    const remaining = activeProject.files.filter((f) => f.path !== path);
    const nextActive =
      activeProject.activeFilePath === path
        ? remaining[0]?.path || ''
        : activeProject.activeFilePath;

    setActiveProject({
      ...activeProject,
      files: remaining,
      activeFilePath: nextActive,
      updatedAt: Date.now(),
    });
  };

  const handleRenameFile = (oldPath: string, newPath: string) => {
    if (!activeProject) return;
    const updatedFiles = activeProject.files.map((f) => {
      if (f.path === oldPath) {
        const cleanNew = newPath.startsWith('/') ? newPath : '/' + newPath;
        const name = cleanNew.split('/').pop() || 'file';
        const { type, extension, mimeType } = detectFileType(cleanNew);
        return {
          ...f,
          path: cleanNew,
          name,
          extension,
          type,
          mimeType,
          updatedAt: Date.now(),
        };
      }
      return f;
    });

    setActiveProject({
      ...activeProject,
      files: updatedFiles,
      activeFilePath: activeProject.activeFilePath === oldPath ? newPath : activeProject.activeFilePath,
      updatedAt: Date.now(),
    });
  };

  const handleDuplicateFile = (path: string) => {
    if (!activeProject) return;
    const target = activeProject.files.find((f) => f.path === path);
    if (!target) return;

    const parts = target.path.split('.');
    const ext = parts.pop();
    const base = parts.join('.');
    const dupPath = `${base}_copy.${ext}`;

    const dupFile: ProjectFile = {
      ...target,
      path: dupPath,
      name: dupPath.split('/').pop() || 'file',
      updatedAt: Date.now(),
    };

    setActiveProject({
      ...activeProject,
      files: [...activeProject.files, dupFile],
      updatedAt: Date.now(),
    });
  };

  // --- Visual Style & Element Modifications ---
  const handleApplyStyleToSelectedElement = (property: string, value: string) => {
    if (!selectedElement || !activeProject) return;

    // Send postMessage to preview iframe for immediate live visual feedback
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: 'NONONICK_UPDATE_STYLE',
          payload: {
            selector: selectedElement.selectorPath,
            property,
            value,
          },
        },
        '*'
      );
    }

    // Update style in Project CSS or inline HTML style attribute
    const cssFile = activeProject.files.find((f) => f.type === 'css') || activeProject.files.find((f) => f.path === '/style.css');

    // Also update selectedElement state
    setSelectedElement((prev) =>
      prev
        ? {
            ...prev,
            styles: { ...prev.styles, [property]: value },
          }
        : null
    );

    // Append / update rule in project CSS file
    if (cssFile) {
      const kebabProp = property.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
      const cssRule = `\n/* Visual Inspector override for ${selectedElement.selectorPath} */\n${selectedElement.selectorPath} {\n  ${kebabProp}: ${value} !important;\n}\n`;

      const updatedFiles = activeProject.files.map((f) =>
        f.path === cssFile.path ? { ...f, content: f.content + cssRule, updatedAt: Date.now() } : f
      );

      setActiveProject({
        ...activeProject,
        files: updatedFiles,
        updatedAt: Date.now(),
      });
    }
  };

  const handleUpdateElementText = (newText: string) => {
    if (!selectedElement || !activeProject) return;

    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: 'NONONICK_UPDATE_TEXT',
          payload: {
            selector: selectedElement.selectorPath,
            newText,
          },
        },
        '*'
      );
    }

    // Replace text in HTML file
    const htmlFile = activeProject.files.find((f) => f.path === '/index.html' || f.extension === 'html');
    if (htmlFile && selectedElement.innerText) {
      const updatedContent = htmlFile.content.replace(selectedElement.innerText, newText);
      const updatedFiles = activeProject.files.map((f) =>
        f.path === htmlFile.path ? { ...f, content: updatedContent, updatedAt: Date.now() } : f
      );
      setActiveProject({
        ...activeProject,
        files: updatedFiles,
        updatedAt: Date.now(),
      });
    }

    setSelectedElement((prev) => (prev ? { ...prev, innerText: newText } : null));
  };

  // --- AI Approval Workflow ---
  const handleAcceptAIProposal = (acceptedChanges: AIProposedChange[]) => {
    if (!activeProject || acceptedChanges.length === 0) return;

    // First create a safety rollback snapshot
    createSnapshot('Before AI: ' + (activeProposal?.title || 'AI Update'));

    let updatedFiles = [...activeProject.files];

    for (const ch of acceptedChanges) {
      if (ch.action === 'modify' || ch.action === 'create') {
        const existingIdx = updatedFiles.findIndex((f) => f.path === ch.filePath);
        const { type, extension, mimeType } = detectFileType(ch.filePath);

        const updatedFile: ProjectFile = {
          path: ch.filePath,
          name: ch.filePath.split('/').pop() || 'file',
          extension,
          type,
          content: ch.newContent,
          isBinary: false,
          mimeType,
          size: ch.newContent.length,
          updatedAt: Date.now(),
        };

        if (existingIdx >= 0) {
          updatedFiles[existingIdx] = updatedFile;
        } else {
          updatedFiles.push(updatedFile);
        }
      } else if (ch.action === 'delete') {
        updatedFiles = updatedFiles.filter((f) => f.path !== ch.filePath);
      }
    }

    setActiveProject({
      ...activeProject,
      files: updatedFiles,
      updatedAt: Date.now(),
    });

    setActiveProposal(null);
  };

  // Current active file object
  const activeFile =
    activeProject?.files.find((f) => f.path === activeProject.activeFilePath) ||
    activeProject?.files[0] ||
    null;

  // View: If no project is active, display Dashboard
  if (!activeProject) {
    return (
      <Dashboard
        projects={projects}
        onOpenProject={(id) => setActiveProjectId(id)}
        onCreateProjectFromTemplate={handleCreateProjectFromTemplate}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
        onImportZip={handleImportZip}
        onImportFiles={handleUploadFilesToCurrentProject}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-[#06080d] text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      {/* Top Application Header */}
      <EditorHeader
        project={activeProject}
        onBackToDashboard={() => setActiveProjectId(null)}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onOpenVersionHistory={() => setShowVersionHistory(true)}
        onOpenAssets={() => setShowAssets(true)}
        onOpenAIAssistant={() => setShowAIAssistant(true)}
        layoutMode={layoutMode}
        onChangeLayoutMode={setLayoutMode}
        isSaving={isSaving}
        onRenameProject={handleRenameProject}
      />

      {/* Main Workspace Workspace Layout */}
      <div className="flex-1 flex overflow-hidden p-2 gap-2 relative">
        {/* DESKTOP WORKSPACE (>= 768px) */}
        <div className="hidden md:flex flex-1 gap-2 overflow-hidden">
          {/* Left Column: File Explorer (Collapsible or 240px) */}
          <div className="w-60 shrink-0 h-full">
            <FileManager
              files={activeProject.files}
              activeFilePath={activeProject.activeFilePath}
              onSelectFile={(path) => setActiveProject({ ...activeProject, activeFilePath: path })}
              onCreateFile={handleCreateFile}
              onCreateFolder={(folder) => handleCreateFile(folder + '/.keep', '')}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
              onDuplicateFile={handleDuplicateFile}
              onUploadFiles={handleUploadFilesToCurrentProject}
              onUploadZip={handleImportZip}
            />
          </div>

          {/* Center Column: Code Editor (if in 'split' or 'code' mode) */}
          {(layoutMode === 'split' || layoutMode === 'code') && (
            <div className={`h-full ${layoutMode === 'split' ? 'w-1/2 flex-1' : 'flex-1'}`}>
              <CodeEditor
                file={activeFile}
                allFiles={activeProject.files}
                onChange={handleUpdateActiveFileContent}
                onAskAI={(snippet) => {
                  setShowAIAssistant(true);
                }}
              />
            </div>
          )}

          {/* Right Column: Live Preview & Visual Website Editor (if in 'split' or 'preview' mode) */}
          {(layoutMode === 'split' || layoutMode === 'preview') && (
            <div className={`h-full ${layoutMode === 'split' ? 'w-1/2 flex-1' : 'flex-1'}`}>
              <PreviewEngine
                project={activeProject}
                isInspectMode={isInspectMode}
                onToggleInspect={() => {
                  setIsInspectMode(!isInspectMode);
                  if (isInspectMode) setSelectedElement(null);
                }}
                selectedElement={selectedElement}
                onSelectElement={(el) => {
                  setSelectedElement(el);
                }}
                onUpdateElementInlineText={handleUpdateElementText}
              />
            </div>
          )}

          {/* Far Right Sidebar: Element Inspector (Active when element is selected) */}
          {selectedElement && (
            <div className="w-80 shrink-0 h-full animate-in slide-in-from-right-4 duration-200">
              <ElementInspector
                element={selectedElement}
                onClose={() => setSelectedElement(null)}
                onApplyStyle={handleApplyStyleToSelectedElement}
                onUpdateText={handleUpdateElementText}
                onDeleteElement={() => {
                  // Basic element deletion
                  if (selectedElement.innerText) {
                    handleUpdateElementText('');
                  }
                  setSelectedElement(null);
                }}
                onDuplicateElement={() => {
                  handleApplyStyleToSelectedElement('opacity', '1');
                }}
                onMoveElement={(dir) => {
                  console.log('Move element', dir);
                }}
                onAskAIAboutElement={(instruction) => {
                  setShowAIAssistant(true);
                }}
              />
            </div>
          )}
        </div>

        {/* MOBILE WORKSPACE (< 768px) with Bottom Tab Swapping */}
        <div className="md:hidden flex-1 flex flex-col overflow-hidden pb-14">
          {mobileTab === 'files' && (
            <FileManager
              files={activeProject.files}
              activeFilePath={activeProject.activeFilePath}
              onSelectFile={(path) => {
                setActiveProject({ ...activeProject, activeFilePath: path });
                setMobileTab('code');
              }}
              onCreateFile={handleCreateFile}
              onCreateFolder={(folder) => handleCreateFile(folder + '/.keep', '')}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
              onDuplicateFile={handleDuplicateFile}
              onUploadFiles={handleUploadFilesToCurrentProject}
              onUploadZip={handleImportZip}
            />
          )}

          {mobileTab === 'code' && (
            <CodeEditor
              file={activeFile}
              allFiles={activeProject.files}
              onChange={handleUpdateActiveFileContent}
              onAskAI={() => setMobileTab('ai')}
            />
          )}

          {mobileTab === 'preview' && (
            <PreviewEngine
              project={activeProject}
              isInspectMode={isInspectMode}
              onToggleInspect={() => {
                setIsInspectMode(!isInspectMode);
                if (isInspectMode) setSelectedElement(null);
              }}
              selectedElement={selectedElement}
              onSelectElement={(el) => {
                setSelectedElement(el);
                setMobileTab('inspect');
              }}
              onUpdateElementInlineText={handleUpdateElementText}
            />
          )}

          {mobileTab === 'inspect' && (
            <ElementInspector
              element={selectedElement}
              onClose={() => setSelectedElement(null)}
              onApplyStyle={handleApplyStyleToSelectedElement}
              onUpdateText={handleUpdateElementText}
              onDeleteElement={() => setSelectedElement(null)}
              onDuplicateElement={() => {}}
              onMoveElement={() => {}}
              onAskAIAboutElement={() => setMobileTab('ai')}
            />
          )}

          {mobileTab === 'ai' && (
            <AIAssistant
              project={activeProject}
              selectedElement={selectedElement}
              onProposalReady={(proposal) => setActiveProposal(proposal)}
            />
          )}

          {mobileTab === 'assets' && (
            <AssetManager
              files={activeProject.files}
              onUploadAssets={handleUploadFilesToCurrentProject}
              onDeleteAsset={handleDeleteFile}
              onReplaceAsset={(path, newContent, newSize) => {
                const updated = activeProject.files.map((f) =>
                  f.path === path ? { ...f, content: newContent, size: newSize, updatedAt: Date.now() } : f
                );
                setActiveProject({ ...activeProject, files: updated, updatedAt: Date.now() });
              }}
            />
          )}
        </div>
      </div>

      {/* Mobile Touch Bottom Navigation */}
      <MobileNav
        activeTab={mobileTab}
        onSelectTab={setMobileTab}
        hasSelectedElement={!!selectedElement}
      />

      {/* Slide-out / Modal Panels for Assets, AI Assistant, Version History */}
      {showAIAssistant && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 shadow-2xl p-2 bg-black/80 backdrop-blur-md animate-in slide-in-from-right">
          <div className="h-full relative">
            <AIAssistant
              project={activeProject}
              selectedElement={selectedElement}
              onProposalReady={(proposal) => {
                setActiveProposal(proposal);
                setShowAIAssistant(false);
              }}
            />
            <button
              onClick={() => setShowAIAssistant(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showAssets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-4xl h-[85vh] relative">
            <AssetManager
              files={activeProject.files}
              onUploadAssets={handleUploadFilesToCurrentProject}
              onDeleteAsset={handleDeleteFile}
              onReplaceAsset={(path, newContent, newSize) => {
                const updated = activeProject.files.map((f) =>
                  f.path === path ? { ...f, content: newContent, size: newSize, updatedAt: Date.now() } : f
                );
                setActiveProject({ ...activeProject, files: updated, updatedAt: Date.now() });
              }}
            />
            <button
              onClick={() => setShowAssets(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showVersionHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg h-[75vh]">
            <VersionHistory
              versions={versions}
              onRestoreVersion={handleRestoreVersion}
              onCreateSnapshot={createSnapshot}
              onClose={() => setShowVersionHistory(false)}
            />
          </div>
        </div>
      )}

      {/* AI Diff Viewer & Approval Modal (MANDATORY APPROVAL GATEWAY) */}
      {activeProposal && (
        <AIDiffViewer
          proposal={activeProposal}
          onAccept={handleAcceptAIProposal}
          onCancel={() => setActiveProposal(null)}
        />
      )}

      {/* Global Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        files={activeProject.files}
        onSelectFile={(path) => setActiveProject({ ...activeProject, activeFilePath: path })}
        onAction={(actionKey) => {
          switch (actionKey) {
            case 'new-file':
              handleCreateFile('/new-file.html', '<!DOCTYPE html>\n<html>\n<body>\n</body>\n</html>');
              break;
            case 'new-folder':
              handleCreateFile('/components/.keep', '');
              break;
            case 'toggle-inspect':
              setIsInspectMode(!isInspectMode);
              break;
            case 'toggle-ai':
              setShowAIAssistant(true);
              break;
            case 'toggle-assets':
              setShowAssets(true);
              break;
            case 'toggle-history':
              setShowVersionHistory(true);
              break;
          }
        }}
      />
    </div>
  );
}
