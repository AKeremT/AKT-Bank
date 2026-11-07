import axios, { AxiosError } from 'axios';
import { ErrorResponse, Role } from '../types/banking';

export const TOKEN_STORAGE_KEY = 'akt_bank_jwt_token';
export const SMART_ASSIST_STORAGE_KEY = 'akt_smart_assist';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getTokenRole(token: string | null): Role | null {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const parsed = JSON.parse(window.atob(base64));
    const rawRole: string = parsed.role || 'ROLE_CUSTOMER';
    return (rawRole.startsWith('ROLE_') ? rawRole.substring(5) : rawRole) as Role;
  } catch {
    return null;
  }
}

export async function ensureRoleForOperation(allowedRoles: Role[]): Promise<void> {
  const smartAssistEnabled = localStorage.getItem(SMART_ASSIST_STORAGE_KEY) !== 'false';
  if (!smartAssistEnabled) return;

  const currentToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  const currentRole = getTokenRole(currentToken);

  if (currentRole && allowedRoles.includes(currentRole)) {
    return;
  }

  // Pick the ideal preset user for the required role
  const targetUser = allowedRoles.includes('TELLER')
    ? 'teller_user'
    : allowedRoles.includes('SYSTEM')
    ? 'system_admin'
    : 'customer_user';

  const { data } = await axios.post<{ accessToken: string }>('/api/v1/auth/login', {
    username: targetUser,
    password: targetUser,
  });

  if (data?.accessToken) {
    localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
    window.dispatchEvent(new CustomEvent('akt-token-updated', { detail: data.accessToken }));
  }
}

export function extractErrorResponse(err: unknown): ErrorResponse {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ErrorResponse>;
    if (axiosErr.response?.data) {
      const data = axiosErr.response.data;
      return {
        status: axiosErr.response.status,
        error: data.error || 'Request Failed',
        message: data.message || 'An unexpected error occurred while processing your request.',
        path: data.path,
        timestamp: data.timestamp,
        validationErrors: data.validationErrors || null,
      };
    }
    if (axiosErr.response?.status === 401) {
      return {
        status: 401,
        error: 'Session Expired',
        message: 'Your session has expired or you are not signed in. Please sign in again.',
      };
    }
    if (axiosErr.response?.status === 403) {
      return {
        status: 403,
        error: 'Permission Required',
        message:
          'Your current role does not have permission for this action. Turn on Smart Auto-Pilot in the top bar or switch roles.',
      };
    }
    return {
      status: axiosErr.response?.status || 500,
      error: 'Connection Error',
      message:
        axiosErr.message === 'Network Error'
          ? 'Could not connect to the AKT Bank server. Please make sure the backend container is running.'
          : axiosErr.message,
    };
  }
  return {
    error: 'Unexpected Error',
    message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
  };
}
