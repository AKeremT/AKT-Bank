import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Check,
  FileSpreadsheet,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { accountApi } from '../api/bankingApi';
import { extractErrorResponse } from '../api/client';
import { AccountStatementResponse, ErrorResponse } from '../types/banking';
import { useAuth } from '../context/AuthContext';
import { ErrorAlert } from '../components/ErrorAlert';

export const StatementPage: React.FC = () => {
  const { knownAccounts, getCustomerNameById } = useAuth();
  const [searchParams] = useSearchParams();

  const userAccounts = knownAccounts.filter(
    (a) => a.accountNumber !== 'TR000000000000000000000001'
  );
  const initialIban = searchParams.get('iban') || userAccounts[0]?.accountNumber || '';

  const [accountNumber, setAccountNumber] = useState(initialIban);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statement, setStatement] = useState<AccountStatementResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const fetchStatement = async (ibanToFetch: string) => {
    if (!ibanToFetch.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const startIso = startDate ? new Date(startDate).toISOString() : undefined;
      const endIso = endDate ? new Date(endDate).toISOString() : undefined;
      const data = await accountApi.getStatement(ibanToFetch.trim(), startIso, endIso);
      setStatement(data);
    } catch (err) {
      setError(extractErrorResponse(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialIban) {
      setAccountNumber(initialIban);
      fetchStatement(initialIban);
    }
  }, [initialIban]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatement(accountNumber);
  };

  return (
    <div className="space-y-7">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
          Account Statement & Transaction History
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Account Activity & Balance Summary
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Click on any of your accounts below to view all money coming in and going out.
        </p>
      </div>

      {/* Visual Account Selector Strip */}
      {userAccounts.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {userAccounts.map((a) => {
            const isSelected = accountNumber === a.accountNumber;
            return (
              <button
                key={a.accountNumber}
                type="button"
                onClick={() => {
                  setAccountNumber(a.accountNumber);
                  fetchStatement(a.accountNumber);
                }}
                className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">
                    {getCustomerNameById(a.customerId)} ({a.currency} {a.accountType})
                  </span>
                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <p className="mt-2 font-mono text-lg font-extrabold text-blue-700">
                  {Number(a.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
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

      {/* Search & Date Filter Bar */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700">
              Account IBAN Number
            </label>
            <input
              type="text"
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="TR..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>From Date (Optional)</span>
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>To Date (Optional)</span>
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-end md:col-span-1">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              <span>Load</span>
            </button>
          </div>
        </div>
      </form>

      <ErrorAlert error={error} onClose={() => setError(null)} />

      {statement && (
        <div className="space-y-6">
          {/* 4 Summary Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Current Balance</span>
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
              <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900">
                {Number(statement.currentBalance).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}{' '}
                <span className="text-sm font-bold text-blue-600">{statement.currency}</span>
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>Total Money In (+)</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 font-mono text-2xl font-extrabold text-emerald-700">
                +
                {Number(statement.totalCredit).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}{' '}
                <span className="text-sm font-bold">{statement.currency}</span>
              </p>
            </div>

            <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
                <span>Total Money Out (-)</span>
                <TrendingDown className="h-4 w-4 text-rose-600" />
              </div>
              <p className="mt-2 font-mono text-2xl font-extrabold text-rose-700">
                -
                {Number(statement.totalDebit).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}{' '}
                <span className="text-sm font-bold">{statement.currency}</span>
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Net Period Change</span>
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              </div>
              <p
                className={`mt-2 font-mono text-2xl font-extrabold ${
                  Number(statement.netChange) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {Number(statement.netChange) >= 0 ? '+' : ''}
                {Number(statement.netChange).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}{' '}
                <span className="text-sm font-bold">{statement.currency}</span>
              </p>
            </div>
          </div>

          {/* Transaction History Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-extrabold text-slate-900">
                Transaction History ({statement.items.length} Records)
              </h3>
              <span className="font-mono text-xs text-slate-500">{statement.accountNumber}</span>
            </div>

            {statement.items.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No transactions found for this account yet. Add or send money to see your history
                here!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Direction</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Description</th>
                      <th className="px-5 py-3.5">Receipt Reference</th>
                      <th className="px-5 py-3.5">Date & Time</th>
                      <th className="px-5 py-3.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statement.items.map((item, idx) => {
                      const isCredit = item.entryType === 'CREDIT';
                      const friendlyType =
                        item.transactionType === 'DEPOSIT'
                          ? 'Cash Deposit'
                          : item.transactionType === 'WITHDRAW'
                          ? 'Cash Withdrawal'
                          : 'Account Transfer';

                      return (
                        <tr
                          key={`${item.referenceNumber}-${idx}`}
                          className="transition hover:bg-slate-50/80"
                        >
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                                isCredit
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDownLeft className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              )}
                              {isCredit ? 'Money In (+)' : 'Money Out (-)'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-800">
                            {friendlyType}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">{item.description || '-'}</td>
                          <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">
                            {item.referenceNumber}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-500">
                            {new Date(item.createdAt).toLocaleString('en-US')}
                          </td>
                          <td
                            className={`px-5 py-3.5 text-right font-mono text-sm font-extrabold ${
                              isCredit ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isCredit ? '+' : '-'}
                            {Number(item.amount).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            {statement.currency}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
