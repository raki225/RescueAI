import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImagePlus, UploadCloud, X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { ImageCategory, ImageQuality } from '../../types';
import { IMAGE_CATEGORY_META, IMAGE_CATEGORY_ORDER } from '../../utils/constants';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, checkImageQuality } from '../../utils/imageQuality';

interface ImageUploaderProps {
  image: string | null;
  onImage: (dataUrl: string | null) => void;
  category: ImageCategory | null;
  onCategory: (c: ImageCategory | null) => void;
  quality: ImageQuality | null;
  onQuality: (q: ImageQuality | null) => void;
}

export const ImageUploader = ({
  image,
  onImage,
  category,
  onCategory,
  quality,
  onQuality,
}: ImageUploaderProps) => {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file?: File) => {
      setError(null);
      if (!file) return;
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError('Please choose a JPG, PNG, or WEBP image.');
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError('Image is too large — maximum size is 10 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        onImage(dataUrl);
        setChecking(true);
        const q = await checkImageQuality(dataUrl);
        onQuality(q);
        setChecking(false);
      };
      reader.readAsDataURL(file);
    },
    [onImage, onQuality]
  );

  const clear = () => {
    onImage(null);
    onQuality(null);
    setError(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-4">
      {/* Category picker */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
          What are you showing?{' '}
          <span className="font-medium normal-case text-muted/70">(optional — helps the AI)</span>
        </p>
        <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto pr-1">
          {IMAGE_CATEGORY_ORDER.map((c) => {
            const meta = IMAGE_CATEGORY_META[c];
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onCategory(active ? null : c)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                  active
                    ? 'border-secondary bg-secondary text-white shadow-sm'
                    : 'border-slate-200 bg-white/70 text-muted hover:border-secondary/50 hover:text-secondary'
                }`}
              >
                <span>{meta.emoji}</span> {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload zone / preview */}
      <AnimatePresence mode="wait">
        {!image ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
              dragging ? 'border-secondary bg-secondary/5' : 'border-slate-300 bg-white/50'
            }`}
          >
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-secondary/15 to-primary/10 text-secondary">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="text-sm font-bold text-primary">Upload a photo of the condition</p>
            <p className="mt-1 text-xs text-muted">
              Drag &amp; drop here, or choose an option below · JPG, PNG, WEBP · max 10 MB
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:border-secondary hover:text-secondary"
              >
                <ImagePlus className="h-4 w-4" /> Gallery
              </button>
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-secondary to-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-105"
              >
                <Camera className="h-4 w-4" /> Take Photo
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <img
                src={image}
                alt="Condition"
                className="max-h-72 w-full bg-slate-900/5 object-contain"
              />
              <button
                onClick={clear}
                className="focus-ring absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quality banner */}
            {checking ? (
              <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking image quality…
              </div>
            ) : quality && !quality.acceptable ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4" /> Please retake the photo
                </p>
                <p className="mt-1 text-xs">
                  {quality.message || 'Make it clear, well-lit and close to the area.'}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white"
                  >
                    Retake
                  </button>
                  <button
                    onClick={() => galleryRef.current?.click()}
                    className="rounded-full border border-amber-400 px-3 py-1 text-xs font-bold text-amber-800"
                  >
                    Choose another
                  </button>
                </div>
              </div>
            ) : quality ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Image looks good — clear and well-lit.
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs font-medium text-danger">{error}</p>}

      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
};

export default ImageUploader;
