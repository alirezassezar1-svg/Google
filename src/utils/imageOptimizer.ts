export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
}

export interface OptimizeResult {
  dataUrl: string;
  originalSize: number;
  newSize: number;
  format: string;
  width: number;
  height: number;
  savingsPercentage: number;
}

/**
 * Optimizes an image (dataUrl or File) using an off-screen HTML5 Canvas.
 */
export async function optimizeImage(
  source: string | File,
  options: OptimizeOptions = {}
): Promise<OptimizeResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.82,
    format = 'image/webp',
  } = options;

  let originalDataUrl = '';
  let originalSize = 0;

  if (typeof source === 'string') {
    originalDataUrl = source;
    // Estimate size from base64
    originalSize = Math.round(source.length * 0.75);
  } else {
    originalSize = source.size;
    originalDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(source);
    });
  }

  const img = new Image();
  img.src = originalDataUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image for optimization'));
  });

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  // Calculate scaled dimensions while preserving aspect ratio
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Draw smooth scaled image
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  const newDataUrl = canvas.toDataURL(format, quality);
  const newSize = Math.round(newDataUrl.length * 0.75);
  const savings = Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100));

  return {
    dataUrl: newDataUrl,
    originalSize,
    newSize,
    format,
    width,
    height,
    savingsPercentage: savings,
  };
}
