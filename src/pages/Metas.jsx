import { useState } from 'react';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { dashboardSummary, formatCurrency, monthLabel } from '../lib/finance';

const initialForm = {
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
  valor_meta: '',
  observacao: '',
};

export default function Metas({ data, actions }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const remove = async (id) => {
    setError('');
    try {
      await actions.deleteMeta(id);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await actions.saveMeta(form);
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
        title="Metas e alertas"
        description="Defina um limite mensal de gastos e acompanhe os avisos automáticos."
      />

      <section className="panel">
        <form className="form-grid" onSubmit={submit}>
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
          <label>
            Valor máximo permitido
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.valor_meta}
              onChange={(event) => update('valor_meta', event.target.value)}
              required
            />
          </label>
          <label className="span-2">
            Observação
            <input
              value={form.observacao || ''}
              onChange={(event) => update('observacao', event.target.value)}
              placeholder="Meta padrão, mês com viagem..."
            />
          </label>
          {error && <p className="form-message error">{error}</p>}
          <div className="form-actions">
            <button className="primary-button" disabled={saving}>
              {saving ? 'Salvando...' : form.id ? 'Atualizar meta' : 'Salvar meta'}
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
          <h2>Metas cadastradas</h2>
          <span>{data.metas.length} metas</span>
        </div>

        {!data.metas.length ? (
          <EmptyState text="Cadastre uma meta mensal para receber alertas." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Meta</th>
                  <th>Gasto atual</th>
                  <th>Uso</th>
                  <th>Alerta</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.metas.map((meta) => {
                  const summary = dashboardSummary(data, meta.mes, meta.ano);
                  return (
                    <tr key={meta.id}>
                      <td>
                        <strong>{monthLabel(meta.mes, meta.ano)}</strong>
                        {meta.observacao && <small>{meta.observacao}</small>}
                      </td>
                      <td>{formatCurrency(meta.valor_meta)}</td>
                      <td>{formatCurrency(summary.spent)}</td>
                      <td>
                        <div className="mini-progress">
                          <span style={{ width: `${Math.min(100, summary.goalPercent || 0)}%` }} />
                        </div>
                        <small>{(summary.goalPercent || 0).toFixed(0)}%</small>
                      </td>
                      <td>
                        <span className={`status-pill ${summary.alert?.level || 'paid'}`}>
                          {summary.alert?.text || 'Sem alerta'}
                        </span>
                      </td>
                      <td className="table-actions">
                        <button className="link-button" onClick={() => setForm(meta)}>
                          Editar
                        </button>
                        <button className="link-button danger" onClick={() => remove(meta.id)}>
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
