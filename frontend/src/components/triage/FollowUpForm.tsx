import { FollowUpAnswer, FollowUpQuestion } from '../../types';

interface FollowUpFormProps {
  questions: FollowUpQuestion[];
  answers: FollowUpAnswer[];
  onChange: (answers: FollowUpAnswer[]) => void;
}

export const FollowUpForm = ({ questions, answers, onChange }: FollowUpFormProps) => {
  const valueOf = (id: string) => answers.find((a) => a.id === id)?.value;

  const setAnswer = (id: string, value: FollowUpAnswer['value']) => {
    const next = answers.filter((a) => a.id !== id);
    next.push({ id, value });
    onChange(next);
  };

  const toggleMulti = (id: string, option: string) => {
    const current = (valueOf(id) as string[] | undefined) ?? [];
    const next = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    setAnswer(id, next);
  };

  return (
    <div className="space-y-3">
      {questions.map((q, idx) => {
        const value = valueOf(q.id);
        return (
          <div
            key={q.id}
            className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"
          >
            <div className="mb-3 flex items-start gap-2">
              <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-secondary/10 text-sm">
                {q.emoji ?? idx + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-primary">{q.question}</p>
                {q.helpText && <p className="mt-0.5 text-xs text-muted">{q.helpText}</p>}
              </div>
            </div>

            {/* Boolean */}
            {q.kind === 'boolean' && (
              <div className="flex gap-2">
                {(q.options ?? []).map((o) => {
                  const active = value === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setAnswer(q.id, o.value)}
                      className={`focus-ring flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                        active
                          ? o.value === 'yes'
                            ? 'border-danger bg-danger/10 text-danger'
                            : 'border-safe bg-safe/10 text-safe'
                          : 'border-slate-200 bg-white text-muted hover:border-secondary/40'
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Single choice */}
            {q.kind === 'single' && (
              <div className="flex flex-wrap gap-2">
                {(q.options ?? []).map((o) => {
                  const active = value === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setAnswer(q.id, o.value)}
                      className={`focus-ring rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        active
                          ? 'border-secondary bg-secondary text-white shadow-sm'
                          : 'border-slate-200 bg-white text-ink hover:border-secondary/40'
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Multi choice */}
            {q.kind === 'multi' && (
              <div className="flex flex-wrap gap-2">
                {(q.options ?? []).map((o) => {
                  const active = ((value as string[] | undefined) ?? []).includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggleMulti(q.id, o.value)}
                      className={`focus-ring rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        active
                          ? 'border-secondary bg-secondary text-white shadow-sm'
                          : 'border-slate-200 bg-white text-ink hover:border-secondary/40'
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Scale (0–10) */}
            {q.kind === 'scale' && (
              <div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={q.min ?? 0}
                    max={q.max ?? 10}
                    value={typeof value === 'number' ? value : q.min ?? 0}
                    onChange={(e) => setAnswer(q.id, Number(e.target.value))}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-safe via-caution to-danger accent-secondary"
                  />
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-extrabold text-white">
                    {typeof value === 'number' ? value : '–'}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-[10px] font-medium text-muted">
                  <span>None</span>
                  <span>Worst</span>
                </div>
              </div>
            )}

            {/* Number */}
            {q.kind === 'number' && (
              <input
                type="number"
                min={q.min}
                max={q.max}
                value={typeof value === 'number' ? value : ''}
                onChange={(e) =>
                  setAnswer(q.id, e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="Enter a number"
                className="input max-w-[160px]"
              />
            )}

            {/* Free text */}
            {q.kind === 'text' && (
              <input
                type="text"
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Type your answer"
                className="input"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FollowUpForm;
