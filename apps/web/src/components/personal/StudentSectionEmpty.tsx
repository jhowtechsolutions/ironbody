import styles from './personal-student-detail.module.css';

type Props = {
  title: string;
  description: string;
};

export function StudentSectionEmpty({ title, description }: Props) {
  return (
    <div className={styles.sectionEmpty} role="status">
      <p className={styles.sectionEmptyTitle}>{title}</p>
      <p className={styles.sectionEmptyDesc}>{description}</p>
    </div>
  );
}
