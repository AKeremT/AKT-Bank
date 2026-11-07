import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  FileSpreadsheet,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { accountApi, customerApi } from '../api/bankingApi';
import { extractErrorResponse } from '../api/client';
import {
  AccountResponse,
  AccountType,
  Currency,
  CustomerResponse,
  ErrorResponse,
} from '../types/banking';
import { useAuth } from '../context/AuthContext';
import { ErrorAlert } from '../components/ErrorAlert';

const SAMPLE_NAMES = [
  { first: 'Emma', last: 'Watson' },
  { first: 'Liam', last: 'Anderson' },
  { first: 'Sophia', last: 'Martinez' },
  { first: 'Noah', last: 'Thompson' },
  { first: 'Olivia', last: 'Clark' },
];

function generateRandomIdNumber(): string {
  let out = '1';
  for (let i = 1; i < 11; i++) {
    out += Math.floor(Math.random() * 10).toString();
  }
  return out;
}

export const DashboardPage: React.FC = () => {
  const {
    knownCustomers,
    knownAccounts,
    registerKnownCustomer,
    registerKnownAccounts,
    getCustomerNameById,
  } = useAuth();
  const navigate = useNavigate();

  // Customer Search State
  const [searchMode, setSearchMode] = useState<'identity' | 'id'>('identity');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse | null>(null);
  const [customerAccounts, setCustomerAccounts] = useState<AccountResponse[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Create Customer State
  const [identityNumber, setIdentityNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Create Account State
  const [newAccCurrency, setNewAccCurrency] = useState<Currency>('TRY');
  const [newAccType, setNewAccType] = useState<AccountType>('CHECKING');
  const [creatingAccount, setCreatingAccount] = useState(false);

  // Feedback
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedIban, setCopiedIban] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const loadCustomerAndAccounts = async (customer: CustomerResponse) => {
    setSelectedCustomer(customer);
    registerKnownCustomer(customer);
    try {
      const accs = await accountApi.getAccountsByCustomerId(customer.id);
      setCustomerAccounts(accs);
      registerKnownAccounts(accs);
    } catch (err) {
      setError(extractErrorResponse(err));
    }
  };

  useEffect(() => {
    const nonVaultCustomers = knownCustomers.filter((c) => c.identityNumber !== '00000000000');
    if (nonVaultCustomers.length > 0 && !selectedCustomer) {
      loadCustomerAndAccounts(nonVaultCustomers[0]);
    } else if (knownCustomers.length > 0 && !selectedCustomer) {
      loadCustomerAndAccounts(knownCustomers[0]);
    }
  }, []);

  const handleFillSamplePerson = () => {
    const pick = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
    const idNum = generateRandomIdNumber();
    setIdentityNumber(idNum);
    setFirstName(pick.first);
    setLastName(pick.last);
    setEmail(`${pick.first.toLowerCase()}.${idNum.slice(-4)}@aktbank.com`);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingCustomer(true);
      setError(null);
      const created = await customerApi.createCustomer({
        identityNumber: identityNumber.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      setIdentityNumber('');
      setFirstName('');
      setLastName('');
      setEmail('');
      await loadCustomerAndAccounts(created);
      showToast(
        `Step 1 Complete! Profile created for ${created.firstName} ${created.lastName}. Now click "+ Open New Bank Account" on the right!`
      );
    } catch (err) {
      setError(extractErrorResponse(err));
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      setCreatingAccount(true);
      setError(null);
      const acc = await accountApi.createAccount({
        customerId: selectedCustomer.id,
        currency: newAccCurrency,
        accountType: newAccType,
      });
      await loadCustomerAndAccounts(selectedCustomer);
      showToast(
        `Step 2 Complete! New ${acc.currency} ${acc.accountType} account opened. Click "+ Add Money" on the card below!`
      );
    } catch (err) {
      setError(extractErrorResponse(err));
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleCustomerSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setLoadingSearch(true);
      setError(null);
      const customer =
        searchMode === 'identity'
          ? await customerApi.getCustomerByIdentityNumber(searchQuery.trim())
          : await customerApi.getCustomerById(Number(searchQuery.trim()));
      await loadCustomerAndAccounts(customer);
    } catch (err) {
      setError(extractErrorResponse(err));
    } finally {
      setLoadingSearch(false);
    }
  };

  const copyIban = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(iban);
    setTimeout(() => setCopiedIban(null), 1800);
  };

  const hasCustomer = !!selectedCustomer;
  const hasAccounts = customerAccounts.length > 0;
  const hasFundedAccount = customerAccounts.some((a) => Number(a.balance) > 0);

  return (
    <div className="space-y-7">
      {/* Stitch 3-Step Visual Onboarding Guide Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
              Quick Setup Progress
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              Welcome to AKT Bank — Follow These 3 Easy Steps
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigate('/tutorial')}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            <BookOpen className="h-4 w-4" />
            <span>Need Help? Open Interactive Tutorial</span>
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {/* Step 1 Pill */}
          <div
            className={`flex items-start gap-3.5 rounded-2xl border p-4 ${
              hasCustomer
                ? 'border-emerald-200 bg-emerald-50/50'
                : 'border-blue-300 bg-blue-50/50 ring-2 ring-blue-500/20'
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                hasCustomer ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
              }`}
            >
              {hasCustomer ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Step 1: Create Customer Profile</p>
              <p className="mt-0.5 text-xs text-slate-600">
                {hasCustomer
                  ? `Active: ${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                  : 'Use the form on the left (or click "Fill Sample Person")'}
              </p>
            </div>
          </div>

          {/* Step 2 Pill */}
          <div
            className={`flex items-start gap-3.5 rounded-2xl border p-4 ${
              hasAccounts
                ? 'border-emerald-200 bg-emerald-50/50'
                : hasCustomer
                ? 'border-blue-300 bg-blue-50/50 ring-2 ring-blue-500/20'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                hasAccounts
                  ? 'bg-emerald-600 text-white'
                  : hasCustomer
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {hasAccounts ? <Check className="h-4 w-4" /> : '2'}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Step 2: Open a Bank Account</p>
              <p className="mt-0.5 text-xs text-slate-600">
                {hasAccounts
                  ? `${customerAccounts.length} active account(s) ready`
                  : 'Pick TRY, USD, or EUR and click "+ Open New Bank Account"'}
              </p>
            </div>
          </div>

          {/* Step 3 Pill */}
          <div
            className={`flex items-start gap-3.5 rounded-2xl border p-4 ${
              hasFundedAccount
                ? 'border-emerald-200 bg-emerald-50/50'
                : hasAccounts
                ? 'border-blue-300 bg-blue-50/50 ring-2 ring-blue-500/20'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                hasFundedAccount
                  ? 'bg-emerald-600 text-white'
                  : hasAccounts
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {hasFundedAccount ? <Check className="h-4 w-4" /> : '3'}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Step 3: Add or Send Money</p>
              <p className="mt-0.5 text-xs text-slate-600">
                {hasFundedAccount
                  ? 'Great! Your account has funds ready to transfer'
                  : 'Click "+ Add Money" on your account card to load cash'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-900 shadow-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <ErrorAlert error={error} onClose={() => setError(null)} />

      <div className="grid gap-7 lg:grid-cols-12">
        {/* Left Column: Step 1 - Create or Select Customer */}
        <div className="space-y-6 lg:col-span-5">
          {/* Create New Customer Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
                    Step 1
                  </span>
                  <h2 className="text-base font-bold text-slate-900">Create a Customer Profile</h2>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFillSamplePerson}
                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                title="Automatically fill with sample data"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Fill Sample Person</span>
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Emma"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Watson"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  National ID / Tax Number (10–11 Digits)
                </label>
                <input
                  type="text"
                  required
                  minLength={10}
                  maxLength={11}
                  value={identityNumber}
                  onChange={(e) => setIdentityNumber(e.target.value)}
                  placeholder="e.g. 12345678901"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. emma@aktbank.com"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={creatingCustomer}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
              >
                <PlusCircle className="h-4 w-4" />
                <span>
                  {creatingCustomer ? 'Creating Profile...' : 'Create Customer Profile'}
                </span>
              </button>
            </form>
          </div>

          {/* Switch or Search Existing Customer Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Your Saved Customer Profiles</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Click any person below to view and manage their bank accounts:
            </p>

            {knownCustomers.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {knownCustomers.map((c) => {
                  const isSelected = selectedCustomer?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => loadCustomerAndAccounts(c)}
                      className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <span>
                        {c.firstName} {c.lastName}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        #{c.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                No profiles created yet. Use the <strong>Create a Customer Profile</strong> card
                above to get started!
              </p>
            )}

            {/* Optional Lookup by ID or National ID */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Find Existing Customer by ID:
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setSearchMode('identity')}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      searchMode === 'identity'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    National ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMode('id')}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      searchMode === 'id'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Customer #
                  </button>
                </div>
              </div>

              <form onSubmit={handleCustomerSearch} className="mt-2 flex gap-2">
                <input
                  type="text"
                  required
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    searchMode === 'identity' ? 'Enter 11-digit ID...' : 'Enter Customer # (e.g. 1)'
                  }
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loadingSearch}
                  className="flex items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Find</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Step 2 & Step 3 - Accounts & Quick Actions */}
        <div className="space-y-6 lg:col-span-7">
          {selectedCustomer ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              {/* Customer Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs font-extrabold text-blue-700">
                      Customer #{selectedCustomer.id}
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900">
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </h2>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>
                      ID Number:{' '}
                      <strong className="font-mono text-slate-700">
                        {selectedCustomer.identityNumber}
                      </strong>
                    </span>
                    <span>
                      Email: <strong className="text-slate-700">{selectedCustomer.email}</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loadCustomerAndAccounts(selectedCustomer)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh Balances</span>
                </button>
              </div>

              {/* Step 2: Open New Bank Account Box */}
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                    Step 2
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Open a New Bank Account for {selectedCustomer.firstName}
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Choose a currency and account type below, then click{' '}
                  <strong>+ Open New Bank Account</strong>:
                </p>

                <form
                  onSubmit={handleCreateAccount}
                  className="mt-3.5 flex flex-wrap items-end gap-3"
                >
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs font-semibold text-slate-700">Currency</label>
                    <select
                      value={newAccCurrency}
                      onChange={(e) => setNewAccCurrency(e.target.value as Currency)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="TRY">TRY — Turkish Lira (₺)</option>
                      <option value="USD">USD — US Dollar ($)</option>
                      <option value="EUR">EUR — Euro (€)</option>
                    </select>
                  </div>

                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-xs font-semibold text-slate-700">
                      Account Type
                    </label>
                    <select
                      value={newAccType}
                      onChange={(e) => setNewAccType(e.target.value as AccountType)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="CHECKING">Checking Account (Everyday Use)</option>
                      <option value="SAVINGS">Savings Account (Save Money)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingAccount}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      {creatingAccount ? 'Opening Account...' : '+ Open New Bank Account'}
                    </span>
                  </button>
                </form>
              </div>

              {/* Customer's Bank Account Cards */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">
                    {selectedCustomer.firstName}'s Bank Accounts ({customerAccounts.length})
                  </h3>
                  {customerAccounts.length > 0 && (
                    <span className="text-xs font-semibold text-emerald-700">
                      Step 3: Click "+ Add Money" or "Send Money" on any card
                    </span>
                  )}
                </div>

                {customerAccounts.length === 0 ? (
                  <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
                    <CreditCard className="mx-auto h-10 w-10 text-slate-400" />
                    <h4 className="mt-3 text-base font-bold text-slate-800">
                      No Bank Accounts Yet
                    </h4>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                      Click the blue <strong>"+ Open New Bank Account"</strong> button right above
                      to open your first account in 1 second!
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {customerAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-300 hover:shadow-md"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-blue-700">
                              {acc.currency}{' '}
                              {acc.accountType === 'CHECKING' ? 'Checking' : 'Savings'}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                              {acc.status}
                            </span>
                          </div>

                          <div className="mt-4">
                            <p className="text-xs font-medium text-slate-400">Available Balance</p>
                            <p className="mt-0.5 font-mono text-2xl font-extrabold text-slate-900">
                              {Number(acc.balance).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              <span className="text-base font-bold text-blue-600">
                                {acc.currency}
                              </span>
                            </p>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                            <span className="font-mono text-[11px] font-medium text-slate-600 truncate">
                              {acc.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyIban(acc.accountNumber)}
                              className="shrink-0 text-slate-400 hover:text-blue-600"
                              title="Copy IBAN"
                            >
                              {copiedIban === acc.accountNumber ? (
                                <Check className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Easy 1-Click Action Buttons */}
                        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3.5">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/transfers?mode=deposit&iban=${acc.accountNumber}`)
                            }
                            className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Money</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/transfers?mode=transfer&iban=${acc.accountNumber}`)
                            }
                            className="flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-2.5 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                          >
                            <ArrowLeftRight className="h-3.5 w-3.5" />
                            <span>Send</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => navigate(`/statements?iban=${acc.accountNumber}`)}
                            className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            <span>Activity</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-96 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                <Wallet className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900">
                Let's Create Your First Customer Profile!
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                On the left panel, click <strong>"Fill Sample Person"</strong> and then click{' '}
                <strong>"Create Customer Profile"</strong>. Or click below to run our automatic
                demo setup!
              </p>
              <button
                type="button"
                onClick={() => navigate('/tutorial')}
                className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4" />
                <span>Open Tutorial & 1-Click Demo Setup</span>
              </button>
            </div>
          )}

          {/* All Known Accounts Overview */}
          {knownAccounts.filter((a) => a.accountNumber !== 'TR000000000000000000000001').length >
            0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                All Active Accounts in Your Workspace
              </h3>
              <div className="mt-3 space-y-2">
                {knownAccounts
                  .filter((a) => a.accountNumber !== 'TR000000000000000000000001')
                  .map((a) => (
                    <div
                      key={a.accountNumber}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">
                          {getCustomerNameById(a.customerId)}
                        </span>
                        <span className="mx-2 text-slate-300">•</span>
                        <span className="font-mono text-slate-500">{a.accountNumber}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-slate-900">
                          {Number(a.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                          {a.currency}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/transfers?mode=deposit&iban=${a.accountNumber}`)
                          }
                          className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-200"
                        >
                          + Add Money
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
