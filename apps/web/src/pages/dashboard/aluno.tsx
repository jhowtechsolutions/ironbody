import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardPlanSection } from '@/components/billing/DashboardPlanSection';
import { PageLoadingState } from '@/components/ui/PageLoadingState';
import { InlineErrorMessage } from '@/components/ui/InlineErrorMessage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

type DayExercise = { name: string; sets: number; reps: number; rest: string; order: number };

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function DashboardAluno() {
  const { t } = useTranslation('common');
  const { user, loading, logout, accessToken } = useAuth();
  const [myWorkout, setMyWorkout] = useState<{
    workout: { id: string; name: string; exercises: DayExercise[] } | null;
    assignedAt: string | null;
  } | null>(null);
  const [workoutsErr, setWorkoutsErr] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setWorkoutsErr(null);
    fetch(`${API_URL}/students/me/workout`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error('Erro ao carregar treino');
        return r.json();
      })
      .then(setMyWorkout)
      .catch(() => {
        setWorkoutsErr('Não foi possível carregar seu treino. Tente atualizar a página.');
        setMyWorkout(null);
      });
  }, [accessToken]);

  if (loading) {
    return <PageLoadingState />;
  }
  if (!user || user.role !== 'ALUNO') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p style={{ marginBottom: 16, color: 'var(--text)' }}>Acesso negado.</p>
          <Link href="/login" className="btn btn-primary">
            Ir para login
          </Link>
        </div>
      </div>
    );
  }

  const w = myWorkout?.workout;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          {t('app.name')} · {t('dashboard.aluno')}
        </h1>
        <nav className="dashboard-nav">
          <Link href="/dashboard/aluno/conta">Conta</Link>
          <Link href="/dashboard/aluno/evolucao">Evolução</Link>
          <Link href="/dashboard/aluno/avaliacao">Avaliação</Link>
          <Link href="/dashboard/aluno/nutricao">Nutrição (Premium)</Link>
        </nav>
        <div className="dashboard-user">
          <span>{user.name}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            {t('nav.logout')}
          </button>
        </div>
      </header>
      <main className="container" style={{ padding: 24 }}>
        <p style={{ marginBottom: 24, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          {t('dashboard.welcome')}, {user.name}.
        </p>
        <DashboardPlanSection role="ALUNO" returnBasePath="/dashboard/aluno" />
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 12, fontSize: '1.125rem', fontWeight: 600 }}>Treino do dia</h2>
          {workoutsErr ? <InlineErrorMessage message={workoutsErr} /> : null}
          {!workoutsErr && myWorkout === null ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Carregando…</p>
          ) : null}
          {!workoutsErr && myWorkout && !w ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Nenhum treino atribuído.</p>
          ) : null}
          {!workoutsErr && w ? (
            <>
              <p style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: 8 }}>{w.name}</p>
              {myWorkout?.assignedAt ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 16 }}>
                  Atualizado em {new Date(myWorkout.assignedAt).toLocaleString('pt-BR')}
                </p>
              ) : null}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {w.exercises.map((ex) => (
                  <li
                    key={`${ex.order}-${ex.name}`}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
                      fontSize: '0.9375rem',
                    }}
                  >
                    <strong>{ex.name}</strong> — {ex.sets}×{ex.reps}
                    {ex.rest ? <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>· descanso {ex.rest}</span> : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
