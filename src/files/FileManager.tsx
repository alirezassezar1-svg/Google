import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderPlus,
  FilePlus,
  FileCode,
  FileText,
  Image as ImageIcon,
  Trash2,
  Copy,
  Edit2,
  Download,
  Upload,
  Search,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  MoreVertical,
  Check,
  FileCheck,
} from 'lucide-react';
import { ProjectFile, FileType } from '../types';
import { detectFileType, exportSingleFile } from '../utils/zip';

interface FileManagerProps {
  files: ProjectFile[];
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string, initialContent?: string) => void;
  onCreateFolder: (folderPath: string) => void;
  onDeleteFile: (path: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;
  onDuplicateFile: (path: string) => void;
  onUploadFiles: (files: FileList | File[]) => void;
  onUploadZip: (file: File) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  file?: ProjectFile;
  children: Record<string, TreeNode>;
}

export const FileManager: React.FC<FileManagerProps> = ({
  files,
  activeFilePath,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onDuplicateFile,
  onUploadFiles,
  onUploadZip,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isCreatingNew, setIsCreatingNew] = useState<'file' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [contextMenuPath, setContextMenuPath] = useState<string | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [copiedFile, setCopiedFile] = useState<ProjectFile | null>(null);

  // Build nested tree structure
  const fileTree = useMemo(() => {
    const root: TreeNode = { name: '', path: '/', isFolder: true, children: {} };

    // Filter by search query if any
    const filteredFiles = files.filter((f) =>
      searchQuery ? f.path.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

    // Sort files
    const sorted = [...filteredFiles].sort((a, b) => {
      let comp = 0;
      if (sortBy === 'name') comp = a.name.localeCompare(b.name);
      else if (sortBy === 'type') comp = a.type.localeCompare(b.type);
      else if (sortBy === 'size') comp = a.size - b.size;
      return sortOrder === 'asc' ? comp : -comp;
    });

    for (const file of sorted) {
      const parts = file.path.replace(/^\/+/, '').split('/');
      let current = root;
      let curPath = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        curPath += '/' + part;
        const isLeaf = i === parts.length - 1;

        if (isLeaf) {
          current.children[part] = {
            name: part,
            path: curPath,
            isFolder: false,
            file,
            children: {},
          };
        } else {
          if (!current.children[part]) {
            current.children[part] = {
              name: part,
              path: curPath,
              isFolder: true,
              children: {},
            };
          }
          current = current.children[part];
        }
      }
    }

    return root;
  }, [files, searchQuery, sortBy, sortOrder]);

  const toggleFolder = (path: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    let path = newItemName.startsWith('/') ? newItemName : '/' + newItemName;
    if (isCreatingNew === 'file') {
      const { type } = detectFileType(path);
      let boilerplate = '';
      if (type === 'html') boilerplate = '<!DOCTYPE html>\n<html>\n<head>\n  <title>New Page</title>\n</head>\n<body>\n</body>\n</html>';
      else if (type === 'css') boilerplate = '/* New Stylesheet */\n';
      else if (type === 'js') boilerplate = '// New Script\n';
      onCreateFile(path, boilerplate);
    } else {
      // Create folder placeholder file
      onCreateFile(path + '/.keep', '');
    }

    setIsCreatingNew(null);
    setNewItemName('');
  };

  const handleRenameSubmit = (path: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim() || renameValue === path) {
      setRenamingPath(null);
      return;
    }
    const dir = path.substring(0, path.lastIndexOf('/'));
    const newPath = dir ? `${dir}/${renameValue.trim()}` : `/${renameValue.trim()}`;
    onRenameFile(path, newPath);
    setRenamingPath(null);
  };

  const renderFileIcon = (type: FileType, isFolder?: boolean, isOpen?: boolean) => {
    if (isFolder) {
      return (
        <Folder className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'text-cyan-400' : 'text-amber-400/80'}`} />
      );
    }

    switch (type) {
      case 'html':
        return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
      case 'css':
      case 'scss':
      case 'less':
        return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return <FileCode className="w-4 h-4 text-amber-300 shrink-0" />;
      case 'image':
      case 'svg':
        return <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'json':
      case 'yaml':
        return <FileText className="w-4 h-4 text-emerald-400 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    if (node.isFolder) {
      const isCollapsed = collapsedFolders[node.path];
      const childrenKeys = Object.keys(node.children);

      return (
        <div key={node.path}>
          {node.path !== '/' && (
            <div
              onClick={() => toggleFolder(node.path)}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              className="flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded-lg text-xs font-semibold text-slate-300 cursor-pointer select-none group transition"
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
              {renderFileIcon('other', true, !isCollapsed)}
              <span className="truncate flex-1">{node.name}</span>
              <span className="text-[10px] text-slate-500 group-hover:text-slate-400">{childrenKeys.length}</span>
            </div>
          )}

          {(!isCollapsed || node.path === '/') && (
            <div className="space-y-0.5">
              {childrenKeys.map((key) => renderNode(node.children[key], depth + (node.path === '/' ? 0 : 1)))}
            </div>
          )}
        </div>
      );
    }

    const file = node.file!;
    const isActive = activeFilePath === file.path;
    const isRenaming = renamingPath === file.path;
    const isContextOpen = contextMenuPath === file.path;

    return (
      <div
        key={file.path}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={`group relative flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs cursor-pointer select-none transition ${
          isActive
            ? 'bg-cyan-500/15 text-cyan-200 border-l-2 border-cyan-400 font-medium'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`}
        onClick={() => onSelectFile(file.path)}
      >
        {renderFileIcon(file.type)}

        {isRenaming ? (
          <form
            onSubmit={(e) => handleRenameSubmit(file.path, e)}
            className="flex-1 flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => setRenamingPath(null)}
              className="w-full bg-[#161a26] border border-cyan-500/50 rounded px-1.5 py-0.5 text-xs text-white outline-none"
            />
          </form>
        ) : (
          <span className="truncate flex-1 font-mono text-[11px]">{node.name}</span>
        )}

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setContextMenuPath(isContextOpen ? null : file.path);
            }}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>

        {/* Dropdown Menu for File Actions */}
        {isContextOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-2 top-8 z-30 w-44 rounded-xl glass-dropdown p-1.5 shadow-2xl border border-white/10 text-xs"
          >
            <button
              onClick={() => {
                setRenamingPath(file.path);
                setRenameValue(file.name);
                setContextMenuPath(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Rename</span>
            </button>
            <button
              onClick={() => {
                onDuplicateFile(file.path);
                setContextMenuPath(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={() => {
                setCopiedFile(file);
                setContextMenuPath(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy to Clipboard</span>
            </button>
            <button
              onClick={() => {
                exportSingleFile(file);
                setContextMenuPath(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
            <div className="h-px bg-white/10 my-1"></div>
            <button
              onClick={() => {
                onDeleteFile(file.path);
                setContextMenuPath(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col glass-panel rounded-xl overflow-hidden border border-white/5">
      {/* Top Header & Actions */}
      <div className="p-3 border-b border-white/5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-cyan-400" />
            Project Files ({files.length})
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setIsCreatingNew('file');
                setNewItemName('');
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition"
              title="New File"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setIsCreatingNew('folder');
                setNewItemName('');
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition"
              title="New Folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <label
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition cursor-pointer"
              title="Upload Files"
            >
              <Upload className="w-3.5 h-3.5" />
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && onUploadFiles(e.target.files)}
              />
            </label>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#0b0e17] border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* New File / Folder Inline Input */}
      {isCreatingNew && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-cyan-500/30 bg-cyan-500/5">
          <div className="flex items-center gap-1.5">
            {isCreatingNew === 'file' ? (
              <FilePlus className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            ) : (
              <FolderPlus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <input
              type="text"
              autoFocus
              placeholder={isCreatingNew === 'file' ? 'e.g. /about.html or style.css' : 'e.g. /components'}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 bg-[#0b0e17] border border-white/20 rounded px-2 py-1 text-xs text-white outline-none focus:border-cyan-400 font-mono"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-cyan-500 text-slate-950 font-bold text-xs rounded hover:bg-cyan-400"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingNew(null)}
              className="px-2 py-1 text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tree View List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {renderNode(fileTree)}

        {files.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            <p>No files in project.</p>
            <button
              onClick={() => onCreateFile('/index.html', '<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello</h1>\n</body>\n</html>')}
              className="mt-3 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg font-medium hover:bg-cyan-500/30 transition"
            >
              Create index.html
            </button>
          </div>
        )}
      </div>

      {/* Bottom Drop Zone / Quick Info */}
      <div className="p-2 border-t border-white/5 bg-[#090b12] text-[11px] text-slate-500 flex items-center justify-between">
        <label className="hover:text-cyan-400 cursor-pointer flex items-center gap-1 transition">
          <Upload className="w-3 h-3" />
          <span>Import ZIP</span>
          <input
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onUploadZip(e.target.files[0])}
          />
        </label>
        {copiedFile && (
          <span className="text-[10px] text-emerald-400 truncate max-w-[120px]">
            Copied: {copiedFile.name}
          </span>
        )}
      </div>
    </div>
  );
};
