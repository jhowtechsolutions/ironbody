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

export default function RegisterAluno() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { register, user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const next = typeof router.query.next === 'string' ? router.query.next : undefined;
      await register(
        { email, password, name, role: 'ALUNO' },
        next ? { returnUrl: next } : undefined,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar');
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
        <p className="auth-subtitle">Cadastro de aluno</p>
        <form onSubmit={handleSubmit}>
          {error ? <p className="auth-error">{error}</p> : null}
          <input
            className="input"
            placeholder={t('auth.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ marginBottom: 12 }}
            autoComplete="name"
          />
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
            minLength={6}
            style={{ marginBottom: 20 }}
            autoComplete="new-password"
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Cadastrando...' : t('auth.register')}
          </button>
        </form>
        <p className="auth-link" style={{ marginTop: 12 }}>
          É personal? <Link href="/register">Cadastro para personal</Link>
        </p>
        <p className="auth-link">
          {t('auth.hasAccount')} <Link href="/login">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  );
}
