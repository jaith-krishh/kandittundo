import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MovieProvider } from './context/MovieContext';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import WatchlistPage from './pages/WatchlistPage';
import WatchedPage from './pages/WatchedPage';
import RankingPage from './pages/RankingPage';
import TimelinePage from './pages/TimelinePage';
import ImportPage from './pages/ImportPage';
import RandomPage from './pages/RandomPage';
import LandingPage from './pages/LandingPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import LoadingScreen from './components/LoadingScreen';
import VantaBackground from './components/VantaBackground';
import PublicProfilePage from './pages/PublicProfilePage';

// The chart library is large; only load it when the dashboard is opened
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

const PAGES = {
  watchlist: WatchlistPage,
  watched: WatchedPage,
  ranking: RankingPage,
  dashboard: DashboardPage,
  timeline: TimelinePage,
  import: ImportPage,
  random: RandomPage
};

// Each page lives at its own path (/watched, /ranking, ...) so refresh and the back button work
const pageFromPath = () => {
  const name = window.location.pathname.slice(1);
  return PAGES[name] ? name : 'watchlist';
};

function AppInner() {
  const { user, authLoading } = useAuth();
  const [page, setPageState] = useState(pageFromPath);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAppReady(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Check if redirected back from Google with ?setup=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('setup') === '1') {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    const onPop = () => setPageState(pageFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const setPage = (name) => {
    if (name === page) return;
    window.history.pushState({}, '', name === 'watchlist' ? '/' : `/${name}`);
    setPageState(name);
  };

  const path = window.location.pathname;
  if (path.startsWith('/u/')) {
    const username = decodeURIComponent(path.split('/')[2] || '');
    return (
      <>
        <VantaBackground />
        <PublicProfilePage username={username} />
      </>
    );
  }

  if (!appReady || authLoading) return <LoadingScreen />;

  if (!user) return <LandingPage />;

  if (!user.profileComplete) return <ProfileSetupPage />;

  const Page = PAGES[page];

  return (
    <MovieProvider>
      <VantaBackground />
      <Navbar page={page} setPage={setPage} />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {page === 'watchlist' && <SearchBar />}
        <Suspense fallback={<p style={{ color: 'var(--text2)' }}>Loading...</p>}>
          <Page />
        </Suspense>
      </main>
    </MovieProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
