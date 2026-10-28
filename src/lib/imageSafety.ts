import 'server-only';

/**
 * Server-side checks for images that visitors send.
 *
 * - The type is read from the FILE'S OWN BYTES (magic numbers), never from the
 *   extension or the Content-Type header, both of which an attacker controls.
 * - Dimensions are bounded to stop decompression-bomb images.
 * - The image is re-encoded, which drops EXIF/GPS metadata and any data
 *   smuggled after the image payload.
 * - The stored filename is random; the visitor's filename is never used.
 *
 * `sharp` is already installed by Next.js for image optimisation, so this adds
 * no dependency.
 */
export type SniffedType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | 'image/gif' | null;

export function sniffImageType(b: Uint8Array): SniffedType {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'image/png';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif';
  // RIFF....WEBP
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  // ....ftypavif / avis
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
  }
  return null;
}

export const MAX_EDGE_PX = 6000;

export type CleanImage = { buffer: Buffer; contentType: string; ext: string; width: number; height: number };

/** Returns a clean re-encoded image, or throws an Error with a message safe to show a visitor. */
export async function cleanVisitorImage(input: Buffer): Promise<CleanImage> {
  const type = sniffImageType(input);
  if (!type || type === 'image/gif' || type === 'image/avif') {
    // GIF would lose its animation and AVIF is rarely sent by phones: keep the visitor path to JPG/PNG/WebP.
    throw new Error('Use a JPG, PNG or WebP photograph.');
  }

  const sharp = (await import('sharp')).default;
  let meta;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_EDGE_PX * MAX_EDGE_PX }).metadata();
  } catch {
    throw new Error('That file could not be read as a photograph.');
  }
  if (!meta.width || !meta.height) throw new Error('That file could not be read as a photograph.');
  if (meta.width > MAX_EDGE_PX || meta.height > MAX_EDGE_PX) {
    throw new Error('That photograph is too large in pixels. Please send a smaller version.');
  }

  // rotate() applies the EXIF orientation before the metadata is dropped, so photos stay upright.
  const pipeline = sharp(input, { limitInputPixels: MAX_EDGE_PX * MAX_EDGE_PX }).rotate();
  if (type === 'image/png') {
    const buffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    return { buffer, contentType: 'image/png', ext: 'png', width: meta.width, height: meta.height };
  }
  if (type === 'image/webp') {
    const buffer = await pipeline.webp({ quality: 88 }).toBuffer();
    return { buffer, contentType: 'image/webp', ext: 'webp', width: meta.width, height: meta.height };
  }
  const buffer = await pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  return { buffer, contentType: 'image/jpeg', ext: 'jpg', width: meta.width, height: meta.height };
}

export function randomObjectName(ext: string): string {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('');
  return `${Date.now()}-${rand}.${ext}`;
}
