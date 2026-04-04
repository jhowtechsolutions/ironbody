type Props = {
  title?: string;
  description: string;
};

export function EmptyState({ title, description }: Props) {
  return (
    <div
      style={{
        padding: '20px 0',
        color: 'var(--text-muted)',
        fontSize: '0.9375rem',
        textAlign: 'center',
      }}
      role="status"
    >
      {title ? (
        <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{title}</p>
      ) : null}
      <p style={{ margin: 0 }}>{description}</p>
    </div>
  );
}
