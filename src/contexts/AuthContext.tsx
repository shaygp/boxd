import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, signIn, signUp, signOut as firebaseSignOut } from '@/services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name: string) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthProvider] Initializing auth listener...');
    let didFire = false;

    // Safety timeout - if auth doesn't respond in 5 seconds, stop loading
    const timeout = setTimeout(() => {
      if (!didFire) {
        console.warn('[AuthProvider] Timeout - auth not responding after 5s, setting loading to false');
        setLoading(false);
        setUser(null);
      }
    }, 5000);

    const unsubscribe = onAuthChange((authUser) => {
      didFire = true;
      clearTimeout(timeout);
      console.log('[AuthProvider] Auth state changed:', authUser ? `User: ${authUser.uid}` : 'No user');
      setUser(authUser);
      setLoading(false);

      // Log session info for debugging
      if (authUser) {
        console.log('[AuthProvider] Session info:', {
          uid: authUser.uid,
          email: authUser.email,
          emailVerified: authUser.emailVerified,
          lastSignInTime: authUser.metadata.lastSignInTime,
          creationTime: authUser.metadata.creationTime
        });
      }
    });

    return () => {
      console.log('[AuthProvider] Cleaning up auth listener');
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut: firebaseSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
