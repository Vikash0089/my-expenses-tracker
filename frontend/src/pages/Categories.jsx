import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState, Field, PageHeader, Skeleton } from '../components/ui';
import useFetch from '../hooks/useFetch';
import { useTransactionForm } from '../context/TransactionFormContext';
import { categoryService } from '../services/resourceServices';
import { errorMessage } from '../services/api';

function CategoryForm({ category, onDone }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { name: category?.name || '', icon: category?.icon || '📦', color: category?.color || '#6366f1' } });
  const submit = async (v) => {
    try {
      if (category) await categoryService.update(category._id, v); else await categoryService.create(v);
      toast.success(category ? 'Category updated' : 'Category created');
      onDone();
    } catch (e) { toast.error(errorMessage(e)); }
  };
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <Field label="Name" error={errors.name?.message}><input className="input" autoFocus {...register('name', { required: 'Name is required', maxLength: { value: 40, message: 'Max 40 characters' } })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Icon (emoji)"><input className="input text-center text-xl" maxLength={8} {...register('icon')} /></Field>
        <Field label="Color"><input type="color" className="h-10 w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-800" {...register('color')} /></Field>
      </div>
      <div className="flex justify-end"><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</button></div>
    </form>
  );
}

export default function Categories() {
  const { openForm } = useTransactionForm();
  const [edit, setEdit] = useState(null); // null | {} (new) | category
  const [del, setDel] = useState(null);
  const { data, error, reload } = useFetch(() => categoryService.list(), []);

  const remove = async () => {
    try { await categoryService.remove(del._id); toast.success('Category deleted'); setDel(null); reload(); }
    catch (e) { toast.error(errorMessage(e)); setDel(null); }
  };

  return (
    <div>
      <PageHeader title="Categories" actions={<button className="btn-primary" onClick={() => setEdit({})}><Plus size={16} /> New category</button>} />
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : !data ? <Skeleton className="h-48" /> : data.length === 0 ? (
        <div className="card"><EmptyState icon="🏷️" title="No categories" action={<button className="btn-primary" onClick={() => setEdit({})}>Create one</button>} /></div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((c) => (
            <li key={c._id} className="card flex items-center gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: `${c.color}22` }}>{c.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.name}</p>
                <button className="text-xs text-indigo-600 hover:underline" onClick={() => openForm({ type: 'expense', categoryId: c._id })}>+ Add expense</button>
              </div>
              <button className="icon-btn" onClick={() => setEdit(c)} aria-label={`Edit ${c.name}`}><Pencil size={15} /></button>
              <button className="icon-btn" onClick={() => setDel(c)} aria-label={`Delete ${c.name}`}><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?._id ? 'Edit category' : 'New category'} size="md">
        {edit && <CategoryForm key={edit._id || 'new'} category={edit._id ? edit : null} onDone={() => { setEdit(null); reload(); }} />}
      </Modal>
      <ConfirmDialog open={Boolean(del)} onClose={() => setDel(null)} onConfirm={remove} title={`Delete ${del?.name}?`} message="Categories that still have transactions can't be deleted." />
    </div>
  );
}
