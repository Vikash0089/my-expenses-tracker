import { Paperclip, Pencil, Trash2 } from 'lucide-react';
import { TYPES } from '../utils/constants';
import { formatTime, money } from '../utils/format';

export const txTitle = (t) => {
  if (t.type === 'sent') return `Sent to ${t.to || 'someone'}`;
  if (t.type === 'received') return `Received from ${t.from || 'someone'}`;
  if (t.type === 'income') return t.merchant || t.category?.name || 'Income';
  return t.merchant || t.description || t.category?.name || 'Expense';
};

const FALLBACK_ICON = { expense: '🧾', income: '💰', sent: '💸', received: '🤝' };

export default function TransactionItem({ tx, currency, onEdit, onDelete }) {
  const meta = TYPES[tx.type];
  const icon = tx.category?.icon || FALLBACK_ICON[tx.type];
  const sub = [formatTime(tx.time), tx.category?.name || meta.label, tx.paymentMethod].filter(Boolean).join(' · ');

  return (
    <li className="group flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${meta.soft}`} aria-hidden="true">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{txTitle(tx)}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{sub}</p>
        {tx.description && tx.type !== 'expense' && <p className="truncate text-xs text-slate-400">{tx.description}</p>}
      </div>
      <div className="flex items-center gap-1">
        <div className="flex items-center opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          {tx.receiptUrl && (
            <a href={tx.receiptUrl} target="_blank" rel="noreferrer" className="icon-btn" aria-label="View receipt"><Paperclip size={15} /></a>
          )}
          {onEdit && <button type="button" className="icon-btn" onClick={() => onEdit(tx)} aria-label="Edit transaction"><Pencil size={15} /></button>}
          {onDelete && <button type="button" className="icon-btn" onClick={() => onDelete(tx)} aria-label="Delete transaction"><Trash2 size={15} /></button>}
        </div>
        <span className={`w-24 text-right text-sm font-semibold tabular-nums sm:w-28 ${meta.text}`}>
          {meta.sign}{money(tx.amount, currency)}
        </span>
      </div>
    </li>
  );
}
