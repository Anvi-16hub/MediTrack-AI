import React, { useState } from 'react';
import { ArrowRight, Heart, LockKeyhole, Mail, ShieldAlert, UserRound } from 'lucide-react';

export default function AuthPage({ onLogin, onRegister, onDemoLogin, supabaseConfigured }) {
  const [mode, setMode] = useState('login');
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegistering = mode === 'register';

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '', form: '' }));
  }

  function validate() {
    const nextErrors = {};
    const email = values.email.trim();

    if (isRegistering && values.name.trim().length < 2) {
      nextErrors.name = 'Enter your name (at least 2 characters).';
    }
    if (!email) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!values.password) {
      nextErrors.password = 'Password is required.';
    } else if (values.password.length < 8) {
      nextErrors.password = 'Use at least 8 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    const account = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
    };
    setBusy(true);
    setNotice('');
    try {
      const result = await (isRegistering ? onRegister(account) : onLogin(account));
      if (!result?.success) {
        setErrors({ form: result?.message || (isRegistering
          ? 'Registration failed. Check your details and try again.'
          : 'Email or password is incorrect.') });
      } else if (result.notice) {
        setErrors({});
        setNotice(result.notice);
      }
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'Authentication failed. Try again.' });
    } finally {
      setBusy(false);
    }
  }

  async function useDemoAccount() {
    if (!onDemoLogin) return;
    setBusy(true);
    setErrors({});
    try {
      await onDemoLogin();
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setErrors({});
    setNotice('');
  }

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-label="MediTrack AI account access">
        <aside className="auth-brand-panel">
          <div className="auth-brand-lockup">
            <span className="auth-brand-icon"><Heart aria-hidden="true" /></span>
            <span>MediTrack <b>AI</b></span>
          </div>
          <div className="auth-brand-copy">
            <p className="auth-eyebrow">MEDICATION CARE, MADE CLEARER</p>
            <h1>Your care routine,<br />all in one place.</h1>
            <p className="auth-brand-description">
              A calmer way to keep track of medicines, doses, and the people who support you.
            </p>
          </div>
          <div className="auth-brand-foot">
            <span className="auth-status-dot" />
            <span>Personal medication dashboard</span>
          </div>
          <div className="auth-pattern" aria-hidden="true" />
        </aside>

        <div className="auth-form-panel">
          <div className="auth-form-topline">
            <span className="auth-mobile-brand"><Heart aria-hidden="true" /> MediTrack AI</span>
            <span className="auth-demo-label">{supabaseConfigured ? 'SUPABASE AUTH' : 'DEMO ENVIRONMENT'}</span>
          </div>

          <div className="auth-form-content">
            <p className="auth-kicker">WELCOME {isRegistering ? 'ABOARD' : 'BACK'}</p>
            <h2>{isRegistering ? 'Create your account' : 'Sign in to MediTrack'}</h2>
            <p className="auth-subtitle">
              {isRegistering
                ? (supabaseConfigured ? 'Create a shared MediTrack account.' : 'Create a temporary local demo profile.')
                : (supabaseConfigured ? 'Sign in with your shared MediTrack account.' : 'Enter your local demo account details.')}
            </p>

            <div className="auth-mode-switch" role="tablist" aria-label="Account access">
              <button
                type="button"
                role="tab"
                aria-selected={!isRegistering}
                className={!isRegistering ? 'selected' : ''}
                onClick={() => changeMode('login')}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isRegistering}
                className={isRegistering ? 'selected' : ''}
                onClick={() => changeMode('register')}
              >
                Register
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {isRegistering && (
                <label className="auth-field">
                  <span>Full name</span>
                  <span className="auth-input-wrap">
                    <UserRound aria-hidden="true" />
                    <input
                      autoComplete="name"
                      name="name"
                      type="text"
                      value={values.name}
                      onChange={updateField}
                      placeholder="Your name"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                    />
                  </span>
                  {errors.name && <span id="name-error" className="auth-field-error">{errors.name}</span>}
                </label>
              )}

              <label className="auth-field">
                <span>Email address</span>
                <span className="auth-input-wrap">
                  <Mail aria-hidden="true" />
                  <input
                    autoComplete="email"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={updateField}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </span>
                {errors.email && <span id="email-error" className="auth-field-error">{errors.email}</span>}
              </label>

              <label className="auth-field">
                <span>Password</span>
                <span className="auth-input-wrap">
                  <LockKeyhole aria-hidden="true" />
                  <input
                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                    name="password"
                    type="password"
                    value={values.password}
                    onChange={updateField}
                    placeholder="At least 8 characters"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                </span>
                {errors.password && <span id="password-error" className="auth-field-error">{errors.password}</span>}
              </label>

              <button className="auth-submit" type="submit" disabled={busy}>
                {isRegistering ? 'Create account' : 'Sign in'}
                <ArrowRight aria-hidden="true" />
              </button>
            </form>

            {errors.form && <p className="auth-form-error" role="alert">{errors.form}</p>}
            {notice && <p className="auth-form-notice" role="status">{notice}</p>}

            {!supabaseConfigured && !isRegistering && (
              <div className="auth-demo-box">
                <div>
                  <strong>Supabase is not configured</strong>
                  <span>Local demo accounts are not shared across apps.</span>
                </div>
                <button type="button" onClick={useDemoAccount} disabled={busy}>Continue in demo mode</button>
              </div>
            )}

            <p className="auth-security-note">
              <ShieldAlert aria-hidden="true" />
              <span>{supabaseConfigured
                ? 'Supabase Auth is configured from public client settings. Database access still depends on the deployed migrations and RLS policies.'
                : 'Demo authentication only. No account or data is shared or production-secure. Do not use real or sensitive information.'}</span>
            </p>
          </div>

          <footer className="auth-footer">MediTrack AI <span>·</span> Medication Adherence Platform</footer>
        </div>
      </section>
    </main>
  );
}