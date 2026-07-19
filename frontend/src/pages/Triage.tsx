import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Bot,
  Camera,
  Mic,
  Sparkles,
  Keyboard,
  Volume2,
  ArrowRight,
  ArrowLeft,
  ImageOff,
  Stethoscope,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { AnalyzingLoader } from '../components/common/Loading';
import { Stepper } from '../components/common/Stepper';
import { ImageUploader } from '../components/image/ImageUploader';
import { ImageFindingsCard } from '../components/image/ImageFindingsCard';
import { FollowUpForm } from '../components/triage/FollowUpForm';
import { useTriageStore } from '../store/triageStore';
import { useGeolocation } from '../hooks/useGeolocation';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { triageService } from '../services/api/triageService';
import { reverseGeocode } from '../services/maps';
import { toApiError } from '../services/api/client';
import { pageTransition } from '../utils/motion';
import { ImageQuality } from '../types';

const STEPS = [{ label: 'Describe' }, { label: 'Questions' }, { label: 'Assessment' }];

const QUICK_REPLIES = [
  'Severe chest pain radiating to left arm, sweating',
  'Sudden face drooping and slurred speech',
  'High fever with severe headache',
  'Difficulty breathing and wheezing',
  'Fell down and hit my head',
  'Bad stomach pain and vomiting',
];

type Step = 'describe' | 'questions';

export const Triage = () => {
  const navigate = useNavigate();
  const {
    symptomText,
    setSymptomText,
    imagePreview,
    setImagePreview,
    imageCategory,
    setImageCategory,
    category,
    categoryLabel,
    setCategory,
    questions,
    setQuestions,
    answers,
    setAnswers,
    imageAnalysis,
    setImageAnalysis,
    setResult,
    location,
    setLocation,
    setLocationDetails,
  } = useTriageStore();
  const { requestLocation } = useGeolocation();

  const [step, setStep] = useState<Step>('describe');
  const [showImage, setShowImage] = useState<boolean>(Boolean(imagePreview));
  const [quality, setQuality] = useState<ImageQuality | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);

  const { supported: voiceSupported, listening, interim, toggle } = useSpeechRecognition((chunk) =>
    setSymptomText([symptomText, chunk].filter(Boolean).join(' ').trim())
  );

  // Best-effort background location capture for the hospital step.
  useEffect(() => {
    if (location) return;
    requestLocation()
      .then(async (loc) => {
        setLocation(loc);
        try {
          const d = await reverseGeocode(loc.lat, loc.lng);
          setLocationDetails({ ...d, accuracyMeters: loc.accuracyMeters });
        } catch {
          /* optional */
        }
      })
      .catch(() => undefined);
  }, [location, requestLocation, setLocation, setLocationDetails]);

  const canContinue = symptomText.trim().length > 3 || Boolean(imagePreview);

  const fetchQuestions = async (force = false) => {
    if (!canContinue) return;
    // If the client flagged poor quality and user hasn't forced, ask to retake.
    if (imagePreview && quality && !quality.acceptable && !force) {
      setQualityWarning(quality.message || 'The photo looks unclear. Retake for a better assessment.');
      return;
    }
    setError(null);
    setQualityWarning(null);
    setLoadingQuestions(true);
    try {
      const data = await triageService.getQuestions({
        text: symptomText.trim(),
        image: imagePreview ?? undefined,
        imageCategory: imageCategory ?? undefined,
      });
      setCategory(data.category, data.categoryLabel);
      setQuestions(data.questions);
      setImageAnalysis(data.imageAnalysis ?? null);
      setAnswers([]);

      // Server-side quality gate.
      if (data.imageAnalysis && !data.imageAnalysis.quality.acceptable && !force) {
        setQualityWarning(
          data.imageAnalysis.quality.message ||
            'The AI could not read the photo clearly. Please retake it.'
        );
        setLoadingQuestions(false);
        return;
      }
      setStep('questions');
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const runAnalysis = async () => {
    setError(null);
    setAnalyzing(true);
    try {
      const result = await triageService.analyze({
        text: symptomText.trim(),
        category: category ?? undefined,
        imageCategory: imageCategory ?? undefined,
        answers,
        imageAnalysis: imageAnalysis ?? undefined,
        location: location ?? undefined,
      });
      setResult(result);
      navigate('/results');
    } catch (err) {
      setError(toApiError(err).message);
      setAnalyzing(false);
    }
  };

  if (analyzing) {
    return (
      <div className="app-container-tight py-10">
        <div className="glass">
          <AnalyzingLoader />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="app-container-tight section-y"
    >
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-secondary">
          Step {step === 'describe' ? '1' : '2'} of 3
        </p>
        <h1 className="text-2xl font-extrabold text-primary sm:text-3xl">
          {step === 'describe' ? 'Describe the situation' : 'A few quick questions'}
        </h1>
        <div className="mt-4">
          <Stepper steps={STEPS} current={step === 'describe' ? 0 : 1} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'describe' ? (
          <motion.div
            key="describe"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="glass overflow-hidden"
          >
            {/* Assistant header */}
            <div className="flex items-center gap-3 border-b border-white/50 bg-white/40 px-5 py-3">
              <span className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-secondary to-primary text-white shadow-md">
                <Bot className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-safe" />
              </span>
              <div>
                <p className="text-sm font-bold text-primary">RescueAI · Virtual Nurse</p>
                <p className="flex items-center gap-1 text-[11px] font-medium text-safe">
                  <span className="h-1.5 w-1.5 rounded-full bg-safe" /> Type, speak, or share a photo
                </p>
              </div>
            </div>

            <div className="space-y-5 p-5">
              {/* Text + voice */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">
                  What's happening?
                </label>
                <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 focus-within:border-secondary">
                  <textarea
                    value={symptomText}
                    onChange={(e) => setSymptomText(e.target.value)}
                    rows={2}
                    placeholder="Describe symptoms… e.g. chest pain, trouble breathing, a rash"
                    className="max-h-40 min-h-[52px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink outline-none placeholder:text-muted/60"
                  />
                  {voiceSupported && (
                    <button
                      type="button"
                      onClick={toggle}
                      title={listening ? 'Stop' : 'Speak'}
                      className={`focus-ring grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl transition ${
                        listening
                          ? 'animate-pulse-ring bg-danger text-white'
                          : 'text-muted hover:bg-secondary/10 hover:text-secondary'
                      }`}
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                  )}
                </div>
                {listening && (
                  <p className="mt-1.5 flex items-center justify-end gap-1 text-xs font-semibold text-danger">
                    <Volume2 className="h-3.5 w-3.5 animate-pulse" /> Listening…
                    {interim && <span className="italic text-muted"> {interim}</span>}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {QUICK_REPLIES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setSymptomText(ex)}
                      className="focus-ring rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-muted transition hover:border-secondary hover:text-secondary"
                    >
                      {ex.length > 30 ? `${ex.slice(0, 30)}…` : ex}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-4 text-[11px] font-medium text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Keyboard className="h-3.5 w-3.5" /> Type
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Mic className="h-3.5 w-3.5" /> Voice
                  </span>
                </div>
              </div>

              {/* Image toggle */}
              <div className="border-t border-white/60 pt-4">
                {!showImage ? (
                  <button
                    type="button"
                    onClick={() => setShowImage(true)}
                    className="focus-ring flex w-full items-center justify-between rounded-2xl border border-dashed border-secondary/40 bg-secondary/5 px-4 py-3 text-left transition hover:border-secondary"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Camera className="h-5 w-5 text-secondary" /> Add a photo of a visible condition
                    </span>
                    <span className="text-xs font-medium text-secondary">Optional</span>
                  </button>
                ) : (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-sm font-bold text-primary">
                        <Camera className="h-4 w-4 text-secondary" /> Medical image analysis
                      </p>
                      <button
                        onClick={() => {
                          setShowImage(false);
                          setImagePreview(null);
                          setQuality(null);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-danger"
                      >
                        <ImageOff className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                    <ImageUploader
                      image={imagePreview}
                      onImage={setImagePreview}
                      category={imageCategory}
                      onCategory={setImageCategory}
                      quality={quality}
                      onQuality={setQuality}
                    />
                  </div>
                )}
              </div>

              {qualityWarning && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-4 w-4" /> Photo quality is low
                  </p>
                  <p className="mt-1 text-xs">{qualityWarning}</p>
                  <button
                    onClick={() => fetchQuestions(true)}
                    className="mt-2 rounded-full border border-amber-400 px-3 py-1 text-xs font-bold text-amber-800"
                  >
                    Continue anyway
                  </button>
                </div>
              )}

              {error && (
                <p className="rounded-xl bg-danger/10 p-3 text-sm font-medium text-danger">{error}</p>
              )}

              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-[11px] text-amber-900">
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                RescueAI assists your decision — for life-threatening emergencies call 108/112 now.
              </div>

              <Button
                fullWidth
                size="lg"
                variant="emergency"
                disabled={!canContinue}
                loading={loadingQuestions}
                icon={<ArrowRight className="h-5 w-5" />}
                onClick={() => fetchQuestions(false)}
              >
                {imagePreview ? 'Analyze image & continue' : 'Continue'}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="questions"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            className="space-y-4"
          >
            {/* Category chip */}
            <div className="glass flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-secondary to-primary text-xl text-white">
                <Stethoscope className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Assessing</p>
                <p className="text-lg font-extrabold text-primary">{categoryLabel ?? 'Your symptoms'}</p>
              </div>
            </div>

            {imageAnalysis && <ImageFindingsCard analysis={imageAnalysis} />}

            <div className="glass p-5">
              <p className="mb-3 text-sm text-muted">
                Answer these so the AI can combine them with{' '}
                {imageAnalysis ? 'the image, ' : ''}your symptoms and history for an accurate risk score.
              </p>
              <FollowUpForm questions={questions} answers={answers} onChange={setAnswers} />
            </div>

            {error && (
              <p className="rounded-xl bg-danger/10 p-3 text-sm font-medium text-danger">{error}</p>
            )}

            <div className="flex gap-3">
              <Button
                variant="ghost"
                icon={<ArrowLeft className="h-5 w-5" />}
                onClick={() => setStep('describe')}
              >
                Back
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="emergency"
                loading={analyzing}
                icon={<Sparkles className="h-5 w-5" />}
                onClick={runAnalysis}
              >
                Get AI assessment
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Triage;
