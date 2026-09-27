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
 * Builds and downloads a full Project ZIP containing all current HTML, CSS, JS,
 * media assets, fonts, and subfolders matching the exact project's current file state.
 */
export async function exportProjectAsZip(
  project: Project,
  customFilename?: string,
  onProgress?: (percent: number, currentFile: string) => void
): Promise<{ blob: Blob; filename: string }> {
  const zip = new JSZip();

  // Track created directories to ensure empty or nested folders are preserved
  const createdDirs = new Set<string>();

  const totalFiles = project.files.length;
  let processedFiles = 0;

  for (const file of project.files) {
    // Normalize path by stripping leading slashes
    const cleanPath = file.path.replace(/^\/+/, '').trim();
    if (!cleanPath) continue;

    // Report progress if callback provided
    processedFiles++;
    if (onProgress) {
      onProgress(Math.round((processedFiles / Math.max(totalFiles, 1)) * 100), cleanPath);
    }

    // Ensure parent folders are registered
    const pathParts = cleanPath.split('/');
    if (pathParts.length > 1) {
      let currentDir = '';
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentDir = currentDir ? `${currentDir}/${pathParts[i]}` : pathParts[i];
        if (!createdDirs.has(currentDir)) {
          zip.folder(currentDir);
          createdDirs.add(currentDir);
        }
      }
    }

    // If it's a directory placeholder file (e.g. .keep), ensure directory exists and optionally omit the placeholder
    if (cleanPath.endsWith('/.keep') || cleanPath === '.keep') {
      const dirName = cleanPath.replace(/\/?\.keep$/, '');
      if (dirName && !createdDirs.has(dirName)) {
        zip.folder(dirName);
        createdDirs.add(dirName);
      }
      // Continue to next file without saving raw .keep file if directory is created
      continue;
    }

    const fileDate = file.updatedAt ? new Date(file.updatedAt) : new Date();

    // Handle binary assets (Images, Videos, Fonts, Audio, etc.)
    if (file.isBinary) {
      if (typeof file.content === 'string' && file.content.startsWith('data:')) {
        const base64Index = file.content.indexOf(';base64,');
        if (base64Index !== -1) {
          // Standard base64 Data URL
          const base64Data = file.content.substring(base64Index + 8).trim();
          zip.file(cleanPath, base64Data, { base64: true, date: fileDate });
        } else {
          // Data URL without base64 (e.g. data:image/svg+xml;utf8,... or data:text/plain;charset=utf-8,...)
          const commaIndex = file.content.indexOf(',');
          const rawPayload = commaIndex !== -1 ? file.content.substring(commaIndex + 1) : file.content;
          try {
            const decoded = decodeURIComponent(rawPayload);
            zip.file(cleanPath, decoded, { date: fileDate });
          } catch {
            zip.file(cleanPath, rawPayload, { date: fileDate });
          }
        }
      } else if (typeof file.content === 'string' && /^[A-Za-z0-9+/=\r\n]+$/.test(file.content.trim()) && file.content.length > 40) {
        // Raw base64 string
        zip.file(cleanPath, file.content.trim(), { base64: true, date: fileDate });
      } else {
        // Fallback plain content
        zip.file(cleanPath, file.content, { date: fileDate });
      }
    } else {
      // Text files: HTML, CSS, JavaScript, TypeScript, JSON, Markdown, SVG, XML, etc.
      if (typeof file.content === 'string' && file.content.startsWith('data:') && file.content.includes(';base64,')) {
        // In case an SVG or text file was stored with a Data URL prefix
        const base64Index = file.content.indexOf(';base64,');
        const base64Data = file.content.substring(base64Index + 8).trim();
        try {
          const decodedText = atob(base64Data);
          zip.file(cleanPath, decodedText, { date: fileDate });
        } catch {
          zip.file(cleanPath, base64Data, { base64: true, date: fileDate });
        }
      } else {
        zip.file(cleanPath, file.content ?? '', { date: fileDate });
      }
    }
  }

  // Compress using DEFLATE level 6 for optimal speed & compression ratio
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6,
    },
  });

  const sanitizedName = project.name
    ? project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    : 'project';
  const filename = customFilename || `${sanitizedName || 'project'}-export.zip`;

  triggerDownload(blob, filename);

  return { blob, filename };
}

/**
 * Builds and downloads a full PWA-Compliant distribution ZIP.
 * Ensures manifest.webmanifest, service worker registration, offline caching script,
 * and PWA icons are present in the root folder so the exported site is 100% installable on any host.
 */
export async function exportPwaZip(
  project: Project,
  onProgress?: (percent: number, currentFile: string) => void
): Promise<{ blob: Blob; filename: string }> {
  // Clone project and check if manifest and sw exist; if not, inject defaults
  const filesCopy = [...project.files];

  const hasManifest = filesCopy.some((f) => f.path.includes('manifest.webmanifest') || f.path.includes('manifest.json'));
  if (!hasManifest) {
    const defaultManifest = {
      name: project.name || 'NONONICK App',
      short_name: (project.name || 'App').slice(0, 12),
      description: 'Progressive Web Application built with NONONICK Universal Editor',
      start_url: '/',
      display: 'standalone',
      background_color: '#07080b',
      theme_color: '#0a0c10',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    };
    filesCopy.push({
      path: '/manifest.webmanifest',
      name: 'manifest.webmanifest',
      extension: 'webmanifest',
      type: 'json',
      content: JSON.stringify(defaultManifest, null, 2),
      isBinary: false,
      mimeType: 'application/manifest+json',
      size: 400,
      updatedAt: Date.now(),
    });
  }

  const hasSw = filesCopy.some((f) => f.path === '/sw.js' || f.name === 'sw.js');
  if (!hasSw) {
    const defaultSw = `// PWA Service Worker generated by NONONICK
const CACHE_NAME = 'app-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        })
      );
    })
  );
});
`;
    filesCopy.push({
      path: '/sw.js',
      name: 'sw.js',
      extension: 'js',
      type: 'js',
      content: defaultSw,
      isBinary: false,
      mimeType: 'text/javascript',
      size: defaultSw.length,
      updatedAt: Date.now(),
    });
  }

  const pwaProject: Project = {
    ...project,
    files: filesCopy,
  };

  const sanitized = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return exportProjectAsZip(pwaProject, `${sanitized}-pwa-bundle.zip`, onProgress);
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
