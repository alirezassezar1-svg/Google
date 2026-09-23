import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Replace,
  ArrowRight,
  Code,
  Wand2,
  Copy,
  Check,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { ProjectFile } from '../types';

interface CodeEditorProps {
  file: ProjectFile | null;
  allFiles: ProjectFile[];
  onChange: (newContent: string) => void;
  onFormat?: () => void;
  onAskAI?: (snippet?: string) => void;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  allFiles,
  onChange,
  onFormat,
  onAskAI,
  readOnly = false,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const content = file?.content || '';

  // Initialize history when file changes
  useEffect(() => {
    if (file) {
      setHistory([file.content]);
      setHistoryIndex(0);
    }
  }, [file?.path]);

  // Update line numbers count
  useEffect(() => {
    const lines = content.split('\n').length;
    setLineCount(Math.max(lines, 1));
  }, [content]);

  // Synchronize textarea scroll with line numbers
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Basic syntax-informed indentation and bracket autocompletion
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Search shortcut: Ctrl+F or Cmd+F
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setShowSearch(true);
      return;
    }

    // Tab indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      updateContentWithHistory(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
      return;
    }

    // Auto-closing brackets & quotes
    const pairs: Record<string, string> = {
      '{': '}',
      '[': ']',
      '(': ')',
      '"': '"',
      "'": "'",
      '`': '`',
      '<': '>',
    };

    if (pairs[e.key]) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start === end) {
        e.preventDefault();
        const closeChar = pairs[e.key];
        const newContent = content.substring(0, start) + e.key + closeChar + content.substring(end);
        updateContentWithHistory(newContent);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);
        return;
      }
    }

    // Enter with auto-indent
    if (e.key === 'Enter') {
      const start = textarea.selectionStart;
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      const currentLine = content.substring(lineStart, start);
      const indentMatch = currentLine.match(/^\s*/);
      let indent = indentMatch ? indentMatch[0] : '';

      // Extra indent if opening curly brace or tag
      if (currentLine.trim().endsWith('{') || currentLine.trim().endsWith('>')) {
        indent += '  ';
      }

      e.preventDefault();
      const newContent = content.substring(0, start) + '\n' + indent + content.substring(start);
      updateContentWithHistory(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
      }, 0);
    }
  };

  const updateContentWithHistory = (newVal: string) => {
    onChange(newVal);
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(newVal);
    if (newHist.length > 50) newHist.shift();
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onChange(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onChange(next);
    }
  };

  // Search & Replace logic
  const handleFind = () => {
    if (!searchQuery || !textareaRef.current) return;
    const matches: number[] = [];
    let pos = content.indexOf(searchQuery);
    while (pos !== -1) {
      matches.push(pos);
      pos = content.indexOf(searchQuery, pos + 1);
    }
    setMatchCount(matches.length);

    if (matches.length > 0) {
      const nextIdx = (currentMatchIndex + 1) % matches.length;
      setCurrentMatchIndex(nextIdx);
      const targetPos = matches[nextIdx];
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(targetPos, targetPos + searchQuery.length);
    }
  };

  const handleReplaceOne = () => {
    if (!searchQuery || !textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const selected = content.substring(start, start + searchQuery.length);

    if (selected.toLowerCase() === searchQuery.toLowerCase()) {
      const newContent = content.substring(0, start) + replaceQuery + content.substring(start + searchQuery.length);
      updateContentWithHistory(newContent);
      setTimeout(() => {
        handleFind();
      }, 0);
    } else {
      handleFind();
    }
  };

  const handleReplaceAll = () => {
    if (!searchQuery) return;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const newContent = content.replace(regex, replaceQuery);
    updateContentWithHistory(newContent);
    setMatchCount(0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Simple formatting helper
  const handleFormatCode = () => {
    if (!content) return;
    try {
      if (file?.extension === 'json') {
        const formatted = JSON.stringify(JSON.parse(content), null, 2);
        updateContentWithHistory(formatted);
      } else {
        // Basic multi-line indentation beautifier
        const lines = content.split('\n');
        let indentLevel = 0;
        const formatted = lines
          .map((line) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('}') || trimmed.startsWith('</') || trimmed.endsWith('/>')) {
              indentLevel = Math.max(0, indentLevel - 1);
            }
            const indented = '  '.repeat(indentLevel) + trimmed;
            if (trimmed.endsWith('{') || (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('</'))) {
              indentLevel++;
            }
            return indented;
          })
          .join('\n');
        updateContentWithHistory(formatted);
      }
    } catch {
      // Keep existing if parse error
    }
    if (onFormat) onFormat();
  };

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-[#07090e]">
        <FileCode className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-sm font-medium">Select a file from the explorer to begin editing</p>
      </div>
    );
  }

  // Binary / Media Preview
  if (file.isBinary) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[#07090e] text-center">
        {file.type === 'image' && (
          <div className="space-y-4 max-w-md">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-xl">
              <img src={file.content} alt={file.name} className="max-h-72 max-w-full rounded object-contain" />
            </div>
            <div className="text-xs text-slate-400 font-mono">
              {file.name} • {(file.size / 1024).toFixed(1)} KB • {file.mimeType}
            </div>
          </div>
        )}
        {file.type === 'video' && (
          <div className="space-y-4 max-w-lg">
            <video src={file.content} controls className="max-h-80 rounded-xl border border-white/10" />
            <div className="text-xs text-slate-400 font-mono">{file.name} • {(file.size / (1024 * 1024)).toFixed(1)} MB</div>
          </div>
        )}
        {file.type !== 'image' && file.type !== 'video' && (
          <div className="text-sm text-slate-400">
            Binary Asset: <span className="font-mono text-cyan-400">{file.name}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#07090e] rounded-xl overflow-hidden border border-white/5 font-mono">
      {/* Top Editor Toolbar */}
      <div className="h-10 px-3 border-b border-white/5 bg-[#090c14] flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            {file.path}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 uppercase font-sans">
            {file.extension}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded hover:bg-white/10 transition ${showSearch ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400'}`}
            title="Search & Replace (Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded hover:bg-white/10 text-slate-400 disabled:opacity-30 transition"
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded hover:bg-white/10 text-slate-400 disabled:opacity-30 transition"
            title="Redo"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleFormatCode}
            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition"
            title="Format Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition"
            title="Copy to Clipboard"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {onAskAI && (
            <button
              onClick={() => onAskAI(content)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[11px] font-sans font-medium transition cursor-pointer"
              title="Explain or Improve with NONONICK AI"
            >
              <Wand2 className="w-3 h-3" />
              <span>AI Assist</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Search & Replace Bar */}
      {showSearch && (
        <div className="p-2 border-b border-white/10 bg-[#0d111a] flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Find..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFind()}
              className="w-full bg-[#161c28] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-cyan-400"
            />
            {matchCount > 0 && (
              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                {currentMatchIndex + 1}/{matchCount}
              </span>
            )}
            <button
              onClick={handleFind}
              className="px-2 py-1 bg-white/10 hover:bg-white/15 text-slate-200 rounded text-xs"
            >
              Next
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="w-full bg-[#161c28] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleReplaceOne}
              className="px-2 py-1 bg-white/10 hover:bg-white/15 text-slate-200 rounded text-xs whitespace-nowrap"
            >
              Replace
            </button>
            <button
              onClick={handleReplaceAll}
              className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded text-xs whitespace-nowrap"
            >
              All
            </button>
          </div>
        </div>
      )}

      {/* Editor Main Canvas: Line Numbers + Textarea */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Line Numbers Column */}
        <div
          ref={lineNumbersRef}
          className="w-12 py-3 px-1 bg-[#090b12] border-r border-white/5 select-none overflow-hidden text-right text-[11px] text-slate-600 font-mono leading-6"
        >
          {Array.from({ length: lineCount }).map((_, idx) => (
            <div key={idx} className="h-6 pr-2">
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Text Area Code Editor */}
        <textarea
          ref={textareaRef}
          value={content}
          readOnly={readOnly}
          onChange={(e) => updateContentWithHistory(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="flex-1 w-full h-full py-3 px-4 bg-transparent text-[#e2e8f0] font-mono text-[12px] leading-6 resize-none outline-none selection:bg-cyan-500/30 whitespace-pre overflow-auto custom-scrollbar"
        />
      </div>

      {/* Bottom Status Bar */}
      <div className="h-6 px-3 border-t border-white/5 bg-[#090c14] flex items-center justify-between text-[10px] text-slate-500 select-none">
        <div className="flex items-center gap-3">
          <span>Lines: {lineCount}</span>
          <span>Length: {content.length} chars</span>
        </div>
        <div className="flex items-center gap-3">
          <span>UTF-8</span>
          <span>Spaces: 2</span>
          <span className="text-cyan-400">NONONICK Realtime Engine</span>
        </div>
      </div>
    </div>
  );
};
