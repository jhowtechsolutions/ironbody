import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useAuth } from '@/contexts/AuthContext';
import { PersonalSubnav } from '@/components/personal/PersonalSubnav';
import { PersonalPageShell } from '@/components/personal/PersonalPageShell';
import { InlineErrorMessage } from '@/components/ui/InlineErrorMessage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function PersonalTreinosIndex() {
  const { t } = useTranslation('common');
  const { user, logout, accessToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setErr(null);
    fetch(`${API_URL}/workouts`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error('Erro ao carregar');
        return r.json();
      })
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setErr('Não foi possível carregar os treinos.');
        setItems([]);
        setLoading(false);
      });
  }, [accessToken]);

  return (
    <PersonalPageShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <header className="dashboard-header">
          <h1 className="dashboard-title">{t('app.name')} · Treinos</h1>
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
        <main className="container" style={{ padding: 24 }}>
          <Link href="/dashboard/personal/treinos/novo" className="btn btn-primary" style={{ marginBottom: 24, display: 'inline-block' }}>
            Criar treino
          </Link>
          {err ? <InlineErrorMessage message={err} /> : null}
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Carregando…</p>
          ) : items.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Nenhum treino ainda. Crie o primeiro.</p>
          ) : (
            <ul className="workout-list">
              {items.map((w: any) => (
                <li key={w.id}>
                  <Link href={`/dashboard/personal/treinos/${w.id}`}>
                    <strong>{w.name}</strong>
                  </Link>
                  {typeof w._count?.assignments === 'number' ? (
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>({w._count.assignments} atrib.)</span>
                  ) : null}
                  <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.875rem' }}>
                    {w.exercises?.length ?? 0} exercícios
                  </span>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </PersonalPageShell>
  );
}
