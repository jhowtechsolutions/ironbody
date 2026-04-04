'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  clearAuthStorage,
  loginRequest,
  persistSession,
  registerPersonalRequest,
  registerWithRoleRequest,
} from '@/services/authApi';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  planType: string | null;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string, options?: { returnUrl?: string }) => Promise<void>;
  /** Sem `role` → cadastro como personal. Com `role` → aluno ou personal explícito. */
  register: (
    data: {
      email: string;
      password: string;
      name: string;
      role?: 'PERSONAL_PROFESSOR' | 'ALUNO';
    },
    options?: { returnUrl?: string },
  ) => Promise<void>;
  logout: () => void;
  syncUserFromServer: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(raw: {
  id: string;
  email: string;
  name: string;
  role: string;
  plan?: string;
  planType?: string | null;
}): AuthUser {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    role: raw.role,
    plan: raw.plan ?? 'FREE',
    planType: raw.planType ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const syncUserFromServer = useCallback((u: AuthUser) => {
    setUser(u);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ironbody_user', JSON.stringify(u));
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ironbody_access') : null;
    const u = typeof window !== 'undefined' ? localStorage.getItem('ironbody_user') : null;
    if (token && u) {
      setAccessToken(token);
      try {
        const parsed = JSON.parse(u) as AuthUser;
        setUser({
          ...parsed,
          plan: parsed.plan ?? 'FREE',
          planType: parsed.planType ?? null,
        });
      } catch {
        clearAuthStorage();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, options?: { returnUrl?: string }) => {
    const data = await loginRequest(email, password);
    persistSession(data);
    const authUser = toAuthUser(data.user);
    setAccessToken(data.accessToken);
    setUser(authUser);
    const next = options?.returnUrl;
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      await router.push(next);
      return;
    }
    if (data.user.role === 'PERSONAL_PROFESSOR') {
      await router.push('/dashboard/personal');
    } else {
      await router.push('/dashboard/aluno');
    }
  };

  const register = async (
    form: {
      email: string;
      password: string;
      name: string;
      role?: 'PERSONAL_PROFESSOR' | 'ALUNO';
    },
    options?: { returnUrl?: string },
  ) => {
    const out = form.role
      ? await registerWithRoleRequest(form.name, form.email, form.password, form.role)
      : await registerPersonalRequest(form.name, form.email, form.password);
    persistSession(out);
    const authUser = toAuthUser(out.user);
    setAccessToken(out.accessToken);
    setUser(authUser);
    const next = options?.returnUrl;
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      await router.push(next);
      return;
    }
    if (out.user.role === 'PERSONAL_PROFESSOR') {
      await router.push('/dashboard/personal');
    } else {
      await router.push('/dashboard/aluno');
    }
  };

  const logout = () => {
    clearAuthStorage();
    setUser(null);
    setAccessToken(null);
    void router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        register,
        logout,
        syncUserFromServer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
