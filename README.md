<<<<<<< HEAD
# controle_financeiro02
=======
# Controle Financeiro Pessoal

Site completo em React + Vite para controlar renda mensal, gastos, cartões de crédito, compras parceladas, faturas e previsão financeira por pessoa responsável: Eu, Pai ou Mãe.

## Funcionalidades

- Login e cadastro com Supabase Auth.
- Dados protegidos por RLS: cada usuário acessa apenas os próprios registros.
- Dashboard com renda, gastos, saldo, próxima fatura, parcelas futuras, divisão por pessoa e alertas de meta.
- CRUD de rendas, gastos, cartões, compras parceladas e metas mensais.
- Faturas de cartão com cálculo automático pelo dia de fechamento.
- Geração automática de parcelas futuras.
- Tela de compras parceladas com parcelas pagas, restantes, valor restante e status.
- Previsão financeira dos próximos 12 meses.
- Filtros por mês, ano, categoria, pessoa, cartão, pagamento e tipo.
- Interface responsiva com cards, tabelas, formulários e gráficos simples.

## Como rodar

1. Instale as dependências:

```bash
npm install
```

2. Crie um projeto no Supabase.

3. No Supabase, abra o SQL Editor e execute o arquivo:

```text
supabase/schema.sql
```

4. Copie o arquivo de exemplo de variáveis:

```bash
cp .env.example .env
```

5. Preencha o `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
```

6. Inicie o app:

```bash
npm run dev
```

## Regra da fatura

O app calcula a fatura pelo dia de fechamento do cartão.

Exemplo: se o cartão fecha dia 20 e a compra foi feita no dia 25, a compra entra automaticamente na fatura do mês seguinte.

Para compras parceladas, o sistema cria todas as parcelas no ato do cadastro:

- Parcela 1 no mês da fatura correta.
- Parcela 2 no mês seguinte.
- E assim por diante até a última parcela.

## Estrutura

```text
src/
  components/       Componentes reutilizáveis
  hooks/            Integração com Supabase e CRUDs
  lib/              Cliente Supabase, constantes e cálculos financeiros
  pages/            Telas do sistema
supabase/
  schema.sql        Tabelas, índices, trigger e políticas RLS
```

## Observações

- Todo gasto exige `pessoa_responsavel`: Eu, Pai ou Mãe.
- Compras à vista no cartão entram na tela de fatura como parcela `1/1`.
- Compras parceladas ficam na tabela `compras_parceladas` e suas parcelas na tabela `parcelas`.
- Para uma aplicação em produção, vale mover a criação de compra parcelada e parcelas para uma função RPC no Supabase, garantindo transação única no banco.
>>>>>>> 61e97d5 (primeira versao do controle financeiro)
