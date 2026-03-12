import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export interface User {
  id: string;
  username: string;
  email: string;
  siteName?: string;
  siteAddress?: string;
  transportAddress?: string;
  gstNumber?: string;
  mobile1?: string;
  mobile2?: string;
  appUsage?: string;
  fuelType?: string;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface SignUpData {
  username: string;
  email: string;
  password: string;
  siteName: string;
  siteAddress: string;
  transportAddress: string;
  gstNumber: string;
  mobile1: string;
  mobile2: string;
  appUsage: string;
  fuelType: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const stored = await AsyncStorage.getItem('auth_user');
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (stored && storedToken) {
        setUser(JSON.parse(stored));
        setToken(storedToken);
      }
    } catch (e) {
      console.log('Error loading stored user', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Sign in failed');
    await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
    await AsyncStorage.setItem('auth_token', data.token);
    setUser(data.user);
    setToken(data.token);
  }

  async function signUp(formData: SignUpData) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Sign up failed');
    await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
    await AsyncStorage.setItem('auth_token', data.token);
    setUser(data.user);
    setToken(data.token);
  }

  async function signOut() {
    await AsyncStorage.removeItem('auth_user');
    await AsyncStorage.removeItem('auth_token');
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
