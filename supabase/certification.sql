-- ---------------------------------------------------------------------------
-- PrideServe — outside org submissions + certification queue patch
--
-- Additive migration for projects where schema.sql was already applied.
-- Adds intake fields for external organizations and the review columns the
-- Tech Manager certification queue writes to. Safe to run more than once.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'recurrence_pattern') then
    create type public.recurrence_pattern as enum ('daily', 'weekly', 'monthly');
  end if;
end
$$;

alter table public.opportunities
  add column if not exists recurrence_pattern public.recurrence_pattern;

alter table public.opportunities
  add column if not exists organization_name text;

alter table public.opportunities
  add column if not exists required_volunteers integer;

alter table public.opportunities
  add column if not exists review_notes text;

alter table public.opportunities
  add column if not exists reviewed_by uuid references public.users (id) on delete set null;

alter table public.opportunities
  add column if not exists reviewed_at timestamptz;

alter table public.opportunities
  drop constraint if exists opportunities_volunteers_positive;

alter table public.opportunities
  add constraint opportunities_volunteers_positive check (
    required_volunteers is null or required_volunteers > 0
  );

alter table public.opportunities
  drop constraint if exists opportunities_recurrence_needs_flag;

alter table public.opportunities
  add constraint opportunities_recurrence_needs_flag check (
    recurrence_pattern is null or is_recurring = true
  );

create index if not exists opportunities_pending_review_idx
  on public.opportunities (event_date)
  where status = 'pending_certification';

-- ---------------------------------------------------------------------------
-- Certification queue action
-- ---------------------------------------------------------------------------
create or replace function public.review_opportunity(
  p_opportunity_id uuid,
  p_status public.opportunity_status,
  p_notes text default null
)
returns public.opportunities
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.opportunities;
begin
  if not public.is_admin_or_tech_manager() then
    raise exception 'only admins and tech managers can certify opportunities';
  end if;

  if p_status not in ('approved', 'rejected') then
    raise exception 'review status must be approved or rejected';
  end if;

  if p_status = 'rejected' and coalesce(trim(p_notes), '') = '' then
    raise exception 'rejections require feedback';
  end if;

  update public.opportunities
  set status = p_status,
      review_notes = nullif(trim(coalesce(p_notes, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_opportunity_id
  returning * into result;

  if result.id is null then
    raise exception 'opportunity not found';
  end if;

  return result;
end;
$$;

grant execute on function public.review_opportunity(uuid, public.opportunity_status, text) to authenticated;
grant usage on type public.recurrence_pattern to anon, authenticated;
