import { Navigate, Outlet } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/" replace />;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-white px-4 py-10 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/30">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-xl font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white"><Wallet size={22} /></span>
          Expenses Tracker
        </div>
        <div className="card p-6 sm:p-8"><Outlet /></div>
      </div>
    </div>
  );
}
