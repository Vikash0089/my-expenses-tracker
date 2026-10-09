import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState, Field, PageHeader, ProgressBar, Skeleton } from '../components/ui';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { goalService } from '../services/resourceServices';
import { errorMessage } from '../services/api';
import { formatDate, money } from '../utils/format';

function GoalForm({ goal, currency, onDone }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: goal?.name || '', targetAmount: goal?.targetAmount ?? '', currentAmount: goal?.currentAmount ?? 0, targetDate: goal?.targetDate?.slice(0, 10) || '', notes: goal?.notes || '' },
  });
  const submit = async (v) => {
    try {
      const body = { ...v, targetAmount: Number(v.targetAmount), currentAmount: Number(v.currentAmount || 0), targetDate: v.targetDate || undefined };
      if (goal) await goalService.update(goal._id, body); else await goalService.create(body);
      toast.success(goal ? 'Goal updated' : 'Goal created');
      onDone();
    } catch (e) { toast.error(errorMessage(e)); }
  };
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <Field label="Goal name" error={errors.name?.message}><input className="input" placeholder="e.g. New laptop" autoFocus {...register('name', { required: 'Give your goal a name' })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Target (${currency})`} error={errors.targetAmount?.message}><input type="number" step="0.01" className="input" {...register('targetAmount', { required: 'Set a target', min: { value: 1, message: 'Must be at least 1' } })} /></Field>
        <Field label={`Saved so far`} error={errors.currentAmount?.message}><input type="number" step="0.01" className="input" {...register('currentAmount', { min: { value: 0, message: 'Cannot be negative' } })} /></Field>
      </div>
      <Field label="Target date"><input type="date" className="input" {...register('targetDate')} /></Field>
      <Field label="Notes"><textarea rows={2} className="input resize-none" {...register('notes')} /></Field>
      <div className="flex justify-end"><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save goal'}</button></div>
    </form>
  );
}

export default function Goals() {
  const { currency } = useAuth();
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  const { data, error, reload } = useFetch(() => goalService.list(), []);

  const remove = async () => {
    try { await goalService.remove(del._id); toast.success('Goal deleted'); setDel(null); reload(); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <div>
      <PageHeader title="Savings Goals" actions={<button className="btn-primary" onClick={() => setEdit({})}><Plus size={16} /> New goal</button>} />
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : !data ? <Skeleton className="h-48" /> : data.length === 0 ? (
        <div className="card"><EmptyState icon="🎯" title="No savings goals yet" text="Saving for something? Create a goal and track your progress." action={<button className="btn-primary" onClick={() => setEdit({})}>Create a goal</button>} /></div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((g) => {
            const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
            const remaining = Math.max(0, g.targetAmount - g.currentAmount);
            return (
              <li key={g._id} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><h2 className="truncate font-semibold">{g.name}</h2>{g.targetDate && <p className="text-xs text-slate-500">By {formatDate(g.targetDate)}</p>}</div>
                  <div className="flex"><button className="icon-btn" onClick={() => setEdit(g)} aria-label={`Edit ${g.name}`}><Pencil size={15} /></button><button className="icon-btn" onClick={() => setDel(g)} aria-label={`Delete ${g.name}`}><Trash2 size={15} /></button></div>
                </div>
                <div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">Saved {money(g.currentAmount, currency)}</span><span className="font-medium">{Math.round(pct)}%</span></div>
                <div className="mt-1"><ProgressBar value={pct} /></div>
                <p className="mt-2 text-sm text-slate-500">{remaining === 0 ? '🎉 Goal reached!' : `${money(remaining, currency)} to go · target ${money(g.targetAmount, currency)}`}</p>
                {g.notes && <p className="mt-2 text-xs text-slate-400">{g.notes}</p>}
              </li>
            );
          })}
        </ul>
      )}
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?._id ? 'Edit goal' : 'New goal'} size="md">
        {edit && <GoalForm key={edit._id || 'new'} goal={edit._id ? edit : null} currency={currency} onDone={() => { setEdit(null); reload(); }} />}
      </Modal>
      <ConfirmDialog open={Boolean(del)} onClose={() => setDel(null)} onConfirm={remove} title={`Delete "${del?.name}"?`} message="This savings goal will be permanently removed." />
    </div>
  );
}
