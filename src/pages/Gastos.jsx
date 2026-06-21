import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import Filters from '../components/Filters';
import MoneyInput from '../components/MoneyInput';
import PageHeader from '../components/PageHeader';
import { CATEGORIES, PAYMENT_METHODS, PERSONS, PURCHASE_STATUS } from '../lib/constants';
import { formatCurrency, todayIso } from '../lib/finance';

const initialForm = {
  descricao: '',
  valor: '',
  data: todayIso(),
  categoria: 'Outros',
  forma_pagamento: 'Pix',
  eh_cartao: false,
  tipo_cartao: 'a_vista',
  cartao_id: '',
  pessoa_responsavel: 'Eu',
  observacao: '',
  quantidade_parcelas: 1,
};

export default function Gastos({ data, actions }) {
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'forma_pagamento') {
        next.eh_cartao = value === 'Cartão de crédito';
        if (value !== 'Cartão de crédito') {
          next.cartao_id = '';
          next.tipo_cartao = 'a_vista';
          next.quantidade_parcelas = 1;
        }
      }
      return next;
    });
  };

  const remove = async (id) => {
    setError('');
    try {
      await actions.deleteGasto(id);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const filteredGastos = useMemo(() => {
    return data.gastos.filter((gasto) => {
      const date = new Date(`${gasto.data}T00:00:00`);
      if (filters.mes && date.getMonth() + 1 !== Number(filters.mes)) return false;
      if (filters.ano && date.getFullYear() !== Number(filters.ano)) return false;
      if (filters.categoria && gasto.categoria !== filters.categoria) return false;
      if (filters.pessoa_responsavel && gasto.pessoa_responsavel !== filters.pessoa_responsavel) return false;
      if (filters.cartao_id && gasto.cartao_id !== filters.cartao_id) return false;
      if (filters.forma_pagamento && gasto.forma_pagamento !== filters.forma_pagamento) return false;
      if (filters.tipo === 'parcelado') return false;
      return true;
    });
  }, [data.gastos, filters]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (form.eh_cartao && !form.cartao_id) {
        throw new Error('Selecione o cartão utilizado.');
      }

      if (form.eh_cartao && form.tipo_cartao === 'parcelado') {
        await actions.saveCompraParcelada({
          descricao: form.descricao,
          valor_total: form.valor,
          quantidade_parcelas: form.quantidade_parcelas,
          data_compra: form.data,
          categoria: form.categoria,
          cartao_id: form.cartao_id,
          pessoa_responsavel: form.pessoa_responsavel,
          observacao: form.observacao,
          status: PURCHASE_STATUS.active,
        });
      } else {
        await actions.saveGasto({
          ...form,
          eh_cartao: form.forma_pagamento === 'Cartão de crédito',
          cartao_id: form.forma_pagamento === 'Cartão de crédito' ? form.cartao_id : null,
        });
      }

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
        title="Cadastro de gastos"
        description="Registre cada gasto com categoria, forma de pagamento e pessoa responsável."
      />

      <section className="panel">
        <form className="form-grid" onSubmit={submit}>
          <label className="span-2">
            Descrição
            <input
              value={form.descricao}
              onChange={(event) => update('descricao', event.target.value)}
              placeholder="Mercado, farmácia, assinatura..."
              required
            />
          </label>
          <label>
            {form.tipo_cartao === 'parcelado' ? 'Valor total' : 'Valor'}
            <MoneyInput
              value={form.valor}
              onChange={(value) => update('valor', value)}
              required
            />
          </label>
          <label>
            Data
            <input type="date" value={form.data} onChange={(event) => update('data', event.target.value)} required />
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
            Forma de pagamento
            <select value={form.forma_pagamento} onChange={(event) => update('forma_pagamento', event.target.value)}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method}>{method}</option>
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
          {form.eh_cartao && (
            <>
              <label>
                Cartão utilizado
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
                Tipo
                <select value={form.tipo_cartao} onChange={(event) => update('tipo_cartao', event.target.value)}>
                  <option value="a_vista">Compra à vista</option>
                  <option value="parcelado">Compra parcelada</option>
                </select>
              </label>
              {form.tipo_cartao === 'parcelado' && (
                <label>
                  Número de parcelas
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={form.quantidade_parcelas}
                    onChange={(event) => update('quantidade_parcelas', Number(event.target.value))}
                    required
                  />
                </label>
              )}
            </>
          )}
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
              {saving ? 'Salvando...' : form.id ? 'Atualizar gasto' : 'Salvar gasto'}
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
        <div className="section-title">
          <h2>Filtros</h2>
          <span>Refine a lista</span>
        </div>
        <Filters filters={filters} onChange={setFilters} cartoes={data.cartoes} />
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>Gastos cadastrados</h2>
          <span>{filteredGastos.length} registros</span>
        </div>

        {!filteredGastos.length ? (
          <EmptyState text="Nenhum gasto encontrado para os filtros atuais." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Categoria</th>
                  <th>Pagamento</th>
                  <th>Pessoa</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredGastos.map((gasto) => (
                  <tr key={gasto.id}>
                    <td>{new Date(`${gasto.data}T00:00:00`).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <strong>{gasto.descricao}</strong>
                      {gasto.observacao && <small>{gasto.observacao}</small>}
                    </td>
                    <td>{formatCurrency(gasto.valor)}</td>
                    <td>{gasto.categoria}</td>
                    <td>
                      {gasto.forma_pagamento}
                      {gasto.cartao_id && (
                        <small>{data.cartoes.find((card) => card.id === gasto.cartao_id)?.nome}</small>
                      )}
                    </td>
                    <td>{gasto.pessoa_responsavel}</td>
                    <td className="table-actions">
                      <button className="link-button" onClick={() => setForm({ ...gasto, tipo_cartao: 'a_vista' })}>
                        Editar
                      </button>
                      <button className="link-button danger" onClick={() => remove(gasto.id)}>
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
