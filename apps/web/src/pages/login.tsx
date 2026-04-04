import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PageLoadingState } from '@/components/ui/PageLoadingState';

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function Login() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nextReturn = typeof router.query.next === 'string' ? router.query.next : undefined;
  const alunoRegisterHref = nextReturn
    ? `/register/aluno?next=${encodeURIComponent(nextReturn)}`
    : '/register/aluno';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const next = typeof router.query.next === 'string' ? router.query.next : undefined;
      await login(email, password, next ? { returnUrl: next } : undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'E-mail ou senha incorretos.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || user) {
    return <PageLoadingState message={user ? 'Redirecionando…' : 'Carregando…'} />;
  }

  return (
    <div className="auth-page">
      <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label="Alternar tema">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <div className="auth-card">
        <h1 className="auth-title">{t('app.name')}</h1>
        <p className="auth-subtitle">Entre na sua conta</p>
        <form onSubmit={handleSubmit}>
          {error ? <p className="auth-error">{error}</p> : null}
          <input
            className="input"
            type="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ marginBottom: 12 }}
            autoComplete="email"
          />
          <input
            className="input"
            type="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ marginBottom: 24 }}
            autoComplete="current-password"
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Entrando...' : t('auth.login')}
          </button>
        </form>
        <p className="auth-link" style={{ marginTop: 12 }}>
          {t('auth.noAccount')}{' '}
          <Link href="/register">Cadastro personal</Link>
          {' · '}
          <Link href={alunoRegisterHref}>Cadastro aluno</Link>
        </p>
      </div>
    </div>
  );
}
