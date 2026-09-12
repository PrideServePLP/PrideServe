-- ---------------------------------------------------------------------------
-- PrideServe — let the service role write rows on behalf of other users
--
-- The domain triggers derive student_id, status, and privileged user columns
-- from auth.uid(). That is correct for end users but makes `npm run seed`
-- impossible, because a service-role connection has no auth.uid() at all.
--
-- Apply after schema.sql. Safe to run more than once.
-- ---------------------------------------------------------------------------

-- True when no end user is behind the statement, which under the existing
-- grants can only be a trusted server-side connection using the service role
-- key: anon holds no write grants on these tables, and authenticated always
-- carries an auth.uid().
create or replace function public.is_service_actor()
returns boolean
language sql
stable
as $$
  select auth.uid() is null;
$$;

grant execute on function public.is_service_actor() to anon, authenticated;

-- users: allow seeding is_tech_manager and email
create or replace function public.protect_user_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_actor() or public.is_admin_or_tech_manager() then
    return new;
  end if;

  new.is_tech_manager := old.is_tech_manager;
  new.email := old.email;

  if old.onboarding_completed then
    new.role := old.role;
    new.honor_societies := old.honor_societies;
    new.onboarding_completed := true;
  elsif new.role = 'admin' and old.role is distinct from 'admin' then
    new.role := old.role;
  end if;

  return new;
end;
$$;

-- event_signups: allow seeding a signup for a named student
create or replace function public.event_signups_enforce_domain()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and not public.is_service_actor() then
    new.student_id := auth.uid();
    new.status := 'registered';
    new.signed_up_at := now();

    if public.current_user_role() is distinct from 'student' then
      raise exception 'only students can sign up for opportunities';
    end if;

    if not public.can_view_opportunity(new.opportunity_id) then
      raise exception 'opportunity is not available to this student';
    end if;
  end if;

  return new;
end;
$$;

-- hour_logs: allow seeding logs already in a verified or rejected state
create or replace function public.hour_logs_enforce_domain()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and not public.is_service_actor() then
    new.student_id := auth.uid();
    new.status := 'pending';
    new.supervisor_signature_status := false;
    new.verified_by := null;
    new.created_at := now();
  end if;

  if tg_op = 'UPDATE'
     and (
       new.status is distinct from old.status
       or new.supervisor_signature_status is distinct from old.supervisor_signature_status
       or new.verified_by is distinct from old.verified_by
     )
     and not public.is_staff()
     and not public.is_service_actor() then
    raise exception 'only staff, admins, or tech managers can verify hour logs';
  end if;

  if tg_op = 'UPDATE'
     and new.status in ('verified', 'rejected')
     and public.is_staff() then
    new.verified_by := coalesce(new.verified_by, auth.uid());
  end if;

  return new;
end;
$$;
