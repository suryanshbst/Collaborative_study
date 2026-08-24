"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { User, RegisterInput, LoginInput } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  setGuestUser: (username: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("studysphere_token");
    const savedUser = localStorage.getItem("studysphere_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify with backend
        api
          .get<{ user: User }>("/api/auth/me")
          .then((res) => {
            setUser(res.data.user);
            localStorage.setItem(
              "studysphere_user",
              JSON.stringify(res.data.user),
            );
          })
          .catch(() => {
            // Token expired or invalid
            logout();
          })
          .finally(() => {
            setIsLoading(false);
          });
        return;
      } catch {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (input: LoginInput) => {
    setIsLoading(true);
    try {
      const res = await api.post<{ user: User; token: string }>(
        "/api/auth/login",
        input,
      );
      const { user: loggedInUser, token: authToken } = res.data;
      setUser(loggedInUser);
      setToken(authToken);
      localStorage.setItem("studysphere_token", authToken);
      localStorage.setItem("studysphere_user", JSON.stringify(loggedInUser));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (input: RegisterInput) => {
    setIsLoading(true);
    try {
      const res = await api.post<{ user: User; token: string }>(
        "/api/auth/register",
        input,
      );
      const { user: registeredUser, token: authToken } = res.data;
      setUser(registeredUser);
      setToken(authToken);
      localStorage.setItem("studysphere_token", authToken);
      localStorage.setItem("studysphere_user", JSON.stringify(registeredUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("studysphere_token");
    localStorage.removeItem("studysphere_user");
  };

  const setGuestUser = (username: string) => {
    const guestUser: User = {
      id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      username: username.trim() || "Student",
      createdAt: new Date().toISOString(),
    };
    setUser(guestUser);
    localStorage.setItem("studysphere_user", JSON.stringify(guestUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: (!!token && !!user) || (!!user && user.id.startsWith("guest-")),
        isLoading,
        login,
        register,
        logout,
        setGuestUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
