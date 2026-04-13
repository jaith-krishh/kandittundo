import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getMovies, addMovie, updateMovie, deleteMovie, bulkRank } from '../api';

const MovieContext = createContext();

export function MovieProvider({ children }) {
  const [movies, setMovies] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshAll = useCallback(async () => {
    const data = await getMovies({});
    setAllMovies(data);
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const fetchMovies = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const data = await getMovies(params);
      setMovies(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToWatchlist = async (movieData) => {
    const movie = await addMovie({ ...movieData, status: 'watchlist' });
    setMovies(prev => [movie, ...prev]);
    setAllMovies(prev => [movie, ...prev]);
    return movie;
  };

  const markWatched = async (id, { rating, remarks, rewatch_value, season_ratings, total_seasons }) => {
    const movie = await updateMovie(id, {
      status: 'watched', rating, remarks, rewatch_value,
      date_watched: new Date().toISOString(),
      ...(season_ratings !== undefined && { season_ratings }),
      ...(total_seasons !== undefined && { total_seasons })
    });
    setMovies(prev => prev.map(m => m._id === id ? movie : m));
    setAllMovies(prev => prev.map(m => m._id === id ? movie : m));
    return movie;
  };

  const editMovie = async (id, data) => {
    const movie = await updateMovie(id, data);
    setMovies(prev => prev.map(m => m._id === id ? movie : m));
    setAllMovies(prev => prev.map(m => m._id === id ? movie : m));
    return movie;
  };

  const removeMovie = async (id) => {
    await deleteMovie(id);
    setMovies(prev => prev.filter(m => m._id !== id));
    setAllMovies(prev => prev.filter(m => m._id !== id));
  };

  const updateRankings = async (rankings) => {
    await bulkRank(rankings);
    setMovies(prev => prev.map(m => {
      const r = rankings.find(r => r._id === m._id);
      return r ? { ...m, rank: r.rank } : m;
    }));
  };

  return (
    <MovieContext.Provider value={{
      movies, allMovies, loading, fetchMovies,
      addToWatchlist, markWatched, editMovie, removeMovie, updateRankings
    }}>
      {children}
    </MovieContext.Provider>
  );
}

export const useMovies = () => useContext(MovieContext);
