-- Execute este arquivo uma única vez em Supabase > SQL Editor.

create table if not exists public.reservas_presentes (
    presente_id text primary key,
    nome_pessoa text not null,
    reservado_em timestamptz not null default now()
);

-- Para tabelas criadas antes desta atualização:
alter table public.reservas_presentes
add column if not exists nome_pessoa text;

alter table public.reservas_presentes enable row level security;

create policy "Qualquer pessoa pode consultar reservas"
on public.reservas_presentes
for select
to anon
using (true);

-- A função insere uma reserva uma única vez. O conflito na chave primária
-- faz com que apenas o primeiro clique seja confirmado, inclusive em cliques simultâneos.
create or replace function public.reservar_presente(
    p_presente_id text,
    p_nome_pessoa text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.reservas_presentes (presente_id, nome_pessoa)
    values (p_presente_id, p_nome_pessoa)
    on conflict (presente_id) do nothing;

    return found;
end;
$$;

revoke all on function public.reservar_presente(text, text) from public;
grant execute on function public.reservar_presente(text, text) to anon;
