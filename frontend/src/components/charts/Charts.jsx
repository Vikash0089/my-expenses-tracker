import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartTheme } from './chartTheme';
import { compactMoney, money } from '../../utils/format';
import { TYPES } from '../../utils/constants';

const Empty = ({ text }) => <div className="flex h-56 items-center justify-center text-sm text-slate-400">{text}</div>;

export function CategoryDonut({ data, currency }) {
  const th = useChartTheme();
  if (!data?.length) return <Empty text="No expenses this month" />;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-52 w-full sm:w-1/2">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="name" innerRadius="58%" outerRadius="90%" paddingAngle={2} stroke="none">
              {data.map((d) => <Cell key={String(d.categoryId)} fill={d.color} />)}
            </Pie>
            <Tooltip {...th.tooltip} formatter={(v, n) => [money(v, currency), n]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-1.5 text-sm sm:w-1/2">
        {data.slice(0, 6).map((d) => (
          <li key={String(d.categoryId)} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} /><span className="truncate">{d.icon} {d.name}</span></span>
            <span className="tabular-nums text-slate-500 dark:text-slate-400">{Math.round(d.percent)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DailyChart({ data, currency }) {
  const th = useChartTheme();
  if (!data?.some((d) => d.expense > 0)) return <Empty text="No spending recorded yet" />;
  const rows = data.map((d) => ({ day: Number(d.date.slice(8)), expense: d.expense }));
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ left: -10, right: 4, top: 4 }}>
          <CartesianGrid stroke={th.grid} vertical={false} />
          <XAxis dataKey="day" tick={{ fill: th.axis, fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: th.axis, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => compactMoney(v, currency)} width={56} />
          <Tooltip {...th.tooltip} labelFormatter={(d) => `Day ${d}`} formatter={(v) => [money(v, currency), 'Spent']} />
          <Bar dataKey="expense" fill={TYPES.expense.hex} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IncomeExpenseChart({ summary, currency }) {
  const th = useChartTheme();
  if (!summary || (!summary.income && !summary.expense)) return <Empty text="No data for this month" />;
  const rows = [
    { name: 'Income', value: summary.income, fill: TYPES.income.hex },
    { name: 'Expense', value: summary.expense, fill: TYPES.expense.hex },
    { name: 'Savings', value: summary.savings, fill: '#6366f1' },
  ];
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ left: -10, right: 4, top: 4 }}>
          <CartesianGrid stroke={th.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: th.axis, fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: th.axis, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => compactMoney(v, currency)} width={56} />
          <Tooltip {...th.tooltip} formatter={(v) => money(v, currency)} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>{rows.map((r) => <Cell key={r.name} fill={r.fill} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PaymentChart({ data, currency }) {
  const th = useChartTheme();
  if (!data?.length) return <Empty text="No expenses this month" />;
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4 }}>
          <CartesianGrid stroke={th.grid} horizontal={false} />
          <XAxis type="number" tick={{ fill: th.axis, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => compactMoney(v, currency)} />
          <YAxis type="category" dataKey="method" tick={{ fill: th.axis, fontSize: 12 }} tickLine={false} axisLine={false} width={92} />
          <Tooltip {...th.tooltip} formatter={(v) => [money(v, currency), 'Spent']} />
          <Bar dataKey="total" fill="#6366f1" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
