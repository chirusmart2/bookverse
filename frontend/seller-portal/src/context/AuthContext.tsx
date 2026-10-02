import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "@shared/apiClient";
import { clearTokens, getRefreshToken, isAuthenticated, setTokens } from "@shared/auth";
import type { User } from "@shared/types";
import { AuthContext } from "./auth-state";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (): Promise<User | null> => {
    if (!isAuthenticated()) return null;
    try {
      const { user: me } = await authApi.me();
      if (me.role !== "seller") {
        clearTokens();
        return null;
      }
      return me;
    } catch {
      clearTokens();
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadUser().then((me) => {
      if (active) setUser(me);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    if (res.user.role !== "seller") {
      clearTokens();
      throw new Error("This account is not a seller account");
    }
    setTokens(res.access_token, res.refresh_token);
    setUser(res.user);
  };

  const logout = async () => {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch {
        /* ignore */
      }
    }
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
