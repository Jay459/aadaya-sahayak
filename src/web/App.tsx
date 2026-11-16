import { useEffect, useState } from 'react';
import type { ApplicationDetail, CertificateApplication, Officer } from '../shared/contracts.ts';
import { api, ApiError, errorMessage, setCsrfToken } from './lib/api.ts';
import { LoginPage } from './features/auth/LoginPage.tsx';
import { Dashboard } from './features/dashboard/Dashboard.tsx';
import { ApplicationPage } from './features/applications/ApplicationPage.tsx';
import { roleLabels } from './i18n/te.ts';

export function App() {
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [starting, setStarting] = useState(true);
  const [applications, setApplications] = useState<CertificateApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api<{ officer: Officer; csrfToken: string }>('/auth/me')
      .then((result) => {
        if (active) {
          setCsrfToken(result.csrfToken);
          setOfficer(result.officer);
        }
      })
      .catch((failure: unknown) => {
        if (active && !(failure instanceof ApiError && failure.status === 401))
          setError(errorMessage(failure));
      })
      .finally(() => {
        if (active) setStarting(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!officer) return;
    let active = true;
    api<{ applications: CertificateApplication[] }>('/applications')
      .then((result) => {
        if (active) setApplications(result.applications);
      })
      .catch((failure: unknown) => {
        if (active) setError(errorMessage(failure));
      });
    return () => {
      active = false;
    };
  }, [officer, revision]);
  useEffect(() => {
    if (!selectedId || !officer) return;
    let active = true;
    api<ApplicationDetail>('/applications/' + selectedId)
      .then((result) => {
        if (active) setDetail(result);
      })
      .catch((failure: unknown) => {
        if (active) setError(errorMessage(failure));
      });
    return () => {
      active = false;
    };
  }, [selectedId, officer, revision]);
  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
      setCsrfToken('');
      setOfficer(null);
      setDetail(null);
      setSelectedId(null);
      setApplications([]);
    } catch (failure) {
      setError(errorMessage(failure));
    }
  }
  function openApplication(id: string) {
    setDetail(null);
    setError('');
    setSelectedId(id);
  }
  function refresh() {
    setDetail(null);
    setError('');
    setRevision((value) => value + 1);
  }
  if (starting)
    return (
      <main className="loading" role="status">
        కార్యస్థలం సిద్ధమవుతోంది…
      </main>
    );
  if (!officer)
    return (
      <>
        <LoginPage
          onLogin={(user) => {
            setError('');
            setOfficer(user);
          }}
        />
        {error && (
          <p role="alert" className="error standalone-error">
            {error}
          </p>
        )}
      </>
    );
  return (
    <>
      <a className="skip-link" href="#main">
        ప్రధాన విషయానికి వెళ్ళండి
      </a>
      <header className="topbar">
        <button className="brand brand-button" onClick={() => setSelectedId(null)}>
          <span className="brand-mark">ఆ</span>
          <span>
            ఆదాయ సహాయక్<small>ఆదాయ ధృవీకరణ కార్యస్థలం</small>
          </span>
        </button>
        <div className="officer-menu">
          <span>
            <strong>{officer.name}</strong>
            <small>{roleLabels[officer.role]}</small>
          </span>
          <button
            className="button secondary"
            onClick={() => {
              void logout();
            }}
          >
            లాగ్ అవుట్
          </button>
        </div>
      </header>
      {error && (
        <div role="alert" className="error global-error">
          {error}
          <button className="button secondary" onClick={refresh}>
            మళ్లీ ప్రయత్నించు
          </button>
        </div>
      )}
      {selectedId ? (
        detail ? (
          <ApplicationPage
            detail={detail}
            officer={officer}
            onBack={() => setSelectedId(null)}
            onChanged={refresh}
          />
        ) : (
          <main id="main" className="loading" role="status">
            <p>వివరాలు లోడ్ అవుతున్నాయి…</p>
            <button className="back-link" onClick={() => setSelectedId(null)}>
              ← జాబితాకు వెళ్ళండి
            </button>
          </main>
        )
      ) : (
        <Dashboard officer={officer} applications={applications} onOpen={openApplication} />
      )}
    </>
  );
}
