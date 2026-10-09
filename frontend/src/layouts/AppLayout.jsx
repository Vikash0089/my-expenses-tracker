import { useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3, Calendar, LayoutDashboard, LogOut, Menu, Moon, PiggyBank, Plus, Repeat, Search, Settings, Sun, Tags, Target, ArrowLeftRight, Users, Wallet, X, MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TransactionFormProvider, useTransactionForm } from '../context/TransactionFormContext';
import NotificationBell from '../components/NotificationBell';
import useClickOutside from '../hooks/useClickOutside';


const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/people', label: 'People', icon: Users },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/goals', label: 'Savings Goals', icon: Target },
  { to: '/recurring', label: 'Recurring', icon: Repeat },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

function Logo() {
  return (
    <div className="flex items-center gap-2 text-lg font-bold">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white"><Wallet size={20} /></span>
      Expenses Tracker
    </div>
  );
}

function Sidebar({ onNavigate }) {
  return (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Main">
      <div className="mb-4 px-2 py-1"><Logo /></div>
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={linkClass} onClick={onNavigate}><Icon size={18} />{label}</NavLink>
      ))}
    </nav>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  useClickOutside(ref, () => setOpen(false), open);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900" aria-label="Account menu" aria-expanded={open}>
        {user.name.slice(0, 1).toUpperCase()}
      </button>
      {open && (
        <div className="card absolute right-0 top-full z-40 mt-2 w-56 p-1.5 shadow-xl">
          <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <button type="button" className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { setOpen(false); navigate('/settings'); }}><Settings size={16} /> Settings</button>
          <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={logout}><LogOut size={16} /> Log out</button>
        </div>
      )}
    </div>
  );
}

function Shell() {
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { openForm } = useTransactionForm();

  const search = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/transactions?search=${encodeURIComponent(q.trim())}` : '/transactions');
    setQ('');
  };

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900"><Sidebar /></aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDrawer(false)} aria-hidden="true" />
          <div className="relative h-full w-72 max-w-[85%] overflow-y-auto bg-white shadow-2xl dark:bg-slate-900">
            <button type="button" className="icon-btn absolute right-3 top-4" onClick={() => setDrawer(false)} aria-label="Close menu"><X size={18} /></button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <button type="button" className="icon-btn lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="lg:hidden"><Logo /></div>
          <form onSubmit={search} className="relative hidden max-w-md flex-1 md:block" role="search">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-9" placeholder="Search transactions…" aria-label="Search transactions" />
          </form>
          <div className="ml-auto flex items-center gap-1.5">
            <button type="button" className="btn-primary hidden md:inline-flex" onClick={() => openForm()}><Plus size={16} /> Add</button>
            <button type="button" className="icon-btn md:hidden" onClick={() => navigate('/transactions')} aria-label="Search"><Search size={19} /></button>
            <button type="button" className="icon-btn" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 lg:pb-10"><Outlet /></main>
      </div>

      <button type="button" onClick={() => openForm()} className="btn-primary fixed bottom-20 right-4 z-30 h-14 rounded-full px-5 shadow-lg md:hidden" aria-label="Add transaction"><Plus size={20} /> Add</button>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-slate-800 dark:bg-slate-900" aria-label="Quick navigation">
        {[NAV[0], NAV[1], NAV[2]].map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}><Icon size={20} />{label}</NavLink>
        ))}
        <button type="button" onClick={() => setDrawer(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-slate-500"><MoreHorizontal size={20} />More</button>
      </nav>
    </div>
  );
}

export default function AppLayout() {
  return (
    <TransactionFormProvider>
      <Shell />
    </TransactionFormProvider>
  );
}
