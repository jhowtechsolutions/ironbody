/**
 * CORS por ambiente.
 * - `CORS_ORIGINS`: várias origens separadas por vírgula (recomendado em produção).
 * - Ou `APP_URL_WEB` como origem única.
 * - Em produção, se nada estiver definido, usa fallback documentado (sobrescreva com env).
 */
export function resolveCorsConfig(): {
  origin: boolean | string | string[] | RegExp;
  credentials: boolean;
} {
  const fromList = process.env.CORS_ORIGINS?.trim();
  const appWeb = process.env.APP_URL_WEB?.trim();
  const isProd = process.env.NODE_ENV === 'production';

  const raw = fromList || (appWeb && appWeb !== '*' ? appWeb : undefined);

  if (!raw) {
    if (isProd) {
      const fallback = 'https://ironbody.app';
      console.warn(
        `[CORS] NODE_ENV=production sem CORS_ORIGINS/APP_URL_WEB — usando fallback ${fallback}. Configure CORS_ORIGINS.`,
      );
      return { origin: fallback, credentials: true };
    }
    return { origin: '*', credentials: true };
  }

  if (raw === '*') {
    return { origin: '*', credentials: true };
  }

  const origins = raw.split(',').map((o) => o.trim()).filter(Boolean);
  if (origins.length === 1) {
    return { origin: origins[0], credentials: true };
  }
  return { origin: origins, credentials: true };
}
