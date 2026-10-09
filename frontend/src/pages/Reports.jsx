import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, FileText } from 'lucide-react';
import { EmptyState, ErrorState, Field, PageHeader, Skeleton } from '../components/ui';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useTransactionForm } from '../context/TransactionFormContext';
import * as reportService from '../services/reportService';
import { errorMessage } from '../services/api';
import { PERIODS, TYPES } from '../utils/constants';
import { formatDate, money, todayStr } from '../utils/format';

const Stat = ({ label, value, tone = '' }) => (
  <div className="card p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p></div>
);

export default function Reports() {
  const { currency } = useAuth();
  const { txVersion } = useTransactionForm();
  const [period, setPeriod] = useState('monthly');
  const [date, setDate] = useState(todayStr());
  const [from, setFrom] = useState(todayStr().slice(0, 8) + '01');
  const [to, setTo] = useState(todayStr());
  const [busy, setBusy] = useState('');

  const params = period === 'custom' ? { period, from, to } : { period, date };
  const ready = period !== 'custom' || (from && to && to >= from);
  const { data, error, reload } = useFetch(() => (ready ? reportService.summary(params) : Promise.resolve(null)), [JSON.stringify(params), txVersion]);

  const exportAs = async (format) => {
    setBusy(format);
    try { await reportService.download(format, params); toast.success(`${format.toUpperCase()} downloaded`); }
    catch (e) {
      // blob error bodies need decoding to show the server's message
      const msg = e?.response?.data instanceof Blob ? JSON.parse(await e.response.data.text()).message : errorMessage(e);
      toast.error(msg);
    } finally { setBusy(''); }
  };

  const t = data?.totals;
  return (
    <div>
      <PageHeader title="Reports" subtitle={data ? `${formatDate(data.range.from)} – ${formatDate(data.range.to)}` : ' '}
        actions={<>
          <button className="btn-secondary" disabled={!data || busy} onClick={() => exportAs('csv')}><Download size={16} />{busy === 'csv' ? 'Exporting…' : 'CSV'}</button>
          <button className="btn-secondary" disabled={!data || busy} onClick={() => exportAs('pdf')}><FileText size={16} />{busy === 'pdf' ? 'Exporting…' : 'PDF'}</button>
        </>} />

      <div className="card mb-5 grid gap-3 p-4 sm:grid-cols-3">
        <Field label="Period"><select className="input capitalize" value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIODS.map((p) => <option key={p} value={p}>{p === 'custom' ? 'Custom range' : p[0].toUpperCase() + p.slice(1)}</option>)}</select></Field>
        {period === 'custom' ? (
          <>
            <Field label="From"><input type="date" className="input" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="To"><input type="date" className="input" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></Field>
          </>
        ) : (
          <Field label={period === 'daily' ? 'Day' : 'Any date in the period'}><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        )}
      </div>

      {!ready ? <p className="text-sm text-red-600">End date must be on or after the start date.</p>
        : error && !data ? <ErrorState message={error} onRetry={reload} />
        : !data ? <div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        : t.count === 0 ? <div className="card"><EmptyState icon="📊" title="Nothing to report" text="There are no transactions in this period." /></div>
        : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Stat label="Total income" value={money(t.income, currency)} tone={TYPES.income.text} />
              <Stat label="Total expenses" value={money(t.expense, currency)} tone={TYPES.expense.text} />
              <Stat label="Total sent" value={money(t.sent, currency)} tone={TYPES.sent.text} />
              <Stat label="Total received" value={money(t.received, currency)} tone={TYPES.received.text} />
              <Stat label="Savings" value={money(t.savings, currency)} tone={t.savings < 0 ? 'text-red-600' : ''} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Highest expense" value={data.highestExpense ? money(data.highestExpense.amount, currency) : '—'} />
              <Stat label="Highest spending category" value={data.highestCategory ? `${data.highestCategory.icon} ${data.highestCategory.name}` : '—'} />
              <Stat label="Average daily spending" value={money(data.averageDailySpending, currency)} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="card p-5">
                <h2 className="mb-3 font-semibold">Category breakdown</h2>
                {data.categories.length === 0 ? <p className="text-sm text-slate-500">No expenses.</p> : (
                  <ul className="space-y-3">
                    {data.categories.map((c) => (
                      <li key={String(c.categoryId)}>
                        <div className="mb-1 flex justify-between text-sm"><span>{c.icon} {c.name}</span><span className="tabular-nums text-slate-500">{money(c.total, currency)} · {Math.round(c.percent)}%</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full" style={{ width: `${c.percent}%`, background: c.color }} /></div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="card p-5">
                <h2 className="mb-3 font-semibold">Top expenses</h2>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.topExpenses.map((e) => (
                    <li key={e._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="min-w-0"><span className="block truncate font-medium">{e.icon} {e.merchant || e.description || e.category || 'Expense'}</span><span className="text-xs text-slate-500">{formatDate(e.date)}</span></span>
                      <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">{money(e.amount, currency)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}
    </div>
  );
}
