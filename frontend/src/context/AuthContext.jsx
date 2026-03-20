import { createContext, useContext, useEffect, useMemo, useState } from "react";
import API from "../api/axios";

const AuthContext = createContext(null);

const TOKEN_KEY = "orvix_access_token";
const USER_KEY = "orvix_user";

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(readStoredUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.defaults.headers.common.Authorization = token ? `Bearer ${token}` : "";
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const { data } = await API.post("/auth/login", { email, password });
      const payload = data?.data || {};
      setToken(payload.accessToken || "");
      setUser(payload.user || null);
      return payload.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, password, role }) => {
    const endpoint = role === "company" ? "/auth/register/company" : "/auth/register/candidate";
    const { data } = await API.post(endpoint, { name, email, password });
    return data?.data;
  };

  const logout = async () => {
    try {
      if (token) {
        await API.post("/auth/logout");
      }
    } catch {
      // Keep local cleanup even when logout request fails.
    } finally {
      setToken("");
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
