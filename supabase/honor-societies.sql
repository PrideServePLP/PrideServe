-- ---------------------------------------------------------------------------
-- PrideServe — honor society portal + private assignment patch
--
-- Additive migration for projects where schema.sql was already applied.
-- Adds per-society targeting (honor_society) and the club-internal vs
-- community-external distinction (service_scope) to opportunities.
-- Safe to run more than once.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'service_scope') then
    create type public.service_scope as enum (
      'club_internal',
      'community_external'
    );
  end if;
end
$$;

alter table public.opportunities
  add column if not exists honor_society text;

alter table public.opportunities
  add column if not exists service_scope public.service_scope
  not null default 'community_external';

alter table public.opportunities
  drop constraint if exists opportunities_honor_society_allowed;

alter table public.opportunities
  add constraint opportunities_honor_society_allowed check (
    honor_society is null
    or honor_society = any (array[
      'NHS',
      'NJHS',
      'Beta Club',
      'Spanish Honor Society',
      'Science National Honor Society'
    ]::text[])
  );

alter table public.opportunities
  drop constraint if exists opportunities_club_internal_needs_society;

alter table public.opportunities
  add constraint opportunities_club_internal_needs_society check (
    service_scope <> 'club_internal'
    or honor_society is not null
  );

create index if not exists opportunities_honor_society_idx
  on public.opportunities (honor_society)
  where honor_society is not null;

create index if not exists opportunities_assigned_student_idx
  on public.opportunities (assigned_student_id)
  where assigned_student_id is not null;

-- ---------------------------------------------------------------------------
-- Membership helper for the five named PLP societies
-- ---------------------------------------------------------------------------
create or replace function public.user_in_society(p_user_id uuid, p_society text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_society is not null
    and exists (
      select 1
      from public.users u
      where u.id = p_user_id
        and u.honor_societies @> array[p_society]::text[]
    );
$$;

create or replace function public.can_view_opportunity(p_opportunity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.opportunities o
    where o.id = p_opportunity_id
      and (
        public.is_admin_or_tech_manager()
        or o.created_by = auth.uid()
        or o.assigned_student_id = auth.uid()
        or (
          o.status = 'approved'
          and o.assigned_student_id is null
          and o.honor_society is null
          and not public.is_honor_society_category(o.category)
        )
        or (
          o.status = 'approved'
          and o.assigned_student_id is null
          and o.honor_society is not null
          and public.user_in_society(auth.uid(), o.honor_society)
        )
        or (
          o.status = 'approved'
          and o.assigned_student_id is null
          and o.honor_society is null
          and public.is_honor_society_category(o.category)
          and public.user_enrolled_in_honor_society(auth.uid(), o.category)
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Read policies rebuilt around honor_society
-- ---------------------------------------------------------------------------
drop policy if exists opportunities_public_read_approved on public.opportunities;
drop policy if exists opportunities_society_read_members on public.opportunities;
drop policy if exists opportunities_honor_society_read on public.opportunities;

create policy opportunities_public_read_approved
  on public.opportunities
  for select
  to anon, authenticated
  using (
    status = 'approved'
    and assigned_student_id is null
    and honor_society is null
    and not public.is_honor_society_category(category)
  );

create policy opportunities_society_read_members
  on public.opportunities
  for select
  to authenticated
  using (
    status = 'approved'
    and assigned_student_id is null
    and honor_society is not null
    and public.user_in_society(auth.uid(), honor_society)
  );

create policy opportunities_honor_society_read
  on public.opportunities
  for select
  to authenticated
  using (
    status = 'approved'
    and honor_society is null
    and assigned_student_id is null
    and public.is_honor_society_category(category)
    and public.user_enrolled_in_honor_society(auth.uid(), category)
  );

grant execute on function public.user_in_society(uuid, text) to authenticated;
grant usage on type public.service_scope to anon, authenticated;
