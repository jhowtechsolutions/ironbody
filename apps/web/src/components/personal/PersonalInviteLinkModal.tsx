import { useCallback, useState, type CSSProperties } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  url: string;
  token: string;
};

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 16,
};

const cardStyle: CSSProperties = {
  maxWidth: 520,
  width: '100%',
  padding: 24,
};

export function PersonalInviteLinkModal({ open, onClose, url, token }: Props) {
  const [copied, setCopied] = useState(false);
  const [copyErr, setCopyErr] = useState<string | null>(null);

  const copy = useCallback(async () => {
    setCopyErr(null);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyErr('Não foi possível copiar. Selecione o link e copie manualmente (Ctrl+C).');
    }
  }, [url]);

  if (!open) return null;

  return (
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="card" style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <h2 id="invite-modal-title" style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 12 }}>
          Link de convite
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: 12 }}>
          Envie este link ao aluno. Ele poderá criar conta ou entrar e será vinculado a você ao aceitar.
        </p>
        <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 6 }}>
          URL
        </label>
        <input className="input" readOnly value={url} style={{ marginBottom: 8, width: '100%' }} />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16, wordBreak: 'break-all' }}>
          Token: <code>{token}</code>
        </p>
        {copyErr ? <p className="auth-error" style={{ marginBottom: 12 }}>{copyErr}</p> : null}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={() => void copy()}>
            {copied ? 'Copiado!' : 'Copiar link'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
