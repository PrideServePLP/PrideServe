-- PrideServe domain schema
-- Copy this entire file into the Supabase SQL editor and press Run.
-- Safe on a brand-new project and safe to re-run (it rebuilds from scratch).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reset
-- ---------------------------------------------------------------------------
-- Only auth.users is guaranteed to exist on a first run, so that is the only
-- trigger dropped by name. Public tables, functions, and types use IF EXISTS
-- without argument types so missing objects do not abort the script.
drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.notifications cascade;
drop table if exists public.hour_logs cascade;
drop table if exists public.event_signups cascade;
drop table if exists public.opportunities cascade;
drop table if exists public.users cascade;

drop function if exists public.handle_new_user cascade;
drop function if exists public.protect_user_privileged_columns cascade;
drop function if exists public.enforce_role_email_domain cascade;
drop function if exists public.is_school_email cascade;
drop function if exists public.is_service_actor cascade;
drop function if exists public.complete_onboarding cascade;
drop function if exists public.opportunities_enforce_domain cascade;
drop function if exists public.hour_logs_enforce_domain cascade;
drop function if exists public.event_signups_enforce_domain cascade;
drop function if exists public.review_opportunity cascade;
drop function if exists public.review_hour_logs cascade;
drop function if exists public.notify_user cascade;
drop function if exists public.notify_on_signup cascade;
drop function if exists public.notify_on_opportunity_review cascade;
drop function if exists public.notify_on_hour_log_review cascade;
drop function if exists public.can_view_opportunity cascade;
drop function if exists public.user_in_society cascade;
drop function if exists public.user_enrolled_in_honor_society cascade;
drop function if exists public.is_honor_society_category cascade;
drop function if exists public.current_user_role cascade;
drop function if exists public.is_staff cascade;
drop function if exists public.is_admin_or_tech_manager cascade;

drop type if exists public.notification_category cascade;
drop type if exists public.hour_log_status cascade;
drop type if exists public.signup_status cascade;
drop type if exists public.recurrence_pattern cascade;
drop type if exists public.service_scope cascade;
drop type if exists public.opportunity_status cascade;
drop type if exists public.opportunity_location cascade;
drop type if exists public.opportunity_category cascade;
drop type if exists public.user_role cascade;

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------
create type public.user_role as enum (
  'student',
  'ta',
  'teacher',
  'admin',
  'outside_org'
);

create type public.opportunity_category as enum (
  'NHS',
  'Beta',
  'Tutoring',
  'General',
  'Outside Org'
);

create type public.opportunity_location as enum (
  'in_school',
  'after_school',
  'out_of_school'
);

create type public.opportunity_status as enum (
  'pending_certification',
  'approved',
  'rejected'
);

-- Separates hours served inside a club from hours served in the community.
create type public.service_scope as enum (
  'club_internal',
  'community_external'
);

create type public.recurrence_pattern as enum (
  'daily',
  'weekly',
  'monthly'
);

create type public.signup_status as enum (
  'registered',
  'completed',
  'canceled'
);

create type public.hour_log_status as enum (
  'pending',
  'verified',
  'rejected'
);

-- Drives the icon and grouping used by the in-app notification center.
create type public.notification_category as enum (
  'signup',
  'certification',
  'hours',
  'general'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.user_role not null default 'student',
  grade_level text,
  honor_societies text[] not null default '{}',
  classes text[] not null default '{}',
  is_tech_manager boolean not null default false,
  onboarding_completed boolean not null default false,
  constraint users_email_not_blank check (char_length(trim(email)) > 0)
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category public.opportunity_category not null,
  honor_society text,
  service_scope public.service_scope not null default 'community_external',
  location public.opportunity_location not null,
  event_date timestamptz not null,
  block_time text,
  hours_value numeric not null,
  created_by uuid not null references public.users (id) on delete restrict,
  assigned_student_id uuid references public.users (id) on delete set null,
  is_recurring boolean not null default false,
  recurrence_pattern public.recurrence_pattern,
  organization_name text,
  required_volunteers integer,
  status public.opportunity_status not null default 'pending_certification',
  review_notes text,
  reviewed_by uuid references public.users (id) on delete set null,
  reviewed_at timestamptz,
  constraint opportunities_title_not_blank check (char_length(trim(title)) > 0),
  constraint opportunities_hours_positive check (hours_value > 0),
  constraint opportunities_volunteers_positive check (
    required_volunteers is null or required_volunteers > 0
  ),
  constraint opportunities_recurrence_needs_flag check (
    recurrence_pattern is null or is_recurring = true
  ),
  constraint opportunities_honor_society_allowed check (
    honor_society is null
    or honor_society = any (array[
      'NHS',
      'NJHS',
      'Beta Club',
      'Spanish Honor Society',
      'Science National Honor Society'
    ]::text[])
  ),
  -- Club-internal hours only make sense inside a society.
  constraint opportunities_club_internal_needs_society check (
    service_scope <> 'club_internal'
    or honor_society is not null
  )
);

create table public.event_signups (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  student_id uuid not null references public.users (id) on delete cascade,
  signed_up_at timestamptz not null default now(),
  status public.signup_status not null default 'registered'
);

-- opportunity_id is nullable so students can log hours served off-platform.
create table public.hour_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  opportunity_id uuid references public.opportunities (id) on delete restrict,
  activity_title text,
  honor_society text,
  service_date timestamptz not null default now(),
  hours_logged numeric not null,
  reflection_text text,
  proof_photo_url text,
  supervisor_name text,
  supervisor_email text,
  supervisor_phone text,
  supervisor_signature_status boolean not null default false,
  status public.hour_log_status not null default 'pending',
  verified_by uuid references public.users (id) on delete set null,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint hour_logs_hours_positive check (hours_logged > 0),
  constraint hour_logs_needs_activity check (
    opportunity_id is not null
    or char_length(trim(coalesce(activity_title, ''))) > 0
  ),
  constraint hour_logs_honor_society_allowed check (
    honor_society is null
    or honor_society in (
      'NHS',
      'NJHS',
      'Beta Club',
      'Spanish Honor Society',
      'Science National Honor Society'
    )
  )
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  category public.notification_category not null default 'general',
  title text not null,
  message text not null,
  href text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_title_not_blank check (char_length(trim(title)) > 0)
);

create unique index event_signups_active_unique
  on public.event_signups (opportunity_id, student_id)
  where status <> 'canceled';

create index opportunities_status_category_idx
  on public.opportunities (status, category);

create index opportunities_event_date_idx
  on public.opportunities (event_date);

create index opportunities_created_by_idx
  on public.opportunities (created_by);

create index opportunities_honor_society_idx
  on public.opportunities (honor_society)
  where honor_society is not null;

create index opportunities_assigned_student_idx
  on public.opportunities (assigned_student_id)
  where assigned_student_id is not null;

create index opportunities_pending_review_idx
  on public.opportunities (event_date)
  where status = 'pending_certification';

create index event_signups_student_id_idx
  on public.event_signups (student_id);

create index hour_logs_student_id_idx
  on public.hour_logs (student_id);

create index hour_logs_status_idx
  on public.hour_logs (status);

create index hour_logs_pending_review_idx
  on public.hour_logs (created_at)
  where status = 'pending';

create index notifications_user_unread_idx
  on public.notifications (user_id, is_read, created_at desc);

-- Honor-society membership values must match opportunity categories.
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

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER to avoid RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin_or_tech_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and (u.role = 'admin' or u.is_tech_manager = true)
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and (
        u.role in ('teacher', 'ta', 'admin')
        or u.is_tech_manager = true
      )
  );
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public.users u
  where u.id = auth.uid();
$$;

create or replace function public.is_honor_society_category(cat public.opportunity_category)
returns boolean
language sql
immutable
as $$
  select cat in ('NHS', 'Beta');
$$;

create or replace function public.user_enrolled_in_honor_society(
  p_user_id uuid,
  cat public.opportunity_category
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = p_user_id
      and (
        (
          cat = 'NHS'
          and u.honor_societies && array['NHS', 'NJHS']::text[]
        )
        or (
          cat = 'Beta'
          and u.honor_societies && array['Beta Club', 'Beta']::text[]
        )
      )
  );
$$;

-- Exact membership check for the five named PLP societies.
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

-- Certification queue action. Only admins and tech managers may decide.
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
-- Domain triggers
-- ---------------------------------------------------------------------------

-- True when no end user is behind the statement, which under the grants below
-- can only be a trusted server-side connection using the service role key
-- (anon has no write grants, and authenticated always carries an auth.uid()).
-- The domain triggers use this to leave caller-supplied columns alone so
-- scripts/seed.ts can write rows on behalf of other people.
create or replace function public.is_service_actor()
returns boolean
language sql
stable
as $$
  select auth.uid() is null;
$$;

create or replace function public.is_school_email(p_email text)
returns boolean
language sql
immutable
as $$
  select lower(coalesce(p_email, '')) like '%@pinelakeprep.org';
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  intended public.user_role;
  raw_role text;
begin
  raw_role := nullif(new.raw_user_meta_data ->> 'intended_role', '');

  if raw_role is not null then
    intended := raw_role::public.user_role;
  elsif public.is_school_email(new.email) then
    intended := 'student';
  else
    intended := 'outside_org';
  end if;

  if intended in ('student', 'ta', 'teacher', 'admin')
     and not public.is_school_email(new.email) then
    raise exception 'School roles require a @pinelakeprep.org email address'
      using errcode = 'P0001';
  end if;

  insert into public.users (
    id,
    email,
    full_name,
    role,
    grade_level,
    honor_societies,
    classes,
    is_tech_manager,
    onboarding_completed
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    intended,
    new.raw_user_meta_data ->> 'grade_level',
    '{}',
    '{}',
    false,
    false
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create or replace function public.enforce_role_email_domain()
returns trigger
language plpgsql
as $$
begin
  if new.role in ('student', 'ta', 'teacher', 'admin')
     and not public.is_school_email(new.email) then
    raise exception 'School roles require a @pinelakeprep.org email address'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger enforce_role_email_domain
  before insert or update of role, email on public.users
  for each row
  execute function public.enforce_role_email_domain();

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

create or replace function public.complete_onboarding(
  p_role public.user_role,
  p_full_name text,
  p_grade_level text default null,
  p_honor_societies text[] default '{}',
  p_classes text[] default '{}'
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.users;
  actor public.users;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into actor
  from public.users
  where id = auth.uid()
  for update;

  if actor is null then
    raise exception 'Profile not found';
  end if;

  if actor.onboarding_completed then
    raise exception 'Onboarding already completed';
  end if;

  if p_role = 'admin' and actor.role is distinct from 'admin' then
    raise exception 'Cannot self-assign the admin role';
  end if;

  if p_role in ('student', 'ta', 'teacher', 'admin')
     and not public.is_school_email(actor.email) then
    raise exception 'School roles require a @pinelakeprep.org email address'
      using errcode = 'P0001';
  end if;

  if p_role = 'student' and p_grade_level is null then
    raise exception 'Students must select a grade level';
  end if;

  update public.users
  set
    role = case when actor.role = 'admin' then 'admin' else p_role end,
    full_name = coalesce(nullif(trim(p_full_name), ''), actor.full_name),
    grade_level = case
      when (case when actor.role = 'admin' then 'admin' else p_role end) = 'student'
        then p_grade_level
      else null
    end,
    honor_societies = case
      when (case when actor.role = 'admin' then 'admin' else p_role end) = 'student'
        then coalesce(p_honor_societies, '{}')
      else '{}'
    end,
    classes = case
      when (case when actor.role = 'admin' then 'admin' else p_role end) = 'student'
        then coalesce(p_classes, '{}')
      else '{}'
    end,
    onboarding_completed = true
  where id = auth.uid()
  returning * into result;

  return result;
end;
$$;

create trigger protect_user_privileged_columns
  before update on public.users
  for each row
  execute function public.protect_user_privileged_columns();

create or replace function public.opportunities_enforce_domain()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.user_role;
begin
  actor_role := public.current_user_role();

  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.created_by := coalesce(new.created_by, auth.uid());
    end if;

    if actor_role = 'outside_org' then
      new.category := 'Outside Org';
      new.status := 'pending_certification';
      new.assigned_student_id := null;
    elsif actor_role in ('teacher', 'ta') and new.status is null then
      new.status := 'approved';
    end if;
  end if;

  if tg_op = 'UPDATE'
     and not public.is_admin_or_tech_manager()
     and actor_role = 'outside_org' then
    new.status := old.status;
    new.category := 'Outside Org';
  end if;

  if new.assigned_student_id is not null
     and not exists (
       select 1
       from public.users u
       where u.id = new.assigned_student_id
         and u.role = 'student'
     ) then
    raise exception 'assigned_student_id must reference a student';
  end if;

  return new;
end;
$$;

create trigger opportunities_enforce_domain
  before insert or update on public.opportunities
  for each row
  execute function public.opportunities_enforce_domain();

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

create trigger event_signups_enforce_domain
  before insert on public.event_signups
  for each row
  execute function public.event_signups_enforce_domain();

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

create trigger hour_logs_enforce_domain
  before insert or update on public.hour_logs
  for each row
  execute function public.hour_logs_enforce_domain();

-- ---------------------------------------------------------------------------
-- Verification pipeline
--
-- Bulk decision used by the /admin/approvals table. Runs as definer so a single
-- call can settle many students' logs without a round trip per row.
-- ---------------------------------------------------------------------------
create or replace function public.review_hour_logs(
  p_log_ids uuid[],
  p_status public.hour_log_status,
  p_notes text default null
)
returns setof public.hour_logs
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'only teachers, advisors, and admins can verify hour logs';
  end if;

  if p_status not in ('verified', 'rejected') then
    raise exception 'review status must be verified or rejected';
  end if;

  if p_status = 'rejected' and coalesce(trim(p_notes), '') = '' then
    raise exception 'rejections require feedback';
  end if;

  return query
  update public.hour_logs
  set status = p_status,
      supervisor_signature_status = (p_status = 'verified'),
      verified_by = auth.uid(),
      review_notes = nullif(trim(coalesce(p_notes, '')), ''),
      reviewed_at = now()
  where id = any (p_log_ids)
    and status = 'pending'
  returning *;
end;
$$;

-- ---------------------------------------------------------------------------
-- Notification engine
--
-- Notifications are written by triggers rather than by clients: students are
-- not allowed to insert rows for other users, but signing up must still alert
-- the task owner. Definer rights let the trigger bypass that insert policy.
-- ---------------------------------------------------------------------------
create or replace function public.notify_user(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_category public.notification_category default 'general',
  p_href text default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (user_id, category, title, message, href)
  select p_user_id, p_category, p_title, p_message, p_href
  where p_user_id is not null;
$$;

-- 1. A student signs up for a task.
create or replace function public.notify_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  task public.opportunities;
  student_name text;
begin
  select * into task from public.opportunities where id = new.opportunity_id;
  select full_name into student_name from public.users where id = new.student_id;

  perform public.notify_user(
    task.created_by,
    'New sign-up',
    coalesce(student_name, 'A student') || ' signed up for "' || task.title || '".',
    'signup',
    '/teacher-dashboard'
  );

  perform public.notify_user(
    new.student_id,
    'You are signed up',
    'Your spot for "' || task.title || '" is reserved. Log your hours once you have served.',
    'signup',
    '/my-hours'
  );

  return new;
end;
$$;

create trigger notify_on_signup
  after insert on public.event_signups
  for each row
  execute function public.notify_on_signup();

-- 2. A Tech Manager certifies (or rejects) an outside request.
create or replace function public.notify_on_opportunity_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'approved' then
    perform public.notify_user(
      new.created_by,
      'Request certified',
      '"' || new.title || '" was certified and is now live on the public task feed.',
      'certification',
      '/'
    );
  elsif new.status = 'rejected' then
    perform public.notify_user(
      new.created_by,
      'Request rejected',
      '"' || new.title || '" was not certified. '
        || coalesce(new.review_notes, 'Check the portal for details.'),
      'certification',
      '/org-dashboard'
    );
  end if;

  return new;
end;
$$;

create trigger notify_on_opportunity_review
  after update on public.opportunities
  for each row
  execute function public.notify_on_opportunity_review();

-- 3. A teacher approves or rejects logged hours.
create or replace function public.notify_on_hour_log_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  label text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  label := coalesce(
    new.activity_title,
    (select title from public.opportunities where id = new.opportunity_id),
    'your service entry'
  );

  if new.status = 'verified' then
    perform public.notify_user(
      new.student_id,
      'Hours verified',
      new.hours_logged || ' hours for "' || label || '" were verified.',
      'hours',
      '/my-hours'
    );
  elsif new.status = 'rejected' then
    perform public.notify_user(
      new.student_id,
      'Hours rejected',
      'Your log for "' || label || '" was rejected. '
        || coalesce(new.review_notes, 'Check My Hour History for details.'),
      'hours',
      '/my-hours'
    );
  end if;

  return new;
end;
$$;

create trigger notify_on_hour_log_review
  after update on public.hour_logs
  for each row
  execute function public.notify_on_hour_log_review();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.opportunities enable row level security;
alter table public.event_signups enable row level security;
alter table public.hour_logs enable row level security;
alter table public.notifications enable row level security;

-- users: self-service profiles; tech managers and admins manage global rosters
create policy users_select_self
  on public.users
  for select
  to authenticated
  using (id = auth.uid());

create policy users_select_students_for_staff
  on public.users
  for select
  to authenticated
  using (
    public.is_staff()
    and role = 'student'
  );

create policy users_select_roster_for_admins
  on public.users
  for select
  to authenticated
  using (public.is_admin_or_tech_manager());

create policy users_update_self
  on public.users
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy users_admin_tech_manager_insert
  on public.users
  for insert
  to authenticated
  with check (public.is_admin_or_tech_manager());

create policy users_admin_tech_manager_update
  on public.users
  for update
  to authenticated
  using (public.is_admin_or_tech_manager())
  with check (public.is_admin_or_tech_manager());

create policy users_admin_tech_manager_delete
  on public.users
  for delete
  to authenticated
  using (public.is_admin_or_tech_manager());

-- opportunities: public feed, honor-society gating, private assignments
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

-- Society-tagged tasks are readable only by students on that society's roster.
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

create policy opportunities_read_assigned_or_created
  on public.opportunities
  for select
  to authenticated
  using (
    created_by = auth.uid()
    or assigned_student_id = auth.uid()
  );

create policy opportunities_read_admin_tech_manager
  on public.opportunities
  for select
  to authenticated
  using (public.is_admin_or_tech_manager());

create policy opportunities_insert_staff_and_orgs
  on public.opportunities
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.is_staff()
      or public.current_user_role() = 'outside_org'
    )
  );

create policy opportunities_update_creator
  on public.opportunities
  for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy opportunities_update_admin_tech_manager
  on public.opportunities
  for update
  to authenticated
  using (public.is_admin_or_tech_manager())
  with check (public.is_admin_or_tech_manager());

create policy opportunities_delete_creator_pending
  on public.opportunities
  for delete
  to authenticated
  using (
    created_by = auth.uid()
    and status = 'pending_certification'
  );

create policy opportunities_delete_admin_tech_manager
  on public.opportunities
  for delete
  to authenticated
  using (public.is_admin_or_tech_manager());

-- event_signups
create policy event_signups_select_own
  on public.event_signups
  for select
  to authenticated
  using (student_id = auth.uid());

create policy event_signups_select_staff
  on public.event_signups
  for select
  to authenticated
  using (
    public.is_staff()
    or public.is_admin_or_tech_manager()
    or exists (
      select 1
      from public.opportunities o
      where o.id = event_signups.opportunity_id
        and o.created_by = auth.uid()
    )
  );

create policy event_signups_insert_student
  on public.event_signups
  for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and public.current_user_role() = 'student'
    and public.can_view_opportunity(opportunity_id)
  );

create policy event_signups_update_own_cancel
  on public.event_signups
  for update
  to authenticated
  using (student_id = auth.uid())
  with check (
    student_id = auth.uid()
    and status in ('registered', 'canceled')
  );

create policy event_signups_update_staff
  on public.event_signups
  for update
  to authenticated
  using (public.is_staff() or public.is_admin_or_tech_manager())
  with check (public.is_staff() or public.is_admin_or_tech_manager());

-- hour_logs
create policy hour_logs_select_own
  on public.hour_logs
  for select
  to authenticated
  using (student_id = auth.uid());

create policy hour_logs_select_staff
  on public.hour_logs
  for select
  to authenticated
  using (public.is_staff() or public.is_admin_or_tech_manager());

create policy hour_logs_insert_student
  on public.hour_logs
  for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and public.current_user_role() = 'student'
  );

create policy hour_logs_update_own_pending
  on public.hour_logs
  for update
  to authenticated
  using (student_id = auth.uid() and status = 'pending')
  with check (student_id = auth.uid() and status = 'pending');

create policy hour_logs_update_staff_verify
  on public.hour_logs
  for update
  to authenticated
  using (public.is_staff() or public.is_admin_or_tech_manager())
  with check (public.is_staff() or public.is_admin_or_tech_manager());

-- notifications
create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

create policy notifications_update_own
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notifications_insert_staff
  on public.notifications
  for insert
  to authenticated
  with check (public.is_staff() or public.is_admin_or_tech_manager());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on table public.opportunities to anon, authenticated;
grant select, insert, update, delete on table public.users to authenticated;
grant select, insert, update, delete on table public.opportunities to authenticated;
grant select, insert, update, delete on table public.event_signups to authenticated;
grant select, insert, update on table public.hour_logs to authenticated;
grant select, insert, update on table public.notifications to authenticated;

grant execute on function public.is_admin_or_tech_manager() to anon, authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_service_actor() to anon, authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_honor_society_category(public.opportunity_category) to anon, authenticated;
grant execute on function public.user_enrolled_in_honor_society(uuid, public.opportunity_category) to authenticated;
grant execute on function public.user_in_society(uuid, text) to authenticated;
grant execute on function public.review_opportunity(uuid, public.opportunity_status, text) to authenticated;
grant execute on function public.review_hour_logs(uuid[], public.hour_log_status, text) to authenticated;
grant execute on function public.can_view_opportunity(uuid) to anon, authenticated;
grant execute on function public.is_school_email(text) to anon, authenticated;
grant execute on function public.complete_onboarding(public.user_role, text, text, text[], text[]) to authenticated;

grant usage on type public.user_role to anon, authenticated;
grant usage on type public.opportunity_category to anon, authenticated;
grant usage on type public.opportunity_location to anon, authenticated;
grant usage on type public.opportunity_status to anon, authenticated;
grant usage on type public.service_scope to anon, authenticated;
grant usage on type public.recurrence_pattern to anon, authenticated;
grant usage on type public.signup_status to authenticated;
grant usage on type public.hour_log_status to authenticated;
grant usage on type public.notification_category to authenticated;
