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
  const totalRenda = forecast.reduce((total, month) => total + month.rendaMes, 0);
  const totalGastoEu = forecast.reduce((total, month) => total + month.gastoEu, 0);
  const saldoEuPeriodo = totalRenda - totalGastoEu;

  return (
    <>
      <PageHeader
        title="Previsão Financeira"
        description="Próximos 12 meses com faturas, parcelas futuras e divisão por pessoa."
        aside={<MonthYearSelect mes={start.mes} ano={start.ano} onChange={setStart} />}
      />

      <section className="kpi-grid">
        <KpiCard title="Total previsto" value={formatCurrency(grandTotal)} description="Próximos 12 meses" />
        <KpiCard title="Renda prevista" value={formatCurrency(totalRenda)} description="Rendas cadastradas" />
        <KpiCard title="Gasto Eu" value={formatCurrency(totalGastoEu)} description="Faturas no seu nome" />
        <KpiCard
          title="Saldo Eu"
          value={formatCurrency(saldoEuPeriodo)}
          description={saldoEuPeriodo >= 0 ? 'Vai sobrar no período' : 'Vai faltar no período'}
          tone={saldoEuPeriodo >= 0 ? 'positive' : 'negative'}
        />
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
              <div>
                <span>Renda do mês</span>
                <strong>{formatCurrency(month.rendaMes)}</strong>
              </div>
              <div className={`forecast-result ${month.saldoEu >= 0 ? 'positive' : 'negative'}`}>
                <span>{month.saldoEu >= 0 ? 'Vai sobrar' : 'Vai faltar'}</span>
                <strong>{formatCurrency(Math.abs(month.saldoEu))}</strong>
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
