import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { accountApi, transferApi } from '../api/bankingApi';
import { extractErrorResponse } from '../api/client';
import { ErrorResponse, TransferResponse } from '../types/banking';
import { useAuth } from '../context/AuthContext';
import { ErrorAlert } from '../components/ErrorAlert';
import { ReceiptModal } from '../components/ReceiptModal';

type OperationTab = 'deposit' | 'transfer' | 'withdraw';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

export const TransferPage: React.FC = () => {
  const { knownAccounts, registerKnownAccounts, getCustomerNameById } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialIban = searchParams.get('iban') || '';
  const initialMode = (searchParams.get('mode') as OperationTab) || 'deposit';

  const userAccounts = knownAccounts.filter(
    (a) => a.accountNumber !== 'TR000000000000000000000001'
  );

  const [activeTab, setActiveTab] = useState<OperationTab>(initialMode);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateUuid());
  const [autoRotateKey, setAutoRotateKey] = useState<boolean>(true);
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);

  // Form states
  const [accountNumber, setAccountNumber] = useState(
    initialIban || userAccounts[0]?.accountNumber || ''
  );
  const [senderAccountNumber, setSenderAccountNumber] = useState(
    initialIban || userAccounts[0]?.accountNumber || ''
  );
  const [receiverAccountNumber, setReceiverAccountNumber] = useState(
    userAccounts[1]?.accountNumber || ''
  );
  const [amount, setAmount] = useState('1000');
  const [description, setDescription] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [receipt, setReceipt] = useState<TransferResponse | null>(null);
  const [lastUsedKey, setLastUsedKey] = useState<string>('');

  useEffect(() => {
    if (initialIban) {
      setAccountNumber(initialIban);
      setSenderAccountNumber(initialIban);
    }
    if (initialMode && ['deposit', 'transfer', 'withdraw'].includes(initialMode)) {
      setActiveTab(initialMode);
    }
  }, [initialIban, initialMode]);

  const refreshAccountsSilently = async (ibans: string[]) => {
    for (const iban of ibans) {
      if (!iban || iban === 'TR000000000000000000000001') continue;
      try {
        const updated = await accountApi.getAccountByNumber(iban);
        registerKnownAccounts([updated]);
      } catch {
        // ignore
      }
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const currentKey = idempotencyKey.trim();
      setLastUsedKey(currentKey);

      let res: TransferResponse;
      if (activeTab === 'deposit') {
        res = await transferApi.deposit(
          {
            accountNumber: accountNumber.trim(),
            amount: Number(amount),
            description: description.trim() || 'Cash Deposit to Account',
          },
          currentKey
        );
        await refreshAccountsSilently([accountNumber.trim()]);
      } else if (activeTab === 'withdraw') {
        res = await transferApi.withdraw(
          {
            accountNumber: accountNumber.trim(),
            amount: Number(amount),
            description: description.trim() || 'Cash Withdrawal from Account',
          },
          currentKey
        );
        await refreshAccountsSilently([accountNumber.trim()]);
      } else {
        res = await transferApi.transfer(
          {
            senderAccountNumber: senderAccountNumber.trim(),
            receiverAccountNumber: receiverAccountNumber.trim(),
            amount: Number(amount),
            description: description.trim() || 'Money Transfer Between Accounts',
          },
          currentKey
        );
        await refreshAccountsSilently([
          senderAccountNumber.trim(),
          receiverAccountNumber.trim(),
        ]);
      }

      setReceipt(res);
      if (autoRotateKey) {
        setIdempotencyKey(generateUuid());
      }
    } catch (err) {
      setError(extractErrorResponse(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
            Step 3 • Easy Money Operations
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Add Money, Send Money, or Withdraw Cash
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Simply choose what you want to do below, click on an account card, pick an amount, and
            confirm!
          </p>
        </div>
      </div>

      {/* 3 Big Visual Action Mode Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab('deposit');
            setError(null);
          }}
          className={`flex items-center gap-4 rounded-3xl border p-5 text-left transition ${
            activeTab === 'deposit'
              ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-sm'
              : 'border-slate-200 bg-white hover:border-emerald-300'
          }`}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-base font-extrabold text-slate-900">
              1. Add Money (Deposit)
            </span>
            <span className="text-xs text-slate-500">
              Put cash into your bank account instantly
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('transfer');
            setError(null);
          }}
          className={`flex items-center gap-4 rounded-3xl border p-5 text-left transition ${
            activeTab === 'transfer'
              ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-sm'
              : 'border-slate-200 bg-white hover:border-blue-300'
          }`}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-base font-extrabold text-slate-900">
              2. Send Money (Transfer)
            </span>
            <span className="text-xs text-slate-500">
              Send money from one account to another
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('withdraw');
            setError(null);
          }}
          className={`flex items-center gap-4 rounded-3xl border p-5 text-left transition ${
            activeTab === 'withdraw'
              ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20 shadow-sm'
              : 'border-slate-200 bg-white hover:border-rose-300'
          }`}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-sm">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-base font-extrabold text-slate-900">
              3. Withdraw Cash
            </span>
            <span className="text-xs text-slate-500">Take cash out of your bank account</span>
          </div>
        </button>
      </div>

      <ErrorAlert error={error} onClose={() => setError(null)} />

      {/* Helpful Prompt if User Has No Accounts Yet */}
      {userAccounts.length === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-3">
            <Wallet className="h-6 w-6 text-amber-600" />
            <div className="text-sm text-amber-900">
              <strong>You don't have any bank accounts saved yet!</strong> Open an account first so
              you can click it right here without typing an IBAN.
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
          >
            Go Open an Account →
          </button>
        </div>
      )}

      {/* Main Transaction Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleExecute} className="space-y-6">
          {activeTab !== 'transfer' ? (
            /* Single Account Picker for Deposit or Withdraw */
            <div className="space-y-3">
              <label className="block text-sm font-extrabold text-slate-900">
                {activeTab === 'deposit'
                  ? 'Step A: Click the Account Where You Want to Add Money'
                  : 'Step A: Click the Account to Withdraw Cash From'}
              </label>

              {userAccounts.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {userAccounts.map((a) => {
                    const isSelected = accountNumber === a.accountNumber;
                    return (
                      <button
                        key={a.accountNumber}
                        type="button"
                        onClick={() => setAccountNumber(a.accountNumber)}
                        className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-slate-50/60 hover:border-blue-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">
                            {getCustomerNameById(a.customerId)}
                          </span>
                          {isSelected && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        <p className="mt-2 font-mono text-lg font-extrabold text-blue-700">
                          {Number(a.balance).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}{' '}
                          {a.currency}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-slate-500 truncate">
                          {a.accountNumber}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              <div>
                <span className="text-xs font-medium text-slate-500">
                  Selected Account IBAN (auto-filled when you click a card above):
                </span>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="TR..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          ) : (
            /* Two Account Pickers for Internal Transfer */
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Sender Picker */}
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <label className="block text-sm font-extrabold text-slate-900">
                  Step A: Send Money FROM (Sender Account)
                </label>

                {userAccounts.length > 0 && (
                  <div className="grid gap-2">
                    {userAccounts.map((a) => {
                      const isSelected = senderAccountNumber === a.accountNumber;
                      return (
                        <button
                          key={a.accountNumber}
                          type="button"
                          onClick={() => setSenderAccountNumber(a.accountNumber)}
                          className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20'
                              : 'border-slate-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {getCustomerNameById(a.customerId)} ({a.currency} {a.accountType})
                            </p>
                            <p className="font-mono text-[11px] text-slate-500">
                              {a.accountNumber}
                            </p>
                          </div>
                          <span className="font-mono text-sm font-extrabold text-blue-700">
                            {Number(a.balance).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            {a.currency}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <input
                  type="text"
                  required
                  value={senderAccountNumber}
                  onChange={(e) => setSenderAccountNumber(e.target.value)}
                  placeholder="Sender IBAN (TR...)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Receiver Picker */}
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <label className="block text-sm font-extrabold text-slate-900">
                  Step B: Send Money TO (Recipient Account)
                </label>

                {userAccounts.length > 0 && (
                  <div className="grid gap-2">
                    {userAccounts.map((a) => {
                      const isSelected = receiverAccountNumber === a.accountNumber;
                      return (
                        <button
                          key={a.accountNumber}
                          type="button"
                          onClick={() => setReceiverAccountNumber(a.accountNumber)}
                          className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {getCustomerNameById(a.customerId)} ({a.currency} {a.accountType})
                            </p>
                            <p className="font-mono text-[11px] text-slate-500">
                              {a.accountNumber}
                            </p>
                          </div>
                          <span className="font-mono text-sm font-extrabold text-emerald-700">
                            {Number(a.balance).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            {a.currency}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <input
                  type="text"
                  required
                  value={receiverAccountNumber}
                  onChange={(e) => setReceiverAccountNumber(e.target.value)}
                  placeholder="Recipient IBAN (TR...)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Amount & Quick Pills + Description */}
          <div className="grid gap-6 border-t border-slate-100 pt-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-extrabold text-slate-900">
                Enter Amount (or Click a Quick Button)
              </label>

              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(String(val))}
                    className={`rounded-xl border px-3.5 py-1.5 font-mono text-xs font-bold transition ${
                      Number(amount) === val
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    +{val.toLocaleString('en-US')}
                  </button>
                ))}
              </div>

              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-lg font-extrabold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-extrabold text-slate-900">
                Note / Description (Optional)
              </label>
              <p className="mt-1 text-xs text-slate-500">
                Add a short note so you remember what this transaction was for:
              </p>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Savings deposit, Rent payment, Gift..."
                className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Primary Confirm CTA */}
          <button
            type="submit"
            disabled={loading}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-extrabold text-white shadow-lg transition disabled:opacity-50 ${
              activeTab === 'deposit'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : activeTab === 'withdraw'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            {activeTab === 'deposit' && <Plus className="h-5 w-5" />}
            {activeTab === 'transfer' && <ArrowLeftRight className="h-5 w-5" />}
            {activeTab === 'withdraw' && <ArrowUpRight className="h-5 w-5" />}
            <span>
              {loading
                ? 'Processing Transaction...'
                : activeTab === 'deposit'
                ? `Add ${Number(amount || 0).toLocaleString('en-US')} to Account Now`
                : activeTab === 'withdraw'
                ? `Withdraw ${Number(amount || 0).toLocaleString('en-US')} Cash Now`
                : `Send ${Number(amount || 0).toLocaleString('en-US')} Now`}
            </span>
          </button>
        </form>

        {/* Collapsible Technical & Idempotency Details */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setShowTechDetails((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Advanced Security & Idempotency Protection Settings</span>
            {showTechDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showTechDetails && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-slate-700">
                  Idempotency-Key Header (Prevents accidental double charges):
                </span>
                <button
                  type="button"
                  onClick={() => setIdempotencyKey(generateUuid())}
                  className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 font-semibold text-blue-600 hover:bg-blue-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Generate New Key</span>
                </button>
              </div>
              <input
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800"
              />
              <label className="mt-2.5 flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={autoRotateKey}
                  onChange={(e) => setAutoRotateKey(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>Automatically generate a fresh key after each successful transaction</span>
              </label>
            </div>
          )}
        </div>
      </div>

      <ReceiptModal
        receipt={receipt}
        idempotencyKey={lastUsedKey}
        onClose={() => setReceipt(null)}
      />
    </div>
  );
};
