create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.rendas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  valor numeric(12, 2) not null check (valor >= 0),
  mes integer not null check (mes between 1 and 12),
  ano integer not null check (ano >= 2000),
  observacao text,
  created_at timestamptz not null default now()
);

create table if not exists public.cartoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  limite numeric(12, 2) not null default 0 check (limite >= 0),
  dia_fechamento integer not null check (dia_fechamento between 1 and 31),
  dia_vencimento integer not null check (dia_vencimento between 1 and 31),
  observacao text,
  created_at timestamptz not null default now()
);

create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  descricao text not null,
  valor numeric(12, 2) not null check (valor >= 0),
  data date not null,
  categoria text not null,
  forma_pagamento text not null,
  eh_cartao boolean not null default false,
  cartao_id uuid references public.cartoes(id) on delete set null,
  pessoa_responsavel text not null check (pessoa_responsavel in ('Eu', 'Pai', 'Mãe')),
  observacao text,
  created_at timestamptz not null default now()
);

create table if not exists public.compras_parceladas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  descricao text not null,
  valor_total numeric(12, 2) not null check (valor_total >= 0),
  quantidade_parcelas integer not null check (quantidade_parcelas >= 1),
  valor_parcela numeric(12, 2) not null check (valor_parcela >= 0),
  data_compra date not null,
  categoria text not null,
  cartao_id uuid not null references public.cartoes(id) on delete restrict,
  pessoa_responsavel text not null check (pessoa_responsavel in ('Eu', 'Pai', 'Mãe')),
  observacao text,
  status text not null default 'Em andamento' check (status in ('Em andamento', 'Quitada')),
  created_at timestamptz not null default now()
);

create table if not exists public.parcelas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  compra_id uuid not null references public.compras_parceladas(id) on delete cascade,
  cartao_id uuid not null references public.cartoes(id) on delete restrict,
  numero_parcela integer not null check (numero_parcela >= 1),
  total_parcelas integer not null check (total_parcelas >= 1),
  valor numeric(12, 2) not null check (valor >= 0),
  data_compra date not null,
  mes_fatura integer not null check (mes_fatura between 1 and 12),
  ano_fatura integer not null check (ano_fatura >= 2000),
  data_vencimento date not null,
  status text not null default 'pendente' check (status in ('pendente', 'paga')),
  pessoa_responsavel text not null check (pessoa_responsavel in ('Eu', 'Pai', 'Mãe')),
  observacao text,
  created_at timestamptz not null default now()
);

create table if not exists public.metas_mensais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mes integer not null check (mes between 1 and 12),
  ano integer not null check (ano >= 2000),
  valor_meta numeric(12, 2) not null check (valor_meta >= 0),
  observacao text,
  created_at timestamptz not null default now(),
  unique (user_id, mes, ano)
);

create index if not exists idx_rendas_user_periodo on public.rendas(user_id, ano, mes);
create index if not exists idx_gastos_user_data on public.gastos(user_id, data);
create index if not exists idx_gastos_user_pessoa on public.gastos(user_id, pessoa_responsavel);
create index if not exists idx_cartoes_user on public.cartoes(user_id);
create index if not exists idx_compras_user_cartao on public.compras_parceladas(user_id, cartao_id);
create index if not exists idx_parcelas_user_fatura on public.parcelas(user_id, ano_fatura, mes_fatura);
create index if not exists idx_parcelas_compra on public.parcelas(compra_id);
create index if not exists idx_metas_user_periodo on public.metas_mensais(user_id, ano, mes);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nome', ''), split_part(new.email, '@', 1), 'Usuário')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.rendas enable row level security;
alter table public.cartoes enable row level security;
alter table public.gastos enable row level security;
alter table public.compras_parceladas enable row level security;
alter table public.parcelas enable row level security;
alter table public.metas_mensais enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile"
on public.profiles
for all
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users manage own rendas" on public.rendas;
create policy "Users manage own rendas"
on public.rendas
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own cartoes" on public.cartoes;
create policy "Users manage own cartoes"
on public.cartoes
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own gastos" on public.gastos;
create policy "Users manage own gastos"
on public.gastos
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own compras parceladas" on public.compras_parceladas;
create policy "Users manage own compras parceladas"
on public.compras_parceladas
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own parcelas" on public.parcelas;
create policy "Users manage own parcelas"
on public.parcelas
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own metas mensais" on public.metas_mensais;
create policy "Users manage own metas mensais"
on public.metas_mensais
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.rendas to authenticated;
grant select, insert, update, delete on public.cartoes to authenticated;
grant select, insert, update, delete on public.gastos to authenticated;
grant select, insert, update, delete on public.compras_parceladas to authenticated;
grant select, insert, update, delete on public.parcelas to authenticated;
grant select, insert, update, delete on public.metas_mensais to authenticated;
