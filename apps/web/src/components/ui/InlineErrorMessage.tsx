type Props = {
  message: string;
  id?: string;
};

export function InlineErrorMessage({ message, id }: Props) {
  return (
    <p id={id} className="auth-error" style={{ fontSize: '0.875rem', marginTop: 8 }} role="alert">
      {message}
    </p>
  );
}
