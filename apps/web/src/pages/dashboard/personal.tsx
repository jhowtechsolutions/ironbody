import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardPlanSection } from '@/components/billing/DashboardPlanSection';
import { InlineErrorMessage } from '@/components/ui/InlineErrorMessage';
import { PersonalSubnav } from '@/components/personal/PersonalSubnav';
import { PersonalPageShell } from '@/components/personal/PersonalPageShell';
import { PersonalInviteLinkModal } from '@/components/personal/PersonalInviteLinkModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function DashboardPersonal() {
  const { t } = useTranslation('common');
  const { user, logout, accessToken } = useAuth();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [workoutsErr, setWorkoutsErr] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);

  const generateInvite = useCallback(async () => {
    if (!accessToken) return;
    setInviteErr(null);
    setInviteLoading(true);
    try {
      const r = await fetch(`${API_URL}/invitations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg =
          typeof json?.message === 'string'
            ? json.message
            : Array.isArray(json?.message)
              ? json.message.join(', ')
              : 'Não foi possível gerar o convite.';
        throw new Error(msg);
      }
      if (typeof json?.url === 'string' && typeof json?.token === 'string') {
        setInviteUrl(json.url);
        setInviteToken(json.token);
        setInviteOpen(true);
      } else {
        throw new Error('Resposta inválida da API.');
      }
    } catch (e: unknown) {
      setInviteErr(e instanceof Error ? e.message : 'Erro ao gerar convite.');
    } finally {
      setInviteLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    setWorkoutsErr(null);
    fetch(`${API_URL}/workouts`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error('Erro ao carregar treinos');
        return r.json();
      })
      .then(setWorkouts)
      .catch(() => {
        setWorkoutsErr('Não foi possível carregar os treinos. Tente atualizar a página.');
        setWorkouts([]);
      });
  }, [accessToken]);

  return (
    <PersonalPageShell>
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="dashboard-header">
        <h1 className="dashboard-title">{t('app.name')} · {t('dashboard.personal')}</h1>
        <nav className="dashboard-nav">
          <PersonalSubnav />
        </nav>
        <div className="dashboard-user">
          <span>{user?.name}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>{t('nav.logout')}</button>
        </div>
      </header>
      <main className="container" style={{ padding: 24 }}>
        <p style={{ marginBottom: 24, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>{t('dashboard.welcome')}, {user?.name}.</p>
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 12, fontSize: '1.125rem', fontWeight: 600 }}>Convidar aluno</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: 12 }}>
            Gere um link único. O aluno abre, cria conta ou entra, e aceita para vincular automaticamente.
          </p>
          {inviteErr ? <InlineErrorMessage message={inviteErr} /> : null}
          <button
            type="button"
            className="btn btn-primary"
            disabled={inviteLoading || !accessToken}
            onClick={() => void generateInvite()}
          >
            {inviteLoading ? 'Gerando…' : 'Gerar link de convite'}
          </button>
        </div>
        <PersonalInviteLinkModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          url={inviteUrl}
          token={inviteToken}
        />
        <DashboardPlanSection role="PERSONAL_PROFESSOR" returnBasePath="/dashboard/personal" />
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 12, fontSize: '1.125rem', fontWeight: 600 }}>Treinos simples</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: 12 }}>
            <Link href="/dashboard/personal/treinos">Gerenciar treinos e atribuições</Link>
          </p>
          {workoutsErr ? <InlineErrorMessage message={workoutsErr} /> : null}
          {!workoutsErr && workouts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Nenhum treino cadastrado.</p>
          ) : !workoutsErr && workouts.length > 0 ? (
            <ul className="workout-list">
              {workouts

                .slice(0, 10)

                .map((w: any) => (
                  <li key={w.id}>
                    <Link href={`/dashboard/personal/treinos/${w.id}`}>{w.name}</Link>
                    {typeof w._count?.assignments === 'number' ? ` · ${w._count.assignments} atrib.` : null}
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      </main>
    </div>
    </PersonalPageShell>
  );
}
