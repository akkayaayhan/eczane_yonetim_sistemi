import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RecommendationRecord } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, name: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  addToHistory: (record: RecommendationRecord) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('pharma_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email: string, name: string) => {
    // Simulated login - in real app, check password
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      history: []
    };
    
    // Check if exists in "DB" (localStorage) to preserve history/profile
    const storedDb = localStorage.getItem('pharma_users_db');
    let db = storedDb ? JSON.parse(storedDb) : {};
    
    if (db[email]) {
      setUser(db[email]);
      localStorage.setItem('pharma_user', JSON.stringify(db[email]));
    } else {
      setUser(newUser);
      localStorage.setItem('pharma_user', JSON.stringify(newUser));
      db[email] = newUser;
      localStorage.setItem('pharma_users_db', JSON.stringify(db));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pharma_user');
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('pharma_user', JSON.stringify(updatedUser));
    
    // Update DB
    const storedDb = localStorage.getItem('pharma_users_db');
    if (storedDb) {
      const db = JSON.parse(storedDb);
      db[user.email] = updatedUser;
      localStorage.setItem('pharma_users_db', JSON.stringify(db));
    }
  };

  const addToHistory = (record: RecommendationRecord) => {
    if (!user) return;
    const updatedHistory = [record, ...user.history];
    updateProfile({ history: updatedHistory });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, addToHistory }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};