import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, LucideIcon } from 'lucide-react';
import { SOCIAL_LINKS, SocialKey, DEVELOPER } from '../../utils/constants';

const ICONS: Record<SocialKey, LucideIcon> = {
  github: Github,
  linkedin: Linkedin,
  email: Mail,
};

/** Brand-accurate hover colours so each icon "lights up" on hover. */
const HOVER: Record<SocialKey, string> = {
  github: 'hover:border-[#24292f] hover:bg-[#24292f] hover:text-white',
  linkedin: 'hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white',
  email: 'hover:border-danger hover:bg-danger hover:text-white',
};

const BOX: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-9 w-9',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const ICON: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-4 w-4',
  md: 'h-[18px] w-[18px]',
  lg: 'h-5 w-5',
};

interface SocialLinksProps {
  size?: 'sm' | 'md' | 'lg';
  /** Base surface style: light glass (default) or a translucent dark chip. */
  tone?: 'light' | 'dark';
  className?: string;
  /** Optional label shown before the icons (e.g. "Connect"). */
  label?: string;
}

/**
 * Reusable row of professional social/portfolio icons (GitHub, LinkedIn, Email).
 * External profiles open in a new tab; hover reveals each brand colour with a
 * subtle lift animation. Used across the footer, developer card and about area.
 */
export const SocialLinks = ({ size = 'md', tone = 'light', className = '', label }: SocialLinksProps) => {
  const base =
    tone === 'dark'
      ? 'border-white/15 bg-white/10 text-white/80'
      : 'border-slate-200 bg-white/70 text-muted';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      )}
      {SOCIAL_LINKS.map((link, i) => {
        const Icon = ICONS[link.key];
        const isEmail = link.key === 'email';
        const aria = isEmail ? `Email ${DEVELOPER.name}` : `${DEVELOPER.name} on ${link.label}`;
        return (
          <motion.a
            key={link.key}
            href={link.href}
            aria-label={aria}
            title={isEmail ? DEVELOPER.email : link.label}
            {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
            whileHover={{ y: -3, scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className={`focus-ring grid ${BOX[size]} place-items-center rounded-xl border ${base} shadow-sm transition-colors duration-300 hover:shadow-md ${HOVER[link.key]}`}
          >
            <Icon className={ICON[size]} />
          </motion.a>
        );
      })}
    </div>
  );
};

export default SocialLinks;
