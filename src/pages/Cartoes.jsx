import { useState } from 'react';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { formatCurrency } from '../lib/finance';

const initialForm = {
  nome: '',
  limite: '',
  dia_fechamento: 20,
  dia_vencimento: 25,
  observacao: '',
};

export default function Cartoes({ data, actions }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const remove = async (id) => {
    setError('');
    try {
      await actions.deleteCartao(id);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await actions.saveCartao(form);
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
        title="Cartões de crédito"
        description="Cadastre Nubank, Inter, PicPay e outros cartões com fechamento e vencimento."
      />

      <section className="panel">
        <form className="form-grid" onSubmit={submit}>
          <label>
            Nome do cartão
            <input
              value={form.nome}
              onChange={(event) => update('nome', event.target.value)}
              placeholder="Nubank, Inter, PicPay..."
              required
            />
          </label>
          <label>
            Limite
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.limite}
              onChange={(event) => update('limite', event.target.value)}
              required
            />
          </label>
          <label>
            Fechamento
            <input
              type="number"
              min="1"
              max="31"
              value={form.dia_fechamento}
              onChange={(event) => update('dia_fechamento', Number(event.target.value))}
              required
            />
          </label>
          <label>
            Vencimento
            <input
              type="number"
              min="1"
              max="31"
              value={form.dia_vencimento}
              onChange={(event) => update('dia_vencimento', Number(event.target.value))}
              required
            />
          </label>
          <label className="span-2">
            Observação
            <input
              value={form.observacao || ''}
              onChange={(event) => update('observacao', event.target.value)}
              placeholder="Cartão principal, limite compartilhado..."
            />
          </label>
          {error && <p className="form-message error">{error}</p>}
          <div className="form-actions">
            <button className="primary-button" disabled={saving}>
              {saving ? 'Salvando...' : form.id ? 'Atualizar cartão' : 'Salvar cartão'}
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
          <h2>Cartões cadastrados</h2>
          <span>{data.cartoes.length} cartões</span>
        </div>

        {!data.cartoes.length ? (
          <EmptyState text="Cadastre um cartão para registrar compras no crédito." />
        ) : (
          <div className="card-grid">
            {data.cartoes.map((card) => (
              <article className="credit-card" key={card.id}>
                <div>
                  <span>Cartão</span>
                  <strong>{card.nome}</strong>
                </div>
                <p>{formatCurrency(card.limite)} de limite</p>
                <small>
                  Fecha dia {card.dia_fechamento} · Vence dia {card.dia_vencimento}
                </small>
                {card.observacao && <em>{card.observacao}</em>}
                <div className="table-actions">
                  <button className="link-button" onClick={() => setForm(card)}>
                    Editar
                  </button>
                  <button className="link-button danger" onClick={() => remove(card.id)}>
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
