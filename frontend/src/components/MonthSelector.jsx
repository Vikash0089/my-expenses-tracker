import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel, monthShort } from '../utils/format';

export default function MonthSelector({ year, month, onChange }) {
  const shift = (n) => {
    const d = new Date(year, month - 1 + n, 1);
    onChange({ year: d.getFullYear(), month: d.getMonth() + 1 });
  };
  const p = new Date(year, month - 2, 1);
  const n = new Date(year, month, 1);
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-3">
      <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={20} /></button>
      <button type="button" onClick={() => shift(-1)} className="hidden rounded-lg px-2 py-1 text-sm text-slate-400 hover:text-slate-700 sm:block dark:hover:text-slate-200">
        {monthShort(p.getFullYear(), p.getMonth() + 1)}
      </button>
      <h2 className="min-w-[9rem] text-center text-lg font-semibold" aria-live="polite">{monthLabel(year, month)}</h2>
      <button type="button" onClick={() => shift(1)} className="hidden rounded-lg px-2 py-1 text-sm text-slate-400 hover:text-slate-700 sm:block dark:hover:text-slate-200">
        {monthShort(n.getFullYear(), n.getMonth() + 1)}
      </button>
      <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={20} /></button>
    </div>
  );
}
