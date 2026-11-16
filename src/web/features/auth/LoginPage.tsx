import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Officer } from '../../../shared/contracts.ts';
import { api, errorMessage, setCsrfToken } from '../../lib/api.ts';

export function LoginPage({ onLogin }: { onLogin: (officer: Officer) => void }) {
  const [username, setUsername] = useState('gpo.ramaram');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api<{ officer: Officer; csrfToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setCsrfToken(result.csrfToken);
      onLogin(result.officer);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-layout">
      <section className="login-story">
        <div className="brand">
          <span className="brand-mark">ఆ</span>
          <span>ఆదాయ సహాయక్</span>
        </div>
        <span className="eyebrow">అధికారుల కోసం · తెలుగులో</span>
        <h1>
          ప్రతి దరఖాస్తుకు
          <br />
          ఒక స్పష్టమైన దారి.
        </h1>
        <p>క్షేత్ర విచారణ నుంచి తుది నిర్ణయం వరకు, అవసరమైన వివరాలు ఒకే చోట.</p>
        <ol className="workflow-preview">
          <li>క్షేత్ర విచారణ</li>
          <li>ఆర్ఐ పరిశీలన</li>
          <li>తహసీల్దార్ నిర్ణయం</li>
        </ol>
        <p className="muted">ఇది ఇంటర్వ్యూ ప్రదర్శన మాత్రమే. ప్రభుత్వ సేవ కాదు. కల్పిత డేటా మాత్రమే ఉపయోగించండి.</p>
      </section>
      <section className="login-panel card">
        <span className="eyebrow">స్వాగతం</span>
        <h2>మీ కార్యస్థలంలోకి లాగిన్ అవ్వండి</h2>
        <form
          onSubmit={(event) => {
            void submit(event);
          }}
        >
          <label>
            వినియోగదారు పేరు
            <input
              autoComplete="username"
              required
              maxLength={80}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label>
            పాస్‌వర్డ్
            <input
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? 'లాగిన్ అవుతోంది…' : 'లాగిన్ అవ్వండి →'}
          </button>
        </form>
        <details>
          <summary>ప్రదర్శన ఖాతాలు</summary>
          <p>పాస్‌వర్డ్‌ను నిర్వాహకుడు అందిస్తారు.</p>
          {['gpo.ramaram', 'ri.mandal', 'tahsildar.mandal'].map((account) => (
            <button className="account-button" key={account} onClick={() => setUsername(account)}>
              {account}
            </button>
          ))}
        </details>
      </section>
    </main>
  );
}
