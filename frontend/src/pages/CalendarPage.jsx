import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import CalendarGrid, { CalendarLegend } from '../components/CalendarGrid';
import DayDetails from '../components/DayDetails';
import Modal from '../components/Modal';
import { ErrorState, PageHeader, Skeleton } from '../components/ui';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useTransactionForm } from '../context/TransactionFormContext';
import * as calendarService from '../services/calendarService';
import { dayUrl, money, monthLabel, pad, todayStr } from '../utils/format';

const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' }));

export default function CalendarPage() {
  const { year: py, month: pm, day: pd } = useParams();
  const navigate = useNavigate();
  const { currency } = useAuth();
  const { openForm, txVersion } = useTransactionForm();
  const now = new Date();

  const fromParams = py && pm ? { year: Number(py), month: Number(pm) } : { year: now.getFullYear(), month: now.getMonth() + 1 };
  const [ym, setYm] = useState(fromParams);
  const [selected, setSelected] = useState(pd ? `${py}-${pad(pm)}-${pad(pd)}` : todayStr());
  const drawerOpen = Boolean(pd);

  // keep state in sync when the URL changes (e.g. "View Full Day" from the dashboard)
  useEffect(() => {
    if (py && pm && pd) {
      setSelected(`${py}-${pad(pm)}-${pad(pd)}`);
      setYm({ year: Number(py), month: Number(pm) });
    }
  }, [py, pm, pd]);

  const { data, error, reload } = useFetch(() => calendarService.month({ month: ym.month, year: ym.year }), [ym.year, ym.month, txVersion]);

  const shift = (n) => { const d = new Date(ym.year, ym.month - 1 + n, 1); setYm({ year: d.getFullYear(), month: d.getMonth() + 1 }); };
  const goToday = () => { setYm({ year: now.getFullYear(), month: now.getMonth() + 1 }); setSelected(todayStr()); };
  const years = Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i);
  const totals = (data?.days || []).reduce((a, d) => ({ income: a.income + d.income, expense: a.expense + d.expense }), { income: 0, expense: 0 });

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle={data ? `${money(totals.expense, currency)} spent · ${money(totals.income, currency)} earned in ${monthLabel(ym.year, ym.month)}` : ' '}
        actions={<button type="button" className="btn-primary" onClick={() => openForm({ date: selected })}><Plus size={16} /> Add Transaction</button>}
      />

      <div className="card p-3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button type="button" className="icon-btn border border-slate-200 dark:border-slate-700" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <button type="button" className="icon-btn border border-slate-200 dark:border-slate-700" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={18} /></button>
          <select aria-label="Month" className="input !w-auto" value={ym.month} onChange={(e) => setYm({ ...ym, month: Number(e.target.value) })}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select aria-label="Year" className="input !w-auto" value={ym.year} onChange={(e) => setYm({ ...ym, year: Number(e.target.value) })}>
            {(years.includes(ym.year) ? years : [...years, ym.year].sort()).map((y) => <option key={y}>{y}</option>)}
          </select>
          <button type="button" className="btn-secondary ml-auto" onClick={goToday}>Today</button>
        </div>

        {error && !data ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data ? (
          <Skeleton className="h-[26rem] w-full" />
        ) : (
          <CalendarGrid
            year={ym.year} month={ym.month} days={data.days} selected={selected} currency={currency}
            onSelect={setSelected} onMonthChange={setYm} onOpen={(d) => navigate(dayUrl(d))}
          />
        )}
        <div className="mt-4"><CalendarLegend /></div>
      </div>

      <Modal open={drawerOpen} onClose={() => navigate('/calendar')} title="Day details" variant="drawer">
        {drawerOpen && <DayDetails date={selected} />}
      </Modal>
    </div>
  );
}
