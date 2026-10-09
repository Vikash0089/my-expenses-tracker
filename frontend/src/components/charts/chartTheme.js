import { useTheme } from '../../context/ThemeContext';

export function useChartTheme() {
  const dark = useTheme().theme === 'dark';
  return {
    axis: dark ? '#94a3b8' : '#64748b',
    grid: dark ? '#1e293b' : '#e2e8f0',
    tooltip: {
      contentStyle: {
        background: dark ? '#0f172a' : '#ffffff',
        border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
        borderRadius: 12,
        color: dark ? '#e2e8f0' : '#0f172a',
        fontSize: 12,
      },
      labelStyle: { color: dark ? '#e2e8f0' : '#0f172a', fontWeight: 600 },
      itemStyle: { color: dark ? '#e2e8f0' : '#0f172a' },
      cursor: { fill: dark ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.08)' },
    },
  };
}
