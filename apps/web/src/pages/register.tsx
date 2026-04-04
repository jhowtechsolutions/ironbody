import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PageLoadingState } from '@/components/ui/PageLoadingState';

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

/** Cadastro como personal trainer (sem pagamento; role padrão na API). */
export default function RegisterPersonal() {
  const { t } = useTranslation('common');
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
      await register({ email, password, name });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar';
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
        <p className="auth-subtitle">Crie sua conta como personal trainer</p>
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
          É aluno?{' '}
          <Link href="/register/aluno">Cadastre-se como aluno</Link>
        </p>
        <p className="auth-link">
          {t('auth.hasAccount')} <Link href="/login">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  );
}
