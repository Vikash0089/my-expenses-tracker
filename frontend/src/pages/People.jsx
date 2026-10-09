import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import TransactionItem from '../components/TransactionItem';
import { EmptyState, ErrorState, Field, PageHeader, Skeleton } from '../components/ui';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useTransactionForm } from '../context/TransactionFormContext';
import { peopleService } from '../services/resourceServices';
import { errorMessage } from '../services/api';
import { TYPES } from '../utils/constants';
import { money } from '../utils/format';
import * as txService from '../services/transactionService';

const statusText = (p, currency) =>
  p.status === 'owes_you' ? { text: `Owes you ${money(p.remaining, currency)}`, cls: TYPES.income.text }
  : p.status === 'you_owe' ? { text: `You owe ${money(-p.remaining, currency)}`, cls: TYPES.expense.text }
  : { text: 'All settled', cls: 'text-slate-400' };

function PersonForm({ person, onDone }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { name: person?.name || '', phone: person?.phone || '', notes: person?.notes || '' } });
  const submit = async (v) => {
    try {
      if (person) await peopleService.update(person._id, v); else await peopleService.create(v);
      toast.success(person ? 'Person updated' : 'Person added');
      onDone();
    } catch (e) { toast.error(errorMessage(e)); }
  };
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <Field label="Name" error={errors.name?.message}><input className="input" autoFocus {...register('name', { required: 'Name is required' })} /></Field>
      <Field label="Phone"><input className="input" {...register('phone')} /></Field>
      <Field label="Notes"><textarea rows={2} className="input resize-none" {...register('notes')} /></Field>
      <div className="flex justify-end"><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</button></div>
    </form>
  );
}

export function People() {
  const { currency } = useAuth();
  const { openForm, txVersion } = useTransactionForm();
  const [adding, setAdding] = useState(false);
  const { data, error, reload } = useFetch(() => peopleService.list(), [txVersion]);

  return (
    <div>
      <PageHeader title="People" subtitle="Lending & borrowing"
        actions={<>
          <button className="btn-secondary" onClick={() => openForm({ type: 'sent' })}><Plus size={16} /> Add Transaction</button>
          <button className="btn-primary" onClick={() => setAdding(true)}><Plus size={16} /> Add person</button>
        </>} />
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : !data ? <Skeleton className="h-48" /> : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <div className="card p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Money you will receive</p><p className={`mt-1 text-2xl font-bold ${TYPES.income.text}`}>{money(data.summary.toReceive, currency)}</p></div>
            <div className="card p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Money you need to pay</p><p className={`mt-1 text-2xl font-bold ${TYPES.expense.text}`}>{money(data.summary.toPay, currency)}</p></div>
          </div>
          {data.people.length === 0 ? (
            <div className="card"><EmptyState icon="🤝" title="No people yet" text="People are added automatically when you send or receive money, or you can add them here." action={<button className="btn-primary" onClick={() => setAdding(true)}>Add person</button>} /></div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.people.map((p) => {
                const st = statusText(p, currency);
                return (
                  <li key={p._id}>
                    <Link to={`/people/${p._id}`} className="card block p-4 transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{p.name[0].toUpperCase()}</span>
                        <div className="min-w-0"><p className="truncate font-semibold">{p.name}</p><p className={`text-sm font-medium ${st.cls}`}>{st.text}</p></div>
                      </div>
                      <dl className="space-y-1 text-sm">
                        <div className="flex justify-between"><dt className="text-slate-500">You gave</dt><dd className="tabular-nums">{money(p.sent, currency)}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">You received</dt><dd className="tabular-nums">{money(p.received, currency)}</dd></div>
                        <div className="flex justify-between border-t border-slate-100 pt-1 font-medium dark:border-slate-800"><dt>Remaining</dt><dd className="tabular-nums">{money(Math.abs(p.remaining), currency)}</dd></div>
                      </dl>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add person" size="md"><PersonForm onDone={() => { setAdding(false); reload(); }} /></Modal>
    </div>
  );
}

export function PersonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currency } = useAuth();
  const { openForm, txVersion, bump } = useTransactionForm();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [txDelete, setTxDelete] = useState(null);
  const { data, error, reload } = useFetch(() => peopleService.get(id), [id, txVersion]);

  const removePerson = async () => {
    try { await peopleService.remove(id); toast.success('Person deleted'); navigate('/people'); } catch (e) { toast.error(errorMessage(e)); }
  };
  const removeTx = async () => {
    try { await txService.remove(txDelete._id); toast.success('Transaction deleted'); setTxDelete(null); bump(); } catch (e) { toast.error(errorMessage(e)); }
  };

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <Skeleton className="h-64" />;
  const { person, transactions } = data;
  const st = statusText(person, currency);

  return (
    <div>
      <Link to="/people" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><ArrowLeft size={14} /> People</Link>
      <PageHeader title={person.name} subtitle={person.phone || person.notes || ' '}
        actions={<>
          <button className="btn-secondary" onClick={() => openForm({ type: 'sent', personName: person.name })}><Plus size={16} /> Send money</button>
          <button className="btn-secondary" onClick={() => openForm({ type: 'received', personName: person.name })}><Plus size={16} /> Receive money</button>
          <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Edit person"><Pencil size={16} /></button>
          <button className="icon-btn" onClick={() => setConfirm(true)} aria-label="Delete person"><Trash2 size={16} /></button>
        </>} />
      <div className="card mb-5 grid grid-cols-3 gap-3 p-5 text-center sm:text-left">
        <div><p className="text-xs text-slate-500">You gave</p><p className={`text-lg font-bold ${TYPES.sent.text}`}>{money(person.sent, currency)}</p></div>
        <div><p className="text-xs text-slate-500">You received</p><p className={`text-lg font-bold ${TYPES.received.text}`}>{money(person.received, currency)}</p></div>
        <div><p className="text-xs text-slate-500">Remaining</p><p className={`text-lg font-bold ${st.cls}`}>{st.text}</p></div>
      </div>
      <section className="card p-3">
        <h2 className="px-2 pb-1 font-semibold">Transactions</h2>
        {transactions.length === 0 ? <EmptyState icon="🧾" title="No transactions yet" text={`Money you send to or receive from ${person.name} will show up here.`} /> : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((t) => <TransactionItem key={t._id} tx={t} currency={currency} onEdit={(tx) => openForm({ editing: tx })} onDelete={setTxDelete} />)}
          </ul>
        )}
      </section>
      <Modal open={editing} onClose={() => setEditing(false)} title="Edit person" size="md"><PersonForm person={person} onDone={() => { setEditing(false); reload(); }} /></Modal>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={removePerson} title={`Delete ${person.name}?`} message="Their transactions are kept, but will no longer be linked to this person." />
      <ConfirmDialog open={Boolean(txDelete)} onClose={() => setTxDelete(null)} onConfirm={removeTx} title="Delete transaction?" message="This transaction will be permanently removed." />
    </div>
  );
}
