import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useAuth } from '@/contexts/AuthContext';
import { PersonalSubnav } from '@/components/personal/PersonalSubnav';
import { PersonalPageShell } from '@/components/personal/PersonalPageShell';
import { InlineErrorMessage } from '@/components/ui/InlineErrorMessage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

type Student = { id: string; name: string; email: string };

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) },
  };
}

export default function PersonalTreinoDetalhe() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const idParam = router.query.id;
  const id = typeof idParam === 'string' ? idParam : '';
  const { user, logout, accessToken } = useAuth();
  const [workout, setWorkout] = useState<any | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignOk, setAssignOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !id) return;
    setErr(null);
    setLoading(true);
    try {
      const [wr, sr] = await Promise.all([
        fetch(`${API_URL}/workouts/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${API_URL}/users/my-students`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);
      if (!wr.ok) throw new Error('Treino não encontrado.');
      const wjson = await wr.json();
      setWorkout(wjson);
      if (sr.ok) {
        const sjson = await sr.json();
        setStudents(Array.isArray(sjson) ? sjson : []);
      } else {
        setStudents([]);
      }
    } catch {
      setErr('Não foi possível carregar o treino.');
      setWorkout(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, id]);

  useEffect(() => {
    if (!router.isReady || !id) return;
    void load();
  }, [router.isReady, id, load]);

  const assign = async (studentId: string) => {
    if (!accessToken || !id) return;
    setAssignOk(null);
    setAssigning(studentId);
    setErr(null);
    try {
      const r = await fetch(`${API_URL}/workouts/${encodeURIComponent(id)}/assign`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg =
          typeof json?.message === 'string'
            ? json.message
            : Array.isArray(json?.message)
              ? json.message.join(', ')
              : 'Falha ao atribuir.';
        throw new Error(msg);
      }
      setAssignOk('Treino atribuído. O aluno verá em “Treino do dia”.');
      void load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao atribuir.');
    } finally {
      setAssigning(null);
    }
  };

  if (!router.isReady || !id) {
    return (
      <PersonalPageShell>
        <p style={{ padding: 24 }}>Carregando…</p>
      </PersonalPageShell>
    );
  }

  return (
    <PersonalPageShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <header className="dashboard-header">
          <h1 className="dashboard-title">{t('app.name')} · Treino</h1>
          <nav className="dashboard-nav">
            <PersonalSubnav />
          </nav>
          <div className="dashboard-user">
            <span>{user?.name}</span>
            <button type="button" className="btn btn-ghost" onClick={logout}>
              {t('nav.logout')}
            </button>
          </div>
        </header>
        <main className="container" style={{ padding: 24, maxWidth: 720 }}>
          <p style={{ marginBottom: 16 }}>
            <Link href="/dashboard/personal/treinos">← Voltar</Link>
          </p>
          {err ? <InlineErrorMessage message={err} /> : null}
          {assignOk ? (
            <p style={{ color: 'var(--accent, #22c55e)', marginBottom: 12 }}>{assignOk}</p>
          ) : null}
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Carregando…</p>
          ) : !workout ? null : (
            <>
              <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16 }}>{workout.name}</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {(workout.exercises as any[]).map((ex: any) => (
                    <li
                      key={ex.id}
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
              </div>
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: 12 }}>Atribuir a aluno</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: 16 }}>
                  Só aparecem alunos já vinculados à sua conta.
                </p>
                {students.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>
                    Nenhum aluno vinculado.{' '}
                    <Link href="/dashboard/personal/alunos">Ver alunos</Link>
                  </p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {students.map((s) => (
                      <li
                        key={s.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: '10px 0',
                          borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
                        }}
                      >
                        <span>
                          {s.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{s.email}</span>
                        </span>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={assigning !== null}
                          onClick={() => void assign(s.id)}
                        >
                          {assigning === s.id ? 'Atribuindo…' : 'Atribuir'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </PersonalPageShell>
  );
}
