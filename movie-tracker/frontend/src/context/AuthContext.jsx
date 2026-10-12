import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, logoutUser } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      // Always leave the signed-in UI, even if the server call failed (e.g. after account deletion)
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, authLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
