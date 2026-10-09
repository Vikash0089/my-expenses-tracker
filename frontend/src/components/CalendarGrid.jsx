import { useEffect, useMemo, useRef } from 'react';
import { TYPES, WEEKDAYS } from '../utils/constants';
import { compactMoney, pad, parseDay, toDayStr, todayStr } from '../utils/format';

const DOT = { income: 'bg-green-500', expense: 'bg-red-500', received: 'bg-blue-500', sent: 'bg-orange-500' };

/**
 * Monday-first month grid with per-day totals. Arrow keys move the selection, PageUp/PageDown change month,
 * Home/End jump to first/last day, Enter/Space opens the day.
 */
export default function CalendarGrid({ year, month, days = [], selected, onSelect, onOpen, onMonthChange, currency, compact = false }) {
  const root = useRef(null);
  const focusPending = useRef(false);
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const today = todayStr();

  const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const count = new Date(year, month, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const key = (d) => `${year}-${pad(month)}-${pad(d)}`;
  const inMonth = selected && selected.startsWith(`${year}-${pad(month)}`);
  const tabbable = inMonth ? selected : today.startsWith(`${year}-${pad(month)}`) ? today : key(1);

  useEffect(() => {
    if (focusPending.current) {
      root.current?.querySelector(`[data-date="${selected}"]`)?.focus();
      focusPending.current = false;
    }
  }, [selected, year, month]);

  const move = (d) => {
    focusPending.current = true;
    onSelect?.(toDayStr(d));
    if (d.getMonth() + 1 !== month || d.getFullYear() !== year) onMonthChange?.({ year: d.getFullYear(), month: d.getMonth() + 1 });
  };

  const onKeyDown = (e) => {
    const base = parseDay(inMonth ? selected : key(1));
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (step) {
      e.preventDefault();
      base.setDate(base.getDate() + step);
      move(base);
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      const dir = e.key === 'PageUp' ? -1 : 1;
      const target = new Date(base.getFullYear(), base.getMonth() + dir, 1);
      target.setDate(Math.min(base.getDate(), new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
      move(target);
    } else if (e.key === 'Home') {
      e.preventDefault();
      move(new Date(year, month - 1, 1));
    } else if (e.key === 'End') {
      e.preventDefault();
      move(new Date(year, month, 0));
    }
  };

  return (
    <div ref={root} onKeyDown={onKeyDown} role="group" aria-label="Calendar. Use arrow keys to move between days.">
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {WEEKDAYS.map((w) => <div key={w}>{compact ? w[0] : w}</div>)}
      </div>
      <div className={`grid grid-cols-7 ${compact ? 'gap-0.5' : 'gap-1'}`}>
        {cells.map((d, i) => {
          if (!d) return <div key={`b${i}`} />;
          const date = key(d);
          const data = byDate.get(date);
          const isSel = date === selected;
          const isToday = date === today;
          const types = data ? ['income', 'expense', 'received', 'sent'].filter((t) => data[t] > 0) : [];
          const label = `${parseDay(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${
            data ? `, ${types.map((t) => `${TYPES[t].label.toLowerCase()} ${compactMoney(data[t], currency)}`).join(', ')}, ${data.count} transactions` : ', no transactions'
          }`;
          return (
            <button
              key={date}
              type="button"
              data-date={date}
              tabIndex={date === tabbable ? 0 : -1}
              aria-label={label}
              aria-pressed={isSel}
              aria-current={isToday ? 'date' : undefined}
              onClick={() => { onSelect?.(date); onOpen?.(date); }}
              className={`flex flex-col items-stretch rounded-lg border p-1 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                compact ? 'h-11 items-center' : 'h-14 sm:h-20 lg:h-24 sm:p-1.5'
              } ${
                isSel
                  ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 dark:bg-indigo-500/10'
                  : 'border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className={`text-xs font-semibold ${isToday ? 'inline-flex h-5 w-5 items-center justify-center self-start rounded-full bg-indigo-600 text-white' : ''} ${compact ? 'self-center' : ''}`}>{d}</span>

              {data && !compact && (
                <div className="mt-auto hidden space-y-0.5 text-[11px] font-medium leading-tight sm:block">
                  {data.income > 0 && <div className="truncate text-green-600 dark:text-green-400">+{compactMoney(data.income, currency)}</div>}
                  {data.expense > 0 && <div className="truncate text-red-600 dark:text-red-400">-{compactMoney(data.expense, currency)}</div>}
                  {(data.sent > 0 || data.received > 0) && (
                    <div className="flex gap-1.5">
                      {data.sent > 0 && <span className="text-orange-500">↗{compactMoney(data.sent, currency)}</span>}
                      {data.received > 0 && <span className="text-blue-500">↙{compactMoney(data.received, currency)}</span>}
                    </div>
                  )}
                  <div className="hidden font-normal text-slate-400 lg:block">{data.count} transaction{data.count > 1 ? 's' : ''}</div>
                </div>
              )}

              {data && (
                <div className={`${compact ? 'mt-auto flex' : 'mt-auto flex sm:hidden'} gap-0.5`} aria-hidden="true">
                  {types.map((t) => <span key={t} className={`h-1.5 w-1.5 rounded-full ${DOT[t]}`} />)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
      {Object.values(TYPES).map((t) => (
        <span key={t.key} className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${t.bg}`} />{t.label}</span>
      ))}
    </div>
  );
}
