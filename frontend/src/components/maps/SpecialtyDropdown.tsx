import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Stethoscope, Check } from 'lucide-react';

export interface Category {
  key: string;
  label: string;
  emoji: string;
}

interface SpecialtyDropdownProps {
  categories: Category[];
  value: string;
  onChange: (key: string) => void;
}

/** Premium, custom-styled specialty picker (replaces the native <select>). */
export const SpecialtyDropdown = ({ categories, value, onChange }: SpecialtyDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = categories.find((c) => c.key === value) ?? categories[0];

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div ref={ref} className="relative sm:w-56">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex h-14 w-full items-center gap-2 rounded-[18px] border border-[#E8EDF5] bg-white px-4 text-sm font-semibold text-primary shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:border-[#0F3DDE]/40"
      >
        <Stethoscope className="h-4 w-4 text-[#0F3DDE]" />
        <span className="flex-1 truncate text-left">
          {current.emoji} {current.label}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute z-[70] mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-[#E8EDF5] bg-white p-1.5 shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
          >
            {categories.map((c) => {
              const active = c.key === value;
              return (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c.key);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl border-l-[3px] px-3 py-2.5 text-left text-sm font-medium transition ${
                      active
                        ? 'border-[#0F3DDE] bg-[#0F3DDE]/10 text-[#0F3DDE]'
                        : 'border-transparent text-ink hover:bg-[#0F3DDE]/5'
                    }`}
                  >
                    <span className="text-base">{c.emoji}</span>
                    <span className="flex-1">{c.label}</span>
                    {active && <Check className="h-4 w-4" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpecialtyDropdown;
