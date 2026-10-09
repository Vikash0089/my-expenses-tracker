import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import TransactionItem from './TransactionItem';
import ConfirmDialog from './ConfirmDialog';
import { EmptyState, ErrorState, Skeleton } from './ui';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useTransactionForm } from '../context/TransactionFormContext';
import * as calendarService from '../services/calendarService';
import * as txService from '../services/transactionService';
import { errorMessage } from '../services/api';
import { TYPES } from '../utils/constants';
import { formatLongDate, money } from '../utils/format';

export default function DayDetails({ date }) {
  const { currency } = useAuth();
  const { openForm, txVersion, bump } = useTransactionForm();
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { data, loading, error, reload } = useFetch(() => calendarService.day(date), [date, txVersion]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await txService.remove(toDelete._id);
      toast.success('Transaction deleted');
      setToDelete(null);
      bump();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>;

  const { summary, transactions } = data;
  const rows = [['expense', summary.expense], ['income', summary.income], ['sent', summary.sent], ['received', summary.received]];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{formatLongDate(date)}</p>
        <div className="card mt-2 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Day summary</p>
          <dl className="space-y-1.5 text-sm">
            {rows.map(([t, v]) => (
              <div key={t} className="flex justify-between">
                <dt className="text-slate-600 dark:text-slate-300">{TYPES[t].label}</dt>
                <dd className={`font-medium tabular-nums ${v > 0 ? TYPES[t].text : 'text-slate-400'}`}>{money(v, currency)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold dark:border-slate-700">
              <dt>Net</dt>
              <dd className={`tabular-nums ${summary.net < 0 ? 'text-red-600 dark:text-red-400' : summary.net > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                {summary.net < 0 ? '-' : ''}{money(Math.abs(summary.net), currency)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <button type="button" className="btn-primary w-full" onClick={() => openForm({ date })}><Plus size={16} /> Add Transaction</button>

      {transactions.length === 0 ? (
        <EmptyState icon="🗓️" title="No transactions on this date." text="Add one to start tracking this day." />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {transactions.map((t) => (
            <TransactionItem key={t._id} tx={t} currency={currency} onEdit={(tx) => openForm({ editing: tx })} onDelete={setToDelete} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting}
        title="Delete transaction?" message="This transaction will be permanently removed."
      />
    </div>
  );
}
