import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  EmergencyReport,
  FollowUpAnswer,
  FollowUpQuestion,
  GeoLocation,
  Hospital,
  ImageAnalysis,
  ImageCategory,
  LocationDetails,
  TriageResult,
} from '../types';

interface TriageState {
  // Inputs
  symptomText: string;
  imagePreview: string | null; // data URL (not persisted)
  imageCategory: ImageCategory | null;

  // Adaptive flow
  category: string | null;
  categoryLabel: string | null;
  questions: FollowUpQuestion[];
  answers: FollowUpAnswer[];
  imageAnalysis: ImageAnalysis | null;

  // Location
  location: GeoLocation | null;
  locationDetails: LocationDetails | null;

  // Outputs
  result: TriageResult | null;
  selectedHospital: Hospital | null;
  savedHospitals: Hospital[];
  report: EmergencyReport | null;

  // Actions
  setSymptomText: (text: string) => void;
  setImagePreview: (image: string | null) => void;
  setImageCategory: (c: ImageCategory | null) => void;
  setCategory: (category: string | null, label?: string | null) => void;
  setQuestions: (questions: FollowUpQuestion[]) => void;
  setAnswers: (answers: FollowUpAnswer[]) => void;
  setImageAnalysis: (a: ImageAnalysis | null) => void;
  setLocation: (loc: GeoLocation | null) => void;
  setLocationDetails: (d: LocationDetails | null) => void;
  setResult: (result: TriageResult | null) => void;
  setSelectedHospital: (hospital: Hospital | null) => void;
  toggleSavedHospital: (hospital: Hospital) => void;
  setReport: (report: EmergencyReport | null) => void;
  resetTriage: () => void;
}

export const useTriageStore = create<TriageState>()(
  persist(
    (set, get) => ({
      symptomText: '',
      imagePreview: null,
      imageCategory: null,
      category: null,
      categoryLabel: null,
      questions: [],
      answers: [],
      imageAnalysis: null,
      location: null,
      locationDetails: null,
      result: null,
      selectedHospital: null,
      savedHospitals: [],
      report: null,

      setSymptomText: (symptomText) => set({ symptomText }),
      setImagePreview: (imagePreview) => set({ imagePreview }),
      setImageCategory: (imageCategory) => set({ imageCategory }),
      setCategory: (category, categoryLabel) =>
        set({ category, categoryLabel: categoryLabel ?? null }),
      setQuestions: (questions) => set({ questions }),
      setAnswers: (answers) => set({ answers }),
      setImageAnalysis: (imageAnalysis) => set({ imageAnalysis }),
      setLocation: (location) => set({ location }),
      setLocationDetails: (locationDetails) => set({ locationDetails }),
      setResult: (result) => set({ result }),
      setSelectedHospital: (selectedHospital) => set({ selectedHospital }),
      toggleSavedHospital: (hospital) => {
        const saved = get().savedHospitals;
        const exists = saved.some((h) => h.id === hospital.id);
        set({
          savedHospitals: exists
            ? saved.filter((h) => h.id !== hospital.id)
            : [...saved, hospital],
        });
      },
      setReport: (report) => set({ report }),
      resetTriage: () =>
        set({
          symptomText: '',
          imagePreview: null,
          imageCategory: null,
          category: null,
          categoryLabel: null,
          questions: [],
          answers: [],
          imageAnalysis: null,
          result: null,
          selectedHospital: null,
          report: null,
        }),
    }),
    {
      name: 'rescueai-triage',
      // Don't persist bulky image data or in-flight preview.
      partialize: (state) => ({
        location: state.location,
        locationDetails: state.locationDetails,
        result: state.result,
        selectedHospital: state.selectedHospital,
        savedHospitals: state.savedHospitals,
        report: state.report,
        symptomText: state.symptomText,
      }),
    }
  )
);

export default useTriageStore;
