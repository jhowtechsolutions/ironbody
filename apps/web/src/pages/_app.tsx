import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import '@/styles/globals.css';

/** Evitar useRouter aqui: com i18n + appWithTranslation pode gerar hidratação/render vazio em /login. */
function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <Component {...pageProps} />
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default appWithTranslation(App);
