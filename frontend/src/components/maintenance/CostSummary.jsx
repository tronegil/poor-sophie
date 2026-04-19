const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

function fmtCost(val) {
  const n = Number(val);
  if (!n) return '—';
  return n.toLocaleString() + ' kr';
}

export default function CostSummary({ summary, t, lang, selectedYear }) {
  if (!summary.length) {
    return (
      <p className="text-sm text-slate-400 mt-3 py-4 text-center">
        {t('maintenance.summary.noData')}
      </p>
    );
  }

  const years = [...new Set(summary.map(r => r.year))].sort((a, b) => b - a);

  const get = (year, season) => summary.find(r => r.year === year && r.season === season);

  const yearTotal = (year) =>
    summary.filter(r => r.year === year).reduce((s, r) => s + Number(r.total_cost || 0), 0);

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-xs text-slate-500 uppercase tracking-wide">
            <th className="text-left py-2 pr-3 font-medium">{t('maintenance.summary.title').replace(' Summary','').replace(' oversikt','')}</th>
            {SEASONS.map(s => (
              <th key={s} className="text-right py-2 px-2 font-medium">
                {t(`maintenance.season.${s}`).slice(0, 3)}
              </th>
            ))}
            <th className="text-right py-2 pl-2 font-semibold text-slate-700">{t('maintenance.summary.total')}</th>
          </tr>
        </thead>
        <tbody>
          {years.map(year => (
            <tr
              key={year}
              className={`border-t border-slate-100 ${year === selectedYear ? 'bg-ocean-50' : ''}`}
            >
              <td className={`py-2 pr-3 font-medium ${year === selectedYear ? 'text-ocean-700' : 'text-slate-700'}`}>
                {year}
              </td>
              {SEASONS.map(s => {
                const row = get(year, s);
                return (
                  <td key={s} className="text-right py-2 px-2 text-slate-600">
                    {row ? fmtCost(row.total_cost) : '—'}
                  </td>
                );
              })}
              <td className="text-right py-2 pl-2 font-semibold text-slate-800">
                {fmtCost(yearTotal(year))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
