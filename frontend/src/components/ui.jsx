import { AlertCircle } from 'lucide-react';

export const Skeleton = ({ className = '' }) => <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`} />;

export const CardSkeleton = ({ rows = 3 }) => (
  <div className="card space-y-3 p-5">
    <Skeleton className="h-4 w-1/3" />
    {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
  </div>
);

export function EmptyState({ icon = '📭', title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 text-4xl" aria-hidden="true">{icon}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center" role="alert">
      <AlertCircle className="text-red-500" />
      <p className="text-sm text-slate-600 dark:text-slate-300">{message || 'Something went wrong.'}</p>
      {onRetry && <button type="button" className="btn-secondary" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ProgressBar({ value, status = 'ok' }) {
  const color = status === 'exceeded' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-500' : 'bg-indigo-500';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="error-text" role="alert">{error}</p>}
    </div>
  );
}
