import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { getMovies, addMovie, updateMovie, deleteMovie } from '../api';

const MovieContext = createContext();

export function MovieProvider({ children }) {
  const [movies, setMovies] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  // Pages refetch on every visit; ignore responses from a page the user already left
  const latestFetch = useRef(0);

  const refreshAll = useCallback(async () => {
    try {
      setAllMovies(await getMovies({}));
    } catch (err) {
      console.error('Could not load your list', err);
    }
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const fetchMovies = useCallback(async (params = {}) => {
    const id = ++latestFetch.current;
    setLoading(true);
    try {
      const data = await getMovies(params);
      if (id === latestFetch.current) setMovies(data);
    } catch (err) {
      console.error('Could not load movies', err);
    } finally {
      if (id === latestFetch.current) setLoading(false);
    }
  }, []);

  // Every add goes through here so both lists (and "already added" badges) stay in sync
  const addEntry = async (movieData) => {
    const movie = await addMovie(movieData);
    setMovies(prev => [movie, ...prev]);
    setAllMovies(prev => [movie, ...prev]);
    return movie;
  };

  const addToWatchlist = (movieData) => addEntry({ ...movieData, status: 'watchlist' });

  const markWatched = async (id, { rating, remarks, rewatch_value, season_ratings, total_seasons, watch_status }) => {
    const movie = await updateMovie(id, {
      status: 'watched', rating, remarks, rewatch_value,
      date_watched: new Date().toISOString(),
      ...(season_ratings !== undefined && { season_ratings }),
      ...(total_seasons !== undefined && { total_seasons }),
      ...(watch_status !== undefined && { watch_status })
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

  return (
    <MovieContext.Provider value={{
      movies, allMovies, loading, fetchMovies, refreshAll,
      addEntry, addToWatchlist, markWatched, editMovie, removeMovie
    }}>
      {children}
    </MovieContext.Provider>
  );
}

export const useMovies = () => useContext(MovieContext);
