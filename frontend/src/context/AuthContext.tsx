import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccountResponse, CustomerResponse, JwtUser, Role } from '../types/banking';
import { authApi } from '../api/bankingApi';
import { SMART_ASSIST_STORAGE_KEY, TOKEN_STORAGE_KEY } from '../api/client';

interface AuthContextType {
  token: string | null;
  user: JwtUser | null;
  isAuthenticated: boolean;
  smartAssist: boolean;
  setSmartAssist: (enabled: boolean) => void;
  login: (username: string, password?: string) => Promise<void>;
  quickSwitchUser: (preset: 'customer_user' | 'teller_user' | 'system_admin') => Promise<void>;
  logout: () => void;
  knownCustomers: CustomerResponse[];
  knownAccounts: AccountResponse[];
  registerKnownCustomer: (customer: CustomerResponse) => void;
  registerKnownAccounts: (accounts: AccountResponse[]) => void;
  getCustomerNameById: (customerId: number) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const KNOWN_CUSTOMERS_KEY = 'akt_bank_known_customers';
const KNOWN_ACCOUNTS_KEY = 'akt_bank_known_accounts';

function parseJwt(token: string): JwtUser | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    const rawRole: string = parsed.role || 'ROLE_CUSTOMER';
    const cleanRole = (rawRole.startsWith('ROLE_') ? rawRole.substring(5) : rawRole) as Role;

    return {
      username: parsed.sub || 'unknown',
      role: cleanRole,
      rawRole,
      exp: parsed.exp || 0,
    };
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<JwtUser | null>(() => {
    const saved = localStorage.getItem(TOKEN_STORAGE_KEY);
    return saved ? parseJwt(saved) : null;
  });

  const [smartAssist, setSmartAssistState] = useState<boolean>(() => {
    return localStorage.getItem(SMART_ASSIST_STORAGE_KEY) !== 'false';
  });

  const [knownCustomers, setKnownCustomers] = useState<CustomerResponse[]>(() => {
    try {
      const raw = localStorage.getItem(KNOWN_CUSTOMERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [knownAccounts, setKnownAccounts] = useState<AccountResponse[]>(() => {
    try {
      const raw = localStorage.getItem(KNOWN_ACCOUNTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      setUser(parseJwt(token));
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    const handleTokenUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setToken(customEvent.detail);
      }
    };
    window.addEventListener('akt-token-updated', handleTokenUpdate);
    return () => window.removeEventListener('akt-token-updated', handleTokenUpdate);
  }, []);

  const setSmartAssist = (enabled: boolean) => {
    setSmartAssistState(enabled);
    localStorage.setItem(SMART_ASSIST_STORAGE_KEY, String(enabled));
  };

  const login = async (username: string, password?: string) => {
    const res = await authApi.login({
      username,
      password: password ?? username,
    });
    setToken(res.accessToken);
  };

  const quickSwitchUser = async (preset: 'customer_user' | 'teller_user' | 'system_admin') => {
    await login(preset, preset);
  };

  const logout = () => {
    setToken(null);
  };

  const registerKnownCustomer = (customer: CustomerResponse) => {
    setKnownCustomers((prev) => {
      const filtered = prev.filter((c) => c.id !== customer.id);
      const updated = [customer, ...filtered];
      localStorage.setItem(KNOWN_CUSTOMERS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const registerKnownAccounts = (accounts: AccountResponse[]) => {
    if (!accounts.length) return;
    setKnownAccounts((prev) => {
      const map = new Map<string, AccountResponse>();
      prev.forEach((a) => map.set(a.accountNumber, a));
      accounts.forEach((a) => map.set(a.accountNumber, a));
      const updated = Array.from(map.values());
      localStorage.setItem(KNOWN_ACCOUNTS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const getCustomerNameById = (customerId: number): string => {
    const found = knownCustomers.find((c) => c.id === customerId);
    if (!found) return `Customer #${customerId}`;
    if (found.identityNumber === '00000000000') return 'AKT Bank Central Vault';
    return `${found.firstName} ${found.lastName}`;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        smartAssist,
        setSmartAssist,
        login,
        quickSwitchUser,
        logout,
        knownCustomers,
        knownAccounts,
        registerKnownCustomer,
        registerKnownAccounts,
        getCustomerNameById,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
