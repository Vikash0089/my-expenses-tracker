import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState, Field, PageHeader, Skeleton } from '../components/ui';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useTransactionForm } from '../context/TransactionFormContext';
import { categoryService, recurringService } from '../services/resourceServices';
import { errorMessage } from '../services/api';
import { FREQUENCIES, PAYMENT_METHODS, TYPES } from '../utils/constants';
import { formatDate, money, todayStr } from '../utils/format';

function RecurringForm({ item, cats, currency, onDone }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: item?.title || '', amount: item?.amount ?? '', type: item?.type || 'expense', categoryId: item?.categoryId?._id || item?.categoryId || '',
      frequency: item?.frequency || 'monthly', startDate: item?.startDate?.slice(0, 10) || todayStr(), endDate: item?.endDate?.slice(0, 10) || '', paymentMethod: item?.paymentMethod || '',
    },
  });
  const type = watch('type');
  const submit = async (v) => {
    try {
      const body = { ...v, amount: Number(v.amount), categoryId: v.categoryId || undefined, endDate: v.endDate || undefined, paymentMethod: v.paymentMethod || undefined, active: item?.active ?? true };
      if (item) await recurringService.update(item._id, body); else await recurringService.create(body);
      toast.success(item ? 'Recurring transaction updated' : 'Recurring transaction created');
      onDone();
    } catch (e) { toast.error(errorMessage(e)); }
  };
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <Field label="Title" error={errors.title?.message}><input className="input" placeholder="e.g. Rent" autoFocus {...register('title', { required: 'Title is required' })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Amount (${currency})`} error={errors.amount?.message}><input type="number" step="0.01" className="input" {...register('amount', { required: 'Enter an amount', min: { value: 0.01, message: 'Must be greater than 0' } })} /></Field>
        <Field label="Type"><select className="input" {...register('type')}><option value="expense">Expense</option><option value="income">Income</option></select></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category" error={errors.categoryId?.message}>
          <select className="input" {...register('categoryId', { required: type === 'expense' ? 'Choose a category' : false })}><option value="">{type === 'expense' ? 'Select' : 'None'}</option>{cats.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}</select>
        </Field>
        <Field label="Frequency"><select className="input capitalize" {...register('frequency')}>{FREQUENCIES.map((f) => <option key={f}>{f}</option>)}</select></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date"><input type="date" className="input" {...register('startDate', { required: true })} /></Field>
        <Field label="End date (optional)"><input type="date" className="input" {...register('endDate')} /></Field>
      </div>
      <Field label="Payment method"><select className="input" {...register('paymentMethod')}><option value="">Not specified</option>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select></Field>
      <p className="text-xs text-slate-500">Transactions are posted automatically on each due date.</p>
      <div className="flex justify-end"><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</button></div>
    </form>
  );
}

export default function Recurring() {
  const { currency } = useAuth();
  const { txVersion, bump } = useTransactionForm();
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  const { data, error, reload } = useFetch(() => recurringService.list(), [txVersion]);
  const { data: cats } = useFetch(() => categoryService.list(), []);

  const toggle = async (r) => {
    try {
      await recurringService.update(r._id, { title: r.title, amount: r.amount, type: r.type, categoryId: r.categoryId?._id, frequency: r.frequency, startDate: r.startDate.slice(0, 10), endDate: r.endDate?.slice(0, 10), paymentMethod: r.paymentMethod, active: !r.active });
      reload();
    } catch (e) { toast.error(errorMessage(e)); }
  };
  const remove = async () => {
    try { await recurringService.remove(del._id); toast.success('Deleted'); setDel(null); reload(); } catch (e) { toast.error(errorMessage(e)); }
  };
  const done = () => { setEdit(null); reload(); bump(); };

  return (
    <div>
      <PageHeader title="Recurring" subtitle="Rent, subscriptions, salary and other repeating transactions" actions={<button className="btn-primary" onClick={() => setEdit({})}><Plus size={16} /> New recurring</button>} />
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : !data ? <Skeleton className="h-48" /> : data.length === 0 ? (
        <div className="card"><EmptyState icon="🔁" title="Nothing recurring yet" text="Add rent, subscriptions or salary once and they'll be recorded automatically." action={<button className="btn-primary" onClick={() => setEdit({})}>Add recurring</button>} /></div>
      ) : (
        <ul className="space-y-2">
          {data.map((r) => (
            <li key={r._id} className={`card flex items-center gap-3 p-4 ${r.active ? '' : 'opacity-60'}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${TYPES[r.type].soft}`}>{r.categoryId?.icon || '🔁'}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.title}</p>
                <p className="text-xs capitalize text-slate-500">{r.frequency} · {r.active ? `next ${formatDate(r.nextDueDate)}` : 'paused / ended'}</p>
              </div>
              <span className={`font-semibold tabular-nums ${TYPES[r.type].text}`}>{money(r.amount, currency)}</span>
              <button className="icon-btn" onClick={() => toggle(r)} aria-label={r.active ? 'Pause' : 'Resume'}>{r.active ? <Pause size={15} /> : <Play size={15} />}</button>
              <button className="icon-btn" onClick={() => setEdit(r)} aria-label={`Edit ${r.title}`}><Pencil size={15} /></button>
              <button className="icon-btn" onClick={() => setDel(r)} aria-label={`Delete ${r.title}`}><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?._id ? 'Edit recurring' : 'New recurring'}>
        {edit && <RecurringForm key={edit._id || 'new'} item={edit._id ? edit : null} cats={cats || []} currency={currency} onDone={done} />}
      </Modal>
      <ConfirmDialog open={Boolean(del)} onClose={() => setDel(null)} onConfirm={remove} title={`Delete "${del?.title}"?`} message="Future transactions will no longer be created. Past ones are kept." />
    </div>
  );
}
