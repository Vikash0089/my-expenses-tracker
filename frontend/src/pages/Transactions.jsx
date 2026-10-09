import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import TransactionItem from '../components/TransactionItem';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import { useTransactionForm } from '../context/TransactionFormContext';
import * as txService from '../services/transactionService';
import { categoryService } from '../services/resourceServices';
import { errorMessage } from '../services/api';
import { PAYMENT_METHODS, TYPE_LIST } from '../utils/constants';
import { formatDate, pad } from '../utils/format';

const now = new Date();
const thisMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

export default function Transactions() {
  const { currency } = useAuth();
  const { openForm, txVersion, bump } = useTransactionForm();
  const [params] = useSearchParams();
  const [f, setF] = useState({ search: params.get('search') || '', month: thisMonth, date: '', type: '', categoryId: '', paymentMethod: '', minAmount: '', maxAmount: '', sort: 'newest' });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const search = useDebounce(f.search);

  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setPage(1); };
  const { data: cats } = useFetch(() => categoryService.list(), []);

  const query = useMemo(() => {
    const q = { page, limit: 20, sort: f.sort };
    if (search) q.search = search;
    if (f.date) q.date = f.date;
    else if (f.month) { const [y, m] = f.month.split('-'); q.year = y; q.month = Number(m); }
    ['type', 'categoryId', 'paymentMethod', 'minAmount', 'maxAmount'].forEach((k) => f[k] && (q[k] = f[k]));
    return q;
  }, [f, search, page]);

  const { data, error, reload, loading } = useFetch(() => txService.list(query), [JSON.stringify(query), txVersion]);

  const grouped = useMemo(() => {
    const map = new Map();
    (data?.items || []).forEach((t) => { const k = t.date.slice(0, 10); map.set(k, [...(map.get(k) || []), t]); });
    return [...map.entries()];
  }, [data]);

  const confirmDelete = async () => {
    setDeleting(true);
    try { await txService.remove(toDelete._id); toast.success('Transaction deleted'); setToDelete(null); bump(); }
    catch (e) { toast.error(errorMessage(e)); }
    finally { setDeleting(false); }
  };

  const reset = () => { setF({ search: '', month: thisMonth, date: '', type: '', categoryId: '', paymentMethod: '', minAmount: '', maxAmount: '', sort: 'newest' }); setPage(1); };
  const meta = data?.meta;

  return (
    <div>
      <PageHeader title="Transactions" subtitle={meta ? `${meta.total} result${meta.total === 1 ? '' : 's'}` : ' '} actions={<button className="btn-primary" onClick={() => openForm()}><Plus size={16} /> Add Transaction</button>} />

      <div className="card mb-4 space-y-3 p-3 sm:p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search transactions..." aria-label="Search transactions" value={f.search} onChange={set('search')} />
          </div>
          <button type="button" className="btn-secondary md:hidden" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}><SlidersHorizontal size={16} /> Filters</button>
        </div>
        <div className={`${showFilters ? 'grid' : 'hidden'} grid-cols-2 gap-2 md:grid md:grid-cols-4`}>
          <input type="month" aria-label="Month" className="input" value={f.month} onChange={(e) => { setF((s) => ({ ...s, month: e.target.value, date: '' })); setPage(1); }} />
          <input type="date" aria-label="Specific date" className="input" value={f.date} onChange={set('date')} />
          <select aria-label="Type" className="input" value={f.type} onChange={set('type')}><option value="">All Types</option>{TYPE_LIST.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select>
          <select aria-label="Category" className="input" value={f.categoryId} onChange={set('categoryId')}><option value="">All Categories</option>{(cats || []).map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}</select>
          <select aria-label="Payment method" className="input" value={f.paymentMethod} onChange={set('paymentMethod')}><option value="">All Payment Methods</option>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select>
          <input type="number" min="0" aria-label="Minimum amount" placeholder="Min amount" className="input" value={f.minAmount} onChange={set('minAmount')} />
          <input type="number" min="0" aria-label="Maximum amount" placeholder="Max amount" className="input" value={f.maxAmount} onChange={set('maxAmount')} />
          <select aria-label="Sort" className="input" value={f.sort} onChange={set('sort')}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option><option value="lowest">Lowest amount</option></select>
        </div>
        <button type="button" className="text-xs text-indigo-600 hover:underline" onClick={reset}>Reset filters</button>
      </div>

      {error && !data ? <ErrorState message={error} onRetry={reload} /> : !data ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : grouped.length === 0 ? (
        <div className="card"><EmptyState icon="🔍" title="No transactions found" text="Try changing your filters, or add a new transaction." action={<button className="btn-primary" onClick={() => openForm()}><Plus size={16} /> Add Transaction</button>} /></div>
      ) : (
        <div className={`space-y-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {grouped.map(([date, items]) => (
            <section key={date} className="card p-3">
              <h2 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{formatDate(date)}</h2>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((t) => <TransactionItem key={t._id} tx={t} currency={currency} onEdit={(tx) => openForm({ editing: tx })} onDelete={setToDelete} />)}
              </ul>
            </section>
          ))}
          {meta.pages > 1 && (
            <div className="flex items-center justify-between">
              <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span className="text-sm text-slate-500">Page {meta.page} of {meta.pages}</span>
              <button className="btn-secondary" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting} title="Delete transaction?" message="This transaction will be permanently removed." />
    </div>
  );
}
