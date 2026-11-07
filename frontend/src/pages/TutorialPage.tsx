import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CreditCard,
  FileSpreadsheet,
  Play,
  Sparkles,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { accountApi, customerApi, transferApi } from '../api/bankingApi';
import { extractErrorResponse } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ErrorResponse } from '../types/banking';
import { ErrorAlert } from '../components/ErrorAlert';

function randomDigits(len: number): string {
  let out = '1';
  for (let i = 1; i < len; i++) {
    out += Math.floor(Math.random() * 10).toString();
  }
  return out;
}

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

export const TutorialPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerKnownCustomer, registerKnownAccounts } = useAuth();

  const [runningDemo, setRunningDemo] = useState(false);
  const [demoStepText, setDemoStepText] = useState<string | null>(null);
  const [demoComplete, setDemoComplete] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const handleOneClickDemoSetup = async () => {
    try {
      setRunningDemo(true);
      setError(null);
      setDemoComplete(false);

      // Step 1: Create Customer
      setDemoStepText('Step 1/4: Creating a sample customer profile (Alice Carter)...');
      const idNum = randomDigits(11);
      const customer = await customerApi.createCustomer({
        identityNumber: idNum,
        firstName: 'Alice',
        lastName: 'Carter',
        email: `alice.${idNum.slice(-4)}@aktbank.com`,
      });
      registerKnownCustomer(customer);

      // Step 2: Open 2 Bank Accounts (Checking & Savings in TRY)
      setDemoStepText('Step 2/4: Opening two bank accounts (Checking & Savings)...');
      const checkingAcc = await accountApi.createAccount({
        customerId: customer.id,
        currency: 'TRY',
        accountType: 'CHECKING',
      });
      const savingsAcc = await accountApi.createAccount({
        customerId: customer.id,
        currency: 'TRY',
        accountType: 'SAVINGS',
      });

      // Step 3: Deposit 5,000 TRY into Checking Account
      setDemoStepText('Step 3/4: Adding 5,000.00 TRY initial cash into Checking Account...');
      await transferApi.deposit(
        {
          accountNumber: checkingAcc.accountNumber,
          amount: 5000,
          description: 'Welcome Cash Deposit',
        },
        generateUuid()
      );

      // Step 4: Transfer 1,250 TRY from Checking to Savings Account
      setDemoStepText('Step 4/4: Sending 1,250.00 TRY from Checking to Savings Account...');
      await transferApi.transfer(
        {
          senderAccountNumber: checkingAcc.accountNumber,
          receiverAccountNumber: savingsAcc.accountNumber,
          amount: 1250,
          description: 'Monthly Savings Transfer',
        },
        generateUuid()
      );

      // Refresh balances
      const updatedAccounts = await accountApi.getAccountsByCustomerId(customer.id);
      registerKnownAccounts(updatedAccounts);

      setDemoStepText(null);
      setDemoComplete(true);
    } catch (err) {
      setError(extractErrorResponse(err));
      setDemoStepText(null);
    } finally {
      setRunningDemo(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-100">
              <BookOpen className="h-3.5 w-3.5" />
              Beginner-Friendly Interactive Guide
            </span>
            <h1 className="mt-3 text-3xl font-extrabold">
              How to Use AKT Bank in 4 Easy Steps
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-blue-100">
              Never used a digital banking system before? Follow the four simple cards below, or
              click the <strong>1-Click Demo Setup</strong> button on the right to watch AKT Bank
              automatically create a customer, open two accounts, deposit money, and make a transfer
              for you!
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <button
              type="button"
              disabled={runningDemo}
              onClick={handleOneClickDemoSetup}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>
                {runningDemo
                  ? 'Running Automatic Demo...'
                  : '1-Click Auto-Setup Demo Accounts & Money'}
              </span>
            </button>
          </div>
        </div>

        {demoStepText && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold text-white">
            <Sparkles className="h-5 w-5 animate-spin text-amber-300" />
            <span>{demoStepText}</span>
          </div>
        )}

        {demoComplete && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-emerald-500/25 border border-emerald-300/40 p-4 text-white">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-300" />
              <div className="text-sm">
                <strong>All Done!</strong> We created <strong>Alice Carter</strong>, opened two
                accounts, added <strong>5,000.00 TRY</strong>, and transferred{' '}
                <strong>1,250.00 TRY</strong> into her Savings account!
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-blue-800 hover:bg-blue-50"
              >
                View Accounts Now →
              </button>
              <button
                type="button"
                onClick={() => navigate('/statements')}
                className="rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
              >
                View Account Activity →
              </button>
            </div>
          </div>
        )}
      </div>

      <ErrorAlert error={error} onClose={() => setError(null)} />

      {/* 4 Step-by-Step Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Step 1 */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                STEP 1
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <UserPlus className="h-5 w-5" />
              </div>
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              1. Create a Customer Profile
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Every bank account belongs to a person. Go to the{' '}
              <strong>1. Accounts & Profile</strong> tab. On the left side, click the{' '}
              <strong>"Fill Sample Person"</strong> button to automatically fill in a name, ID
              number, and email, then click <strong>"Create Customer Profile"</strong>.
            </p>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
            >
              <span>Go to Step 1 (Create Profile)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                STEP 2
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              2. Open Your Bank Account (IBAN)
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Once your profile appears on the right side of the screen, choose your currency (
              <strong>TRY</strong>, <strong>USD</strong>, or <strong>EUR</strong>) and account type
              (<strong>Checking</strong> or <strong>Savings</strong>), then click{' '}
              <strong>"+ Open New Bank Account"</strong>. Your unique IBAN card will appear
              instantly!
            </p>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
            >
              <span>Go to Step 2 (Open Account)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                STEP 3
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Wallet className="h-5 w-5" />
              </div>
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              3. Add Money to Your Account
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              New accounts start with a <strong>0.00</strong> balance. Click the{' '}
              <strong>"+ Add Money"</strong> button right on your account card (or open the{' '}
              <strong>2. Add & Send Money</strong> tab). Click your account card, pick an amount
              like <strong>+1,000</strong>, and click <strong>"Add Money Now"</strong>!
            </p>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => navigate('/transfers?mode=deposit')}
              className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-800"
            >
              <span>Go to Step 3 (Add Money)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-700">
                STEP 4
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              4. Send Money & Check Your Statement
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Want to transfer money between two accounts? Open{' '}
              <strong>2. Add & Send Money</strong> and choose{' '}
              <strong>"Send Money to Another Account"</strong>. Click the sender card, click the
              recipient card (must share the same currency), enter an amount, and press{' '}
              <strong>Send Money</strong>. Then check <strong>3. Account Activity</strong> to see
              your full statement!
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => navigate('/transfers?mode=transfer')}
              className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800"
            >
              <span>Send Money</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/statements')}
              className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>View Activity</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
