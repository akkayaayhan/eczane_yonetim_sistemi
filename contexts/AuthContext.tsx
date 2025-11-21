
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RecommendationRecord } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: 'pharmacist' | 'patient') => Promise<void>;
  createStaff: (username: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  addToHistory: (record: RecommendationRecord) => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load session on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const clearError = () => setError(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await authService.login(email, password);
      setUser(loggedUser);
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: 'pharmacist' | 'patient') => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await authService.register(email, password, name, role);
      setUser(newUser);
    } catch (err: any) {
      setError(err.message || 'Kayıt başarısız.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createStaff = async (username: string, password: string, name: string) => {
      setError(null);
      try {
          if (!user?.email) throw new Error("Oturum bulunamadı");
          await authService.registerStaff(user.email, username, password, name);
      } catch (err: any) {
          setError(err.message || 'Personel oluşturulamadı.');
          throw err;
      }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = await authService.updateUserProfile(user.email, data);
      setUser(updatedUser);
    } catch (err) {
      console.error("Profil güncellenemedi", err);
    }
  };

  const addToHistory = async (record: RecommendationRecord) => {
    if (!user) return;
    const updatedHistory = [record, ...(user.history || [])];
    await updateProfile({ history: updatedHistory });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      createStaff,
      logout, 
      updateProfile, 
      addToHistory,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
