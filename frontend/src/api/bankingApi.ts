import { apiClient, ensureRoleForOperation } from './client';
import {
  AccountResponse,
  AccountStatementResponse,
  AuthResponse,
  CreateAccountRequest,
  CreateCustomerRequest,
  CustomerResponse,
  DepositRequest,
  LoginRequest,
  TransferRequest,
  TransferResponse,
  WithdrawRequest,
} from '../types/banking';

export const authApi = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return data;
  },
};

export const customerApi = {
  createCustomer: async (payload: CreateCustomerRequest): Promise<CustomerResponse> => {
    await ensureRoleForOperation(['TELLER']);
    const { data } = await apiClient.post<CustomerResponse>('/customers', payload);
    return data;
  },

  getCustomerById: async (id: number): Promise<CustomerResponse> => {
    await ensureRoleForOperation(['TELLER', 'CUSTOMER']);
    const { data } = await apiClient.get<CustomerResponse>(`/customers/${id}`);
    return data;
  },

  getCustomerByIdentityNumber: async (identityNumber: string): Promise<CustomerResponse> => {
    await ensureRoleForOperation(['TELLER', 'CUSTOMER']);
    const { data } = await apiClient.get<CustomerResponse>(
      `/customers/identity/${encodeURIComponent(identityNumber.trim())}`
    );
    return data;
  },
};

export const accountApi = {
  createAccount: async (payload: CreateAccountRequest): Promise<AccountResponse> => {
    await ensureRoleForOperation(['TELLER']);
    const { data } = await apiClient.post<AccountResponse>('/accounts', payload);
    return data;
  },

  getAccountByNumber: async (accountNumber: string): Promise<AccountResponse> => {
    await ensureRoleForOperation(['TELLER', 'CUSTOMER']);
    const { data } = await apiClient.get<AccountResponse>(
      `/accounts/${encodeURIComponent(accountNumber.trim())}`
    );
    return data;
  },

  getAccountsByCustomerId: async (customerId: number): Promise<AccountResponse[]> => {
    await ensureRoleForOperation(['TELLER', 'CUSTOMER']);
    const { data } = await apiClient.get<AccountResponse[]>(`/accounts/customer/${customerId}`);
    return data;
  },

  getStatement: async (
    accountNumber: string,
    startDate?: string,
    endDate?: string
  ): Promise<AccountStatementResponse> => {
    await ensureRoleForOperation(['TELLER', 'CUSTOMER']);
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const { data } = await apiClient.get<AccountStatementResponse>(
      `/accounts/${encodeURIComponent(accountNumber.trim())}/statement`,
      { params }
    );
    return data;
  },
};

export const transferApi = {
  transfer: async (
    payload: TransferRequest,
    idempotencyKey: string
  ): Promise<TransferResponse> => {
    await ensureRoleForOperation(['SYSTEM']);
    const { data } = await apiClient.post<TransferResponse>('/transfers', payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return data;
  },

  deposit: async (
    payload: DepositRequest,
    idempotencyKey: string
  ): Promise<TransferResponse> => {
    await ensureRoleForOperation(['TELLER']);
    const { data } = await apiClient.post<TransferResponse>('/transfers/deposit', payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return data;
  },

  withdraw: async (
    payload: WithdrawRequest,
    idempotencyKey: string
  ): Promise<TransferResponse> => {
    await ensureRoleForOperation(['TELLER']);
    const { data } = await apiClient.post<TransferResponse>('/transfers/withdraw', payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return data;
  },
};
