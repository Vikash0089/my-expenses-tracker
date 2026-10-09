export default function SummaryCard({ label, value, icon: Icon, tone = 'text-slate-500', className = '' }) {
  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
        {Icon && <Icon size={16} className={tone} aria-hidden="true" />}
      </div>
      <div className={`mt-2 text-xl font-bold sm:text-2xl ${tone === 'text-slate-500' ? '' : tone}`}>{value}</div>
    </div>
  );
}
