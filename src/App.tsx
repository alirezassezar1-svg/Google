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
import { DatabaseStudio } from './database/DatabaseStudio';
import { SeoStudio } from './seo/SeoStudio';
import { AnalyticsStudio } from './analytics/AnalyticsStudio';
import { AutomationStudio } from './automations/AutomationStudio';
import { WebsiteAnalyzerStudio, AnalyzerIssue } from './analyzer/WebsiteAnalyzerStudio';
import { CinemaStudio } from './cinema/CinemaStudio';
import { OrchestratorView } from './orchestrator/OrchestratorView';
import { AutomationWorkflow } from './orchestrator/types';
import { ShareModal } from './ui/ShareModal';
import { AuthModal } from './auth/AuthModal';
import { UserProfile, subscribeToAuth, saveProjectToFirestore } from './firebase/config';
import { DatabaseCollection, ProjectSeoConfig } from './types';
import { extractZipToProjectFiles, detectFileType, exportProjectAsZip, exportSingleBundledHtml } from './utils/zip';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

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
  const [showAutomationStudio, setShowAutomationStudio] = useState(false);
  const [showAnalyzerStudio, setShowAnalyzerStudio] = useState(false);
  const [showCinemaStudio, setShowCinemaStudio] = useState(false);
  const [showOrchestrator, setShowOrchestrator] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTargetProject, setShareTargetProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

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
        if (currentUser && currentUser.uid) {
          saveProjectToFirestore(activeProject, currentUser.uid).catch((err) => {
            console.warn('Firestore cloud sync notice:', err);
          });
        }
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
  }, [activeProject, isLoaded, currentUser]);

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

  const handleExtractElementToComponent = () => {
    if (!selectedElement || !activeProject) return;

    // 1. Determine clean component name
    let baseName = selectedElement.tagName.toLowerCase();
    if (selectedElement.id) {
      baseName = selectedElement.id.replace(/[^a-zA-Z0-9_-]/g, '');
    } else if (selectedElement.className) {
      const firstClass = selectedElement.className.trim().split(/\s+/)[0];
      if (firstClass && !firstClass.includes(':') && !firstClass.includes('/')) {
        baseName = firstClass.replace(/[^a-zA-Z0-9_-]/g, '');
      }
    }

    // Convert to PascalCase/kebab-case clean name
    const cleanPascal = baseName
      .split(/[-_]/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');
    const componentName = cleanPascal || 'Component';

    // Ensure unique partial filename in components/ directory (e.g. /components/NonoCard.html or _nono-card.html)
    let compPath = `/components/_${baseName}.html`;
    let counter = 1;
    while (activeProject.files.some((f) => f.path === compPath)) {
      compPath = `/components/_${baseName}_${counter}.html`;
      counter++;
    }

    // 2. Extract HTML structure
    const rawHtml =
      selectedElement.outerHTML ||
      `<${selectedElement.tagName.toLowerCase()} class="${selectedElement.className || ''}">${
        selectedElement.innerText || ''
      }</${selectedElement.tagName.toLowerCase()}>`;

    // 3. Extract associated styles
    const relevantStyles = Object.entries(selectedElement.styles || {}).filter(
      ([_, v]) => v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== 'rgba(0, 0, 0, 0)'
    );

    let compContent = `<!-- ======================================================== -->\n`;
    compContent += `<!-- Component: ${componentName} -->\n`;
    compContent += `<!-- Extracted from: ${selectedElement.selectorPath} -->\n`;
    compContent += `<!-- Date: ${new Date().toISOString()} -->\n`;
    compContent += `<!-- ======================================================== -->\n\n`;

    if (relevantStyles.length > 0) {
      compContent += `<style>\n  /* Component Scoped Styles */\n  .${baseName}-extracted {\n`;
      for (const [prop, val] of relevantStyles) {
        const kebab = prop.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
        compContent += `    ${kebab}: ${val};\n`;
      }
      compContent += `  }\n</style>\n\n`;
    }

    compContent += `${rawHtml.trim()}\n`;

    // 4. Create new partial file in project
    const newComponentFile: ProjectFile = {
      path: compPath,
      name: compPath.split('/').pop() || 'component.html',
      extension: 'html',
      type: 'html',
      content: compContent,
      isBinary: false,
      mimeType: 'text/html',
      size: compContent.length,
      updatedAt: Date.now(),
    };

    // 5. Replace original element in the HTML document with a comment placeholder
    const placeholderComment = `<!-- [COMPONENT: ${componentName} -> Extracted to ${compPath}] -->`;
    const targetHtmlFile =
      activeProject.files.find((f) => f.path === activeProject.activeFilePath && f.extension === 'html') ||
      activeProject.files.find((f) => f.path === '/index.html') ||
      activeProject.files.find((f) => f.extension === 'html');

    let updatedFiles = [...activeProject.files, newComponentFile];

    if (targetHtmlFile) {
      let updatedHtml = targetHtmlFile.content;
      let replaced = false;

      // Try replacing full outerHTML if present
      if (selectedElement.outerHTML && updatedHtml.includes(selectedElement.outerHTML)) {
        updatedHtml = updatedHtml.replace(selectedElement.outerHTML, placeholderComment);
        replaced = true;
      }

      // Fallback matching by innerText if unique
      if (!replaced && selectedElement.innerText && selectedElement.innerText.trim().length > 3) {
        const needle = selectedElement.innerText.trim();
        const tagRegex = new RegExp(`<${selectedElement.tagName}[^>]*>[\\s\\S]*?${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?<\\/${selectedElement.tagName}>`, 'i');
        if (tagRegex.test(updatedHtml)) {
          updatedHtml = updatedHtml.replace(tagRegex, placeholderComment);
          replaced = true;
        }
      }

      // Fallback matching by id
      if (!replaced && selectedElement.id) {
        const idRegex = new RegExp(`<${selectedElement.tagName}[^>]*id=["']${selectedElement.id}["'][^>]*>[\\s\\S]*?<\\/${selectedElement.tagName}>`, 'i');
        if (idRegex.test(updatedHtml)) {
          updatedHtml = updatedHtml.replace(idRegex, placeholderComment);
          replaced = true;
        }
      }

      // If matched and replaced in file
      if (replaced) {
        updatedFiles = updatedFiles.map((f) =>
          f.path === targetHtmlFile.path
            ? { ...f, content: updatedHtml, size: updatedHtml.length, updatedAt: Date.now() }
            : f
        );
      }
    }

    // 6. Notify preview iframe to live replace DOM node with comment
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: 'NONONICK_REPLACE_ELEMENT_WITH_COMMENT',
          payload: {
            selector: selectedElement.selectorPath,
            commentText: `[COMPONENT: ${componentName} -> Extracted to ${compPath}]`,
          },
        },
        '*'
      );
    }

    // 7. Update active project and select the newly extracted file in explorer
    setActiveProject({
      ...activeProject,
      files: updatedFiles,
      activeFilePath: compPath,
      updatedAt: Date.now(),
    });

    // 8. Snapshot and deselect element
    createSnapshot(`Extracted element <${selectedElement.tagName.toLowerCase()}> to ${compPath}`);
    setSelectedElement(null);
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

  // --- Database & SEO Handlers ---
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

    setActiveProject({ ...activeProject, files: updatedFiles, updatedAt: Date.now() });
    createSnapshot('Injected Analytics Telemetry Tracker');
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

  // --- Website Analyzer & Code Auto-Fix Handlers ---
  const handleApplyAnalyzerFix = (issue: AnalyzerIssue) => {
    if (!activeProject) return;
    if (issue.suggestedPatch) {
      const targetPath = issue.affectedFile || '/index.html';
      const targetFile = activeProject.files.find((f) => f.path === targetPath) || activeProject.files.find((f) => f.extension === 'html');
      if (targetFile) {
        let newContent = targetFile.content;
        if (newContent.includes(issue.suggestedPatch.findText)) {
          newContent = newContent.replace(issue.suggestedPatch.findText, issue.suggestedPatch.replaceText);
        } else if (newContent.includes('</head>')) {
          newContent = newContent.replace('</head>', `    ${issue.suggestedPatch.replaceText}\n</head>`);
        } else {
          newContent = issue.suggestedPatch.replaceText + '\n' + newContent;
        }

        const updatedFiles = activeProject.files.map((f) =>
          f.path === targetFile.path ? { ...f, content: newContent, size: newContent.length, updatedAt: Date.now() } : f
        );
        const updatedProj = { ...activeProject, files: updatedFiles, updatedAt: Date.now() };
        setActiveProject(updatedProj);
        setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
        dbManager.saveProject(updatedProj);
        createSnapshot(`Analyzer Auto-Fix: ${issue.title}`, issue.suggestedPatch.description);
      }
    }
  };

  // --- Automation Workflow Execution Handler ---
  const handleExecuteWorkflow = (workflow: AutomationWorkflow) => {
    if (!activeProject) return;
    createSnapshot(`Ran Automation: ${workflow.name}`, `Triggered ${workflow.trigger.name}`);
  };

  // --- Cinema & Creative Asset Handlers ---
  const handleAttachCinemaMedia = (path: string, content: string, isBinary: boolean, mimeType: string) => {
    if (!activeProject) return;
    const newFile: ProjectFile = {
      path,
      name: path.split('/').pop() || 'media.jpg',
      extension: path.split('.').pop() || 'jpg',
      type: 'image',
      content,
      isBinary,
      mimeType,
      size: content.length,
      updatedAt: Date.now(),
    };
    const updatedFiles = [...activeProject.files.filter((f) => f.path !== path), newFile];
    const updatedProj = { ...activeProject, files: updatedFiles, updatedAt: Date.now() };
    setActiveProject(updatedProj);
    setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
    dbManager.saveProject(updatedProj);
    createSnapshot(`Added Cinema Asset: ${newFile.name}`);
  };

  const handleInsertCinemaSnippet = (snippet: string) => {
    if (!activeProject) return;
    const targetFile = activeProject.files.find((f) => f.path === '/index.html') || activeProject.files.find((f) => f.extension === 'html');
    if (targetFile) {
      let updatedContent = targetFile.content;
      if (updatedContent.includes('</main>')) {
        updatedContent = updatedContent.replace('</main>', `\n${snippet}\n    </main>`);
      } else if (updatedContent.includes('</body>')) {
        updatedContent = updatedContent.replace('</body>', `\n${snippet}\n</body>`);
      } else {
        updatedContent += `\n${snippet}`;
      }
      const updatedFiles = activeProject.files.map((f) =>
        f.path === targetFile.path ? { ...f, content: updatedContent, size: updatedContent.length, updatedAt: Date.now() } : f
      );
      const updatedProj = { ...activeProject, files: updatedFiles, updatedAt: Date.now() };
      setActiveProject(updatedProj);
      setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
      dbManager.saveProject(updatedProj);
      createSnapshot('Injected Cinema Section');
    }
  };

  // Current active file object
  const activeFile =
    activeProject?.files.find((f) => f.path === activeProject.activeFilePath) ||
    activeProject?.files[0] ||
    null;

  // View: If no project is active, display Dashboard
  if (!activeProject) {
    return (
      <>
        <Dashboard
          projects={projects}
          onOpenProject={(id) => setActiveProjectId(id)}
          onCreateProjectFromTemplate={handleCreateProjectFromTemplate}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          onImportZip={handleImportZip}
          onImportFiles={handleUploadFilesToCurrentProject}
          onOpenShare={(proj) => {
            setShareTargetProject(proj || null);
            setShowShareModal(true);
          }}
          onOpenAuth={() => setShowAuthModal(true)}
          currentUser={currentUser}
        />
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          project={shareTargetProject}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          currentUser={currentUser}
        />
      </>
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
        onOpenDatabase={() => setShowDatabaseStudio(true)}
        onOpenSEO={() => setShowSeoStudio(true)}
        onOpenAnalytics={() => setShowAnalyticsStudio(true)}
        onOpenAutomations={() => setShowAutomationStudio(true)}
        onOpenAnalyze={() => setShowAnalyzerStudio(true)}
        onOpenCinema={() => setShowCinemaStudio(true)}
        onOpenShare={() => {
          setShareTargetProject(activeProject);
          setShowShareModal(true);
        }}
        onOpenAuth={() => setShowAuthModal(true)}
        currentUser={currentUser}
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
              onExportZip={() => exportProjectAsZip(activeProject)}
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
                onExtractComponent={handleExtractElementToComponent}
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
              onExtractComponent={handleExtractElementToComponent}
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

      {/* Mobile Touch Bottom Navigation */}
      <MobileNav
        activeTab={mobileTab}
        onSelectTab={setMobileTab}
        hasSelectedElement={!!selectedElement}
        onOpenDatabase={() => setShowDatabaseStudio(true)}
        onOpenSEO={() => setShowSeoStudio(true)}
        onOpenAnalytics={() => setShowAnalyticsStudio(true)}
        onOpenAutomations={() => setShowAutomationStudio(true)}
        onOpenAnalyze={() => setShowAnalyzerStudio(true)}
        onOpenCinema={() => setShowCinemaStudio(true)}
        onOpenOrchestrator={() => setShowOrchestrator(true)}
        onOpenShare={() => {
          setShareTargetProject(activeProject);
          setShowShareModal(true);
        }}
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

      {/* Database Studio Modal */}
      <DatabaseStudio
        project={activeProject}
        isOpen={showDatabaseStudio}
        onClose={() => setShowDatabaseStudio(false)}
        onUpdateProjectDatabase={handleUpdateProjectDatabase}
      />

      {/* SEO & Meta Studio Modal */}
      <SeoStudio
        project={activeProject}
        isOpen={showSeoStudio}
        onClose={() => setShowSeoStudio(false)}
        onUpdateProjectSeo={handleUpdateProjectSeo}
      />

      {/* Analytics, Telemetry & Web Vitals Studio Modal */}
      <AnalyticsStudio
        project={activeProject}
        isOpen={showAnalyticsStudio}
        onClose={() => setShowAnalyticsStudio(false)}
        onInjectTrackerToProject={handleInjectAnalyticsTracker}
        onApplyCodePatch={handleApplyAnalyticsCodePatch}
      />

      {/* Automation Studio Modal */}
      <AutomationStudio
        project={activeProject}
        isOpen={showAutomationStudio}
        onClose={() => setShowAutomationStudio(false)}
        onExecuteWorkflow={handleExecuteWorkflow}
      />

      {/* Website Analyzer & Audit Studio Modal */}
      <WebsiteAnalyzerStudio
        project={activeProject}
        isOpen={showAnalyzerStudio}
        onClose={() => setShowAnalyzerStudio(false)}
        onApplyFix={handleApplyAnalyzerFix}
      />

      {/* Cinema & Creative Asset Engine Modal */}
      <CinemaStudio
        project={activeProject}
        isOpen={showCinemaStudio}
        onClose={() => setShowCinemaStudio(false)}
        onAttachMediaAsset={handleAttachCinemaMedia}
        onInsertHtmlSnippet={handleInsertCinemaSnippet}
      />

      {/* Universal Orchestrator Modal */}
      <OrchestratorView
        project={activeProject}
        isOpen={showOrchestrator}
        onClose={() => setShowOrchestrator(false)}
        onUpdateProject={(updated) => {
          setActiveProject(updated);
          setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          dbManager.saveProject(updated);
        }}
        onOpenDeliveryContract={() => {}}
      />

      {/* Global Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        files={activeProject.files}
        onSelectFile={(path) => setActiveProject({ ...activeProject, activeFilePath: path })}
        onAction={(actionKey) => {
          switch (actionKey) {
            case 'toggle-share':
              setShareTargetProject(activeProject);
              setShowShareModal(true);
              break;
            case 'toggle-database':
              setShowDatabaseStudio(true);
              break;
            case 'toggle-seo':
              setShowSeoStudio(true);
              break;
            case 'toggle-analytics':
              setShowAnalyticsStudio(true);
              break;
            case 'toggle-automations':
              setShowAutomationStudio(true);
              break;
            case 'toggle-analyzer':
              setShowAnalyzerStudio(true);
              break;
            case 'toggle-cinema':
              setShowCinemaStudio(true);
              break;
            case 'toggle-orchestrator':
              setShowOrchestrator(true);
              break;
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
            case 'export-zip':
              exportProjectAsZip(activeProject);
              break;
            case 'export-single':
              exportSingleBundledHtml(activeProject);
              break;
          }
        }}
      />

      {/* Public Share & Direct URL Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        project={shareTargetProject || activeProject}
      />

      {/* Firebase Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
