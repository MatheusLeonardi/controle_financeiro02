import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { CATEGORIES, PERSONS, PURCHASE_STATUS } from '../lib/constants';
import { formatCurrency, purchaseSummaries, todayIso } from '../lib/finance';

const initialForm = {
  descricao: '',
  valor_total: '',
  quantidade_parcelas: 2,
  data_compra: todayIso(),
  categoria: 'Compras',
  cartao_id: '',
  pessoa_responsavel: 'Eu',
  observacao: '',
  status: PURCHASE_STATUS.active,
};

export default function ComprasParceladas({ data, actions }) {
  const [form, setForm] = useState(initialForm);
  const [filter, setFilter] = useState({ pessoa: '', cartao: '', status: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const summaries = useMemo(() => {
    return purchaseSummaries(data).filter((purchase) => {
      if (filter.pessoa && purchase.pessoa_responsavel !== filter.pessoa) return false;
      if (filter.cartao && purchase.cartao_id !== filter.cartao) return false;
      if (filter.status && purchase.status_calculado !== filter.status) return false;
      return true;
    });
  }, [data, filter]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const runAction = async (operation) => {
    setError('');
    try {
      await operation();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await actions.saveCompraParcelada(form);
      setForm(initialForm);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Compras Parceladas"
        description="Cadastre a compra uma vez e deixe o sistema gerar todas as parcelas futuras."
      />

      <section className="panel">
        <form className="form-grid" onSubmit={submit}>
          <label className="span-2">
            Descrição
            <input
              value={form.descricao}
              onChange={(event) => update('descricao', event.target.value)}
              placeholder="Notebook, celular, compra grande..."
              required
            />
          </label>
          <label>
            Valor total
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.valor_total}
              onChange={(event) => update('valor_total', event.target.value)}
              required
            />
          </label>
          <label>
            Parcelas
            <input
              type="number"
              min="1"
              max="120"
              value={form.quantidade_parcelas}
              onChange={(event) => update('quantidade_parcelas', Number(event.target.value))}
              required
            />
          </label>
          <label>
            Data da compra
            <input
              type="date"
              value={form.data_compra}
              onChange={(event) => update('data_compra', event.target.value)}
              required
            />
          </label>
          <label>
            Cartão
            <select value={form.cartao_id} onChange={(event) => update('cartao_id', event.target.value)} required>
              <option value="">Selecione</option>
              {data.cartoes.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Categoria
            <select value={form.categoria} onChange={(event) => update('categoria', event.target.value)}>
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            Pessoa responsável
            <select
              value={form.pessoa_responsavel}
              onChange={(event) => update('pessoa_responsavel', event.target.value)}
              required
            >
              {PERSONS.map((person) => (
                <option key={person}>{person}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => update('status', event.target.value)}>
              <option>{PURCHASE_STATUS.active}</option>
              <option>{PURCHASE_STATUS.paid}</option>
            </select>
          </label>
          <label className="span-2">
            Observação
            <input
              value={form.observacao || ''}
              onChange={(event) => update('observacao', event.target.value)}
              placeholder="Detalhes opcionais"
            />
          </label>
          {error && <p className="form-message error">{error}</p>}
          <div className="form-actions">
            <button className="primary-button" disabled={saving}>
              {saving ? 'Salvando...' : form.id ? 'Atualizar compra' : 'Salvar compra parcelada'}
            </button>
            {form.id && (
              <button type="button" className="ghost-button" onClick={() => setForm(initialForm)}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="filters compact">
          <label>
            Pessoa
            <select value={filter.pessoa} onChange={(event) => setFilter({ ...filter, pessoa: event.target.value })}>
              <option value="">Todas</option>
              {PERSONS.map((person) => (
                <option key={person}>{person}</option>
              ))}
            </select>
          </label>
          <label>
            Cartão
            <select value={filter.cartao} onChange={(event) => setFilter({ ...filter, cartao: event.target.value })}>
              <option value="">Todos</option>
              {data.cartoes.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={filter.status} onChange={(event) => setFilter({ ...filter, status: event.target.value })}>
              <option value="">Todos</option>
              <option>{PURCHASE_STATUS.active}</option>
              <option>{PURCHASE_STATUS.paid}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>Resumo das compras</h2>
          <span>{summaries.length} compras</span>
        </div>

        {!summaries.length ? (
          <EmptyState text="Nenhuma compra parcelada encontrada." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Total</th>
                  <th>Parcelas</th>
                  <th>Valor parcela</th>
                  <th>Pagas</th>
                  <th>Restantes</th>
                  <th>Valor restante</th>
                  <th>Cartão</th>
                  <th>Pessoa</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>
                      <strong>{purchase.descricao}</strong>
                      <small>{new Date(`${purchase.data_compra}T00:00:00`).toLocaleDateString('pt-BR')}</small>
                    </td>
                    <td>{formatCurrency(purchase.valor_total)}</td>
                    <td>{purchase.quantidade_parcelas}</td>
                    <td>{formatCurrency(purchase.valor_parcela_real)}</td>
                    <td>{purchase.parcelas_pagas}</td>
                    <td>{purchase.parcelas_restantes}</td>
                    <td>{formatCurrency(purchase.valor_restante)}</td>
                    <td>{purchase.cartao_nome}</td>
                    <td>{purchase.pessoa_responsavel}</td>
                    <td>
                      <span className={`status-pill ${purchase.status_calculado === PURCHASE_STATUS.paid ? 'paid' : 'pending'}`}>
                        {purchase.status_calculado}
                      </span>
                    </td>
                    <td className="table-actions">
                      <button className="link-button" onClick={() => setForm(purchase)}>
                        Editar
                      </button>
                      <button
                        className="link-button"
                        onClick={() =>
                          runAction(() =>
                            actions.markPurchaseStatus(
                              purchase.id,
                              purchase.status_calculado === PURCHASE_STATUS.paid
                                ? PURCHASE_STATUS.active
                                : PURCHASE_STATUS.paid,
                            ),
                          )
                        }
                      >
                        {purchase.status_calculado === PURCHASE_STATUS.paid ? 'Reabrir' : 'Quitar'}
                      </button>
                      <button
                        className="link-button danger"
                        onClick={() => runAction(() => actions.deleteCompraParcelada(purchase.id))}
                      >
                        Excluir
                      </button>
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
