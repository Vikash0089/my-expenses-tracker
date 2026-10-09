import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Paperclip } from 'lucide-react';
import Modal from './Modal';
import { Field } from './ui';
import { useAuth } from '../context/AuthContext';
import * as txService from '../services/transactionService';
import { categoryService, peopleService } from '../services/resourceServices';
import { errorMessage } from '../services/api';
import { PAYMENT_METHODS, TYPE_LIST, TYPES } from '../utils/constants';
import { nowTime, todayStr } from '../utils/format';

export default function TransactionFormModal({ open, prefill, editing, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit transaction' : 'Add transaction'}>
      <FormBody prefill={prefill} editing={editing} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}

const personName = (t) => (t.type === 'sent' ? t.to : t.type === 'received' ? t.from : '') || '';

function FormBody({ prefill, editing, onClose, onSaved }) {
  const { currency } = useAuth();
  const [categories, setCategories] = useState([]);
  const [people, setPeople] = useState([]);
  const [file, setFile] = useState(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      type: editing?.type || prefill.type || 'expense',
      amount: editing?.amount ?? '',
      date: editing?.date?.slice(0, 10) || prefill.date || todayStr(),
      time: editing ? editing.time || '' : nowTime(),
      categoryId: editing?.categoryId || prefill.categoryId || '',
      merchant: editing?.merchant || '',
      person: editing ? personName(editing) : prefill.personName || '',
      paymentMethod: editing?.paymentMethod || '',
      description: editing?.description || '',
      tags: (editing?.tags || []).join(', '),
    },
  });
  const type = watch('type');
  const isPeople = type === 'sent' || type === 'received';

  useEffect(() => {
    categoryService.list().then(setCategories).catch(() => toast.error('Could not load categories'));
    peopleService.list().then((d) => setPeople(d.people)).catch(() => {});
  }, []);

  // Select values only stick once their <option>s exist
  useEffect(() => {
    const id = editing?.categoryId || prefill.categoryId;
    if (id && categories.length) setValue('categoryId', id);
  }, [categories, editing, prefill, setValue]);

  const onSubmit = async (v) => {
    try {
      let receiptUrl = editing?.receiptUrl;
      if (file) receiptUrl = (await txService.uploadReceipt(file)).url;

      const payload = {
        type: v.type,
        amount: v.amount,
        date: v.date,
        time: v.time || undefined,
        paymentMethod: v.paymentMethod || undefined,
        description: v.description?.trim() || undefined,
        tags: v.tags.split(',').map((t) => t.trim()).filter(Boolean),
        receiptUrl: receiptUrl || undefined,
      };
      if (isPeople) {
        const name = v.person.trim();
        const match = people.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (match) payload.personId = match._id;
        payload[v.type === 'sent' ? 'to' : 'from'] = name;
      } else {
        payload.categoryId = v.categoryId || undefined;
        payload.merchant = v.merchant?.trim() || undefined;
      }

      if (editing) await txService.update(editing._id, payload);
      else await txService.create(payload);
      toast.success(editing ? 'Transaction updated' : 'Transaction added');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <input type="hidden" {...register('type')} />
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist" aria-label="Transaction type">
        {TYPE_LIST.map((t) => (
          <button
            key={t.key} type="button" role="tab" aria-selected={type === t.key}
            onClick={() => setValue('type', t.key)}
            className={`rounded-lg px-2 py-1.5 text-sm font-medium transition ${type === t.key ? `${t.bg} text-white shadow` : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Field label={`Amount (${currency})`} error={errors.amount?.message}>
        <input
          type="number" step="0.01" inputMode="decimal" placeholder="0.00" className="input text-lg font-semibold" autoFocus
          {...register('amount', {
            required: 'Amount is required',
            valueAsNumber: true,
            validate: (n) => (Number.isNaN(n) ? 'Enter a valid amount' : n > 0 || 'Amount must be greater than 0'),
          })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" error={errors.date?.message}>
          <input type="date" className="input" {...register('date', { required: 'Pick a date' })} />
        </Field>
        <Field label="Time">
          <input type="time" className="input" {...register('time')} />
        </Field>
      </div>

      {isPeople ? (
        <Field label={type === 'sent' ? 'To' : 'From'} error={errors.person?.message} hint="Pick an existing person or type a new name.">
          <input list="people-list" className="input" placeholder="e.g. Rahul" {...register('person', { required: type === 'sent' ? 'Who did you send money to?' : 'Who did you receive money from?', validate: (s) => s.trim().length > 0 || 'Name is required' })} />
          <datalist id="people-list">{people.map((p) => <option key={p._id} value={p.name} />)}</datalist>
        </Field>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Category" error={errors.categoryId?.message}>
            <select className="input" {...register('categoryId', { required: type === 'expense' ? 'Choose a category' : false })}>
              <option value="">{type === 'expense' ? 'Select category' : 'No category'}</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
            </select>
          </Field>
          <Field label={type === 'income' ? 'Source' : 'Merchant'}>
            <input className="input" placeholder={type === 'income' ? 'e.g. Company' : 'e.g. Swiggy'} {...register('merchant')} />
          </Field>
        </div>
      )}

      <Field label="Payment method">
        <select className="input" {...register('paymentMethod')}>
          <option value="">Not specified</option>
          {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </Field>

      <Field label={isPeople ? 'Reason' : 'Description'} error={errors.description?.message}>
        <textarea rows={2} maxLength={500} className="input resize-none" placeholder={isPeople ? 'e.g. Personal loan' : 'e.g. Dinner'} {...register('description')} />
      </Field>

      <Field label="Tags" hint="Comma separated, e.g. trip, work">
        <input className="input" {...register('tags')} />
      </Field>

      <Field label="Receipt" hint="Images or PDF, up to 5 MB">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          <Paperclip size={16} />
          <span className="truncate">{file ? file.name : editing?.receiptUrl ? 'Replace attached receipt' : 'Attach a receipt'}</span>
          <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        {editing?.receiptUrl && !file && (
          <a href={editing.receiptUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-indigo-600 hover:underline">View current receipt</a>
        )}
      </Field>

      <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 pt-3 dark:border-slate-800 dark:bg-slate-900">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className={`btn text-white ${TYPES[type].bg} hover:opacity-90`} disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : editing ? 'Save changes' : `Add ${TYPES[type].label.toLowerCase()}`}
        </button>
      </div>
    </form>
  );
}
