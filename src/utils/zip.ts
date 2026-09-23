import JSZip from 'jszip';
import { FileType, Project, ProjectFile } from '../types';

export function detectFileType(path: string): { type: FileType; extension: string; mimeType: string; isBinary: boolean } {
  const ext = path.split('.').pop()?.toLowerCase() || '';

  const binaryImageExts = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'ico', 'bmp'];
  const videoExts = ['mp4', 'webm', 'ogg', 'mov'];
  const fontExts = ['woff', 'woff2', 'ttf', 'otf', 'eot'];

  if (binaryImageExts.includes(ext)) {
    return {
      type: 'image',
      extension: ext,
      mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      isBinary: true,
    };
  }

  if (videoExts.includes(ext)) {
    return {
      type: 'video',
      extension: ext,
      mimeType: `video/${ext}`,
      isBinary: true,
    };
  }

  if (fontExts.includes(ext)) {
    return {
      type: 'font',
      extension: ext,
      mimeType: `font/${ext}`,
      isBinary: true,
    };
  }

  const mimeMap: Record<string, { type: FileType; mimeType: string }> = {
    html: { type: 'html', mimeType: 'text/html' },
    htm: { type: 'html', mimeType: 'text/html' },
    css: { type: 'css', mimeType: 'text/css' },
    scss: { type: 'scss', mimeType: 'text/x-scss' },
    less: { type: 'less', mimeType: 'text/x-less' },
    js: { type: 'js', mimeType: 'text/javascript' },
    jsx: { type: 'jsx', mimeType: 'text/javascript' },
    ts: { type: 'ts', mimeType: 'text/typescript' },
    tsx: { type: 'tsx', mimeType: 'text/typescript' },
    json: { type: 'json', mimeType: 'application/json' },
    svg: { type: 'svg', mimeType: 'image/svg+xml' },
    xml: { type: 'xml', mimeType: 'application/xml' },
    md: { type: 'md', mimeType: 'text/markdown' },
    txt: { type: 'txt', mimeType: 'text/plain' },
    csv: { type: 'csv', mimeType: 'text/csv' },
    yaml: { type: 'yaml', mimeType: 'text/yaml' },
    yml: { type: 'yaml', mimeType: 'text/yaml' },
  };

  const matched = mimeMap[ext];
  if (matched) {
    return {
      type: matched.type,
      extension: ext,
      mimeType: matched.mimeType,
      isBinary: false,
    };
  }

  return {
    type: 'other',
    extension: ext,
    mimeType: 'text/plain',
    isBinary: false,
  };
}

/**
 * Extracts a ZIP file into an array of ProjectFiles, preserving full directory hierarchy.
 */
export async function extractZipToProjectFiles(zipBlobOrFile: Blob | File): Promise<ProjectFile[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipBlobOrFile);
  const files: ProjectFile[] = [];

  for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
    // Ignore directory entries and mac system files
    if (zipEntry.dir || relativePath.includes('__MACOSX') || relativePath.endsWith('.DS_Store')) {
      continue;
    }

    const normalizedPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
    const name = normalizedPath.split('/').pop() || 'file';
    const { type, extension, mimeType, isBinary } = detectFileType(normalizedPath);

    if (isBinary) {
      // Convert to base64 Data URL so images/assets can be previewed and manipulated
      const base64Data = await zipEntry.async('base64');
      const content = `data:${mimeType};base64,${base64Data}`;
      files.push({
        path: normalizedPath,
        name,
        extension,
        type,
        content,
        isBinary: true,
        mimeType,
        size: Math.round(base64Data.length * 0.75),
        updatedAt: Date.now(),
      });
    } else {
      const textContent = await zipEntry.async('string');
      files.push({
        path: normalizedPath,
        name,
        extension,
        type,
        content: textContent,
        isBinary: false,
        mimeType,
        size: textContent.length,
        updatedAt: Date.now(),
      });
    }
  }

  return files;
}

/**
 * Builds and downloads a full Project ZIP
 */
export async function exportProjectAsZip(project: Project, customFilename?: string): Promise<void> {
  const zip = new JSZip();

  for (const file of project.files) {
    // Strip leading slash for zip paths
    const cleanPath = file.path.replace(/^\/+/, '');

    if (file.isBinary && file.content.startsWith('data:')) {
      // Extract raw base64 data
      const base64Index = file.content.indexOf(';base64,');
      if (base64Index !== -1) {
        const base64Data = file.content.substring(base64Index + 8);
        zip.file(cleanPath, base64Data, { base64: true });
      }
    } else {
      zip.file(cleanPath, file.content);
    }
  }

  const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const filename = customFilename || `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-export.zip`;
  triggerDownload(content, filename);
}

/**
 * Exports single bundled standalone HTML file with inlined CSS & JS
 */
export function exportSingleBundledHtml(project: Project): void {
  const htmlFile = project.files.find((f) => f.path === '/index.html' || f.extension === 'html') || project.files[0];
  if (!htmlFile) return;

  let bundled = htmlFile.content;

  // Inlined CSS files
  const cssFiles = project.files.filter((f) => f.type === 'css');
  for (const css of cssFiles) {
    const linkRegex = new RegExp(`<link[^>]*href=["']${css.name}["'][^>]*>`, 'i');
    const styleTag = `<style>\n/* Inlined from ${css.path} */\n${css.content}\n</style>`;
    if (linkRegex.test(bundled)) {
      bundled = bundled.replace(linkRegex, styleTag);
    } else if (bundled.includes('</head>')) {
      bundled = bundled.replace('</head>', `${styleTag}\n</head>`);
    }
  }

  // Inlined JS files
  const jsFiles = project.files.filter((f) => f.type === 'js');
  for (const js of jsFiles) {
    const scriptRegex = new RegExp(`<script[^>]*src=["']${js.name}["'][^>]*>\\s*<\\/script>`, 'i');
    const scriptTag = `<script>\n// Inlined from ${js.path}\n${js.content}\n</script>`;
    if (scriptRegex.test(bundled)) {
      bundled = bundled.replace(scriptRegex, scriptTag);
    } else if (bundled.includes('</body>')) {
      bundled = bundled.replace('</body>', `${scriptTag}\n</body>`);
    }
  }

  const blob = new Blob([bundled], { type: 'text/html;charset=utf-8' });
  triggerDownload(blob, `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-single.html`);
}

/**
 * Downloads a specific file
 */
export function exportSingleFile(file: ProjectFile): void {
  let blob: Blob;
  if (file.isBinary && file.content.startsWith('data:')) {
    const base64Index = file.content.indexOf(';base64,');
    const mime = file.mimeType || 'application/octet-stream';
    if (base64Index !== -1) {
      const b64 = file.content.substring(base64Index + 8);
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: mime });
    } else {
      blob = new Blob([file.content], { type: mime });
    }
  } else {
    blob = new Blob([file.content], { type: file.mimeType || 'text/plain' });
  }

  triggerDownload(blob, file.name);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
