-- Additive auth/onboarding patch if schema.sql was already applied.
alter table public.users
  add column if not exists onboarding_completed boolean not null default false;

alter table public.users
  drop constraint if exists users_honor_societies_allowed;

alter table public.users
  add constraint users_honor_societies_allowed
  check (
    honor_societies <@ array[
      'NHS',
      'NJHS',
      'Beta Club',
      'Spanish Honor Society',
      'Science National Honor Society'
    ]::text[]
  );

create or replace function public.is_school_email(p_email text)
returns boolean
language sql
immutable
as $$
  select lower(coalesce(p_email, '')) like '%@pinelakeprep.org';
$$;

-- Re-run the handle_new_user, enforce_role_email_domain, protect_user_privileged_columns,
-- and complete_onboarding definitions from supabase/schema.sql after this patch.
