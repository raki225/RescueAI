import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldPlus, HeartPulse, Phone, Sparkles, ArrowUpRight } from 'lucide-react';
import { EMERGENCY_NUMBERS, DEVELOPER } from '../../utils/constants';
import { SocialLinks } from '../common/SocialLinks';

const quickLinks = [
  { to: '/', label: 'Home' },
  { to: '/triage', label: 'AI Triage' },
  { to: '/hospitals', label: 'Hospital Locator' },
  { to: '/first-aid', label: 'First Aid' },
  { to: '/report', label: 'Emergency Report' },
];

const emergencyNumbers = [
  { number: EMERGENCY_NUMBERS.ambulance, label: 'Ambulance', primary: true },
  { number: EMERGENCY_NUMBERS.unified, label: 'Unified Emergency', primary: true },
  { number: EMERGENCY_NUMBERS.poison, label: 'Poison Control', primary: false },
];

const year = new Date().getFullYear();

export const Footer = () => (
  <footer className="relative mt-10 overflow-hidden border-t border-white/40 bg-gradient-to-b from-white/70 to-secondary/[0.06] backdrop-blur">
    {/* Subtle top accent line */}
    <div className="h-1 w-full bg-gradient-to-r from-secondary via-primary to-accent opacity-80" />

    <div className="app-container py-8">
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand + tagline */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link to="/" className="group inline-flex items-center gap-2 text-primary">
            <motion.span
              whileHover={{ rotate: -8, scale: 1.06 }}
              className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-secondary to-primary text-white shadow-md"
            >
              <ShieldPlus className="h-5 w-5" />
            </motion.span>
            <span className="text-xl font-extrabold tracking-tight">
              Rescue<span className="text-accent">AI</span>
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm font-medium leading-relaxed text-muted">
            AI that helps save lives before help arrives.
          </p>
          <div className="mt-4">
            <SocialLinks size="md" />
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">Quick Links</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {quickLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="group inline-flex items-center gap-1 font-medium text-muted transition-colors duration-200 hover:text-primary"
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    {l.label}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all duration-200 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Emergency numbers */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
            Emergency Numbers
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {emergencyNumbers.map((e) => (
              <li key={e.number}>
                <a
                  href={`tel:${e.number}`}
                  className={`group inline-flex items-center gap-2 transition-colors ${
                    e.primary
                      ? 'font-semibold text-primary hover:text-danger'
                      : 'text-muted hover:text-primary'
                  }`}
                >
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-danger/10 text-danger transition-transform duration-200 group-hover:scale-110">
                    <Phone className="h-3 w-3" />
                  </span>
                  <span>
                    <span className="font-bold">{e.number}</span> · {e.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Developer */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">Developer</h3>
          <p className="mt-4 text-sm text-muted">Developed by</p>
          <p className="text-base font-extrabold text-primary">{DEVELOPER.name}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {DEVELOPER.roles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary"
              >
                {role}
              </span>
            ))}
          </div>
          <div className="mt-4">
            <SocialLinks size="sm" />
          </div>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-semibold text-secondary">
            <Sparkles className="h-3.5 w-3.5" /> Idea2Impact 2026
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200/70 pt-5 sm:flex-row">
        <p className="max-w-md text-center text-[11px] leading-snug text-muted sm:text-left">
          RescueAI is a decision-support tool, not a substitute for professional medical care.
          Always call emergency services for serious conditions.
        </p>
        <div className="flex flex-col items-center gap-1 text-center sm:items-end sm:text-right">
          <p className="text-[11px] font-semibold text-primary">
            © {year} RescueAI · Developed by{' '}
            <a
              href={DEVELOPER.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary underline-offset-2 transition hover:text-primary hover:underline"
            >
              {DEVELOPER.name}
            </a>
          </p>
          <p className="inline-flex items-center gap-1 text-[11px] text-muted">
            Built with <HeartPulse className="h-3.5 w-3.5 text-danger" /> for those who help first
          </p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
