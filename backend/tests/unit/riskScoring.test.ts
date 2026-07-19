import { computeRiskScore, riskLevelFromScore } from '../../src/services/triage/riskScoring';
import { detectCategory, getQuestionsForCategory } from '../../src/services/triage/followUpQuestions';

describe('riskLevelFromScore', () => {
  it('maps scores to the correct 4-level bands', () => {
    expect(riskLevelFromScore(10)).toBe('low');
    expect(riskLevelFromScore(24)).toBe('low');
    expect(riskLevelFromScore(25)).toBe('moderate');
    expect(riskLevelFromScore(49)).toBe('moderate');
    expect(riskLevelFromScore(50)).toBe('urgent');
    expect(riskLevelFromScore(74)).toBe('urgent');
    expect(riskLevelFromScore(75)).toBe('emergency');
    expect(riskLevelFromScore(100)).toBe('emergency');
  });
});

describe('detectCategory', () => {
  it('detects the right symptom bucket from free text', () => {
    expect(detectCategory('crushing chest pain and sweating')).toBe('chest_pain');
    expect(detectCategory('the worst headache of my life')).toBe('headache');
    expect(detectCategory('bad stomach pain and vomiting')).toBe('stomach_pain');
    expect(detectCategory('I fell down the stairs')).toBe('fall');
    expect(detectCategory('trouble breathing and wheezing')).toBe('breathing');
    expect(detectCategory('something unusual')).toBe('general');
  });

  it('returns a non-empty question set for every detected category', () => {
    for (const text of ['chest pain', 'headache', 'fever', 'fall', 'burn on my hand']) {
      const q = getQuestionsForCategory(detectCategory(text));
      expect(q.length).toBeGreaterThan(0);
    }
  });
});

describe('computeRiskScore', () => {
  it('escalates to EMERGENCY when a red-flag answer is chosen', () => {
    const res = computeRiskScore({
      category: 'fall',
      answers: [{ id: 'unconscious', value: 'yes' }],
    });
    expect(res.redFlagTriggered).toBe(true);
    expect(res.level).toBe('emergency');
    expect(res.score).toBeGreaterThanOrEqual(75);
  });

  it('scores pain severity into the expected buckets', () => {
    const mild = computeRiskScore({ category: 'general', answers: [{ id: 'pain_score', value: 2 }] });
    const severe = computeRiskScore({ category: 'general', answers: [{ id: 'pain_score', value: 9 }] });
    expect(severe.score).toBeGreaterThan(mild.score);
  });

  it('never de-escalates below the AI baseline severity', () => {
    const res = computeRiskScore({ category: 'general', baseSeverity: 'critical' });
    expect(res.level).toBe('emergency');
  });

  it('keeps a minor single-answer complaint at LOW', () => {
    const res = computeRiskScore({
      category: 'general',
      answers: [{ id: 'pain_score', value: 1 }],
    });
    expect(res.level).toBe('low');
  });

  it('lets benign answers refine a cautious URGENT baseline down to LOW', () => {
    // Regression guard for the "everything is URGENT" bug: once follow-up
    // questions are answered, the dynamic answer score is the arbiter, so a
    // non-critical base reading must not lock the result at URGENT.
    const res = computeRiskScore({
      category: 'headache',
      baseSeverity: 'urgent',
      answers: [
        { id: 'pain_score', value: 2 },
        { id: 'onset', value: 'gradual' },
        { id: 'worst_ever', value: 'no' },
        { id: 'weakness', value: 'no' },
        { id: 'speech_problems', value: 'no' },
      ],
    });
    expect(res.level).toBe('low');
    expect(res.redFlagTriggered).toBe(false);
  });

  it('still floors a CRITICAL baseline at EMERGENCY even with benign answers', () => {
    const res = computeRiskScore({
      category: 'headache',
      baseSeverity: 'critical',
      answers: [{ id: 'pain_score', value: 1 }],
    });
    expect(res.level).toBe('emergency');
  });

  it('adds points from objective image findings', () => {
    const withBleeding = computeRiskScore({
      category: 'cut',
      imageFindings: {
        redness: true,
        swelling: false,
        skinColor: 'red',
        blisters: false,
        openWound: true,
        bleeding: true,
        rashDistribution: '',
        size: '',
        shape: '',
        burnSeverity: 'none',
        infectionSigns: false,
        notes: [],
      },
    });
    expect(withBleeding.score).toBeGreaterThan(0);
    expect(withBleeding.contributions.some((c) => /bleeding/i.test(c.label))).toBe(true);
  });
});
