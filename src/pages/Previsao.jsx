import { useMemo, useState } from 'react';
import KpiCard from '../components/KpiCard';
import MonthYearSelect from '../components/MonthYearSelect';
import PageHeader from '../components/PageHeader';
import { PERSONS } from '../lib/constants';
import { currentMonthYear, forecastMonths, formatCurrency } from '../lib/finance';

export default function Previsao({ data }) {
  const [start, setStart] = useState(currentMonthYear());
  const forecast = useMemo(() => forecastMonths(data, start.mes, start.ano, 12), [data, start]);
  const grandTotal = forecast.reduce((total, month) => total + month.totalGeral, 0);

  return (
    <>
      <PageHeader
        title="Previsão Financeira"
        description="Próximos 12 meses com faturas, parcelas futuras e divisão por pessoa."
        aside={<MonthYearSelect mes={start.mes} ano={start.ano} onChange={setStart} />}
      />

      <section className="kpi-grid">
        <KpiCard title="Total previsto" value={formatCurrency(grandTotal)} description="Próximos 12 meses" />
        {PERSONS.map((person) => (
          <KpiCard
            key={person}
            title={person}
            value={formatCurrency(forecast.reduce((total, month) => total + (month.byPerson[person] || 0), 0))}
          />
        ))}
      </section>

      <section className="forecast-grid">
        {forecast.map((month) => (
          <article className="forecast-card" key={`${month.mes}-${month.ano}`}>
            <div className="section-title">
              <h2>{month.label}</h2>
              <span>{formatCurrency(month.totalGeral)}</span>
            </div>
            <div className="forecast-lines">
              <div>
                <span>Total previsto da fatura</span>
                <strong>{formatCurrency(month.totalFatura)}</strong>
              </div>
              <div>
                <span>Parcelas futuras</span>
                <strong>{formatCurrency(month.totalParcelas)}</strong>
              </div>
              {PERSONS.map((person) => (
                <div key={person}>
                  <span>{person}</span>
                  <strong>{formatCurrency(month.byPerson[person] || 0)}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
