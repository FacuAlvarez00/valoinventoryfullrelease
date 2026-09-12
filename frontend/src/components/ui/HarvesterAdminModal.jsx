import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal, ModalHeader, ModalBody, TextField, TacticalButton } from './kit';
import { parseRiotAuthInput } from '../../utils/riotAuth';
import styles from './HarvesterAdminModal.module.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://valoinventory-1.onrender.com';
const RIOT_LOGIN_URL =
  'https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid';

// Admin-only: bootstraps/inspects the shared "harvester" Riot session (see
// backend/services/riotHarvester.js) that lets Details pull live rank +
// matches for ANY linked account without that account's own owner logging in
// again. One-time-ish manual step — log into a normal browser with the
// harvester account, then paste what Riot redirects to here (plus the
// auth.riotgames.com cookies, so the session lasts weeks instead of ~1h).
export default function HarvesterAdminModal({ open, onClose }) {
  const { makeAuthenticatedRequest } = useAuth();
  const [status, setStatus] = useState(null); // { state, savedAt, expiresAt } | null while loading
  const [statusError, setStatusError] = useState('');
  const [urlInput, setUrlInput] = useState({ riotToken: '', riotUrl: '' });
  const [cookieFields, setCookieFields] = useState({ ssid: '', asid: '', clid: '', tdid: '' });
  const [submitStatus, setSubmitStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = async () => {
    setStatusError('');
    try {
      const res = await makeAuthenticatedRequest(`${API_BASE}/api/auth/riot-harvester/status`);
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      } else {
        setStatusError(data.message || 'Failed to load the harvester status.');
      }
    } catch (e) {
      setStatusError('A network error occurred while loading the harvester status.');
    }
  };

  useEffect(() => {
    if (open) fetchStatus();
  }, [open]);

  const setCookieField = (name) => (e) => {
    setCookieFields(prev => ({ ...prev, [name]: e.target.value.trim() }));
  };

  // Riot expects a standard `Cookie` header value ("name=value; name2=...") —
  // built from whichever of the 4 fields were actually filled in, so leaving
  // one blank (or the whole section, it's optional) doesn't send a stray
  // "clid=; tdid=" for nothing.
  const buildCookieString = () =>
    Object.entries(cookieFields)
      .filter(([, value]) => value)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');

  const handleBootstrap = async () => {
    if (!urlInput.riotUrl || !urlInput.riotUrl.includes('playvalorant.com')) {
      setSubmitStatus('Paste the complete redirect URL (from the address bar after logging in).');
      return;
    }
    setSubmitting(true);
    setSubmitStatus('');
    try {
      const res = await makeAuthenticatedRequest(`${API_BASE}/api/auth/riot-harvester`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.riotUrl, cookies: buildCookieString() }),
      });
      const data = await res.json();
      if (data.success) {
        setUrlInput({ riotToken: '', riotUrl: '' });
        setCookieFields({ ssid: '', asid: '', clid: '', tdid: '' });
        setSubmitStatus('');
        await fetchStatus();
      } else {
        setSubmitStatus(data.message || 'Failed to save the harvester session.');
      }
    } catch (e) {
      setSubmitStatus('A network error occurred while saving the harvester session.');
    }
    setSubmitting(false);
  };

  const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

  return (
    <Modal open={open} onClose={onClose} maxWidth={520}>
      <ModalHeader
        title="Riot harvester session"
        subtitle="Shared session used to pull live rank + matches for any linked account."
      />
      <ModalBody>
        {statusError && <p className={styles.statusError}>{statusError}</p>}

        {status && (
          <div className={`${styles.statusBox} ${status.state === 'ready' ? styles.statusBoxReady : styles.statusBoxNeedsLogin}`}>
            <div className={styles.statusState}>
              {status.state === 'ready' ? '● Ready' : '● Needs login'}
            </div>
            {status.state === 'ready' && (
              <div className={styles.statusMeta}>
                <div>Saved: {formatDate(status.savedAt)}</div>
                <div>Estimated expiry: {formatDate(status.expiresAt)} (Riot doesn't publish an exact lifetime — ~2-3 weeks, ballpark only)</div>
              </div>
            )}
          </div>
        )}

        <div className={styles.divider} />

        <div className={styles.stepLabel}>1. Log in with the harvester account</div>
        <TacticalButton
          as="a"
          variant="ghost"
          fullWidth
          href={RIOT_LOGIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginBottom: 16 }}
        >
          Log in with Riot
        </TacticalButton>

        <div className={styles.stepLabel}>2. Paste the resulting URL here</div>
        <TextField
          type="text"
          placeholder="https://playvalorant.com/opt_in#access_token=..."
          value={urlInput.riotUrl}
          onChange={e => setUrlInput(parseRiotAuthInput(e.target.value))}
          onPaste={e => {
            setUrlInput(parseRiotAuthInput(e.clipboardData.getData('text')));
            e.preventDefault();
          }}
        />

        <div className={styles.stepLabel} style={{ marginTop: 12 }}>
          3. Paste each cookie's value (DevTools → Application → Cookies → auth.riotgames.com) — optional, but without these the session only lasts ~1h instead of weeks
        </div>
        <div className={styles.cookieGrid}>
          {['ssid', 'asid', 'clid', 'tdid'].map(name => (
            <TextField
              key={name}
              label={name}
              type="text"
              placeholder="value"
              value={cookieFields[name]}
              onChange={setCookieField(name)}
            />
          ))}
        </div>

        {submitStatus && <p className={styles.statusError}>{submitStatus}</p>}

        <TacticalButton
          fullWidth
          style={{ marginTop: 16 }}
          disabled={submitting || !urlInput.riotUrl}
          onClick={handleBootstrap}
        >
          {submitting ? 'Saving…' : 'Save harvester session'}
        </TacticalButton>
      </ModalBody>
    </Modal>
  );
}
