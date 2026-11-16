import { useState } from 'react';
import type { AiFeature, AiSuggestion, FieldReport } from '../../../shared/contracts.ts';
import { api, errorMessage } from '../../lib/api.ts';

export function AiPanel({
  applicationId,
  feature,
  notes,
  onApply,
}: {
  applicationId: string;
  feature: AiFeature;
  notes: string;
  onApply: (report: FieldReport) => void;
}) {
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function requestSuggestion() {
    setBusy(true);
    setError('');
    try {
      setSuggestion(
        await api<AiSuggestion>('/applications/' + applicationId + '/ai', {
          method: 'POST',
          body: JSON.stringify({ feature, notes }),
        }),
      );
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ai-panel">
      <div className="section-title">
        <h3>✦ AI సహాయం</h3>
        <span className="badge">అధికారి సమీక్ష అవసరం</span>
      </div>
      <p>నివేదిక ముసాయిదా, ఆధారాల పోలిక లేదా సంక్షిప్త సమీక్ష కోసం.</p>
      <button
        className="button secondary"
        type="button"
        disabled={busy}
        onClick={() => {
          void requestSuggestion();
        }}
      >
        {busy ? 'సూచన సిద్ధమవుతోంది…' : 'సహాయం పొందండి'}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {suggestion && (
        <div aria-live="polite" className="ai-result">
          <span className="badge">
            {suggestion.provider === 'mock' ? 'నమూనా సమాధానం · ప్రత్యక్ష AI కాదు' : 'Gemini AI సూచన'}
          </span>
          <p>{suggestion.summary}</p>
          <ul>
            {suggestion.findings.map((finding, index) => (
              <li key={index}>
                {finding.note}
                <small className="evidence">{finding.evidence}</small>
              </li>
            ))}
          </ul>
          {suggestion.report && (
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                if (suggestion.report) onApply(suggestion.report);
              }}
            >
              ముసాయిదాను ఫారంలో చేర్చు
            </button>
          )}
          <small>{suggestion.disclaimer}</small>
        </div>
      )}
    </section>
  );
}
