"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, login, logout } from '@/lib/auth/auth';
import { Models } from 'appwrite';

// Define the context value type
interface GlobalContextType {
  isLogged: boolean;
  setIsLogged: React.Dispatch<React.SetStateAction<boolean>>;
  user: Models.User<Models.Preferences> | null;
  setUser: React.Dispatch<React.SetStateAction<Models.User<Models.Preferences> | null>>;
  loading: boolean;
  handleLogin: (email: string, password: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

// Create context with proper type
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Type-safe custom hook
export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};

// Type the provider props
interface GlobalProviderProps {
  children: React.ReactNode;
}

const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const [isLogged, setIsLogged] = useState<boolean>(false);
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch the current user on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setIsLogged(true);
          setUser(currentUser);
        } else {
          setIsLogged(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Handle user login
  const handleLogin = async (email: string, password: string) => {
    try {
      const session = await login(email, password);
      if (session) {
        const currentUser = await getCurrentUser();
        setIsLogged(true);
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await logout();
      setIsLogged(false);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const value: GlobalContextType = {
    isLogged,
    setIsLogged,
    user,
    setUser,
    loading,
    handleLogin,
    handleLogout,
  };

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

export default GlobalProvider;