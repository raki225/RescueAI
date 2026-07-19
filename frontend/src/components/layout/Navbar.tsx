import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldPlus, Phone, Menu, X } from 'lucide-react';
import { EMERGENCY_NUMBERS } from '../../utils/constants';

const links = [
  { to: '/', label: 'Home' },
  { to: '/triage', label: 'Triage' },
  { to: '/hospitals', label: 'Hospitals' },
  { to: '/first-aid', label: 'First Aid' },
];

export const Navbar = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-glass">
      <nav className="app-container relative flex items-center justify-between py-3">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <motion.span
            whileHover={{ rotate: -8, scale: 1.05 }}
            className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-secondary to-primary text-white shadow-md"
          >
            <ShieldPlus className="h-5 w-5" />
          </motion.span>
          <span className="text-lg font-extrabold tracking-tight text-primary">
            Rescue<span className="text-accent">AI</span>
          </span>
        </Link>

        {/* Centered navigation (desktop) */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-active={isActive(l.to)}
              className={`nav-underline relative rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive(l.to) ? 'text-primary' : 'text-muted hover:text-primary'
              }`}
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right: emergency CTA + mobile toggle */}
        <div className="flex items-center gap-2">
          <a
            href={`tel:${EMERGENCY_NUMBERS.ambulance}`}
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-danger px-4 py-2 text-sm font-bold text-white shadow-md shadow-danger/30 transition hover:brightness-95"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden xs:inline">Call {EMERGENCY_NUMBERS.ambulance}</span>
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/70 text-primary transition hover:border-secondary md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden border-t border-white/50 bg-white/90 backdrop-blur md:hidden"
          >
            <div className="app-container flex flex-col gap-1 py-3">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-[48px] items-center rounded-xl px-4 text-base font-semibold transition ${
                    isActive(l.to)
                      ? 'bg-secondary/10 text-primary'
                      : 'text-muted hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
