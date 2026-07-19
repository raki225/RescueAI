import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Stethoscope,
  MapPin,
  FileText,
  HeartPulse,
  ShieldCheck,
  ArrowRight,
  ScanSearch,
  Zap,
  Clock,
  Building2,
  Ambulance,
  Activity,
  Phone,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { GlassCard } from '../components/common/GlassCard';
import { CountUp } from '../components/common/CountUp';
import { Stepper } from '../components/common/Stepper';
import { DeveloperCard } from '../components/common/DeveloperCard';
import { EMERGENCY_NUMBERS } from '../utils/constants';
import { pageTransition, slideUp, stagger } from '../utils/motion';

const features = [
  {
    icon: Stethoscope,
    title: 'AI Symptom Triage',
    desc: 'Describe symptoms or upload a photo — get a severity assessment with confidence scoring.',
    gradient: 'from-secondary to-primary',
    badges: ['⭐ AI Powered', '⚡ Under 30s'],
  },
  {
    icon: MapPin,
    title: 'Nearest Hospitals',
    desc: 'Locate emergency-ready facilities around you, sorted by distance and live ETA.',
    gradient: 'from-accent to-danger',
    badges: ['📍 Live GPS', '🚑 Real ETA'],
  },
  {
    icon: HeartPulse,
    title: 'Guided First Aid',
    desc: 'Step-by-step, bystander-safe instructions tailored to the emergency type.',
    gradient: 'from-danger to-accent',
    badges: ['🩺 Verified', '✅ Bystander-safe'],
  },
  {
    icon: FileText,
    title: 'Emergency Report',
    desc: 'One-tap, printable report for a fast, accurate hospital hand-off.',
    gradient: 'from-safe to-emerald-600',
    badges: ['📄 Printable', '⏱️ Instant'],
  },
];

const stats: {
  icon: typeof Building2;
  to: number;
  suffix: string;
  label: string;
  prefix: string;
  text?: string;
}[] = [
  { icon: Building2, to: 10000, suffix: '+', label: 'Hospitals', prefix: '' },
  { icon: Zap, to: 30, suffix: 's', label: 'Assessment', prefix: '<' },
  { icon: Ambulance, to: 24, suffix: '×7', label: 'Emergency', prefix: '' },
  { icon: Sparkles, to: 0, suffix: '', label: 'Powered', prefix: '', text: 'AI' },
];

const steps = [
  { label: 'Describe', desc: 'Tell RescueAI what happened — text or photo.' },
  { label: 'Assess', desc: 'AI classifies severity and recommends actions.' },
  { label: 'Act', desc: 'Find hospitals, follow first aid, generate a report.' },
];

// Floating emergency icons around the hero illustration.
const floaters = [
  { emoji: '🚑', className: 'left-[2%] top-[12%]', delay: 0 },
  { emoji: '❤️', className: 'right-[4%] top-[6%]', delay: 0.6 },
  { emoji: '🩺', className: 'right-[0%] top-1/2', delay: 0.9 },
  { emoji: '📍', className: 'left-[4%] bottom-[14%]', delay: 1.1 },
  { emoji: '🏥', className: 'right-[6%] bottom-[10%]', delay: 1.6 },
];

const HeroIllustration = () => (
  <div className="relative mx-auto aspect-square h-full w-full max-w-[560px]">
    {/* Soft animated background blobs */}
    <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-secondary/25 blur-3xl animate-blob" />
    <div className="absolute right-1/4 top-1/3 h-60 w-60 rounded-full bg-accent/25 blur-3xl animate-blob [animation-delay:3s]" />
    <div className="absolute bottom-1/4 left-1/3 h-56 w-56 rounded-full bg-safe/20 blur-3xl animate-blob [animation-delay:6s]" />

    {/* Central pulse card */}
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="glass-strong absolute left-1/2 top-1/2 flex h-60 w-60 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-3 sm:h-72 sm:w-72"
    >
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-danger to-accent text-white shadow-lg shadow-danger/30"
      >
        <HeartPulse className="h-10 w-10" />
      </motion.div>

      {/* Animated ECG line */}
      <svg viewBox="0 0 200 40" className="h-11 w-48 text-secondary" fill="none">
        <motion.path
          d="M0 20 H45 L55 6 L66 34 L78 20 H110 L120 8 L131 32 L143 20 H200"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        />
      </svg>
      <p className="text-sm font-bold uppercase tracking-widest text-primary">Live Triage</p>
    </motion.div>

    {/* Floating emergency icons */}
    {floaters.map((f) => (
      <motion.div
        key={f.emoji}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 + f.delay * 0.3 }}
        className={`absolute ${f.className}`}
      >
        <div
          className="glass-strong grid h-16 w-16 place-items-center rounded-2xl text-3xl animate-float"
          style={{ animationDelay: `${f.delay}s` }}
        >
          {f.emoji}
        </div>
      </motion.div>
    ))}
  </div>
);

export const Landing = () => {
  const navigate = useNavigate();
  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit">
      {/* Hero */}
      <section className="app-container flex min-h-[85vh] flex-col justify-center py-8 sm:py-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.span
              variants={slideUp}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-white/70 px-4 py-1.5 text-sm font-semibold text-secondary shadow-sm"
            >
              <Sparkles className="h-4 w-4" /> AI-Powered · Free · No Login Required
            </motion.span>

            <motion.h1
              variants={slideUp}
              className="hero-title font-extrabold text-primary"
            >
              Emergency? <span className="text-gradient">Start here.</span>
            </motion.h1>

            <motion.p variants={slideUp} className="mt-5 max-w-xl text-lg text-muted sm:text-xl">
              When seconds matter, RescueAI helps you assess the situation, take the right first
              steps, and reach help — fast.
            </motion.p>

            <motion.div
              variants={slideUp}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
            >
              <Button
                size="lg"
                variant="emergency"
                icon={<Activity className="h-5 w-5" />}
                onClick={() => navigate('/triage')}
              >
                🚨 Start Emergency Assessment
              </Button>
              <Button
                size="lg"
                variant="secondary"
                icon={<MapPin className="h-5 w-5" />}
                onClick={() => navigate('/hospitals')}
              >
                Find Nearby Hospitals
              </Button>
            </motion.div>

            <motion.div variants={slideUp} className="mt-6 flex flex-col gap-3">
              {/* Emergency numbers — always one tap away */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Emergency:
                </span>
                <a
                  href={`tel:${EMERGENCY_NUMBERS.ambulance}`}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-danger/20 bg-danger/5 px-3 py-1 text-sm font-bold text-danger transition hover:bg-danger/10"
                >
                  <Phone className="h-3.5 w-3.5" /> {EMERGENCY_NUMBERS.ambulance} · Ambulance
                </a>
                <a
                  href={`tel:${EMERGENCY_NUMBERS.unified}`}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white/70 px-3 py-1 text-sm font-bold text-primary transition hover:bg-white"
                >
                  <Phone className="h-3.5 w-3.5" /> {EMERGENCY_NUMBERS.unified}
                </a>
              </div>

              <span className="inline-flex items-center gap-2 text-xs text-muted">
                <ShieldCheck className="h-4 w-4 text-safe" />
                Your data stays on this device — sessions are anonymous.
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-[320px] w-full sm:h-[460px] lg:h-[540px]"
          >
            <HeroIllustration />
          </motion.div>
        </div>

        {/* Trust statistics — one row */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:grid-cols-4 sm:gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-strong flex flex-col items-center gap-1 px-3 py-5 text-center"
            >
              <s.icon className="h-6 w-6 text-secondary" />
              <span className="text-2xl font-extrabold text-primary sm:text-3xl lg:text-4xl">
                {s.text ? s.text : <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />}
              </span>
              <span className="text-xs font-medium text-muted sm:text-sm">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="app-container section-y">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl lg:text-[2.75rem]">
            Everything you need, in one calm place
          </h2>
          <p className="mt-3 text-muted sm:text-lg">
            Four fast tools that work together the moment an emergency starts.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <GlassCard
              key={f.title}
              hover
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group"
            >
              <div
                className={`mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${f.gradient} text-white shadow-md transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}
              >
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-primary">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.desc}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {f.badges.map((b) => (
                  <span
                    key={b}
                    className="rounded-full bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="app-container-md section-y">
        <h2 className="text-center text-2xl font-bold text-primary sm:text-3xl">How it works</h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted">
          Three calm steps between panic and help.
        </p>

        <GlassCard className="mt-8">
          <Stepper steps={steps} current={0} />
        </GlassCard>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 text-center"
            >
              <div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full bg-accent/10 font-extrabold text-accent">
                {i + 1}
              </div>
              <h3 className="text-sm font-bold text-primary">{s.label}</h3>
              <p className="mt-1 text-xs text-muted">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            variant="emergency"
            onClick={() => navigate('/triage')}
            icon={<ScanSearch className="h-5 w-5" />}
          >
            Start your assessment
          </Button>
          <Link
            to="/first-aid"
            className="focus-ring inline-flex items-center gap-1 rounded-full px-5 py-3 font-semibold text-primary transition hover:bg-primary/5"
          >
            Browse First Aid <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* About the developer */}
      <section className="app-container-md section-y">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
            <Sparkles className="h-3.5 w-3.5" /> About
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
            Meet the Developer
          </h2>
          <p className="mt-3 text-muted sm:text-lg">The mind and hands behind RescueAI.</p>
        </div>
        <DeveloperCard />
      </section>

      {/* Trust footer strip */}
      <section className="app-container pb-12">
        <div className="glass-strong flex flex-col items-center justify-center gap-2 px-6 py-5 text-center sm:flex-row sm:gap-6">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Clock className="h-4 w-4 text-accent" /> Available 24×7
          </span>
          <span className="hidden text-muted sm:inline">·</span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4 text-safe" /> Privacy-first &amp; anonymous
          </span>
          <span className="hidden text-muted sm:inline">·</span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4 text-secondary" /> Built for Idea2Impact 2026
          </span>
        </div>
      </section>
    </motion.div>
  );
};

export default Landing;
