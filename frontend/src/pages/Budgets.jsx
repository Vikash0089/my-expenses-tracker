import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import MonthSelector from '../components/MonthSelector';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState, Field, PageHeader, ProgressBar, Skeleton } from '../components/ui';
import useFetch from '../hooks/useFetch';
import useMonth from '../hooks/useMonth';
import { useAuth } from '../context/AuthContext';
import { useTransactionForm } from '../context/TransactionFormContext';
import { budgetService, categoryService } from '../services/resourceServices';
import { errorMessage } from '../services/api';
import { monthLabel, money } from '../utils/format';

export default function Budgets() {
  const { currency } = useAuth();
  const { txVersion } = useTransactionForm();
  const [ym, setYm] = useMonth();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const { data, error, reload } = useFetch(() => budgetService.list({ month: ym.month, year: ym.year }), [ym.year, ym.month, txVersion]);
  const { data: cats } = useFetch(() => categoryService.list(), []);
  const budget = data?.[0];

  const remove = async () => {
    try { await budgetService.remove(budget._id); toast.success('Budget deleted'); setConfirm(false); reload(); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <div>
      <PageHeader title="Budgets" actions={data && <button className="btn-primary" onClick={() => setEditing(true)}><Plus size={16} />{budget ? 'Edit budget' : 'Set budget'}</button>} />
      <div className="mb-5"><MonthSelector year={ym.year} month={ym.month} onChange={setYm} /></div>

      {error && !data ? <ErrorState message={error} onRetry={reload} /> : !data ? <Skeleton className="h-64" /> : !budget ? (
        <div className="card"><EmptyState icon="🎯" title={`No budget for ${monthLabel(ym.year, ym.month)}`} text="Set a monthly budget and optional category limits. You'll get a warning as you approach them." action={<button className="btn-primary" onClick={() => setEditing(true)}>Set budget</button>} /></div>
      ) : (
        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold">{monthLabel(ym.year, ym.month)} budget</h2>
            <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
              <div><p className="text-xs text-slate-500">Total budget</p><p className="text-lg font-bold">{money(budget.status.totalBudget, currency)}</p></div>
              <div><p className="text-xs text-slate-500">Spent</p><p className="text-lg font-bold text-red-600 dark:text-red-400">{money(budget.status.totalSpent, currency)}</p></div>
              <div><p className="text-xs text-slate-500">Remaining</p><p className={`text-lg font-bold ${budget.status.remaining < 0 ? 'text-red-600' : ''}`}>{money(budget.status.remaining, currency)}</p></div>
            </div>
            <div className="mt-4"><ProgressBar value={budget.status.percentUsed} status={budget.status.status} /></div>
            <p className="mt-1 text-sm text-slate-500">{Math.round(budget.status.percentUsed)}% used</p>
            {budget.status.status !== 'ok' && (
              <p className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${budget.status.status === 'exceeded' ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'}`} role="alert">
                <AlertTriangle size={16} />{budget.status.status === 'exceeded' ? 'Your monthly budget has been exceeded.' : 'You are close to your monthly budget.'}
              </p>
            )}
          </section>

          {budget.status.categories.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-3 font-semibold">Category budgets</h2>
              <ul className="space-y-4">
                {budget.status.categories.map((c) => (
                  <li key={String(c.categoryId)}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{c.icon} {c.name}</span>
                      <span className="tabular-nums text-slate-500">{money(c.spent, currency)} / {money(c.budget, currency)}</span>
                    </div>
                    <ProgressBar value={c.percentUsed} status={c.status} />
                    {c.status !== 'ok' && <p className={`mt-1 text-xs ${c.status === 'exceeded' ? 'text-red-600' : 'text-amber-600'}`}>{c.status === 'exceeded' ? `Exceeded by ${money(-c.remaining, currency)}` : `${Math.round(c.percentUsed)}% used`}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <button className="btn-ghost text-red-600" onClick={() => setConfirm(true)}><Trash2 size={16} /> Delete this budget</button>
        </div>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title={`${monthLabel(ym.year, ym.month)} budget`}>
        <BudgetForm ym={ym} budget={budget} cats={cats || []} currency={currency} onDone={() => { setEditing(false); reload(); }} />
      </Modal>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={remove} title="Delete budget?" message="The budget for this month will be removed. Your transactions are not affected." />
    </div>
  );
}

function BudgetForm({ ym, budget, cats, currency, onDone }) {
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { totalAmount: budget?.totalAmount ?? '', categoryBudgets: (budget?.categoryBudgets || []).map((c) => ({ categoryId: c.categoryId, amount: c.amount })) },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'categoryBudgets' });
  useEffect(() => { if (cats.length) reset({ totalAmount: budget?.totalAmount ?? '', categoryBudgets: (budget?.categoryBudgets || []).map((c) => ({ categoryId: c.categoryId, amount: c.amount })) }); }, [cats.length]); // eslint-disable-line

  const onSubmit = async (v) => {
    try {
      await budgetService.create({ month: ym.month, year: ym.year, totalAmount: Number(v.totalAmount), categoryBudgets: v.categoryBudgets.map((c) => ({ categoryId: c.categoryId, amount: Number(c.amount) })) });
      toast.success('Budget saved');
      onDone();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label={`Total monthly budget (${currency})`} error={errors.totalAmount?.message}>
        <input type="number" step="0.01" className="input" {...register('totalAmount', { required: 'Enter your total budget', min: { value: 0, message: 'Cannot be negative' } })} />
      </Field>
      <div>
        <p className="label">Category budgets <span className="font-normal text-slate-400">(optional)</span></p>
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className="flex items-start gap-2">
              <select className="input" {...register(`categoryBudgets.${i}.categoryId`, { required: true })}>{cats.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}</select>
              <input type="number" step="0.01" placeholder="Amount" aria-label="Category budget amount" className="input !w-32" {...register(`categoryBudgets.${i}.amount`, { required: true, min: 1 })} />
              <button type="button" className="icon-btn mt-0.5" onClick={() => remove(i)} aria-label="Remove category budget"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-ghost mt-2" onClick={() => append({ categoryId: cats.find((c) => !fields.some((f) => f.categoryId === c._id))?._id || cats[0]?._id, amount: '' })} disabled={!cats.length}><Plus size={16} /> Add category budget</button>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
        <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save budget'}</button>
      </div>
    </form>
  );
}
