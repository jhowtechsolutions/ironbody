import styles from './personal-student-detail.module.css';

/** Skeleton da página de detalhe do aluno (loading elegante). */
export function StudentDetailSkeleton() {
  return (
    <div className={styles.skeletonPage} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.skeletonBlock}>
        <div className={styles.skeletonLine} style={{ width: '30%' }} />
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLine} />
        <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
      </div>
      <div className={styles.skeletonBlock}>
        <div className={styles.skeletonLine} style={{ width: '45%', marginBottom: 16 }} />
        <div className={styles.skeletonGrid}>
          {[1, 2, 3].map((k) => (
            <div key={k} className={styles.skeletonThumb} />
          ))}
        </div>
      </div>
      <div className={styles.skeletonBlock}>
        <div className={styles.skeletonLine} style={{ width: '45%', marginBottom: 16 }} />
        <div className={styles.skeletonGrid}>
          {[1, 2].map((k) => (
            <div key={k} className={styles.skeletonThumb} />
          ))}
        </div>
      </div>
      <div className={styles.skeletonBlock}>
        <div className={styles.skeletonLine} style={{ width: '35%', marginBottom: 16 }} />
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLine} />
      </div>
      <span className={styles.srOnly}>Carregando dados do aluno…</span>
    </div>
  );
}
