type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
  /** Uso dentro de card / seção estreita (sem `.auth-card`). */
  inline?: boolean;
};

export function PageErrorState({ title, message, onRetry, inline }: Props) {
  const body = (
    <>
      {title ? (
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
          {title}
        </h2>
      ) : null}
      <p className="auth-error" style={{ marginBottom: onRetry ? 16 : 0 }}>
        {message}
      </p>
      {onRetry ? (
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Tentar novamente
        </button>
      ) : null}
    </>
  );
  if (inline) {
    return <div role="alert">{body}</div>;
  }
  return (
    <div className="auth-page">
      <div className="auth-card" role="alert">
        {body}
      </div>
    </div>
  );
}
