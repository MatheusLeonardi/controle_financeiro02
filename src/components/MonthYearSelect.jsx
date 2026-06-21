import { monthOptions, yearOptions } from '../lib/finance';

export default function MonthYearSelect({ mes, ano, onChange }) {
  return (
    <div className="inline-filters">
      <label>
        Mês
        <select value={mes} onChange={(event) => onChange({ mes: Number(event.target.value), ano })}>
          {monthOptions.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Ano
        <select value={ano} onChange={(event) => onChange({ mes, ano: Number(event.target.value) })}>
          {yearOptions().map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
