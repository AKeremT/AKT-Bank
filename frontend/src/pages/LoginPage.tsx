import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { extractErrorResponse } from '../api/client';
import { ErrorResponse } from '../types/banking';
import { ErrorAlert } from '../components/ErrorAlert';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('teller_user');
  const [password, setPassword] = useState('teller_user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const handleQuickStart = async (presetUser = 'teller_user', targetPath = '/dashboard') => {
    try {
      setLoading(true);
      setError(null);
      await login(presetUser, presetUser);
      navigate(targetPath);
    } catch (err) {
      setError(extractErrorResponse(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login(username.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(extractErrorResponse(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#F8FAFC] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Brand Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-700 text-white shadow-xl shadow-blue-700/25">
            <Building2 className="h-9 w-9" />
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900">
            AKT Bank
          </h1>
          <p className="mt-2 text-lg font-medium text-blue-700">
            Simplicity in Every Step. Precision in Every Transaction.
          </p>
          <p className="mx-auto mt-1 max-w-xl text-sm text-slate-500">
            Welcome to our easy-to-use digital banking portal. Open an account, add funds, and
            transfer money in just three simple clicks.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: 1-Click Beginner Entry */}
          <div className="flex flex-col justify-between rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-700 to-indigo-800 p-8 text-white shadow-xl lg:col-span-7">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-100">
                <Sparkles className="h-3.5 w-3.5" />
                Recommended for Everyone
              </span>
              <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">
                Start Banking with One Click
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-blue-100">
                New here? No problem! Click the button below to enter the portal immediately with
                our <strong>Smart Auto-Pilot</strong> enabled—or view our step-by-step interactive
                tutorial first.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-blue-50">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                  <span>
                    <strong>Step 1:</strong> Create a customer profile in 5 seconds
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                  <span>
                    <strong>Step 2:</strong> Open a free TRY, USD, or EUR bank account
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                  <span>
                    <strong>Step 3:</strong> Click your account card to add or send money
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickStart('teller_user', '/dashboard')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-extrabold text-blue-800 shadow-lg transition hover:bg-blue-50 disabled:opacity-50"
              >
                <span>{loading ? 'Entering AKT Bank...' : 'Enter AKT Bank Now (1-Click)'}</span>
                <ArrowRight className="h-5 w-5" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickStart('teller_user', '/tutorial')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
              >
                <span>First Time? Open Step-by-Step Tutorial</span>
              </button>
            </div>
          </div>

          {/* Right Column: Standard Sign In Form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm lg:col-span-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Lock className="h-5 w-5 text-blue-600" />
              <span>Account Sign In</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Sign in with your username and password or pick a test profile below.
            </p>

            <div className="mt-4">
              <ErrorAlert error={error} onClose={() => setError(null)} />
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  placeholder="teller_user"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Or Choose a Specific Role Profile:
              </p>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickStart('teller_user', '/dashboard')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Teller
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStart('customer_user', '/dashboard')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStart('system_admin', '/dashboard')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  System
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
              <span>Protected by 256-bit JWT security & atomic ledger verification.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
