import type { ApplicationDetail, Officer } from '../../../shared/contracts.ts';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { actionLabels, displayTime, money } from '../../i18n/te.ts';
import { ActionForm } from './ActionForm.tsx';

export function ApplicationPage({
  detail,
  officer,
  onBack,
  onChanged,
}: {
  detail: ApplicationDetail;
  officer: Officer;
  onBack: () => void;
  onChanged: () => void;
}) {
  const item = detail.application;
  return (
    <main id="main" className="workspace">
      <button className="back-link" onClick={onBack}>
        ← దరఖాస్తుల జాబితా
      </button>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            {item.reference} · {item.villageName}
          </span>
          <h1>{item.applicantName}</h1>
          <p className="muted">{item.purpose}</p>
        </div>
        <StatusBadge state={item.state} />
      </section>
      <div className="detail-layout">
        <div className="detail-content">
          <section className="card">
            <div className="section-title">
              <h2>దరఖాస్తు వివరాలు</h2>
              <span className="badge">వెర్షన్ {item.version}</span>
            </div>
            <dl className="facts">
              <div>
                <dt>దరఖాస్తు తేదీ</dt>
                <dd>{displayTime(item.submittedAt)}</dd>
              </div>
              <div>
                <dt>నమూనా గడువు</dt>
                <dd>{displayTime(item.dueAt)}</dd>
              </div>
              <div>
                <dt>వృత్తి</dt>
                <dd>{item.fieldReport?.occupation ?? 'నివేదిక పెండింగ్'}</dd>
              </div>
              <div>
                <dt>కుటుంబ సభ్యులు</dt>
                <dd>{item.fieldReport?.familyMembers ?? 'నిర్ధారించాలి'}</dd>
              </div>
            </dl>
          </section>
          <section className="card">
            <h2>ఆధారాల పోలిక</h2>
            <p className="muted">ఆదాయ మొత్తాలను పరిశీలించి తేడాలను నిర్ధారించండి.</p>
            <div className="comparison">
              <article>
                <span>దరఖాస్తులో ప్రకటించినది</span>
                <strong>{money(item.declaredIncome)}</strong>
              </article>
              <article>
                <span>నమూనా పత్రంలోని ఆదాయం</span>
                <strong>{money(item.documentIncome)}</strong>
                <small>ప్రత్యక్ష OCR లేదా ప్రభుత్వ రికార్డు కాదు</small>
              </article>
              <article>
                <span>క్షేత్ర నివేదిక ఆదాయం</span>
                <strong>{item.fieldReport ? money(item.fieldReport.annualIncome) : 'పెండింగ్'}</strong>
              </article>
            </div>
            {item.fieldReport && <p className="note">{item.fieldReport.notes}</p>}
            {item.recommendation && (
              <div className="note">
                <strong>ఆర్ఐ సిఫార్సు: {actionLabels[item.recommendation.action]}</strong>
                <p>{item.recommendation.note}</p>
              </div>
            )}
          </section>
          <section className="card">
            <div className="section-title">
              <h2>దరఖాస్తు చరిత్ర</h2>
              <span className={'badge ' + (detail.auditIntact ? 'intact' : 'broken')}>
                {detail.auditIntact ? '✓ హ్యాష్ చైన్ సరి' : 'హెచ్చరిక: చరిత్రలో తేడా'}
              </span>
            </div>
            <ol className="timeline">
              {detail.events.map((event) => (
                <li key={event.id}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>
                      {event.action in actionLabels
                        ? actionLabels[event.action as keyof typeof actionLabels]
                        : 'నమూనా దిగుమతి'}
                    </strong>
                    <p>{event.reason}</p>
                    <small>
                      {event.actorName} · {displayTime(event.createdAt)}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <ActionForm
          key={item.id + '-' + item.version}
          detail={detail}
          officer={officer}
          onChanged={onChanged}
        />
      </div>
    </main>
  );
}
