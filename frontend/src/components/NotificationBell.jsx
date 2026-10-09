import { useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import useClickOutside from '../hooks/useClickOutside';
import { notificationService } from '../services/resourceServices';
import { useTransactionForm } from '../context/TransactionFormContext';

const DOT = { danger: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-blue-500', success: 'bg-green-500' };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { txVersion } = useTransactionForm();
  const { data } = useFetch(() => notificationService.list(), [txVersion]);
  useClickOutside(ref, () => setOpen(false), open);
  const items = data || [];

  return (
    <div ref={ref} className="relative">
      <button type="button" className="icon-btn relative" onClick={() => setOpen((o) => !o)} aria-label={`Notifications${items.length ? `, ${items.length} new` : ''}`} aria-expanded={open}>
        <Bell size={19} />
        {items.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />}
      </button>
      {open && (
        <div className="card fixed inset-x-3 top-16 z-40 max-h-[70vh] overflow-y-auto p-2 shadow-xl md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-96">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Alerts</p>
          {items.length === 0 ? (
            <p className="px-3 pb-4 text-sm text-slate-500">You're all caught up. 🎉</p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id} className="flex gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[n.level]}`} />
                  <span>{n.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
