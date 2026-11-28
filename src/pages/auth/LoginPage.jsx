import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api/services/auth.api';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

export default function LoginPage() {
  const { loginSuccess } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const redirectTo = location.state?.from || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      const response = await authApi.login({
        username: username.trim(),
        password,
      });

      const payload = response?.data || response;
      const token = payload?.token || payload?.accessToken;
      const user = payload?.user || payload?.account;

      if (!token || !user) {
        setErrorMessage('INVALID_AUTH_RESPONSE');
        return;
      }

      loginSuccess(token, user);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrorMessage(err?.message || 'LOGIN_FAILED');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-md border border-border-strong bg-surface">
      <div className="border-b border-border-strong bg-subheader px-5 py-3">
        <div className="font-mono text-xs font-bold uppercase tracking-wider text-accent-emerald">
          [AUTH // PORTAL ACCESS]
        </div>
        <h1 className="mt-1 text-base font-bold text-ink-primary">
          {lang === 'vi' ? 'ĐĂNG NHẬP CỔNG THÔNG TIN' : 'PORTAL SIGN IN'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        {errorMessage && (
          <div className="border border-accent-crimson bg-canvas px-3 py-2 font-mono text-xs font-semibold text-accent-crimson">
            [ERROR // {errorMessage}]
          </div>
        )}

        <div>
          <label
            htmlFor="login-username"
            className="block font-mono text-[11px] font-semibold uppercase text-ink-secondary"
          >
            {lang === 'vi' ? 'TÊN NHÂN VẬT IN-GAME' : 'IN-GAME USERNAME'}
          </label>
          <input
            id="login-username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Kuuhaku"
            className="mt-1.5 w-full border border-border-strong bg-canvas px-3 py-2 font-mono text-xs text-ink-primary outline-none focus:bg-surface"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block font-mono text-[11px] font-semibold uppercase text-ink-secondary"
          >
            {lang === 'vi' ? 'MẬT KHẨU WEB' : 'WEB PASSWORD'}
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1.5 w-full border border-border-strong bg-canvas px-3 py-2 font-mono text-xs text-ink-primary outline-none focus:bg-surface"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full border border-border-strong bg-accent-emerald px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:opacity-95 disabled:opacity-60"
        >
          {submitting
            ? lang === 'vi'
              ? 'ĐANG XÁC THỰC...'
              : 'AUTHENTICATING...'
            : lang === 'vi'
            ? 'XÁC NHẬN ĐĂNG NHẬP >'
            : 'SIGN IN >'}
        </button>
      </form>
    </div>
  );
}