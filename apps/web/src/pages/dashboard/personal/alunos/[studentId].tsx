import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useAuth } from '@/contexts/AuthContext';
import { PersonalSubnav } from '@/components/personal/PersonalSubnav';
import { PersonalPageShell } from '@/components/personal/PersonalPageShell';
import { PageLoadingState } from '@/components/ui/PageLoadingState';
import { PageErrorState } from '@/components/ui/PageErrorState';
import { useStudentDetail } from '@/hooks/useStudentDetail';
import {
  filterAssessmentPhotos,
  filterProgressPhotos,
  formatPtDate,
} from '@/lib/personal-media-filters';
import { MediaPreviewModal } from '@/components/personal/MediaPreviewModal';
import { StudentMediaGrid } from '@/components/personal/StudentMediaGrid';
import { StudentAssessmentCard } from '@/components/personal/StudentAssessmentCard';
import { StudentDetailSkeleton } from '@/components/personal/StudentDetailSkeleton';
import { StudentSectionEmpty } from '@/components/personal/StudentSectionEmpty';
import detailStyles from '@/components/personal/personal-student-detail.module.css';
import type { MediaFileRecord } from '@/types/media';

export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function PersonalAlunoDetalhePage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const studentId = typeof router.query.studentId === 'string' ? router.query.studentId : undefined;
  const { user, logout, accessToken } = useAuth();
  const { media, assessments, student, loading, error, reload } = useStudentDetail(accessToken, studentId);
  const [previewMedia, setPreviewMedia] = useState<MediaFileRecord | null>(null);

  const progressPhotos = filterProgressPhotos(media);
  const assessmentPhotos = filterAssessmentPhotos(media, assessments);

  if (!router.isReady) {
    return (
      <PersonalPageShell>
        <PageLoadingState />
      </PersonalPageShell>
    );
  }

  if (!studentId) {
    return (
      <PersonalPageShell>
      <div className="auth-page">
        <div className="auth-card">
          <p style={{ marginBottom: 16 }}>Identificador do aluno inválido.</p>
          <Link href="/dashboard/personal/alunos" className="btn btn-primary">
            Voltar aos alunos
          </Link>
        </div>
      </div>
      </PersonalPageShell>
    );
  }

  return (
    <PersonalPageShell>
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="dashboard-header">
        <h1 className="dashboard-title">{t('app.name')} · Aluno</h1>
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
        <p style={{ marginBottom: 16 }}>
          <Link href="/dashboard/personal/alunos" style={{ color: 'var(--accent)', fontSize: '0.9375rem' }}>
            ← Voltar aos alunos
          </Link>
        </p>

        {loading ? (
          <StudentDetailSkeleton />
        ) : error ? (
          <PageErrorState
            inline
            title="Erro ao carregar"
            message={error}
            onRetry={() => void reload()}
          />
        ) : (
          <>
            <MediaPreviewModal media={previewMedia} onClose={() => setPreviewMedia(null)} />

            {!student ? (
              <div className="card" style={{ padding: 20, marginBottom: 24 }} role="alert">
                <p style={{ margin: 0, color: 'var(--text)' }}>
                  Este aluno não está na sua lista de vínculos ou o identificador é inválido.
                </p>
              </div>
            ) : (
              <section className="card" style={{ padding: 20, marginBottom: 24 }}>
                <h2 style={{ margin: '0 0 12px', fontSize: '1.125rem', fontWeight: 600 }}>Dados básicos</h2>
                <dl style={{ margin: 0, display: 'grid', gap: 8, fontSize: '0.9375rem' }}>
                  <div>
                    <dt style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Nome</dt>
                    <dd style={{ margin: 0 }}>{student.name}</dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>E-mail</dt>
                    <dd style={{ margin: 0 }}>{student.email}</dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Plano / tipo</dt>
                    <dd style={{ margin: 0 }}>
                      {student.plan}
                      {student.planType ? ` · ${student.planType}` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Conta criada em</dt>
                    <dd style={{ margin: 0 }}>{formatPtDate(student.createdAt)}</dd>
                  </div>
                </dl>
              </section>
            )}

            <section className="card" style={{ padding: 20, marginBottom: 24 }}>
              <h2 style={{ margin: '0 0 16px', fontSize: '1.125rem', fontWeight: 600 }}>Fotos de evolução</h2>
              {progressPhotos.length === 0 ? (
                <StudentSectionEmpty
                  title="Nenhuma foto de evolução"
                  description="Quando o aluno enviar fotos de progresso, elas aparecerão aqui em grade com pré-visualização."
                />
              ) : (
                <StudentMediaGrid items={progressPhotos} onPreview={setPreviewMedia} />
              )}
            </section>

            <section className="card" style={{ padding: 20, marginBottom: 24 }}>
              <h2 style={{ margin: '0 0 16px', fontSize: '1.125rem', fontWeight: 600 }}>Fotos de avaliação</h2>
              {assessmentPhotos.length === 0 ? (
                <StudentSectionEmpty
                  title="Nenhuma foto de avaliação"
                  description="Imagens vinculadas a avaliações (tipo PHOTO_ASSESSMENT) serão listadas aqui."
                />
              ) : (
                <StudentMediaGrid
                  items={assessmentPhotos}
                  onPreview={setPreviewMedia}
                  assessmentHint={(m) =>
                    m.entityId ? `Avaliação: ${m.entityId}` : null
                  }
                />
              )}
            </section>

            <section className="card" style={{ padding: 20 }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '1.125rem', fontWeight: 600 }}>Avaliações</h2>
              {assessments.length === 0 ? (
                <StudentSectionEmpty
                  title="Nenhuma avaliação registrada"
                  description="As avaliações criadas para este aluno aparecerão aqui com medidas, adipometria e mídias quando existirem."
                />
              ) : (
                <div className={detailStyles.assessmentGrid}>
                  {assessments.map((a) => (
                    <StudentAssessmentCard key={a.id} assessment={a} onMediaPreview={setPreviewMedia} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
    </PersonalPageShell>
  );
}
