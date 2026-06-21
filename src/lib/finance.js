import { INSTALLMENT_STATUS, PERSONS, PURCHASE_STATUS } from './constants';

export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

export const numberFromInput = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return Number(String(value).replace(/\./g, '').replace(',', '.')) || 0;
};

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const currentMonthYear = () => {
  const now = new Date();
  return {
    mes: now.getMonth() + 1,
    ano: now.getFullYear(),
  };
};

export const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Date(2026, index, 1).toLocaleString('pt-BR', { month: 'long' }),
}));

export const yearOptions = () => {
  const current = new Date().getFullYear();
  return Array.from({ length: 9 }, (_, index) => current - 3 + index);
};

export const monthLabel = (mes, ano) => {
  const date = new Date(Number(ano), Number(mes) - 1, 1);
  return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
};

const pad = (value) => String(value).padStart(2, '0');

export const lastDayOfMonth = (ano, mes) => new Date(Number(ano), Number(mes), 0).getDate();

export const addMonths = (mes, ano, amount) => {
  const date = new Date(Number(ano), Number(mes) - 1 + Number(amount), 1);
  return {
    mes: date.getMonth() + 1,
    ano: date.getFullYear(),
  };
};

export const comparePeriods = (left, right) => {
  const a = Number(left.ano) * 12 + Number(left.mes);
  const b = Number(right.ano) * 12 + Number(right.mes);
  return a - b;
};

export const samePeriod = (dateValue, mes, ano) => {
  if (!dateValue) return false;
  const date = new Date(`${dateValue}T00:00:00`);
  return date.getMonth() + 1 === Number(mes) && date.getFullYear() === Number(ano);
};

export const invoicePeriodForDate = (dateValue, closingDay) => {
  const date = new Date(`${dateValue}T00:00:00`);
  const period = {
    mes: date.getMonth() + 1,
    ano: date.getFullYear(),
  };

  if (date.getDate() > Number(closingDay)) {
    return addMonths(period.mes, period.ano, 1);
  }

  return period;
};

export const billClosingDate = (card, mes, ano) => {
  const day = Math.min(Number(card?.dia_fechamento || 1), lastDayOfMonth(ano, mes));
  return `${ano}-${pad(mes)}-${pad(day)}`;
};

export const billDueDate = (card, mes, ano) => {
  const period =
    Number(card?.dia_vencimento || 1) <= Number(card?.dia_fechamento || 1)
      ? addMonths(mes, ano, 1)
      : { mes: Number(mes), ano: Number(ano) };
  const day = Math.min(
    Number(card?.dia_vencimento || 1),
    lastDayOfMonth(period.ano, period.mes),
  );
  return `${period.ano}-${pad(period.mes)}-${pad(day)}`;
};

export const getCard = (cartoes, id) => cartoes.find((card) => card.id === id);

export const createInstallmentsForPurchase = (purchase, card) => {
  const totalCents = Math.round(numberFromInput(purchase.valor_total) * 100);
  const quantity = Math.max(1, Number(purchase.quantidade_parcelas || 1));
  const baseCents = Math.floor(totalCents / quantity);
  const remainder = totalCents - baseCents * quantity;
  const firstInvoice = invoicePeriodForDate(purchase.data_compra, card.dia_fechamento);

  return Array.from({ length: quantity }, (_, index) => {
    const period = addMonths(firstInvoice.mes, firstInvoice.ano, index);
    const cents = index === quantity - 1 ? baseCents + remainder : baseCents;

    return {
      cartao_id: purchase.cartao_id,
      numero_parcela: index + 1,
      total_parcelas: quantity,
      valor: cents / 100,
      data_compra: purchase.data_compra,
      mes_fatura: period.mes,
      ano_fatura: period.ano,
      data_vencimento: billDueDate(card, period.mes, period.ano),
      status: purchase.status === PURCHASE_STATUS.paid ? INSTALLMENT_STATUS.paid : INSTALLMENT_STATUS.pending,
      pessoa_responsavel: purchase.pessoa_responsavel,
      observacao: purchase.observacao || null,
    };
  });
};

const basePersonTotals = () =>
  PERSONS.reduce((acc, person) => {
    acc[person] = 0;
    return acc;
  }, {});

export const sum = (items, selector = (item) => item.valor) =>
  items.reduce((total, item) => total + Number(selector(item) || 0), 0);

export const totalsByPerson = (items) =>
  items.reduce((acc, item) => {
    const person = item.pessoa_responsavel || 'Eu';
    acc[person] = (acc[person] || 0) + Number(item.valor || 0);
    return acc;
  }, basePersonTotals());

export const oneTimeCardEntries = (data) =>
  data.gastos
    .filter((gasto) => gasto.eh_cartao && gasto.cartao_id)
    .map((gasto) => {
      const card = getCard(data.cartoes, gasto.cartao_id);
      if (!card) return null;
      const period = invoicePeriodForDate(gasto.data, card.dia_fechamento);

      return {
        id: `gasto-${gasto.id}`,
        source_id: gasto.id,
        type: 'a_vista',
        source: 'gastos',
        cartao_id: gasto.cartao_id,
        cartao_nome: card.nome,
        data_compra: gasto.data,
        descricao: gasto.descricao,
        valor: Number(gasto.valor || 0),
        categoria: gasto.categoria,
        forma_pagamento: gasto.forma_pagamento,
        pessoa_responsavel: gasto.pessoa_responsavel,
        observacao: gasto.observacao,
        mes_fatura: period.mes,
        ano_fatura: period.ano,
        data_vencimento: billDueDate(card, period.mes, period.ano),
        parcela_label: '1/1',
      };
    })
    .filter(Boolean);

export const installmentEntries = (data) =>
  data.parcelas.map((parcela) => {
    const purchase = data.compras.find((item) => item.id === parcela.compra_id);
    const card = getCard(data.cartoes, parcela.cartao_id);

    return {
      id: `parcela-${parcela.id}`,
      source_id: parcela.id,
      compra_id: parcela.compra_id,
      type: 'parcelado',
      source: 'parcelas',
      cartao_id: parcela.cartao_id,
      cartao_nome: card?.nome || 'Cartão removido',
      data_compra: parcela.data_compra,
      descricao: purchase?.descricao || 'Compra parcelada',
      valor: Number(parcela.valor || 0),
      categoria: purchase?.categoria || 'Outros',
      forma_pagamento: 'Cartão de crédito',
      pessoa_responsavel: parcela.pessoa_responsavel,
      observacao: parcela.observacao || purchase?.observacao,
      mes_fatura: Number(parcela.mes_fatura),
      ano_fatura: Number(parcela.ano_fatura),
      data_vencimento: parcela.data_vencimento,
      parcela_label: `${parcela.numero_parcela}/${parcela.total_parcelas}`,
      numero_parcela: parcela.numero_parcela,
      total_parcelas: parcela.total_parcelas,
      status: parcela.status,
    };
  });

export const billEntries = (data, filters = {}) => {
  const entries = [...oneTimeCardEntries(data), ...installmentEntries(data)];

  return entries
    .filter((entry) => {
      if (filters.mes && Number(entry.mes_fatura) !== Number(filters.mes)) return false;
      if (filters.ano && Number(entry.ano_fatura) !== Number(filters.ano)) return false;
      if (filters.cartao_id && entry.cartao_id !== filters.cartao_id) return false;
      if (filters.categoria && entry.categoria !== filters.categoria) return false;
      if (filters.pessoa_responsavel && entry.pessoa_responsavel !== filters.pessoa_responsavel) return false;
      if (filters.tipo && entry.type !== filters.tipo) return false;
      return true;
    })
    .sort((a, b) => String(a.data_compra).localeCompare(String(b.data_compra)));
};

export const cashExpenseEntries = (data, mes, ano) =>
  data.gastos
    .filter((gasto) => !gasto.eh_cartao && samePeriod(gasto.data, mes, ano))
    .map((gasto) => ({
      id: `gasto-${gasto.id}`,
      source_id: gasto.id,
      type: 'a_vista',
      source: 'gastos',
      cartao_id: null,
      data_compra: gasto.data,
      descricao: gasto.descricao,
      valor: Number(gasto.valor || 0),
      categoria: gasto.categoria,
      forma_pagamento: gasto.forma_pagamento,
      pessoa_responsavel: gasto.pessoa_responsavel,
      observacao: gasto.observacao,
      parcela_label: 'À vista',
    }));

export const monthlyExpenseEntries = (data, mes, ano, filters = {}) => {
  const cash = cashExpenseEntries(data, mes, ano);
  const card = billEntries(data, { mes, ano });

  return [...cash, ...card].filter((entry) => {
    if (filters.categoria && entry.categoria !== filters.categoria) return false;
    if (filters.pessoa_responsavel && entry.pessoa_responsavel !== filters.pessoa_responsavel) return false;
    if (filters.cartao_id && entry.cartao_id !== filters.cartao_id) return false;
    if (filters.forma_pagamento && entry.forma_pagamento !== filters.forma_pagamento) return false;
    if (filters.tipo && entry.type !== filters.tipo) return false;
    return true;
  });
};

export const monthlyIncome = (rendas, mes, ano) =>
  sum(rendas.filter((renda) => Number(renda.mes) === Number(mes) && Number(renda.ano) === Number(ano)), (renda) => renda.valor);

export const monthlyGoal = (metas, mes, ano) =>
  metas.find((meta) => Number(meta.mes) === Number(mes) && Number(meta.ano) === Number(ano));

export const categoryTotals = (items) => {
  const grouped = items.reduce((acc, item) => {
    const category = item.categoria || 'Outros';
    acc[category] = (acc[category] || 0) + Number(item.valor || 0);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);
};

export const goalAlert = (spent, goalValue) => {
  if (!goalValue) return null;
  const percent = spent / Number(goalValue);
  if (percent >= 1) return { level: 'danger', text: 'Meta mensal ultrapassada' };
  if (percent >= 0.9) return { level: 'danger', text: 'Você chegou a 90% da meta mensal' };
  if (percent >= 0.7) return { level: 'warning', text: 'Você chegou a 70% da meta mensal' };
  return { level: 'success', text: 'Gastos dentro da meta' };
};

export const dashboardSummary = (data, mes, ano) => {
  const income = monthlyIncome(data.rendas, mes, ano);
  const entries = monthlyExpenseEntries(data, mes, ano);
  const spent = sum(entries);
  const goal = monthlyGoal(data.metas, mes, ano);
  const goalValue = Number(goal?.valor_meta || 0);
  const next = addMonths(mes, ano, 1);
  const nextBillTotal = sum(billEntries(data, { mes: next.mes, ano: next.ano }));
  const futureInstallments = data.parcelas.filter(
    (parcela) =>
      comparePeriods(
        { mes: parcela.mes_fatura, ano: parcela.ano_fatura },
        { mes, ano },
      ) > 0 && parcela.status !== INSTALLMENT_STATUS.paid,
  );

  return {
    income,
    spent,
    balance: income - spent,
    nextBillTotal,
    futureInstallmentsTotal: sum(futureInstallments),
    byPerson: totalsByPerson(entries),
    categories: categoryTotals(entries),
    goal,
    goalPercent: goal && goalValue > 0 ? Math.min(100, (spent / goalValue) * 100) : 0,
    alert: goalAlert(spent, goal?.valor_meta),
  };
};

export const purchaseSummaries = (data) =>
  data.compras
    .map((purchase) => {
      const installments = data.parcelas
        .filter((parcela) => parcela.compra_id === purchase.id)
        .sort((a, b) => Number(a.numero_parcela) - Number(b.numero_parcela));
      const paid = installments.filter((parcela) => parcela.status === INSTALLMENT_STATUS.paid);
      const pending = installments.filter((parcela) => parcela.status !== INSTALLMENT_STATUS.paid);
      const card = getCard(data.cartoes, purchase.cartao_id);
      const status = pending.length === 0 && installments.length > 0 ? PURCHASE_STATUS.paid : PURCHASE_STATUS.active;

      return {
        ...purchase,
        cartao_nome: card?.nome || 'Cartão removido',
        parcelas_pagas: paid.length,
        parcelas_restantes: pending.length,
        valor_restante: sum(pending),
        valor_pago: sum(paid),
        valor_parcela_real: installments[0]?.valor || purchase.valor_parcela,
        status_calculado: status,
      };
    })
    .sort((a, b) => String(b.data_compra).localeCompare(String(a.data_compra)));

export const forecastMonths = (data, startMes, startAno, count = 12) =>
  Array.from({ length: count }, (_, index) => {
    const period = addMonths(startMes, startAno, index);
    const entries = billEntries(data, { mes: period.mes, ano: period.ano });
    const installmentItems = entries.filter((entry) => entry.type === 'parcelado');

    return {
      ...period,
      label: monthLabel(period.mes, period.ano),
      totalFatura: sum(entries),
      totalParcelas: sum(installmentItems),
      byPerson: totalsByPerson(entries),
      totalGeral: sum(entries),
    };
  });
