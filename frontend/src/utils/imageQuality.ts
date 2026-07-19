import { ImageQuality } from '../types';

/**
 * Lightweight client-side image quality check using a canvas. Estimates
 * brightness and sharpness (variance of a Laplacian) so we can ask the user to
 * retake dark, washed-out, or blurry photos before spending an AI call.
 */
export const checkImageQuality = (dataUrl: string): Promise<ImageQuality> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 320;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve({ acceptable: true, issues: [], message: '' });
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);

        // Grayscale + brightness
        const gray = new Float64Array(w * h);
        let sum = 0;
        for (let i = 0; i < w * h; i++) {
          const r = data[i * 4];
          const g = data[i * 4 + 1];
          const b = data[i * 4 + 2];
          const v = 0.299 * r + 0.587 * g + 0.114 * b;
          gray[i] = v;
          sum += v;
        }
        const brightness = sum / (w * h);

        // Sharpness: variance of Laplacian
        let lapSum = 0;
        let lapSqSum = 0;
        let count = 0;
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            const lap =
              4 * gray[idx] -
              gray[idx - 1] -
              gray[idx + 1] -
              gray[idx - w] -
              gray[idx + w];
            lapSum += lap;
            lapSqSum += lap * lap;
            count++;
          }
        }
        const mean = count ? lapSum / count : 0;
        const sharpness = count ? lapSqSum / count - mean * mean : 0;

        const issues: string[] = [];
        if (brightness < 45) issues.push('too_dark');
        else if (brightness > 225) issues.push('too_bright');
        if (sharpness < 60) issues.push('blurry');
        if (Math.min(img.width, img.height) < 160) issues.push('too_small');

        const acceptable = issues.length === 0;
        const messages: Record<string, string> = {
          too_dark: 'The photo looks too dark — move to better light.',
          too_bright: 'The photo is over-exposed — reduce glare or flash.',
          blurry: 'The photo looks blurry — hold steady and tap to focus.',
          too_small: 'The photo is very small — move closer to the area.',
        };
        const message = acceptable
          ? ''
          : issues.map((i) => messages[i]).filter(Boolean).join(' ');

        resolve({
          acceptable,
          issues,
          message,
          brightness: Math.round(brightness),
          sharpness: Math.round(sharpness),
        });
      } catch {
        resolve({ acceptable: true, issues: [], message: '' });
      }
    };
    img.onerror = () => resolve({ acceptable: true, issues: [], message: '' });
    img.src = dataUrl;
  });

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
