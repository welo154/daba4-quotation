-- Wahaj Studio — shared Supabase schema for Quotations + Invoices
-- Run once in Supabase SQL Editor (Dashboard → SQL → New query → Run).
-- Shared workspace: no login required. Anyone with the app URL can save/load.

begin;

-- ── Invoices ──────────────────────────────────────────────────────────────
create sequence if not exists public.invoice_number_seq;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  number bigint not null unique default nextval('public.invoice_number_seq'),
  invoice_date date not null,
  client text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_history (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid,
  data jsonb not null,
  recorded_at timestamptz not null default now()
);

alter table public.invoices alter column user_id drop not null;
alter table public.invoice_history alter column user_id drop not null;

do $$ begin
  alter table public.invoices drop constraint if exists invoices_user_id_fkey;
  alter table public.invoice_history drop constraint if exists invoice_history_user_id_fkey;
exception when undefined_object then null;
end $$;

alter table public.invoices enable row level security;
alter table public.invoice_history enable row level security;

drop policy if exists anon_select on public.invoices;
drop policy if exists anon_insert on public.invoices;
drop policy if exists anon_update on public.invoices;
drop policy if exists anon_history_select on public.invoice_history;
drop policy if exists anon_history_insert on public.invoice_history;

create policy anon_select on public.invoices for select to anon using (true);
create policy anon_insert on public.invoices for insert to anon with check (true);
create policy anon_update on public.invoices for update to anon using (true) with check (true);
create policy anon_history_select on public.invoice_history for select to anon using (true);
create policy anon_history_insert on public.invoice_history for insert to anon with check (true);

revoke all on public.invoices, public.invoice_history from anon, authenticated;
grant select on public.invoices, public.invoice_history to anon;
grant insert (invoice_date, client, data) on public.invoices to anon;
grant update (invoice_date, client, data) on public.invoices to anon;
grant usage on sequence public.invoice_number_seq to anon;

create or replace function public.invoice_timestamp() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists invoice_timestamp on public.invoices;
create trigger invoice_timestamp before update on public.invoices
  for each row execute function public.invoice_timestamp();

create or replace function public.log_invoice_revision() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.invoice_history (invoice_id, user_id, data)
  values (new.id, new.user_id, to_jsonb(new));
  return new;
end; $$;

drop trigger if exists invoice_revision on public.invoices;
create trigger invoice_revision after insert or update on public.invoices
  for each row execute function public.log_invoice_revision();

-- ── Quotations ──────────────────────────────────────────────────────────
create sequence if not exists public.quotation_number_seq;

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  number bigint not null unique default nextval('public.quotation_number_seq'),
  client text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotation_history (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  user_id uuid,
  data jsonb not null,
  recorded_at timestamptz not null default now()
);

alter table public.quotations enable row level security;
alter table public.quotation_history enable row level security;

drop policy if exists anon_select on public.quotations;
drop policy if exists anon_insert on public.quotations;
drop policy if exists anon_update on public.quotations;
drop policy if exists anon_history_select on public.quotation_history;
drop policy if exists anon_history_insert on public.quotation_history;

create policy anon_select on public.quotations for select to anon using (true);
create policy anon_insert on public.quotations for insert to anon with check (true);
create policy anon_update on public.quotations for update to anon using (true) with check (true);
create policy anon_history_select on public.quotation_history for select to anon using (true);
create policy anon_history_insert on public.quotation_history for insert to anon with check (true);

revoke all on public.quotations, public.quotation_history from anon, authenticated;
grant select on public.quotations, public.quotation_history to anon;
grant insert (client, data) on public.quotations to anon;
grant update (client, data) on public.quotations to anon;
grant usage on sequence public.quotation_number_seq to anon;

create or replace function public.quotation_timestamp() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists quotation_timestamp on public.quotations;
create trigger quotation_timestamp before update on public.quotations
  for each row execute function public.quotation_timestamp();

create or replace function public.log_quotation_revision() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.quotation_history (quotation_id, user_id, data)
  values (new.id, new.user_id, to_jsonb(new));
  return new;
end; $$;

drop trigger if exists quotation_revision on public.quotations;
create trigger quotation_revision after insert or update on public.quotations
  for each row execute function public.log_quotation_revision();

commit;
