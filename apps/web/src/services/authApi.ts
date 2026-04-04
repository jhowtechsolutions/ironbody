import { API_URL } from '@/lib/api-config';
import { readErrorMessageFromResponse } from '@/lib/read-api-error';

const STORAGE_ACCESS = 'ironbody_access';
const STORAGE_REFRESH = 'ironbody_refresh';
const STORAGE_USER = 'ironbody_user';

export type AuthUserPayload = {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  planType: string | null;
};

export type LoginRegisterResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
  user: AuthUserPayload;
};

function normalizeUser(u: AuthUserPayload): AuthUserPayload {
  return {
    ...u,
    planType: u.planType ?? null,
    plan: u.plan ?? 'FREE',
  };
}

/** Token JWT atual (cliente apenas). */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_ACCESS);
}

export function persistSession(data: LoginRegisterResponse) {
  const user = normalizeUser(data.user);
  localStorage.setItem(STORAGE_ACCESS, data.accessToken);
  localStorage.setItem(STORAGE_REFRESH, data.refreshToken);
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
}

export function clearAuthStorage() {
  localStorage.removeItem(STORAGE_ACCESS);
  localStorage.removeItem(STORAGE_REFRESH);
  localStorage.removeItem(STORAGE_USER);
}

export async function loginRequest(email: string, password: string): Promise<LoginRegisterResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessageFromResponse(res, 'E-mail ou senha inválidos'));
  }
  return res.json();
}

/** Cadastro como personal (corpo sem `role`; API assume PERSONAL_PROFESSOR). */
export async function registerPersonalRequest(
  name: string,
  email: string,
  password: string,
): Promise<LoginRegisterResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    let msg = await readErrorMessageFromResponse(res, 'Erro ao cadastrar');
    if (res.status === 409) {
      msg = msg.includes('E-mail') ? msg : 'Este e-mail já está cadastrado.';
    }
    throw new Error(msg);
  }
  return res.json();
}

/** Cadastro explícito com papel (ex.: aluno). */
export async function registerWithRoleRequest(
  name: string,
  email: string,
  password: string,
  role: 'PERSONAL_PROFESSOR' | 'ALUNO',
): Promise<LoginRegisterResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  if (!res.ok) {
    let msg = await readErrorMessageFromResponse(res, 'Erro ao cadastrar');
    if (res.status === 409) {
      msg = msg.includes('E-mail') ? msg : 'Este e-mail já está cadastrado.';
    }
    throw new Error(msg);
  }
  return res.json();
}

/** Limpa storage local (logout no cliente; backend refresh opcional). */
export function logoutClient() {
  clearAuthStorage();
}

/** Alias semântico para limpar sessão (uso por UI ou guard). */
export function logout() {
  clearAuthStorage();
}
