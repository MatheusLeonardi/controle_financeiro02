import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { createInstallmentsForPurchase, numberFromInput } from '../lib/finance';
import { PURCHASE_STATUS } from '../lib/constants';

const emptyData = {
  profile: null,
  rendas: [],
  gastos: [],
  cartoes: [],
  compras: [],
  parcelas: [],
  metas: [],
};

const tableMap = {
  rendas: 'rendas',
  gastos: 'gastos',
  cartoes: 'cartoes',
  metas: 'metas_mensais',
};

const pickPayload = (payload, fields) =>
  fields.reduce((acc, field) => {
    if (payload[field] !== undefined) acc[field] = payload[field];
    return acc;
  }, {});

const normalizeMoneyFields = (payload, fields) => {
  const next = { ...payload };
  fields.forEach((field) => {
    if (next[field] !== undefined) next[field] = numberFromInput(next[field]);
  });
  return next;
};

export function useFinanceData(userId) {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ensureUser = useCallback(() => {
    if (!userId) throw new Error('Usuário não autenticado.');
  }, [userId]);

  const loadAll = useCallback(async () => {
    if (!userId || !supabase) {
      setData(emptyData);
      return;
    }

    setLoading(true);
    setError('');

    const requests = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('rendas').select('*').eq('user_id', userId).order('ano', { ascending: false }).order('mes', { ascending: false }),
      supabase.from('gastos').select('*').eq('user_id', userId).order('data', { ascending: false }),
      supabase.from('cartoes').select('*').eq('user_id', userId).order('nome', { ascending: true }),
      supabase.from('compras_parceladas').select('*').eq('user_id', userId).order('data_compra', { ascending: false }),
      supabase.from('parcelas').select('*').eq('user_id', userId).order('ano_fatura', { ascending: true }).order('mes_fatura', { ascending: true }),
      supabase.from('metas_mensais').select('*').eq('user_id', userId).order('ano', { ascending: false }).order('mes', { ascending: false }),
    ]);

    const firstError = requests.find((response) => response.error)?.error;
    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    setData({
      profile: requests[0].data,
      rendas: requests[1].data || [],
      gastos: requests[2].data || [],
      cartoes: requests[3].data || [],
      compras: requests[4].data || [],
      parcelas: requests[5].data || [],
      metas: requests[6].data || [],
    });
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const saveRenda = useCallback(
    async (form) => {
      ensureUser();
      const payload = normalizeMoneyFields(
        pickPayload(form, ['valor', 'mes', 'ano', 'observacao']),
        ['valor'],
      );
      const query = form.id
        ? supabase.from(tableMap.rendas).update(payload).eq('id', form.id).eq('user_id', userId)
        : supabase.from(tableMap.rendas).insert({ ...payload, user_id: userId });
      const { error: requestError } = await query;
      if (requestError) throw requestError;
      await loadAll();
    },
    [ensureUser, loadAll, userId],
  );

  const saveCartao = useCallback(
    async (form) => {
      ensureUser();
      const payload = normalizeMoneyFields(
        pickPayload(form, ['nome', 'limite', 'dia_fechamento', 'dia_vencimento', 'observacao']),
        ['limite'],
      );
      const query = form.id
        ? supabase.from(tableMap.cartoes).update(payload).eq('id', form.id).eq('user_id', userId)
        : supabase.from(tableMap.cartoes).insert({ ...payload, user_id: userId });
      const { error: requestError } = await query;
      if (requestError) throw requestError;
      await loadAll();
    },
    [ensureUser, loadAll, userId],
  );

  const saveGasto = useCallback(
    async (form) => {
      ensureUser();
      const payload = normalizeMoneyFields(
        pickPayload(form, [
          'descricao',
          'valor',
          'data',
          'categoria',
          'forma_pagamento',
          'eh_cartao',
          'cartao_id',
          'pessoa_responsavel',
          'observacao',
        ]),
        ['valor'],
      );
      payload.eh_cartao = Boolean(payload.eh_cartao);
      payload.cartao_id = payload.eh_cartao ? payload.cartao_id : null;

      const query = form.id
        ? supabase.from(tableMap.gastos).update(payload).eq('id', form.id).eq('user_id', userId)
        : supabase.from(tableMap.gastos).insert({ ...payload, user_id: userId });
      const { error: requestError } = await query;
      if (requestError) throw requestError;
      await loadAll();
    },
    [ensureUser, loadAll, userId],
  );

  const saveMeta = useCallback(
    async (form) => {
      ensureUser();
      const payload = normalizeMoneyFields(
        pickPayload(form, ['mes', 'ano', 'valor_meta', 'observacao']),
        ['valor_meta'],
      );
      const query = form.id
        ? supabase.from(tableMap.metas).update(payload).eq('id', form.id).eq('user_id', userId)
        : supabase
            .from(tableMap.metas)
            .upsert({ ...payload, user_id: userId }, { onConflict: 'user_id,mes,ano' });
      const { error: requestError } = await query;
      if (requestError) throw requestError;
      await loadAll();
    },
    [ensureUser, loadAll, userId],
  );

  const deleteFromTable = useCallback(
    async (kind, id) => {
      ensureUser();
      const { error: requestError } = await supabase
        .from(tableMap[kind])
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (requestError) throw requestError;
      await loadAll();
    },
    [ensureUser, loadAll, userId],
  );

  const saveCompraParcelada = useCallback(
    async (form) => {
      ensureUser();
      const card = data.cartoes.find((item) => item.id === form.cartao_id);
      if (!card) throw new Error('Selecione um cartão válido para a compra parcelada.');

      const payload = normalizeMoneyFields(
        pickPayload(form, [
          'descricao',
          'valor_total',
          'quantidade_parcelas',
          'data_compra',
          'categoria',
          'cartao_id',
          'pessoa_responsavel',
          'observacao',
          'status',
        ]),
        ['valor_total'],
      );

      payload.quantidade_parcelas = Math.max(1, Number(payload.quantidade_parcelas || 1));
      payload.valor_parcela = Number((payload.valor_total / payload.quantidade_parcelas).toFixed(2));
      payload.status = payload.status || PURCHASE_STATUS.active;

      let purchaseId = form.id;
      if (form.id) {
        const { error: updateError } = await supabase
          .from('compras_parceladas')
          .update(payload)
          .eq('id', form.id)
          .eq('user_id', userId);
        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from('parcelas')
          .delete()
          .eq('compra_id', form.id)
          .eq('user_id', userId);
        if (deleteError) throw deleteError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('compras_parceladas')
          .insert({ ...payload, user_id: userId })
          .select('id')
          .single();
        if (insertError) throw insertError;
        purchaseId = inserted.id;
      }

      const parcelas = createInstallmentsForPurchase(payload, card).map((parcela) => ({
        ...parcela,
        user_id: userId,
        compra_id: purchaseId,
      }));

      const { error: parcelasError } = await supabase.from('parcelas').insert(parcelas);
      if (parcelasError) throw parcelasError;
      await loadAll();
    },
    [data.cartoes, ensureUser, loadAll, userId],
  );

  const deleteCompraParcelada = useCallback(
    async (id) => {
      ensureUser();
      const { error: parcelasError } = await supabase
        .from('parcelas')
        .delete()
        .eq('compra_id', id)
        .eq('user_id', userId);
      if (parcelasError) throw parcelasError;

      const { error: compraError } = await supabase
        .from('compras_parceladas')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (compraError) throw compraError;
      await loadAll();
    },
    [ensureUser, loadAll, userId],
  );

  const updateParcelaStatus = useCallback(
    async (id, status) => {
      ensureUser();
      const { data: updated, error: requestError } = await supabase
        .from('parcelas')
        .update({ status })
        .eq('id', id)
        .eq('user_id', userId)
        .select('compra_id')
        .single();
      if (requestError) throw requestError;

      const related = data.parcelas
        .filter((parcela) => parcela.compra_id === updated.compra_id)
        .map((parcela) => (parcela.id === id ? { ...parcela, status } : parcela));
      const allPaid = related.length > 0 && related.every((parcela) => parcela.status === 'paga');

      await supabase
        .from('compras_parceladas')
        .update({ status: allPaid ? PURCHASE_STATUS.paid : PURCHASE_STATUS.active })
        .eq('id', updated.compra_id)
        .eq('user_id', userId)
        .throwOnError();

      await loadAll();
    },
    [data.parcelas, ensureUser, loadAll, userId],
  );

  const markPurchaseStatus = useCallback(
    async (purchaseId, status) => {
      ensureUser();
      const parcelaStatus = status === PURCHASE_STATUS.paid ? 'paga' : 'pendente';
      const { error: parcelasError } = await supabase
        .from('parcelas')
        .update({ status: parcelaStatus })
        .eq('compra_id', purchaseId)
        .eq('user_id', userId);
      if (parcelasError) throw parcelasError;

      const { error: compraError } = await supabase
        .from('compras_parceladas')
        .update({ status })
        .eq('id', purchaseId)
        .eq('user_id', userId);
      if (compraError) throw compraError;
      await loadAll();
    },
    [ensureUser, loadAll, userId],
  );

  return useMemo(
    () => ({
      data,
      loading,
      error,
      loadAll,
      actions: {
        saveRenda,
        saveCartao,
        saveGasto,
        saveMeta,
        saveCompraParcelada,
        deleteCompraParcelada,
        updateParcelaStatus,
        markPurchaseStatus,
        deleteRenda: (id) => deleteFromTable('rendas', id),
        deleteCartao: (id) => deleteFromTable('cartoes', id),
        deleteGasto: (id) => deleteFromTable('gastos', id),
        deleteMeta: (id) => deleteFromTable('metas', id),
      },
    }),
    [
      data,
      loading,
      error,
      loadAll,
      saveRenda,
      saveCartao,
      saveGasto,
      saveMeta,
      saveCompraParcelada,
      deleteCompraParcelada,
      updateParcelaStatus,
      markPurchaseStatus,
      deleteFromTable,
    ],
  );
}
