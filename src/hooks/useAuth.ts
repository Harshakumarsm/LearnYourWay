import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useEffect } from "react";

// Mock authentication hook for development
export const useAuth = () => {
  const { isSignedIn, getToken } = useClerkAuth();

  useEffect(() => {
    // Mock token for development - in production, this would be handled by Clerk
    if (isSignedIn && !localStorage.getItem('auth_token')) {
      localStorage.setItem('auth_token', 'mock-jwt-token-for-development');
    }
  }, [isSignedIn]);

  return {
    isSignedIn,
    getToken: async () => {
      if (isSignedIn) {
        return localStorage.getItem('auth_token') || 'mock-jwt-token-for-development';
      }
      return null;
    }
  };
};
