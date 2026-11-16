import { useState } from 'react';
import type { CertificateApplication, Officer } from '../../../shared/contracts.ts';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { money, roleLabels } from '../../i18n/te.ts';

const roleStates = { GPO: 'PENDING_GPO', RI: 'PENDING_RI', TAHSILDAR: 'PENDING_TAHSILDAR' };
function deadlineLabel(dueAt: string): string {
  const days = Math.ceil((Date.parse(dueAt) - Date.now()) / 86400000);
  if (Date.parse(dueAt) < Date.now()) return 'గడువు దాటింది';
  if (days <= 1) return 'గడువు సమీపంలో';
  return days + ' రోజులు మిగిలాయి';
}

export function Dashboard({
  officer,
  applications,
  onOpen,
}: {
  officer: Officer;
  applications: CertificateApplication[];
  onOpen: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const pending = applications.filter((item) => item.state === roleStates[officer.role]);
  const visible = (showAll ? applications : pending).filter((item) =>
    (item.applicantName + item.reference + item.villageName)
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  return (
    <main id="main" className="workspace">
      <section className="page-heading">
        <div>
          <span className="eyebrow">{roleLabels[officer.role]} · నమూనా మండలం</span>
          <h1>మీ పని, స్పష్టంగా.</h1>
          <p className="muted">ముందుగా శ్రద్ధ అవసరమైన దరఖాస్తులు ఇక్కడ ఉన్నాయి.</p>
        </div>
        <span className="date-label">
          {new Intl.DateTimeFormat('te-IN', { dateStyle: 'long', timeZone: 'Asia/Kolkata' }).format(
            new Date(),
          )}
        </span>
      </section>
      <section className="stats" aria-label="దరఖాస్తుల సారాంశం">
        <article className="card">
          <span>మీ వద్ద పెండింగ్</span>
          <strong>{pending.length}</strong>
          <small>చర్య అవసరమైనవి</small>
        </article>
        <article className="card">
          <span>గడువు దాటినవి</span>
          <strong className="danger-text">
            {pending.filter((item) => Date.parse(item.dueAt) < Date.now()).length}
          </strong>
          <small>ముందుగా పరిశీలించండి</small>
        </article>
        <article className="card">
          <span>తిరిగి వచ్చినవి</span>
          <strong>{pending.filter((item) => item.returned).length}</strong>
          <small>సవరణ కోసం</small>
        </article>
        <article className="card">
          <span>పూర్తయినవి</span>
          <strong>
            {applications.filter((item) => ['APPROVED', 'REJECTED'].includes(item.state)).length}
          </strong>
          <small>అందుబాటులో ఉన్న దరఖాస్తుల్లో</small>
        </article>
      </section>
      <section className="card queue">
        <div className="queue-toolbar">
          <div>
            <h2>దరఖాస్తుల జాబితా</h2>
            <p className="muted">గడువు, తిరిగి వచ్చిన స్థితి ఆధారంగా ప్రాధాన్యత.</p>
          </div>
          <label className="search-label">
            <span className="sr-only">దరఖాస్తు వెతకండి</span>
            <input
              type="search"
              placeholder="పేరు లేదా దరఖాస్తు సంఖ్య…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        <div className="filter-bar">
          <button
            className={!showAll ? 'filter active' : 'filter'}
            onClick={() => setShowAll(false)}
          >
            నా పని ({pending.length})
          </button>
          <button className={showAll ? 'filter active' : 'filter'} onClick={() => setShowAll(true)}>
            అన్ని దరఖాస్తులు
          </button>
        </div>
        <div>
          {visible.map((item) => (
            <button className="application-row" key={item.id} onClick={() => onOpen(item.id)}>
              <span className="avatar" aria-hidden="true">
                {item.applicantName.slice(0, 1)}
              </span>
              <span className="applicant">
                <strong>{item.applicantName}</strong>
                <small>
                  {item.reference} · {item.villageName}
                </small>
                <span>{item.purpose}</span>
              </span>
              <span className="income">
                {money(item.declaredIncome)}
                <small>ప్రకటించిన వార్షిక ఆదాయం</small>
              </span>
              <span className="row-state">
                <StatusBadge state={item.state} />
                <small>
                  {['APPROVED', 'REJECTED'].includes(item.state)
                    ? 'పరిశీలన పూర్తయింది'
                    : deadlineLabel(item.dueAt)}
                </small>
              </span>
              <span aria-hidden="true">↗</span>
            </button>
          ))}
          {visible.length === 0 && <p className="empty-state">ఈ జాబితాలో దరఖాస్తులు లేవు.</p>}
        </div>
      </section>
      <p className="footnote">నమూనా డేటా మాత్రమే · AI సహాయక సూచనలు మాత్రమే అందిస్తుంది · తుది నిర్ణయం అధికారిదే</p>
    </main>
  );
}
