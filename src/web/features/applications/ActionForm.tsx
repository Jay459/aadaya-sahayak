import { useRef, useState } from 'react';
import type {
  ApplicationDetail,
  FieldReport,
  Officer,
  TransitionCommand,
  WorkflowAction,
} from '../../../shared/contracts.ts';
import { actionLabels } from '../../i18n/te.ts';
import { api, ApiError, errorMessage } from '../../lib/api.ts';
import { AiPanel } from './AiPanel.tsx';

export function ActionForm({
  detail,
  officer,
  onChanged,
}: {
  detail: ApplicationDetail;
  officer: Officer;
  onChanged: () => void;
}) {
  const application = detail.application;
  const [report, setReport] = useState<FieldReport>(
    application.fieldReport ?? {
      annualIncome: application.declaredIncome,
      familyMembers: 1,
      occupation: '',
      notes: '',
    },
  );
  const [reason, setReason] = useState('');
  const [recommendation, setRecommendation] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewed, setReviewed] = useState(false);
  const [action, setAction] = useState<WorkflowAction>(detail.allowedActions[0] ?? 'APPROVE');
  const [confirmation, setConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const intent = useRef<{ body: string; key: string } | null>(null);
  const feature = { GPO: 'report', RI: 'discrepancies', TAHSILDAR: 'brief' } as const;

  function createCommand(): TransitionCommand {
    const command: TransitionCommand = { action, expectedVersion: application.version };
    if (action === 'SUBMIT_REPORT') command.report = report;
    if (action === 'RECOMMEND') command.recommendation = { action: recommendation, note: reason };
    if (['APPROVE', 'REJECT', 'RETURN'].includes(action)) command.reason = reason;
    if (['APPROVE', 'REJECT'].includes(action)) command.reviewedEvidence = reviewed;
    return command;
  }

  async function submit() {
    if (busy) return;
    const body = JSON.stringify(createCommand());
    const currentIntent =
      intent.current?.body === body ? intent.current : { body, key: crypto.randomUUID() };
    intent.current = currentIntent;
    const key = currentIntent.key;
    setBusy(true);
    setError('');
    try {
      await api('/applications/' + application.id + '/transitions', {
        method: 'POST',
        body,
        headers: { 'Idempotency-Key': key },
      });
      intent.current = null;
      onChanged();
    } catch (failure) {
      setError(errorMessage(failure));
      if (failure instanceof ApiError && failure.code === 'VERSION_CONFLICT')
        setConfirmation(false);
    } finally {
      setBusy(false);
    }
  }

  if (!detail.allowedActions.length)
    return (
      <aside className="card">
        <h2>చర్య అవసరం లేదు</h2>
        <p>ఈ దశలో మీ పాత్రకు చర్యలు లేవు. ఆధారాలు, చరిత్ర చూడవచ్చు.</p>
      </aside>
    );
  return (
    <aside className="card action-panel">
      <h2>తదుపరి చర్య</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setConfirmation(true);
        }}
      >
        <label>
          చర్య
          <select
            value={action}
            onChange={(event) => {
              setAction(event.target.value as WorkflowAction);
              setConfirmation(false);
            }}
          >
            {detail.allowedActions.map((item) => (
              <option key={item} value={item}>
                {actionLabels[item]}
              </option>
            ))}
          </select>
        </label>
        {action === 'SUBMIT_REPORT' && (
          <>
            <label>
              వార్షిక ఆదాయం (₹)
              <input
                type="number"
                required
                min={0}
                max={100000000}
                step={1}
                value={report.annualIncome}
                onChange={(event) =>
                  setReport({ ...report, annualIncome: Number(event.target.value) })
                }
              />
            </label>
            <label>
              కుటుంబ సభ్యులు
              <input
                type="number"
                required
                min={1}
                max={30}
                step={1}
                value={report.familyMembers}
                onChange={(event) =>
                  setReport({ ...report, familyMembers: Number(event.target.value) })
                }
              />
            </label>
            <label>
              వృత్తి
              <input
                required
                minLength={2}
                maxLength={100}
                value={report.occupation}
                onChange={(event) => setReport({ ...report, occupation: event.target.value })}
              />
            </label>
            <label>
              క్షేత్ర విచారణ గమనికలు
              <textarea
                required
                minLength={5}
                maxLength={2000}
                rows={4}
                value={report.notes}
                onChange={(event) => setReport({ ...report, notes: event.target.value })}
              />
            </label>
          </>
        )}
        {action === 'RECOMMEND' && (
          <label>
            మీ సిఫార్సు
            <select
              value={recommendation}
              onChange={(event) => setRecommendation(event.target.value as 'APPROVE' | 'REJECT')}
            >
              <option value="APPROVE">ఆమోదానికి సిఫార్సు</option>
              <option value="REJECT">తిరస్కరణకు సిఫార్సు</option>
            </select>
          </label>
        )}
        {action !== 'SUBMIT_REPORT' && (
          <label>
            కారణం / పరిశీలన గమనిక
            <textarea
              required
              minLength={5}
              maxLength={1000}
              rows={4}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setConfirmation(false);
              }}
            />
          </label>
        )}
        {['APPROVE', 'REJECT'].includes(action) && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              required
              checked={reviewed}
              onChange={(event) => setReviewed(event.target.checked)}
            />
            నేను ఆధారాలను పరిశీలించాను. తుది నిర్ణయం నాదే.
          </label>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button
          className={'button ' + (action === 'REJECT' ? 'danger' : 'primary')}
          disabled={busy}
        >
          {actionLabels[action]} →
        </button>
      </form>
      {confirmation && (
        <section className="confirmation" role="alert">
          <strong>{actionLabels[action]} — నిర్ధారిస్తున్నారా?</strong>
          <p>ఈ చర్య చరిత్రలో శాశ్వతంగా నమోదవుతుంది.</p>
          <div className="button-row">
            <button
              className="button primary"
              disabled={busy}
              onClick={() => {
                void submit();
              }}
            >
              {busy ? 'సేవ్ అవుతోంది…' : 'నిర్ధారించు'}
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setConfirmation(false)}
            >
              రద్దు
            </button>
          </div>
        </section>
      )}
      <AiPanel
        applicationId={application.id}
        feature={feature[officer.role]}
        notes={report.notes}
        onApply={(draft) => {
          setReport(draft);
          setConfirmation(false);
        }}
      />
    </aside>
  );
}
