import { runTriageEngine } from '../../src/services/triage/triageEngine';
import { classifySeverity } from '../../src/services/triage/severityClassifier';

describe('SeverityClassifier', () => {
  it('forces CRITICAL when a hard critical keyword is present', () => {
    const result = classifySeverity({
      severity: 'mild',
      confidence: 90,
      text: 'he is unconscious and not breathing',
    });
    expect(result.severity).toBe('critical');
    expect(result.escalated).toBe(true);
  });

  it('nudges an uncertain MILD reading only up to MODERATE (never straight to URGENT)', () => {
    // Low confidence adds mild caution but must NOT manufacture urgency on its
    // own — this is the fix that prevents "every symptom becomes URGENT". Real
    // escalation must come from critical keywords, intensifiers, or red-flag
    // follow-up answers, not from uncertainty alone.
    const result = classifySeverity({ severity: 'mild', confidence: 40, text: 'mild headache' });
    expect(result.severity).toBe('moderate');
    expect(result.escalated).toBe(true);
  });

  it('does not escalate an already MODERATE reading just because confidence is low', () => {
    const result = classifySeverity({ severity: 'moderate', confidence: 40, text: 'runny nose' });
    expect(result.severity).toBe('moderate');
  });

  it('does not de-escalate a critical assessment', () => {
    const result = classifySeverity({ severity: 'critical', confidence: 95, text: 'chest pain' });
    expect(result.severity).toBe('critical');
  });
});

describe('TriageEngine', () => {
  it('classifies chest pain as a critical cardiac emergency', () => {
    const a = runTriageEngine({ text: 'severe chest pain radiating to left arm and sweating' });
    expect(a.emergencyType).toBe('cardiac');
    expect(a.severity).toBe('critical');
    expect(a.ambulanceRequired).toBe(true);
    expect(a.actions.length).toBeGreaterThan(0);
    expect(a.firstAid.length).toBeGreaterThan(0);
  });

  it('detects a stroke presentation', () => {
    const a = runTriageEngine({ text: 'sudden face drooping and slurred speech on one side' });
    expect(a.emergencyType).toBe('neurological');
    expect(a.severity).toBe('critical');
  });

  it('handles a mild/general complaint without over-escalating to critical', () => {
    const a = runTriageEngine({ text: 'mild sore throat and slight cough for two days' });
    expect(['mild', 'moderate', 'urgent']).toContain(a.severity);
    expect(a.severity).not.toBe('critical');
  });

  it('always returns a disclaimer and a source', () => {
    const a = runTriageEngine({ text: 'headache' });
    expect(a.disclaimer).toMatch(/emergency/i);
    expect(a.source).toBe('fallback');
  });
});
