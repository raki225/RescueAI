import { motion } from 'framer-motion';
import { Code2, BrainCircuit, Sparkles, MapPin } from 'lucide-react';
import { DEVELOPER } from '../../utils/constants';
import { SocialLinks } from './SocialLinks';

const ROLE_ICON = [Code2, BrainCircuit];

const initials = DEVELOPER.name
  .split(' ')
  .map((p) => p[0])
  .join('')
  .slice(0, 2)
  .toUpperCase();

/**
 * "About the Developer" panel — a professional, healthcare-styled card that
 * introduces the creator and surfaces their portfolio links. Reused on the
 * landing page and available anywhere an about/contact block is needed.
 */
export const DeveloperCard = () => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="glass-strong relative overflow-hidden rounded-[26px] p-6 sm:p-9"
  >
    {/* Soft decorative gradient blobs */}
    <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-secondary/15 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />

    <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      {/* Avatar */}
      <motion.div
        whileHover={{ rotate: -4, scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="relative grid h-24 w-24 flex-shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-secondary via-primary to-accent text-3xl font-extrabold text-white shadow-lg shadow-primary/25 sm:h-28 sm:w-28"
      >
        {initials}
        <span className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-xl bg-white text-accent shadow-md">
          <Sparkles className="h-4 w-4" />
        </span>
      </motion.div>

      {/* Details */}
      <div className="flex-1 text-center sm:text-left">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
          <MapPin className="h-3.5 w-3.5" /> Developer
        </p>
        <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          {DEVELOPER.name}
        </h3>

        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
          {DEVELOPER.roles.map((role, i) => {
            const Icon = ROLE_ICON[i] ?? Code2;
            return (
              <span
                key={role}
                className="inline-flex items-center gap-1.5 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary"
              >
                <Icon className="h-3.5 w-3.5" /> {role}
              </span>
            );
          })}
        </div>

        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted sm:mx-0">
          Passionate about building AI-driven products that create real-world impact — RescueAI blends
          intelligent triage with a fast, human-centred experience.
        </p>

        <div className="mt-5 flex justify-center sm:justify-start">
          <SocialLinks size="lg" label="Connect" />
        </div>
      </div>
    </div>
  </motion.div>
);

export default DeveloperCard;
