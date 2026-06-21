import { useEffect, useState } from 'react';
import AuthPage from './components/AuthPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Rendas from './pages/Rendas';
import Gastos from './pages/Gastos';
import Cartoes from './pages/Cartoes';
import Fatura from './pages/Fatura';
import ComprasParceladas from './pages/ComprasParceladas';
import Previsao from './pages/Previsao';
import Metas from './pages/Metas';
import { useFinanceData } from './hooks/useFinanceData';
import { currentMonthYear } from './lib/finance';
import { hasSupabaseConfig, supabase } from './lib/supabase';

function LoadingScreen() {
  return (
    <main className="loading-screen">
      <div className="loader" />
      <strong>Carregando seu controle financeiro...</strong>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [period, setPeriod] = useState(currentMonthYear());

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setAuthLoading(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const finance = useFinanceData(session?.user?.id);

  if (authLoading) return <LoadingScreen />;
  if (!session) return <AuthPage />;

  const pageProps = {
    data: finance.data,
    actions: finance.actions,
    period,
    setPeriod,
  };

  const pages = {
    dashboard: <Dashboard {...pageProps} />,
    rendas: <Rendas {...pageProps} />,
    gastos: <Gastos {...pageProps} />,
    cartoes: <Cartoes {...pageProps} />,
    fatura: <Fatura {...pageProps} />,
    parceladas: <ComprasParceladas {...pageProps} />,
    previsao: <Previsao {...pageProps} />,
    metas: <Metas {...pageProps} />,
  };

  return (
    <Layout
      activePage={activePage}
      setActivePage={setActivePage}
      profile={finance.data.profile}
      userEmail={session.user.email}
    >
      {finance.loading && <div className="top-notice">Atualizando dados...</div>}
      {finance.error && <div className="top-notice danger">{finance.error}</div>}
      {pages[activePage]}
    </Layout>
  );
}
