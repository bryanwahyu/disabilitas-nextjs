
import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { authService, type User, type LoginCredentials, type RegisterCredentials } from '@/lib/api';

interface AuthResult {
  data?: { token: string; user: User } | null;
  error?: string;
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isLoading: boolean; // alias for backward-compat
  error: string | null;
  signUp: (credentials: RegisterCredentials) => Promise<AuthResult>;
  signIn: (credentials: LoginCredentials) => Promise<AuthResult>;
  signOut: () => Promise<{ data: null; error: undefined }>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const signUp = async (credentials: RegisterCredentials): Promise<AuthResult> => {
    setLoading(true); setError(null);
    try {
      const response = await authService.signUp(credentials);
      if (response.error) {
        setError(response.error); setLoading(false); return { error: response.error };
      }
      setUser(response.data?.user || null);
      setLoading(false);
      return response;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message); setLoading(false); return { error: message };
    }
  };

  const signIn = async (credentials: LoginCredentials): Promise<AuthResult> => {
    setLoading(true); setError(null);
    try {
      const response = await authService.signIn(credentials);
      if (response.error) {
        setError(response.error); setLoading(false); return { error: response.error };
      }
      setUser(response.data?.user || null);
      setLoading(false);
      return response;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message); setLoading(false); return { error: message };
    }
  };

  const signOut = async () => {
    setLoading(true); setError(null);
    try {
      await authService.signOut();
    } catch (_e: unknown) {
      // Ignore errors on logout - we still want to clear user state
    }
    // Always clear user state on logout
    setUser(null);
    setLoading(false);
    return { data: null, error: undefined };
  };

  useEffect(() => {
    (async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response.data?.session?.user) {
          setUser(response.data.session.user);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isLoading: loading,
    error,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
