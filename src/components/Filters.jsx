import { CATEGORIES, PAYMENT_METHODS, PERSONS } from '../lib/constants';

export default function Filters({ filters, onChange, cartoes = [], showMonth = true }) {
  const update = (field, value) => onChange({ ...filters, [field]: value });

  return (
    <section className="filters">
      {showMonth && (
        <>
          <label>
            Mês
            <input
              type="number"
              min="1"
              max="12"
              value={filters.mes || ''}
              onChange={(event) => update('mes', event.target.value)}
              placeholder="Mês"
            />
          </label>
          <label>
            Ano
            <input
              type="number"
              min="2020"
              value={filters.ano || ''}
              onChange={(event) => update('ano', event.target.value)}
              placeholder="Ano"
            />
          </label>
        </>
      )}
      <label>
        Categoria
        <select value={filters.categoria || ''} onChange={(event) => update('categoria', event.target.value)}>
          <option value="">Todas</option>
          {CATEGORIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        Pessoa
        <select
          value={filters.pessoa_responsavel || ''}
          onChange={(event) => update('pessoa_responsavel', event.target.value)}
        >
          <option value="">Todas</option>
          {PERSONS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        Cartão
        <select value={filters.cartao_id || ''} onChange={(event) => update('cartao_id', event.target.value)}>
          <option value="">Todos</option>
          {cartoes.map((card) => (
            <option key={card.id} value={card.id}>
              {card.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Pagamento
        <select
          value={filters.forma_pagamento || ''}
          onChange={(event) => update('forma_pagamento', event.target.value)}
        >
          <option value="">Todos</option>
          {PAYMENT_METHODS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        Tipo
        <select value={filters.tipo || ''} onChange={(event) => update('tipo', event.target.value)}>
          <option value="">Todos</option>
          <option value="a_vista">À vista</option>
          <option value="parcelado">Parcelado</option>
        </select>
      </label>
      <button className="ghost-button" onClick={() => onChange({})}>
        Limpar filtros
      </button>
    </section>
  );
}
