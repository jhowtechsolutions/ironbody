import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useAuth } from '@/contexts/AuthContext';
import { PersonalSubnav } from '@/components/personal/PersonalSubnav';
import { PersonalPageShell } from '@/components/personal/PersonalPageShell';
import { InlineErrorMessage } from '@/components/ui/InlineErrorMessage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

type Row = { name: string; sets: string; reps: string; rest: string };

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function PersonalTreinoNovo() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { user, logout, accessToken } = useAuth();
  const [workoutName, setWorkoutName] = useState('');
  const [rows, setRows] = useState<Row[]>([{ name: '', sets: '3', reps: '10', rest: '60s' }]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addRow = () => {
    setRows((r) => [...r, { name: '', sets: '3', reps: '10', rest: '60s' }]);
  };

  const updateRow = (i: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  };

  const removeRow = (i: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!accessToken) return;
    const name = workoutName.trim();
    if (!name) {
      setErr('Informe o nome do treino.');
      return;
    }
    const exercises = rows
      .map((row) => ({
        name: row.name.trim(),
        sets: parseInt(row.sets, 10),
        reps: parseInt(row.reps, 10),
        rest: row.rest.trim() || '60s',
      }))
      .filter((e) => e.name.length > 0);
    if (exercises.length === 0) {
      setErr('Adicione pelo menos um exercício com nome.');
      return;
    }
    if (exercises.some((e) => !Number.isFinite(e.sets) || e.sets < 1 || !Number.isFinite(e.reps) || e.reps < 1)) {
      setErr('Séries e repetições devem ser números ≥ 1.');
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}/workouts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, exercises }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg =
          typeof json?.message === 'string'
            ? json.message
            : Array.isArray(json?.message)
              ? json.message.join(', ')
              : 'Erro ao salvar treino.';
        throw new Error(msg);
      }
      if (json?.id) {
        await router.push(`/dashboard/personal/treinos/${json.id}`);
      } else {
        await router.push('/dashboard/personal/treinos');
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PersonalPageShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <header className="dashboard-header">
          <h1 className="dashboard-title">{t('app.name')} · Novo treino</h1>
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
          <form onSubmit={(e) => void handleSubmit(e)} className="card" style={{ padding: 24 }}>
            {err ? <InlineErrorMessage message={err} /> : null}
            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ display: 'block', marginBottom: 6, fontSize: '0.9375rem' }}>Nome do treino</span>
              <input
                className="input"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="Ex.: Treino A — Peito"
                style={{ width: '100%' }}
                required
              />
            </label>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Exercícios</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {rows.map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 72px 72px 80px auto',
                    gap: 8,
                    alignItems: 'end',
                  }}
                >
                  <label style={{ fontSize: '0.8125rem' }}>
                    Nome
                    <input
                      className="input"
                      value={row.name}
                      onChange={(e) => updateRow(i, { name: e.target.value })}
                      style={{ marginTop: 4, width: '100%' }}
                    />
                  </label>
                  <label style={{ fontSize: '0.8125rem' }}>
                    Séries
                    <input
                      className="input"
                      type="number"
                      min={1}
                      value={row.sets}
                      onChange={(e) => updateRow(i, { sets: e.target.value })}
                      style={{ marginTop: 4, width: '100%' }}
                    />
                  </label>
                  <label style={{ fontSize: '0.8125rem' }}>
                    Reps
                    <input
                      className="input"
                      type="number"
                      min={1}
                      value={row.reps}
                      onChange={(e) => updateRow(i, { reps: e.target.value })}
                      style={{ marginTop: 4, width: '100%' }}
                    />
                  </label>
                  <label style={{ fontSize: '0.8125rem' }}>
                    Descanso
                    <input
                      className="input"
                      value={row.rest}
                      onChange={(e) => updateRow(i, { rest: e.target.value })}
                      style={{ marginTop: 4, width: '100%' }}
                    />
                  </label>
                  <button type="button" className="btn btn-ghost" onClick={() => removeRow(i)} disabled={rows.length <= 1}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-ghost" style={{ marginTop: 16 }} onClick={addRow}>
              + Adicionar exercício
            </button>
            <div style={{ marginTop: 24 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar treino'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </PersonalPageShell>
  );
}
