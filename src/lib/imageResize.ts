'use client';

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_EDGE = 2400;

function readAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };
    image.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

/**
 * Shrinks a photograph until it fits under the upload limit.
 * Family photos straight off a phone are often 6–10 MB; this makes them usable
 * without asking anyone to resize anything by hand.
 * Anything already small enough, or not an image, is passed straight through.
 */
export async function prepareForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/gif') return file; // resizing would drop the animation
  if (file.size <= MAX_UPLOAD_BYTES) return file;

  const image = await readAsImage(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  let width = Math.round(image.width * scale);
  let height = Math.round(image.height * scale);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return file;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, width, height);

    for (const quality of [0.86, 0.74, 0.62]) {
      const blob = await toBlob(canvas, quality);
      if (blob && blob.size <= MAX_UPLOAD_BYTES) {
        return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
      }
    }

    width = Math.round(width * 0.8);
    height = Math.round(height * 0.8);
  }

  throw new Error('That image is too large to compress. Please resize it and try again.');
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
