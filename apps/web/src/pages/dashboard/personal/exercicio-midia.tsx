import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useAuth } from '@/contexts/AuthContext';
import { FileUploadField } from '@/components/media/FileUploadField';
import { MediaGallery } from '@/components/media/MediaGallery';
import { PersonalSubnav } from '@/components/personal/PersonalSubnav';
import { PersonalPageShell } from '@/components/personal/PersonalPageShell';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

type Sport = { id: string; nome: string };
type Exercise = { id: string; nome: string };

export default function ExercicioMidiaPage() {
  const { t } = useTranslation('common');
  const { user, logout, accessToken } = useAuth();
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportId, setSportId] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseId, setExerciseId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    fetch(`${API_URL}/sports`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then(setSports)
      .catch(() => setSports([]));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !sportId) {
      setExercises([]);
      return;
    }
    fetch(`${API_URL}/sports/${sportId}/exercises`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then(setExercises)
      .catch(() => setExercises([]));
  }, [accessToken, sportId]);

  return (
    <PersonalPageShell>
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="dashboard-header">
        <h1 className="dashboard-title">{t('app.name')} · Mídia de exercício</h1>
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
        <p style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Escolha o exercício e envie vídeo (MP4/WebM) ou GIF. URLs são gravadas em <code>Exercise.videoUrl</code> /{' '}
          <code>gifUrl</code>.
        </p>
        <div className="card" style={{ marginBottom: 24, padding: 16 }}>
          <label style={{ display: 'block', marginBottom: 12, fontSize: '0.9375rem' }}>
            Modalidade
            <select
              className="input"
              style={{ marginTop: 8, width: '100%', maxWidth: 400, display: 'block' }}
              value={sportId}
              onChange={(e) => {
                setSportId(e.target.value);
                setExerciseId('');
              }}
            >
              <option value="">—</option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'block', marginBottom: 16, fontSize: '0.9375rem' }}>
            Exercício
            <select
              className="input"
              style={{ marginTop: 8, width: '100%', maxWidth: 400, display: 'block' }}
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              disabled={!sportId}
            >
              <option value="">—</option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.nome}
                </option>
              ))}
            </select>
          </label>
          {exerciseId && accessToken ? (
            <>
              <FileUploadField
                accessToken={accessToken}
                kind="EXERCISE_VIDEO"
                entityType="EXERCISE"
                entityId={exerciseId}
                label="Enviar vídeo"
                onUploaded={() => setRefreshKey((k) => k + 1)}
              />
              <FileUploadField
                accessToken={accessToken}
                kind="EXERCISE_GIF"
                entityType="EXERCISE"
                entityId={exerciseId}
                label="Enviar GIF"
                onUploaded={() => setRefreshKey((k) => k + 1)}
              />
            </>
          ) : null}
        </div>
        {exerciseId && accessToken ? (
          <div className="card" style={{ padding: 16 }}>
            <h2 style={{ marginBottom: 12, fontSize: '1.125rem', fontWeight: 600 }}>Mídias deste exercício</h2>
            <MediaGallery
              accessToken={accessToken}
              query={{
                entityType: 'EXERCISE',
                entityId: exerciseId,
              }}
              onRefreshKey={refreshKey}
            />
          </div>
        ) : null}
      </main>
    </div>
    </PersonalPageShell>
  );
}
