import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MovieProvider } from './context/MovieContext';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import WatchlistPage from './pages/WatchlistPage';
import WatchedPage from './pages/WatchedPage';
import RankingPage from './pages/RankingPage';
import DashboardPage from './pages/DashboardPage';
import TimelinePage from './pages/TimelinePage';
import ImportPage from './pages/ImportPage';
import RandomPage from './pages/RandomPage';
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import LoadingScreen from './components/LoadingScreen';
import VantaBackground from './components/VantaBackground';

function AppInner() {
  const { user, authLoading } = useAuth();
  const [page, setPage] = useState('watchlist');
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

  if (!appReady || authLoading) return <LoadingScreen />;

  if (!user) return <LoginPage />;

  if (!user.profileComplete) return <ProfileSetupPage />;

  const pages = {
    watchlist: <WatchlistPage />,
    watched: <WatchedPage />,
    ranking: <RankingPage />,
    dashboard: <DashboardPage />,
    timeline: <TimelinePage />,
    import: <ImportPage />,
    random: <RandomPage />
  };

  return (
    <MovieProvider>
      <VantaBackground />
      <Navbar page={page} setPage={setPage} />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {page === 'watchlist' && <SearchBar />}
        {pages[page]}
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
