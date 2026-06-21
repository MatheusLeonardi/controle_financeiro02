import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import KpiCard from '../components/KpiCard';
import MonthYearSelect from '../components/MonthYearSelect';
import PageHeader from '../components/PageHeader';
import { INSTALLMENT_STATUS, PERSONS } from '../lib/constants';
import {
  billClosingDate,
  billDueDate,
  billEntries,
  formatCurrency,
  getCard,
  monthLabel,
  sum,
  totalsByPerson,
} from '../lib/finance';

const personOrder = PERSONS.reduce((acc, person, index) => {
  acc[person] = index;
  return acc;
}, {});

export default function Fatura({ data, period, setPeriod, actions }) {
  const [cardId, setCardId] = useState('');
  const [updating, setUpdating] = useState('');
  const [error, setError] = useState('');

  const selectedCard = getCard(data.cartoes, cardId);
  const entries = useMemo(
    () =>
      billEntries(data, { mes: period.mes, ano: period.ano, cartao_id: cardId }).sort((a, b) => {
        const personDiff =
          (personOrder[a.pessoa_responsavel] ?? PERSONS.length) -
          (personOrder[b.pessoa_responsavel] ?? PERSONS.length);

        if (personDiff !== 0) return personDiff;

        const dateDiff = String(a.data_compra).localeCompare(String(b.data_compra));
        if (dateDiff !== 0) return dateDiff;

        return String(a.descricao).localeCompare(String(b.descricao));
      }),
    [cardId, data, period.ano, period.mes],
  );
  const byPerson = totalsByPerson(entries);
  const total = sum(entries);

  const toggleStatus = async (entry) => {
    const nextStatus = entry.status === INSTALLMENT_STATUS.paid ? INSTALLMENT_STATUS.pending : INSTALLMENT_STATUS.paid;
    setError('');
    setUpdating(entry.source_id);
    try {
      await actions.updateParcelaStatus(entry.source_id, nextStatus);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdating('');
    }
  };

  return (
    <>
      <PageHeader
        title="Fatura do cartão"
        description="Veja o total da fatura, vencimento, fechamento e quanto cada pessoa deve pagar."
        aside={<MonthYearSelect mes={period.mes} ano={period.ano} onChange={setPeriod} />}
      />

      <section className="panel">
        <div className="filters compact">
          <label>
            Cartão
            <select value={cardId} onChange={(event) => setCardId(event.target.value)}>
              <option value="">Todos os cartões</option>
              {data.cartoes.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.nome}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className="form-message error">{error}</p>}
      </section>

      <section className="kpi-grid">
        <KpiCard
          title="Fatura"
          value={formatCurrency(total)}
          description={selectedCard ? selectedCard.nome : 'Todos os cartões'}
        />
        <KpiCard
          title="Fechamento"
          value={selectedCard ? new Date(`${billClosingDate(selectedCard, period.mes, period.ano)}T00:00:00`).toLocaleDateString('pt-BR') : '-'}
          description={monthLabel(period.mes, period.ano)}
        />
        <KpiCard
          title="Vencimento"
          value={selectedCard ? new Date(`${billDueDate(selectedCard, period.mes, period.ano)}T00:00:00`).toLocaleDateString('pt-BR') : '-'}
          description="Data prevista"
        />
        {PERSONS.map((person) => (
          <KpiCard key={person} title={person} value={formatCurrency(byPerson[person] || 0)} />
        ))}
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>Itens da fatura</h2>
          <span>{entries.length} lançamentos</span>
        </div>

        {!entries.length ? (
          <EmptyState text="Nenhum lançamento encontrado para esta fatura." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data da compra</th>
                  <th>Descrição</th>
                  <th>Parcela</th>
                  <th>Valor</th>
                  <th>Categoria</th>
                  <th>Pessoa</th>
                  <th>Observação</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(`${entry.data_compra}T00:00:00`).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <strong>{entry.descricao}</strong>
                      <small>{entry.cartao_nome}</small>
                    </td>
                    <td>{entry.parcela_label}</td>
                    <td>{formatCurrency(entry.valor)}</td>
                    <td>{entry.categoria}</td>
                    <td>{entry.pessoa_responsavel}</td>
                    <td>{entry.observacao || '-'}</td>
                    <td>
                      {entry.source === 'parcelas' ? (
                        <button
                          className={`status-pill ${entry.status === INSTALLMENT_STATUS.paid ? 'paid' : 'pending'}`}
                          disabled={updating === entry.source_id}
                          onClick={() => toggleStatus(entry)}
                        >
                          {entry.status === INSTALLMENT_STATUS.paid ? 'Paga' : 'Pendente'}
                        </button>
                      ) : (
                        <span className="status-pill paid">À vista</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
