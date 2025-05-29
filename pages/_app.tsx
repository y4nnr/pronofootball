import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from '../contexts/LanguageContext';
import type { AppProps } from "next/app";
import "../styles/globals.css";
import Navbar from '../components/Navbar';
import { appWithTranslation } from 'next-i18next';

function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <LanguageProvider>
        <Navbar />
        <main className="pt-navbar">
          <Component {...pageProps} />
        </main>
      </LanguageProvider>
    </SessionProvider>
  );
}

export default appWithTranslation(App);
