/**
 * Lê corpo de resposta HTTP de erro e extrai `message` do JSON padronizado pela API (Nest + AllExceptionsFilter).
 */
export async function readErrorMessageFromResponse(
  res: Response,
  fallback: string,
): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { message?: string | string[] };
    if (j.message != null) {
      return Array.isArray(j.message) ? j.message.join(' ') : String(j.message);
    }
  } catch {
    /* não é JSON */
  }
  const t = text.trim();
  if (t.length > 0 && t.length < 1200) return t;
  return `${fallback} (${res.status})`;
}
