import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Phone } from 'lucide-react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { EmergencyBanner } from './components/layout/EmergencyBanner';
import { BrandedLoader } from './components/common/Loading';

// Code-split each route for faster first paint.
const Landing = lazy(() => import('./pages/Landing'));
const Triage = lazy(() => import('./pages/Triage'));
const Results = lazy(() => import('./pages/Results'));
const Hospitals = lazy(() => import('./pages/Hospitals'));
const FirstAid = lazy(() => import('./pages/FirstAid'));
const Report = lazy(() => import('./pages/Report'));

export const App = () => {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <div className="no-print">
        <Navbar />
        <EmergencyBanner />
      </div>

      <main className="flex-1">
        <Suspense fallback={<BrandedLoader />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Landing />} />
              <Route path="/triage" element={<Triage />} />
              <Route path="/results" element={<Results />} />
              <Route path="/hospitals" element={<Hospitals />} />
              <Route path="/first-aid" element={<FirstAid />} />
              <Route path="/report" element={<Report />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>

      <div className="no-print">
        <Footer />
      </div>

      {/* Mobile floating emergency call button — always one tap from help */}
      <a
        href="tel:108"
        aria-label="Call emergency ambulance 108"
        className="no-print fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-danger to-accent text-white shadow-glass-lg shadow-danger/40 animate-pulse-ring sm:hidden"
      >
        <Phone className="h-6 w-6" />
      </a>
    </div>
  );
};

export default App;
