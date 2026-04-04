import type { MediaFileRecord } from '@/types/media';
import { StudentMediaCard } from './StudentMediaCard';
import styles from './personal-student-detail.module.css';

type Props = {
  items: MediaFileRecord[];
  onPreview: (m: MediaFileRecord) => void;
  assessmentHint?: (m: MediaFileRecord) => string | null;
};

export function StudentMediaGrid({ items, onPreview, assessmentHint }: Props) {
  return (
    <div className={styles.mediaGrid}>
      {items.map((m) => (
        <StudentMediaCard
          key={m.id}
          item={m}
          onPreview={onPreview}
          assessmentHint={assessmentHint?.(m) ?? null}
        />
      ))}
    </div>
  );
}
