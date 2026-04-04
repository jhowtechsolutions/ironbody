type Props = {
  message?: string;
  /** Dentro de card/modal — sem `.auth-page` em volta. */
  bare?: boolean;
};

/** Estado de carregamento de página (acessível: status + live region). */
export function PageLoadingState({ message = 'Carregando…', bare }: Props) {
  const inner = (
    <div style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>{message}</div>
  );
  if (bare) {
    return (
      <div role="status" aria-live="polite" aria-busy="true">
        {inner}
      </div>
    );
  }
  return (
    <div className="auth-page" role="status" aria-live="polite" aria-busy="true">
      {inner}
    </div>
  );
}
