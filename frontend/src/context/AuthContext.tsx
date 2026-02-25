import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'OPERADOR'
  | 'LECTURISTA'
  | 'ATENCION_CLIENTES'
  | 'CLIENTE';

export const INTERNAL_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'OPERADOR',
  'LECTURISTA',
  'ATENCION_CLIENTES',
];
export const PORTAL_ROLES: UserRole[] = ['CLIENTE'];

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TOKEN_KEY = 'ctcf_access_token';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// ─── JWT helpers ─────────────────────────────────────────────────────────────

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function isTokenExpired(payload: Record<string, unknown>): boolean {
  const exp = payload['exp'];
  if (typeof exp !== 'number') return true;
  return Date.now() / 1000 > exp;
}

function userFromPayload(payload: Record<string, unknown>): AuthUser | null {
  const { sub, email, name, role } = payload;
  if (
    typeof sub !== 'string' ||
    typeof email !== 'string' ||
    typeof name !== 'string' ||
    typeof role !== 'string'
  ) {
    return null;
  }
  return { id: sub, email, name, role: role as UserRole };
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      const payload = decodeJwt(token);
      if (payload && !isTokenExpired(payload)) {
        const authUser = userFromPayload(payload);
        setUser(authUser);
      } else {
        // Expired or invalid — clean up
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        (data as { message?: string }).message ?? 'Credenciales incorrectas',
      );
    }

    const { access_token } = (await response.json()) as { access_token: string };
    localStorage.setItem(TOKEN_KEY, access_token);

    const payload = decodeJwt(access_token);
    if (!payload || isTokenExpired(payload)) {
      throw new Error('Token inválido recibido del servidor');
    }

    const authUser = userFromPayload(payload);
    if (!authUser) {
      throw new Error('Datos de usuario incompletos en el token');
    }

    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
