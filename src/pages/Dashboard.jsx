import KpiCard from '../components/KpiCard';
import MonthYearSelect from '../components/MonthYearSelect';
import PageHeader from '../components/PageHeader';
import { dashboardSummary, formatCurrency, monthLabel } from '../lib/finance';
import { PERSONS } from '../lib/constants';

function BarList({ data }) {
  const max = Math.max(...data.map((item) => item.valor), 1);

  if (!data.length) {
    return <p className="muted">Nenhum gasto registrado neste mês.</p>;
  }

  return (
    <div className="bar-list">
      {data.map((item) => (
        <div className="bar-row" key={item.categoria}>
          <div>
            <strong>{item.categoria}</strong>
            <span>{formatCurrency(item.valor)}</span>
          </div>
          <div className="bar-track">
            <span style={{ width: `${Math.max(7, (item.valor / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ data, period, setPeriod }) {
  const summary = dashboardSummary(data, period.mes, period.ano);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Resumo de ${monthLabel(period.mes, period.ano)} com renda, gastos, faturas e alertas.`}
        aside={<MonthYearSelect mes={period.mes} ano={period.ano} onChange={setPeriod} />}
      />

      {summary.alert && (
        <section className={`alert-banner ${summary.alert.level}`}>
          <strong>{summary.alert.text}</strong>
          {summary.goal && (
            <span>
              {formatCurrency(summary.spent)} de {formatCurrency(summary.goal.valor_meta)} usados.
            </span>
          )}
        </section>
      )}

      <section className="kpi-grid">
        <KpiCard title="Renda mensal" value={formatCurrency(summary.income)} tone="positive" />
        <KpiCard title="Gastos do mês" value={formatCurrency(summary.spent)} tone="negative" />
        <KpiCard
          title="Saldo restante"
          value={formatCurrency(summary.balance)}
          tone={summary.balance >= 0 ? 'positive' : 'negative'}
        />
        <KpiCard title="Próxima fatura" value={formatCurrency(summary.nextBillTotal)} />
        <KpiCard title="Parcelas futuras" value={formatCurrency(summary.futureInstallmentsTotal)} />
        <KpiCard
          title="Meta mensal"
          value={summary.goal ? formatCurrency(summary.goal.valor_meta) : 'Sem meta'}
          description={summary.goal ? `${summary.goalPercent.toFixed(0)}% usado` : 'Cadastre uma meta'}
        />
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="section-title">
            <h2>Gastos por pessoa</h2>
            <span>{monthLabel(period.mes, period.ano)}</span>
          </div>
          <div className="person-grid">
            {PERSONS.map((person) => (
              <div className="person-card" key={person}>
                <span>{person}</span>
                <strong>{formatCurrency(summary.byPerson[person] || 0)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-title">
            <h2>Gastos por categoria</h2>
            <span>Gráfico do mês</span>
          </div>
          <BarList data={summary.categories} />
        </article>
      </section>
    </>
  );
}
