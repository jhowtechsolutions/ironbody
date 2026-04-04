import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PageLoadingState } from '@/components/ui/PageLoadingState';
import { InlineErrorMessage } from '@/components/ui/InlineErrorMessage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

type ValidateResponse = {
  valid: boolean;
  personal?: { id: string; name: string };
};

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'pt-BR', ['common'])),
    },
  };
}

export default function ConvitePage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const tokenParam = router.query.token;
  const token = typeof tokenParam === 'string' ? tokenParam : '';
  const { user, accessToken, loading: authLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [data, setData] = useState<ValidateResponse | null>(null);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptErr, setAcceptErr] = useState<string | null>(null);
  const [acceptOk, setAcceptOk] = useState(false);

  const nextEncoded = token ? encodeURIComponent(`/convite/${token}`) : '';

  const loadInvite = useCallback(async () => {
    if (!token) return;
    setPhase('loading');
    setFetchErr(null);
    try {
      const r = await fetch(`${API_URL}/invitations/${encodeURIComponent(token)}`);
      const json = (await r.json()) as ValidateResponse;
      if (!r.ok) {
        throw new Error('Não foi possível validar o convite.');
      }
      setData(json);
      setPhase('ready');
    } catch {
      setFetchErr('Erro de rede ao validar o convite. Tente de novo.');
      setPhase('error');
    }
  }, [token]);

  useEffect(() => {
    if (!router.isReady || !token) return;
    void loadInvite();
  }, [router.isReady, token, loadInvite]);

  const handleAccept = async () => {
    if (!token || !accessToken) return;
    setAcceptErr(null);
    setAccepting(true);
    try {
      const r = await fetch(`${API_URL}/invitations/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg =
          typeof json?.message === 'string'
            ? json.message
            : Array.isArray(json?.message)
              ? json.message.join(', ')
              : 'Não foi possível aceitar o convite.';
        throw new Error(msg);
      }
      setAcceptOk(true);
      window.setTimeout(() => {
        void router.push('/dashboard/aluno');
      }, 1200);
    } catch (e: unknown) {
      setAcceptErr(e instanceof Error ? e.message : 'Erro ao aceitar convite.');
    } finally {
      setAccepting(false);
    }
  };

  if (!router.isReady || authLoading) {
    return <PageLoadingState message="Carregando…" />;
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <InlineErrorMessage message="Link de convite inválido." />
          <Link href="/login" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
            {t('auth.login')}
          </Link>
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return <PageLoadingState message="Verificando convite…" />;
  }

  if (phase === 'error' || !data) {
    return (
      <div className="auth-page">
        <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label="Alternar tema">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="auth-card">
          <h1 className="auth-title">{t('app.name')}</h1>
          {fetchErr ? <InlineErrorMessage message={fetchErr} /> : null}
          <button type="button" className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => void loadInvite()}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data.valid) {
    return (
      <div className="auth-page">
        <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label="Alternar tema">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="auth-card">
          <h1 className="auth-title">Convite inválido</h1>
          <p className="auth-subtitle" style={{ color: 'var(--text-muted)' }}>
            Este link expirou, já foi usado ou não existe.
          </p>
          <Link href="/login" style={{ marginTop: 16, display: 'inline-block' }}>
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  const personalName = data.personal?.name ?? 'seu personal';

  return (
    <div className="auth-page">
      <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label="Alternar tema">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <div className="auth-card">
        <h1 className="auth-title">{t('app.name')}</h1>
        <p className="auth-subtitle">Você foi convidado por {personalName}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: 8 }}>
          Ao aceitar, sua conta será vinculada a este personal automaticamente.
        </p>

        {acceptOk ? (
          <p style={{ marginTop: 20, color: 'var(--accent, #22c55e)', fontWeight: 600 }}>
            Agora você está vinculado ao seu personal. Redirecionando…
          </p>
        ) : null}
        {acceptErr ? <p className="auth-error" style={{ marginTop: 12 }}>{acceptErr}</p> : null}

        {!user ? (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href={`/register/aluno?next=${nextEncoded}`} className="btn btn-primary" style={{ textAlign: 'center' }}>
              Criar conta
            </Link>
            <Link href={`/login?next=${nextEncoded}`} className="btn btn-ghost" style={{ textAlign: 'center' }}>
              Já tenho conta
            </Link>
          </div>
        ) : user.role === 'PERSONAL_PROFESSOR' ? (
          <div style={{ marginTop: 24 }}>
            <p className="auth-error">
              Este convite é para alunos. Entre com uma conta de aluno para aceitar.
            </p>
            <button type="button" className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => logout()}>
              Sair e trocar de conta
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 24 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={accepting || acceptOk}
              onClick={() => void handleAccept()}
            >
              {accepting ? 'Aceitando…' : 'Aceitar convite'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
