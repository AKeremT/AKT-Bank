import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  FileSpreadsheet,
  Home,
  LogOut,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, smartAssist, setSmartAssist, quickSwitchUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          {/* Brand & Slogan */}
          <div className="flex items-center gap-6">
            <NavLink to="/dashboard" className="flex items-center gap-3 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-md shadow-blue-700/25 transition group-hover:bg-blue-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900">
                    AKT Bank
                  </span>
                  <span className="hidden rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 sm:inline-block">
                    Digital Portal
                  </span>
                </div>
                <span className="block text-xs font-medium text-slate-500">
                  Simplicity in Every Step. Precision in Every Transaction.
                </span>
              </div>
            </NavLink>

            {/* Primary Navigation Links */}
            <nav className="hidden items-center gap-1.5 lg:flex">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Home className="h-4 w-4" />
                <span>1. Accounts & Profile</span>
              </NavLink>

              <NavLink
                to="/transfers"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span>2. Add & Send Money</span>
              </NavLink>

              <NavLink
                to="/statements"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>3. Account Activity</span>
              </NavLink>

              <NavLink
                to="/tutorial"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  }`
                }
              >
                <BookOpen className="h-4 w-4" />
                <span>How It Works (Tutorial)</span>
              </NavLink>
            </nav>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                title="Role & Auto-Pilot Settings"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span className="hidden sm:inline">
                  {smartAssist ? 'Smart Auto-Pilot: ON' : `Role: ${user?.role}`}
                </span>
                <Settings2 className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Smart Role Auto-Pilot</p>
                      <p className="text-[11px] text-slate-500">
                        Automatically selects the right permission for every action
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={smartAssist}
                      onChange={(e) => setSmartAssist(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                  </div>

                  <div className="mt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Active Session Role ({user?.username})
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => quickSwitchUser('customer_user')}
                        className={`rounded-lg px-2 py-1.5 text-xs font-bold transition ${
                          user?.role === 'CUSTOMER'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        CUSTOMER
                      </button>
                      <button
                        type="button"
                        onClick={() => quickSwitchUser('teller_user')}
                        className={`rounded-lg px-2 py-1.5 text-xs font-bold transition ${
                          user?.role === 'TELLER'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        TELLER
                      </button>
                      <button
                        type="button"
                        onClick={() => quickSwitchUser('system_admin')}
                        className={`rounded-lg px-2 py-1.5 text-xs font-bold transition ${
                          user?.role === 'SYSTEM'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        SYSTEM
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
              }`
            }
          >
            1. Accounts
          </NavLink>
          <NavLink
            to="/transfers"
            className={({ isActive }) =>
              `shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
              }`
            }
          >
            2. Add & Send Money
          </NavLink>
          <NavLink
            to="/statements"
            className={({ isActive }) =>
              `shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
              }`
            }
          >
            3. Activity
          </NavLink>
          <NavLink
            to="/tutorial"
            className={({ isActive }) =>
              `shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${
                isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
              }`
            }
          >
            How It Works (Tutorial)
          </NavLink>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-5 text-center text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 sm:px-6">
          <span className="font-semibold text-slate-700">
            AKT Bank — Simplicity in Every Step. Precision in Every Transaction.
          </span>
          <span>
            Secured by Double-Entry Bookkeeping • Deadlock-Free Locking • Idempotency Protection
          </span>
        </div>
      </footer>
    </div>
  );
};
