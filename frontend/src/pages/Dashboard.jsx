import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Percent, Plus, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import MonthSelector from '../components/MonthSelector';
import SummaryCard from '../components/SummaryCard';
import CalendarGrid, { CalendarLegend } from '../components/CalendarGrid';
import TransactionItem from '../components/TransactionItem';
import { CategoryDonut, DailyChart, IncomeExpenseChart, PaymentChart } from '../components/charts/Charts';
import { CardSkeleton, EmptyState, ErrorState, PageHeader, ProgressBar, Skeleton } from '../components/ui';
import useFetch from '../hooks/useFetch';
import useMonth from '../hooks/useMonth';
import { useAuth } from '../context/AuthContext';
import { useTransactionForm } from '../context/TransactionFormContext';
import * as dash from '../services/dashboardService';
import * as txService from '../services/transactionService';
import { budgetService } from '../services/resourceServices';
import { TYPES } from '../utils/constants';
import { dayUrl, formatLongDate, money, monthLabel, pad, todayStr } from '../utils/format';

const defaultSelected = ({ year, month }) => {
  const t = todayStr();
  return t.startsWith(`${year}-${pad(month)}`) ? t : `${year}-${pad(month)}-01`;
};

export default function Dashboard() {
  const { user, currency } = useAuth();
  const { openForm, txVersion } = useTransactionForm();
  const navigate = useNavigate();
  const [ym, setYm] = useMonth();
  const [selected, setSelected] = useState(todayStr());

  const { data, loading, error, reload } = useFetch(async () => {
    const p = { month: ym.month, year: ym.year };
    const [summary, monthly, daily, categories, payments, budgets, recent] = await Promise.all([
      dash.summary(p), dash.monthly(p), dash.daily(p), dash.categories(p), dash.paymentMethods(p),
      budgetService.list(p), txService.list({ limit: 6 }),
    ]);
    return { summary, monthly, daily, categories, payments, budget: budgets[0], recent: recent.items };
  }, [ym.year, ym.month, txVersion]);

  const changeMonth = (next) => { setYm(next); setSelected(defaultSelected(next)); };

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <div className="grid gap-4 lg:grid-cols-2"><CardSkeleton rows={5} /><CardSkeleton rows={5} /></div>
      </div>
    );
  }

  const { summary: s, monthly, daily, categories, payments, budget, recent } = data;
  const day = daily.find((d) => d.date === selected);
  const change = monthly.expenseChange;
  const hasAny = s.count > 0 || recent.length > 0;

  return (
    <div className="space-y-5">
      <PageHeader title={`Hi, ${user.name.split(' ')[0]} 👋`} subtitle="Here's how your money is moving." />
      <MonthSelector year={ym.year} month={ym.month} onChange={changeMonth} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Available Balance" value={money(s.balance, currency)} icon={Wallet} tone="text-indigo-600 dark:text-indigo-400" className="max-sm:order-first max-sm:col-span-2" />
        <SummaryCard label="Total Income" value={money(s.income, currency)} icon={TrendingUp} tone={TYPES.income.text} />
        <SummaryCard label="Total Expenses" value={money(s.expense, currency)} icon={TrendingDown} tone={TYPES.expense.text} />
        <SummaryCard label="Money Sent" value={money(s.sent, currency)} icon={ArrowUpRight} tone={TYPES.sent.text} />
        <SummaryCard label="Money Received" value={money(s.received, currency)} icon={ArrowDownLeft} tone={TYPES.received.text} />
        <SummaryCard label="Savings Rate" value={`${s.savingsRate}%`} icon={Percent} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Quick actions">
        {[['expense', '+ Expense'], ['income', '+ Income'], ['sent', '+ Send Money'], ['received', '+ Receive Money']].map(([t, label]) => (
          <button key={t} type="button" onClick={() => openForm({ type: t })} className={`btn border ${TYPES[t].soft} ${TYPES[t].text} border-transparent hover:opacity-80`}>{label}</button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="card p-4 lg:col-span-3" aria-label="Calendar">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{monthLabel(ym.year, ym.month)}</h2>
            <Link to="/calendar" className="text-sm text-indigo-600 hover:underline">Open calendar</Link>
          </div>
          <CalendarGrid compact year={ym.year} month={ym.month} days={daily.filter((d) => d.count > 0)} selected={selected} onSelect={setSelected} onMonthChange={changeMonth} currency={currency} />
          <div className="mt-3"><CalendarLegend /></div>
        </section>

        <section className="card flex flex-col p-4 lg:col-span-2" aria-label="Selected day">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Selected</p>
          <h2 className="text-lg font-semibold">{formatLongDate(selected)}</h2>
          <dl className="my-3 space-y-1.5 text-sm">
            {['expense', 'income', 'sent', 'received'].map((t) => (
              <div key={t} className="flex justify-between"><dt className="text-slate-500">{TYPES[t].label === 'Expense' ? 'Expenses' : TYPES[t].label}</dt><dd className={`font-medium tabular-nums ${day?.[t] > 0 ? TYPES[t].text : 'text-slate-400'}`}>{money(day?.[t] || 0, currency)}</dd></div>
            ))}
          </dl>
          <div className="mt-auto flex gap-2">
            <button type="button" className="btn-primary flex-1" onClick={() => navigate(dayUrl(selected))}>View Full Day</button>
            <button type="button" className="btn-secondary" onClick={() => openForm({ date: selected })} aria-label="Add transaction on this date"><Plus size={16} /></button>
          </div>
        </section>
      </div>

      <section className="card p-4" aria-label="Recent transactions">
        <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">Recent transactions</h2><Link to="/transactions" className="text-sm text-indigo-600 hover:underline">View all</Link></div>
        {recent.length === 0 ? (
          <EmptyState icon="🧾" title="No transactions yet." text="Start tracking your spending by adding your first transaction." action={<button className="btn-primary" onClick={() => openForm()}><Plus size={16} /> Add Transaction</button>} />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">{recent.map((t) => <TransactionItem key={t._id} tx={t} currency={currency} onEdit={(tx) => openForm({ editing: tx })} />)}</ul>
        )}
      </section>

      {hasAny && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-4"><h2 className="mb-3 font-semibold">Expense by category</h2><CategoryDonut data={categories} currency={currency} /></section>
            <section className="card p-4"><h2 className="mb-3 font-semibold">Daily spending</h2><DailyChart data={daily} currency={currency} /></section>
            <section className="card p-4"><h2 className="mb-3 font-semibold">Income vs expense</h2><IncomeExpenseChart summary={s} currency={currency} /></section>
            <section className="card p-4"><h2 className="mb-3 font-semibold">Payment methods</h2><PaymentChart data={payments} currency={currency} /></section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Monthly budget</h2><Link to="/budgets" className="text-sm text-indigo-600 hover:underline">Manage</Link></div>
              {budget ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Spent {money(budget.status.totalSpent, currency)} of {money(budget.status.totalBudget, currency)}</span><span className="font-medium">{Math.round(budget.status.percentUsed)}%</span></div>
                  <ProgressBar value={budget.status.percentUsed} status={budget.status.status} />
                  <p className={`text-sm ${budget.status.remaining < 0 ? 'text-red-600' : 'text-slate-500'}`}>{budget.status.remaining < 0 ? `Over budget by ${money(-budget.status.remaining, currency)}` : `${money(budget.status.remaining, currency)} remaining`}</p>
                </div>
              ) : <EmptyState icon="🎯" title="No budget for this month" text="Set a budget to get warnings before you overspend." action={<Link to="/budgets" className="btn-secondary">Set a budget</Link>} />}
            </section>

            <section className="card p-4">
              <h2 className="mb-1 font-semibold">Compared to last month</h2>
              {change === null ? <p className="text-sm text-slate-500">No spending last month to compare with.</p> : (
                <p className={`mb-3 text-sm font-medium ${change <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {change <= 0 ? `You spent ${Math.abs(change)}% less this month 🎉` : `You spent ${change}% more this month`}
                </p>
              )}
              <ul className="space-y-1.5 text-sm">
                {monthly.categories.slice(0, 5).map((c) => (
                  <li key={String(c.categoryId)} className="flex items-center justify-between gap-2">
                    <span className="truncate">{c.icon} {c.name}</span>
                    <span className="shrink-0 tabular-nums text-slate-500">{money(c.previous, currency)} → {money(c.current, currency)}{' '}
                      <span className={c.saved >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>({c.saved >= 0 ? 'saved ' : 'over '}{money(Math.abs(c.saved), currency)})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
