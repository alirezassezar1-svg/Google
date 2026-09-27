/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Project,
  ProjectFile,
  ProjectTemplateType,
  SelectedElementInfo,
  AIProposal,
  AIProposedChange,
  VersionSnapshot,
  DatabaseCollection,
  ProjectSeoConfig,
} from './types';
import { dbManager } from './storage/db';
import { TEMPLATES } from './core/templates';
import { Dashboard } from './core/Dashboard';
import { EditorHeader, DesktopLayoutMode, ActiveModuleTab } from './ui/EditorHeader';
import { FileManager } from './files/FileManager';
import { CodeEditor } from './editor/CodeEditor';
import { PreviewEngine } from './preview/PreviewEngine';
import { ElementInspector } from './visual/ElementInspector';
import { AssetManager } from './files/AssetManager';
import { AIAssistant } from './ai/AIAssistant';
import { AIDiffViewer } from './ai/AIDiffViewer';
import { AIIntegrationsStudio } from './ai/AIIntegrationsStudio';
import { VersionHistory } from './core/VersionHistory';
import { CommandPalette } from './ui/CommandPalette';
import { MobileNav, EditorMobileTab } from './ui/MobileNav';
import { DatabaseStudio } from './database/DatabaseStudio';
import { SeoStudio } from './seo/SeoStudio';
import { AnalyticsStudio } from './analytics/AnalyticsStudio';
import { ShareModal } from './ui/ShareModal';
import { extractZipToProjectFiles, detectFileType, exportProjectAsZip, exportSingleBundledHtml } from './utils/zip';
import { RotateCcw, RotateCw } from 'lucide-react';

// Orchestrator, Quality Gate, Cinema, Analyzer, Automations
import { UniversalOrchestrator } from './orchestrator/UniversalOrchestrator';
import { OrchestratorView } from './orchestrator/OrchestratorView';
import { QualityGateModal } from './qa/QualityGateModal';
import { FinalDeliveryModal } from './delivery/FinalDeliveryModal';
import { WebsiteAnalyzerStudio, AnalyzerIssue } from './analyzer/WebsiteAnalyzerStudio';
import { CinemaStudio } from './cinema/CinemaStudio';
import { AutomationStudio } from './automations/AutomationStudio';
import { QualityAuditResult, OrchestratorDeliveryContract, AutomationWorkflow } from './orchestrator/types';

interface HistorySnapshot {
  files: ProjectFile[];
  activeFilePath: string;
  label: string;
  timestamp: number;
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Global Undo / Redo History Stack (دکمه‌های قبل و بعد)
  const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);
  const [historyToast, setHistoryToast] = useState<{ message: string; type: 'undo' | 'redo' } | null>(null);
  const isTypingSessionRef = useRef(false);
  const fileContentDebounceTimerRef = useRef<any>(null);

  // Active Operating System Tab
  const [activeModuleTab, setActiveModuleTab] = useState<ActiveModuleTab>('editor');

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
  const [showDatabaseStudio, setShowDatabaseStudio] = useState(false);
  const [showSeoStudio, setShowSeoStudio] = useState(false);
  const [showAnalyticsStudio, setShowAnalyticsStudio] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTargetProject, setShareTargetProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);

  // Orchestrator, Quality Gate & Final Delivery
  const [showOrchestrator, setShowOrchestrator] = useState(false);
  const [showQualityGate, setShowQualityGate] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [activeDeliveryContract, setActiveDeliveryContract] = useState<OrchestratorDeliveryContract | null>(null);
  const [qaResult, setQaResult] = useState<QualityAuditResult | null>(null);

  // Load projects from IndexedDB on startup
  useEffect(() => {
    async function loadInitialData() {
      try {
        const storedProjects = await dbManager.getAllProjects();
        if (storedProjects.length > 0) {
          setProjects(storedProjects);
          const lastActiveId = await dbManager.getSetting<string>('last_active_project_id', '');
          const found = storedProjects.find((p) => p.id === lastActiveId) || storedProjects[0];
          setActiveProjectId(found.id);
          setActiveProject(found);
          const qa = UniversalOrchestrator.runQualityGate(found);
          setQaResult(qa);
        } else {
          // Initialize with default official template projects
          const defaultLanding = TEMPLATES[0].createProject('NONONICK Digital Studio');
          const defaultBoilerplate = TEMPLATES[1].createProject('Apex Nova SaaS');
          const defaultPortfolio = TEMPLATES[2].createProject('Creative Portfolio');

          await dbManager.saveProject(defaultLanding);
          await dbManager.saveProject(defaultBoilerplate);
          await dbManager.saveProject(defaultPortfolio);

          const initialList = [defaultLanding, defaultBoilerplate, defaultPortfolio];
          setProjects(initialList);
          setActiveProjectId(defaultLanding.id);
          setActiveProject(defaultLanding);
          const qa = UniversalOrchestrator.runQualityGate(defaultLanding);
          setQaResult(qa);
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
        dbManager.getVersions(found.id).then(setVersions);
        const qa = UniversalOrchestrator.runQualityGate(found);
        setQaResult(qa);
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

  // Record state into Undo Stack before any modification
  const recordHistory = useCallback(
    (label: string, projectOverride?: Project) => {
      const current = projectOverride || activeProject;
      if (!current) return;
      const snapshot: HistorySnapshot = {
        files: JSON.parse(JSON.stringify(current.files)),
        activeFilePath: current.activeFilePath,
        label,
        timestamp: Date.now(),
      };
      setUndoStack((prev) => [snapshot, ...prev].slice(0, 50));
      setRedoStack([]); // Clear redo stack on new action
    },
    [activeProject]
  );

  // Undo Handler (قبل / واگرد)
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || !activeProject) return;

    const [targetSnapshot, ...remainingUndo] = undoStack;

    // Push current active state to Redo stack
    const currentSnapshot: HistorySnapshot = {
      files: JSON.parse(JSON.stringify(activeProject.files)),
      activeFilePath: activeProject.activeFilePath,
      label: targetSnapshot.label,
      timestamp: Date.now(),
    };

    setRedoStack((prev) => [currentSnapshot, ...prev].slice(0, 50));
    setUndoStack(remainingUndo);

    const updatedProj: Project = {
      ...activeProject,
      files: JSON.parse(JSON.stringify(targetSnapshot.files)),
      activeFilePath: targetSnapshot.activeFilePath || activeProject.activeFilePath,
      updatedAt: Date.now(),
    };

    setActiveProject(updatedProj);
    setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
    dbManager.saveProject(updatedProj);
    const qa = UniversalOrchestrator.runQualityGate(updatedProj);
    setQaResult(qa);

    setHistoryToast({ message: `واگرد (Undo): ${targetSnapshot.label}`, type: 'undo' });
    setTimeout(() => setHistoryToast(null), 2200);
  }, [undoStack, activeProject]);

  // Redo Handler (بعد / بازانجام)
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || !activeProject) return;

    const [targetSnapshot, ...remainingRedo] = redoStack;

    // Push current active state to Undo stack
    const currentSnapshot: HistorySnapshot = {
      files: JSON.parse(JSON.stringify(activeProject.files)),
      activeFilePath: activeProject.activeFilePath,
      label: targetSnapshot.label,
      timestamp: Date.now(),
    };

    setUndoStack((prev) => [currentSnapshot, ...prev].slice(0, 50));
    setRedoStack(remainingRedo);

    const updatedProj: Project = {
      ...activeProject,
      files: JSON.parse(JSON.stringify(targetSnapshot.files)),
      activeFilePath: targetSnapshot.activeFilePath || activeProject.activeFilePath,
      updatedAt: Date.now(),
    };

    setActiveProject(updatedProj);
    setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
    dbManager.saveProject(updatedProj);
    const qa = UniversalOrchestrator.runQualityGate(updatedProj);
    setQaResult(qa);

    setHistoryToast({ message: `بازانجام (Redo): ${targetSnapshot.label}`, type: 'redo' });
    setTimeout(() => setHistoryToast(null), 2200);
  }, [redoStack, activeProject]);

  // Global Keyboard Shortcuts (Cmd+K, Cmd+S, Cmd+Z, Cmd+Shift+Z / Cmd+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowOrchestrator((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (activeProject) {
          dbManager.saveProject(activeProject);
          createSnapshot('Manual Save');
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          handleUndo();
        }
      } else if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && e.shiftKey)
      ) {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProject, handleUndo, handleRedo]);

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
    const updated = {
      ...activeProject,
      files: JSON.parse(JSON.stringify(version.files)),
      updatedAt: Date.now(),
    };
    setActiveProject(updated);
    setShowVersionHistory(false);
    const qa = UniversalOrchestrator.runQualityGate(updated);
    setQaResult(qa);
  };

  // --- Project CRUD ---
  const handleCreateProjectFromTemplate = (templateType: ProjectTemplateType, customName?: string) => {
    const tmpl = TEMPLATES.find((t) => t.id === templateType) || TEMPLATES[0];
    const newProj = tmpl.createProject(customName || tmpl.title);
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setActiveProject(newProj);
    setActiveModuleTab('editor');
    dbManager.saveProject(newProj);
    const qa = UniversalOrchestrator.runQualityGate(newProj);
    setQaResult(qa);
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
      setActiveModuleTab('editor');
      const qa = UniversalOrchestrator.runQualityGate(newProj);
      setQaResult(qa);
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

    const updated = [...activeProject.files];
    for (const nf of newFiles) {
      const idx = updated.findIndex((x) => x.path === nf.path);
      if (idx >= 0) updated[idx] = nf;
      else updated.push(nf);
    }

    const updatedProj = { ...activeProject, files: updated, updatedAt: Date.now() };
    setActiveProject(updatedProj);
    const qa = UniversalOrchestrator.runQualityGate(updatedProj);
    setQaResult(qa);
  };

  // --- Project File Modifications ---
  const handleUpdateActiveFileContent = (newContent: string) => {
    if (!activeProject) return;

    if (!isTypingSessionRef.current) {
      recordHistory(`ویرایش فایل ${activeProject.activeFilePath}`);
      isTypingSessionRef.current = true;
    }

    if (fileContentDebounceTimerRef.current) {
      clearTimeout(fileContentDebounceTimerRef.current);
    }
    fileContentDebounceTimerRef.current = setTimeout(() => {
      isTypingSessionRef.current = false;
    }, 1200);

    const path = activeProject.activeFilePath;
    const updatedFiles = activeProject.files.map((f) =>
      f.path === path ? { ...f, content: newContent, size: newContent.length, updatedAt: Date.now() } : f
    );
    const updatedProj = { ...activeProject, files: updatedFiles, updatedAt: Date.now() };
    setActiveProject(updatedProj);
  };

  const handleCreateFile = (path: string, initialContent = '') => {
    if (!activeProject) return;
    recordHistory(`ایجاد فایل ${path}`);

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

    const updatedProj = {
      ...activeProject,
      files: [...activeProject.files, newFile],
      activeFilePath: cleanPath,
      updatedAt: Date.now(),
    };
    setActiveProject(updatedProj);
  };

  const handleDeleteFile = (path: string) => {
    if (!activeProject) return;
    recordHistory(`حذف فایل ${path}`);

    const remaining = activeProject.files.filter((f) => f.path !== path);
    const nextActive =
      activeProject.activeFilePath === path
        ? remaining[0]?.path || ''
        : activeProject.activeFilePath;

    const updatedProj = {
      ...activeProject,
      files: remaining,
      activeFilePath: nextActive,
      updatedAt: Date.now(),
    };
    setActiveProject(updatedProj);
  };

  const handleRenameFile = (oldPath: string, newPath: string) => {
    if (!activeProject) return;
    recordHistory(`تغییر نام ${oldPath}`);

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

    const updatedProj = {
      ...activeProject,
      files: updatedFiles,
      activeFilePath: activeProject.activeFilePath === oldPath ? newPath : activeProject.activeFilePath,
      updatedAt: Date.now(),
    };
    setActiveProject(updatedProj);
  };

  const handleDuplicateFile = (path: string) => {
    if (!activeProject) return;
    recordHistory(`تکثیر فایل ${path}`);

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

    const updatedProj = {
      ...activeProject,
      files: [...activeProject.files, dupFile],
      updatedAt: Date.now(),
    };
    setActiveProject(updatedProj);
  };

  // --- Visual Style & Element Modifications ---
  const handleApplyStyleToSelectedElement = (property: string, value: string) => {
    if (!selectedElement || !activeProject) return;
    recordHistory(`تغییر استایل ${property}`);

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

    const cssFile = activeProject.files.find((f) => f.type === 'css') || activeProject.files.find((f) => f.path === '/style.css');

    setSelectedElement((prev) =>
      prev
        ? {
            ...prev,
            styles: { ...prev.styles, [property]: value },
          }
        : null
    );

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
    recordHistory('ویرایش متن المان');

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
    recordHistory('اعمال پیشنهاد هوش مصنوعی');

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

    const updatedProj = {
      ...activeProject,
      files: updatedFiles,
      updatedAt: Date.now(),
    };

    setActiveProject(updatedProj);
    setActiveProposal(null);
    const qa = UniversalOrchestrator.runQualityGate(updatedProj);
    setQaResult(qa);
  };

  // --- Database, SEO, and Telemetry Handlers ---
  const handleUpdateProjectDatabase = (newCollections: DatabaseCollection[]) => {
    if (!activeProject) return;
    const updated: Project = {
      ...activeProject,
      database: {
        collections: newCollections,
        lastSync: Date.now(),
      },
      updatedAt: Date.now(),
    };
    setActiveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    dbManager.saveProject(updated);
  };

  const handleUpdateProjectSeo = (seo: ProjectSeoConfig, updatedFiles?: ProjectFile[]) => {
    if (!activeProject) return;
    const updated: Project = {
      ...activeProject,
      seo,
      files: updatedFiles || activeProject.files,
      updatedAt: Date.now(),
    };
    setActiveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    dbManager.saveProject(updated);
    const qa = UniversalOrchestrator.runQualityGate(updated);
    setQaResult(qa);
  };

  const handleInjectAnalyticsTracker = () => {
    if (!activeProject) return;
    const indexFile = activeProject.files.find((f) => f.path === '/index.html');
    if (!indexFile) return;

    if (indexFile.content.includes('/api/analytics/tracker.js')) return;

    const scriptTag = `    <!-- NONONICK Real-Time Analytics Telemetry -->\n    <script src="/api/analytics/tracker.js" data-project-id="${activeProject.id}" defer></script>\n`;
    let updatedContent = indexFile.content;
    if (updatedContent.includes('</head>')) {
      updatedContent = updatedContent.replace('</head>', `${scriptTag}</head>`);
    } else if (updatedContent.includes('</body>')) {
      updatedContent = updatedContent.replace('</body>', `${scriptTag}</body>`);
    } else {
      updatedContent += `\n${scriptTag}`;
    }

    const updatedFiles = activeProject.files.map((f) =>
      f.path === '/index.html'
        ? { ...f, content: updatedContent, size: updatedContent.length, updatedAt: Date.now() }
        : f
    );

    const updatedProj = { ...activeProject, files: updatedFiles, updatedAt: Date.now() };
    setActiveProject(updatedProj);
    createSnapshot('Injected Analytics Telemetry Tracker');
    const qa = UniversalOrchestrator.runQualityGate(updatedProj);
    setQaResult(qa);
  };

  const handleApplyAnalyticsCodePatch = (filePath: string, patch: string, description: string) => {
    if (!activeProject) return;
    const target = activeProject.files.find((f) => f.path === filePath) || activeProject.files.find((f) => f.path === '/index.html');
    if (!target) return;

    let updatedContent = target.content;
    if (updatedContent.includes('</body>')) {
      updatedContent = updatedContent.replace('</body>', `\n    ${patch}\n</body>`);
    } else {
      updatedContent += `\n${patch}`;
    }

    const proposal: AIProposal = {
      id: 'prop_' + Math.random().toString(36).substring(2, 9),
      title: 'Analytics AI Optimization Patch',
      explanation: description || 'Apply growth and conversion optimization recommended by Gemini AI.',
      prompt: 'Apply Analytics Insight',
      timestamp: Date.now(),
      changes: [
        {
          filePath: target.path,
          action: 'modify',
          oldContent: target.content,
          newContent: updatedContent,
          diffSummary: description || 'Injected optimization patch',
          accepted: true,
        },
      ],
    };

    setActiveProposal(proposal);
  };

  // --- Website Analyzer Heuristic Auto-Fixer ---
  const handleApplyAnalyzerFix = (issue: AnalyzerIssue) => {
    if (!activeProject || !issue.suggestedPatch) return;
    createSnapshot(`Before Fix: ${issue.title}`);

    const targetFile = activeProject.files.find((f) => f.path === issue.affectedFile) || activeProject.files.find((f) => f.extension === 'html');
    if (!targetFile) return;

    const { findText, replaceText } = issue.suggestedPatch;
    let content = targetFile.content;

    if (content.includes(findText)) {
      content = content.replace(findText, replaceText);
    } else if (findText === '</title>' && !content.includes('</title>')) {
      content = content.replace('<head>', `<head>\n    ${replaceText}`);
    } else {
      content = content.replace('<head>', `<head>\n    ${replaceText}`);
    }

    const updatedFiles = activeProject.files.map((f) =>
      f.path === targetFile.path ? { ...f, content, size: content.length, updatedAt: Date.now() } : f
    );

    const updatedProj = { ...activeProject, files: updatedFiles, updatedAt: Date.now() };
    setActiveProject(updatedProj);
    const qa = UniversalOrchestrator.runQualityGate(updatedProj);
    setQaResult(qa);
  };

  // --- Cinema Asset Attachment & HTML Injection ---
  const handleAttachMediaAsset = (path: string, content: string, isBinary: boolean, mimeType: string) => {
    if (!activeProject) return;
    const name = path.split('/').pop() || 'asset.jpg';
    const cleanPath = path.startsWith('/') ? path : '/' + path;

    const assetFile: ProjectFile = {
      path: cleanPath,
      name,
      extension: name.split('.').pop() || 'jpg',
      type: 'image',
      content,
      isBinary,
      mimeType,
      size: content.length,
      updatedAt: Date.now(),
    };

    const existingIdx = activeProject.files.findIndex((f) => f.path === cleanPath);
    let updatedFiles = [...activeProject.files];
    if (existingIdx >= 0) {
      updatedFiles[existingIdx] = assetFile;
    } else {
      updatedFiles.push(assetFile);
    }

    const updatedProj = { ...activeProject, files: updatedFiles, updatedAt: Date.now() };
    setActiveProject(updatedProj);
    createSnapshot(`Attached Media: ${name}`);
  };

  const handleInsertHtmlSnippet = (snippet: string) => {
    if (!activeProject) return;
    recordHistory('درج کد HTML');

    const indexFile = activeProject.files.find((f) => f.path === '/index.html') || activeProject.files.find((f) => f.extension === 'html');
    if (!indexFile) return;

    let content = indexFile.content;
    if (content.includes('</main>')) {
      content = content.replace('</main>', `    ${snippet}\n</main>`);
    } else if (content.includes('</body>')) {
      content = content.replace('</body>', `    ${snippet}\n</body>`);
    } else {
      content += `\n${snippet}`;
    }

    const updatedFiles = activeProject.files.map((f) =>
      f.path === indexFile.path ? { ...f, content, size: content.length, updatedAt: Date.now() } : f
    );

    const updatedProj = { ...activeProject, files: updatedFiles, updatedAt: Date.now() };
    setActiveProject(updatedProj);
    createSnapshot('Injected Cinema HTML Scene');
  };

  // Current active file object
  const activeFile =
    activeProject?.files.find((f) => f.path === activeProject.activeFilePath) ||
    activeProject?.files[0] ||
    null;

  // View: If no project is active, display Dashboard
  if (!activeProject || activeModuleTab === 'home') {
    return (
      <>
        <Dashboard
          projects={projects}
          onOpenProject={(id) => {
            setActiveProjectId(id);
            setActiveModuleTab('editor');
          }}
          onCreateProjectFromTemplate={handleCreateProjectFromTemplate}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          onImportZip={handleImportZip}
          onImportFiles={handleUploadFilesToCurrentProject}
          onOpenShare={(proj) => {
            setShareTargetProject(proj || null);
            setShowShareModal(true);
          }}
        />
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          project={shareTargetProject}
        />
      </>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#06080d] text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      {/* Master Top Operating System Navigation Bar */}
      <EditorHeader
        project={activeProject}
        activeModuleTab={activeModuleTab}
        onSelectModuleTab={setActiveModuleTab}
        onBackToDashboard={() => setActiveModuleTab('home')}
        onOpenCommandPalette={() => setShowOrchestrator(true)}
        onOpenVersionHistory={() => setShowVersionHistory(true)}
        onOpenAssets={() => setActiveModuleTab('assets')}
        onOpenAIAssistant={() => setShowAIAssistant(true)}
        onOpenDatabase={() => setActiveModuleTab('database')}
        onOpenSEO={() => setActiveModuleTab('seo')}
        onOpenAnalytics={() => setActiveModuleTab('analytics')}
        onOpenOrchestrator={() => setShowOrchestrator(true)}
        onOpenQualityGate={() => setShowQualityGate(true)}
        onOpenDeliveryContract={() => {
          if (!activeDeliveryContract && activeProject) {
            const qa = qaResult || UniversalOrchestrator.runQualityGate(activeProject);
            const task = UniversalOrchestrator.planTask('Release delivery review', activeProject, 'ship');
            const contract = UniversalOrchestrator.buildDeliveryContract(activeProject, task, qa);
            setActiveDeliveryContract(contract);
          }
          setShowDeliveryModal(true);
        }}
        onOpenShare={() => {
          setShareTargetProject(activeProject);
          setShowShareModal(true);
        }}
        layoutMode={layoutMode}
        onChangeLayoutMode={setLayoutMode}
        isSaving={isSaving}
        onRenameProject={handleRenameProject}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        undoCount={undoStack.length}
        redoCount={redoStack.length}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Main OS Viewport Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* TAB 1: UNIVERSAL LIVE EDITOR (HTML, CSS, JS, Visual Inspector, Live Preview) */}
        {activeModuleTab === 'editor' && (
          <div className="flex-1 flex overflow-hidden p-2 gap-2 relative">
            {/* Desktop Layout (>= 768px) */}
            <div className="hidden md:flex flex-1 gap-2 overflow-hidden">
              {/* File Explorer */}
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
                  onExportZip={() => exportProjectAsZip(activeProject)}
                />
              </div>

              {/* Code Editor */}
              {(layoutMode === 'split' || layoutMode === 'code') && (
                <div className={`h-full ${layoutMode === 'split' ? 'w-1/2 flex-1' : 'flex-1'}`}>
                  <CodeEditor
                    file={activeFile}
                    allFiles={activeProject.files}
                    onChange={handleUpdateActiveFileContent}
                    onAskAI={(snippet) => setShowAIAssistant(true)}
                  />
                </div>
              )}

              {/* Live Preview */}
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
                    onSelectElement={(el) => setSelectedElement(el)}
                    onUpdateElementInlineText={handleUpdateElementText}
                  />
                </div>
              )}

              {/* Visual Element Inspector */}
              {selectedElement && (
                <div className="w-80 shrink-0 h-full animate-in slide-in-from-right-4 duration-200">
                  <ElementInspector
                    element={selectedElement}
                    onClose={() => setSelectedElement(null)}
                    onApplyStyle={handleApplyStyleToSelectedElement}
                    onUpdateText={handleUpdateElementText}
                    onDeleteElement={() => {
                      if (selectedElement.innerText) handleUpdateElementText('');
                      setSelectedElement(null);
                    }}
                    onDuplicateElement={() => handleApplyStyleToSelectedElement('opacity', '1')}
                    onMoveElement={() => {}}
                    onAskAIAboutElement={() => setShowAIAssistant(true)}
                  />
                </div>
              )}
            </div>

            {/* Mobile Layout (< 768px) with Bottom Tab Swapping */}
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
                  onExportZip={() => exportProjectAsZip(activeProject)}
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
                  onCreateNewFile={handleCreateFile}
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
        )}

        {/* TAB 2: CINEMA & CREATIVE ENGINE */}
        {activeModuleTab === 'cinema' && (
          <div className="flex-1 h-full overflow-hidden">
            <CinemaStudio
              project={activeProject}
              onAttachMediaAsset={handleAttachMediaAsset}
              onInsertHtmlSnippet={handleInsertHtmlSnippet}
            />
          </div>
        )}

        {/* TAB 3: WEBSITE ANALYZER STUDIO (8 Categories & 1-Click Fix) */}
        {activeModuleTab === 'analyze' && (
          <div className="flex-1 h-full overflow-hidden">
            <WebsiteAnalyzerStudio
              project={activeProject}
              onApplyFix={handleApplyAnalyzerFix}
            />
          </div>
        )}

        {/* TAB 4: SEO AUTOMATION SUITE */}
        {activeModuleTab === 'seo' && (
          <div className="flex-1 h-full overflow-hidden">
            <SeoStudio
              project={activeProject}
              isOpen={true}
              onClose={() => setActiveModuleTab('editor')}
              onUpdateProjectSeo={handleUpdateProjectSeo}
            />
          </div>
        )}

        {/* TAB 5: AUTOMATION WORKFLOWS ENGINE */}
        {activeModuleTab === 'automations' && (
          <div className="flex-1 h-full overflow-hidden">
            <AutomationStudio
              project={activeProject}
              onExecuteWorkflow={(flow) => {
                createSnapshot(`Workflow Trigger: ${flow.name}`);
              }}
            />
          </div>
        )}

        {/* TAB 6: REAL-TIME ANALYTICS & TELEMETRY */}
        {activeModuleTab === 'analytics' && (
          <div className="flex-1 h-full overflow-hidden">
            <AnalyticsStudio
              project={activeProject}
              isOpen={true}
              onClose={() => setActiveModuleTab('editor')}
              onInjectTrackerToProject={handleInjectAnalyticsTracker}
              onApplyCodePatch={handleApplyAnalyticsCodePatch}
            />
          </div>
        )}

        {/* TAB 7: EMBEDDED DATABASE STUDIO */}
        {activeModuleTab === 'database' && (
          <div className="flex-1 h-full overflow-hidden">
            <DatabaseStudio
              project={activeProject}
              isOpen={true}
              onClose={() => setActiveModuleTab('editor')}
              onUpdateProjectDatabase={handleUpdateProjectDatabase}
            />
          </div>
        )}

        {/* TAB 8: ASSET & FILE SYSTEM MANAGER */}
        {activeModuleTab === 'assets' && (
          <div className="flex-1 h-full p-4 overflow-y-auto">
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
          </div>
        )}

        {/* TAB 9: AI HUB & MODEL INTEGRATIONS */}
        {activeModuleTab === 'ai' && (
          <div className="flex-1 h-full p-2 md:p-4 max-w-6xl mx-auto overflow-hidden">
            <AIIntegrationsStudio
              project={activeProject}
              selectedElement={selectedElement}
              onProposalReady={(proposal) => {
                setActiveProposal(proposal);
              }}
              onInsertComponentCode={(code) => {
                handleInsertHtmlSnippet(code);
              }}
              onInsertHtmlSnippet={handleInsertHtmlSnippet}
              onUpdateProjectDatabase={handleUpdateProjectDatabase}
              onCreateNewFile={handleCreateFile}
            />
          </div>
        )}
      </div>

      {/* Mobile Touch Bottom Navigation */}
      <MobileNav
        activeTab={mobileTab}
        onSelectTab={setMobileTab}
        activeModuleTab={activeModuleTab}
        onSelectModuleTab={setActiveModuleTab}
        hasSelectedElement={!!selectedElement}
        onOpenOrchestrator={() => setShowOrchestrator(true)}
        onOpenDatabase={() => setActiveModuleTab('database')}
        onOpenSEO={() => setActiveModuleTab('seo')}
        onOpenAnalytics={() => setActiveModuleTab('analytics')}
        onOpenShare={() => {
          setShareTargetProject(activeProject);
          setShowShareModal(true);
        }}
      />

      {/* Universal Orchestrator HUD Modal (The Brain Connecting All Systems) */}
      <OrchestratorView
        isOpen={showOrchestrator}
        onClose={() => setShowOrchestrator(false)}
        project={activeProject}
        onUpdateProject={(updated) => {
          setActiveProject(updated);
          dbManager.saveProject(updated);
          const qa = UniversalOrchestrator.runQualityGate(updated);
          setQaResult(qa);
        }}
        onOpenDeliveryContract={(contract) => {
          setActiveDeliveryContract(contract);
          setShowOrchestrator(false);
          setShowDeliveryModal(true);
        }}
      />

      {/* 10-Point Quality Gate Audit Modal */}
      <QualityGateModal
        isOpen={showQualityGate}
        onClose={() => setShowQualityGate(false)}
        qaResult={qaResult || UniversalOrchestrator.runQualityGate(activeProject)}
        onRerunQA={() => {
          if (activeProject) {
            const qa = UniversalOrchestrator.runQualityGate(activeProject);
            setQaResult(qa);
          }
        }}
        onProceedToDelivery={() => {
          setShowQualityGate(false);
          if (!activeDeliveryContract && activeProject) {
            const qa = qaResult || UniversalOrchestrator.runQualityGate(activeProject);
            const task = UniversalOrchestrator.planTask('Release delivery review', activeProject, 'ship');
            const contract = UniversalOrchestrator.buildDeliveryContract(activeProject, task, qa);
            setActiveDeliveryContract(contract);
          }
          setShowDeliveryModal(true);
        }}
      />

      {/* Final Delivery & Package Release Modal */}
      <FinalDeliveryModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        project={activeProject}
        contract={activeDeliveryContract}
      />

      {/* AI Diff Viewer & Approval Modal */}
      {activeProposal && (
        <AIDiffViewer
          proposal={activeProposal}
          onAccept={handleAcceptAIProposal}
          onCancel={() => setActiveProposal(null)}
        />
      )}

      {/* Version History Modal */}
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

      {/* Slide-out AIAssistant quick drawer */}
      {showAIAssistant && activeModuleTab !== 'ai' && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 shadow-2xl p-2 bg-black/85 backdrop-blur-md animate-in slide-in-from-right">
          <div className="h-full relative">
            <AIAssistant
              project={activeProject}
              selectedElement={selectedElement}
              onProposalReady={(proposal) => {
                setActiveProposal(proposal);
                setShowAIAssistant(false);
              }}
              onCreateNewFile={handleCreateFile}
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

      {/* Global Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        files={activeProject.files}
        onSelectFile={(path) => {
          setActiveProject({ ...activeProject, activeFilePath: path });
          setActiveModuleTab('editor');
        }}
        onAction={(actionKey) => {
          switch (actionKey) {
            case 'toggle-orchestrator':
              setShowOrchestrator(true);
              break;
            case 'toggle-qa':
              setShowQualityGate(true);
              break;
            case 'toggle-delivery':
              if (!activeDeliveryContract && activeProject) {
                const qa = qaResult || UniversalOrchestrator.runQualityGate(activeProject);
                const task = UniversalOrchestrator.planTask('Release delivery review', activeProject, 'ship');
                const contract = UniversalOrchestrator.buildDeliveryContract(activeProject, task, qa);
                setActiveDeliveryContract(contract);
              }
              setShowDeliveryModal(true);
              break;
            case 'toggle-cinema':
              setActiveModuleTab('cinema');
              break;
            case 'toggle-analyze':
              setActiveModuleTab('analyze');
              break;
            case 'toggle-automations':
              setActiveModuleTab('automations');
              break;
            case 'toggle-database':
              setActiveModuleTab('database');
              break;
            case 'toggle-seo':
              setActiveModuleTab('seo');
              break;
            case 'toggle-analytics':
              setActiveModuleTab('analytics');
              break;
            case 'toggle-assets':
              setActiveModuleTab('assets');
              break;
            case 'toggle-ai':
              setActiveModuleTab('ai');
              break;
            case 'toggle-inspect':
              setIsInspectMode(!isInspectMode);
              setActiveModuleTab('editor');
              break;
            case 'toggle-history':
              setShowVersionHistory(true);
              break;
            case 'toggle-share':
              setShareTargetProject(activeProject);
              setShowShareModal(true);
              break;
            case 'new-file':
              handleCreateFile('/new-page.html', '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>New Page</title>\n</head>\n<body>\n</body>\n</html>');
              setActiveModuleTab('editor');
              break;
            case 'new-folder':
              handleCreateFile('/components/.keep', '');
              setActiveModuleTab('editor');
              break;
            case 'export-zip':
              exportProjectAsZip(activeProject);
              break;
            case 'export-single':
              exportSingleBundledHtml(activeProject);
              break;
          }
        }}
      />

      {/* Public Share Link Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        project={shareTargetProject || activeProject}
      />

      {/* Floating Undo/Redo Feedback Toast */}
      {historyToast && (
        <div className="fixed bottom-16 md:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0d121f]/95 border border-cyan-500/40 text-xs font-semibold text-white shadow-2xl backdrop-blur-md">
            {historyToast.type === 'undo' ? (
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <RotateCw className="w-3.5 h-3.5 text-purple-400" />
            )}
            <span>{historyToast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
