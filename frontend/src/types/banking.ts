export type Currency = 'TRY' | 'USD' | 'EUR';
export type AccountType = 'CHECKING' | 'SAVINGS';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
export type TransactionType = 'INTERNAL_TRANSFER' | 'DEPOSIT' | 'WITHDRAW';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type EntryType = 'DEBIT' | 'CREDIT';
export type Role = 'CUSTOMER' | 'TELLER' | 'SYSTEM';

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface CreateCustomerRequest {
  identityNumber: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CustomerResponse {
  id: number;
  identityNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export interface CreateAccountRequest {
  customerId: number;
  currency: Currency;
  accountType: AccountType;
}

export interface AccountResponse {
  id: number;
  accountNumber: string;
  balance: number;
  currency: Currency;
  status: AccountStatus;
  accountType: AccountType;
  customerId: number;
  createdAt: string;
}

export interface TransferRequest {
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: number;
  description?: string;
}

export interface DepositRequest {
  accountNumber: string;
  amount: number;
  description?: string;
}

export interface WithdrawRequest {
  accountNumber: string;
  amount: number;
  description?: string;
}

export interface TransferResponse {
  transactionId: string;
  referenceNumber: string;
  status: TransactionStatus;
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: number;
  currency: Currency;
  createdAt: string;
}

export interface StatementItemResponse {
  referenceNumber: string;
  entryType: EntryType;
  transactionType: TransactionType;
  amount: number;
  description: string;
  createdAt: string;
}

export interface AccountStatementResponse {
  accountNumber: string;
  currency: Currency;
  currentBalance: number;
  startDate: string;
  endDate: string;
  totalCredit: number;
  totalDebit: number;
  netChange: number;
  summaryByType: Partial<Record<TransactionType, number>>;
  items: StatementItemResponse[];
}

export interface ErrorResponse {
  timestamp?: string;
  status?: number;
  error: string;
  message: string;
  path?: string;
  validationErrors?: Record<string, string> | null;
}

export interface JwtUser {
  username: string;
  role: Role;
  rawRole: string;
  exp: number;
}
