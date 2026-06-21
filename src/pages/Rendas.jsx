import { useState } from 'react';
import EmptyState from '../components/EmptyState';
import MoneyInput from '../components/MoneyInput';
import PageHeader from '../components/PageHeader';
import { formatCurrency, monthLabel } from '../lib/finance';

const initialForm = {
  valor: '',
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
  observacao: '',
};

export default function Rendas({ data, actions }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const remove = async (id) => {
    setError('');
    try {
      await actions.deleteRenda(id);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await actions.saveRenda(form);
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
        title="Cadastro de renda"
        description="Registre sua renda por mês e ano para acompanhar o saldo restante."
      />

      <section className="panel">
        <form className="form-grid" onSubmit={submit}>
          <label>
            Valor
            <MoneyInput
              value={form.valor}
              onChange={(value) => update('valor', value)}
              required
            />
          </label>
          <label>
            Mês
            <input
              type="number"
              min="1"
              max="12"
              value={form.mes}
              onChange={(event) => update('mes', Number(event.target.value))}
              required
            />
          </label>
          <label>
            Ano
            <input
              type="number"
              min="2020"
              value={form.ano}
              onChange={(event) => update('ano', Number(event.target.value))}
              required
            />
          </label>
          <label className="span-2">
            Observação
            <input
              value={form.observacao || ''}
              onChange={(event) => update('observacao', event.target.value)}
              placeholder="Salário, extra, comissão..."
            />
          </label>
          {error && <p className="form-message error">{error}</p>}
          <div className="form-actions">
            <button className="primary-button" disabled={saving}>
              {saving ? 'Salvando...' : form.id ? 'Atualizar renda' : 'Salvar renda'}
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
          <h2>Rendas cadastradas</h2>
          <span>{data.rendas.length} registros</span>
        </div>

        {!data.rendas.length ? (
          <EmptyState text="Cadastre sua primeira renda mensal." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Valor</th>
                  <th>Observação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.rendas.map((renda) => (
                  <tr key={renda.id}>
                    <td>{monthLabel(renda.mes, renda.ano)}</td>
                    <td>{formatCurrency(renda.valor)}</td>
                    <td>{renda.observacao || '-'}</td>
                    <td className="table-actions">
                      <button className="link-button" onClick={() => setForm(renda)}>
                        Editar
                      </button>
                      <button className="link-button danger" onClick={() => remove(renda.id)}>
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
