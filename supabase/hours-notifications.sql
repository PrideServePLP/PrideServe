-- ---------------------------------------------------------------------------
-- PrideServe — hour logging, verification pipeline, notification engine
--
-- Additive migration for projects where schema.sql was already applied.
-- Safe to run more than once.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_category') then
    create type public.notification_category as enum (
      'signup', 'certification', 'hours', 'general'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- hour_logs: manual entries, proof, and supervisor contact details
-- ---------------------------------------------------------------------------
alter table public.hour_logs
  alter column opportunity_id drop not null;

alter table public.hour_logs
  add column if not exists activity_title text;

alter table public.hour_logs
  add column if not exists honor_society text;

alter table public.hour_logs
  add column if not exists service_date timestamptz not null default now();

alter table public.hour_logs
  add column if not exists proof_photo_url text;

alter table public.hour_logs
  add column if not exists supervisor_name text;

alter table public.hour_logs
  add column if not exists supervisor_email text;

alter table public.hour_logs
  add column if not exists supervisor_phone text;

alter table public.hour_logs
  add column if not exists review_notes text;

alter table public.hour_logs
  add column if not exists reviewed_at timestamptz;

alter table public.hour_logs
  drop constraint if exists hour_logs_needs_activity;

alter table public.hour_logs
  add constraint hour_logs_needs_activity check (
    opportunity_id is not null
    or char_length(trim(coalesce(activity_title, ''))) > 0
  );

alter table public.hour_logs
  drop constraint if exists hour_logs_honor_society_allowed;

alter table public.hour_logs
  add constraint hour_logs_honor_society_allowed check (
    honor_society is null
    or honor_society in (
      'NHS',
      'NJHS',
      'Beta Club',
      'Spanish Honor Society',
      'Science National Honor Society'
    )
  );

create index if not exists hour_logs_pending_review_idx
  on public.hour_logs (created_at)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- notifications: category and deep link
-- ---------------------------------------------------------------------------
alter table public.notifications
  add column if not exists category public.notification_category not null default 'general';

alter table public.notifications
  add column if not exists href text;

-- ---------------------------------------------------------------------------
-- Verification pipeline
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

drop trigger if exists notify_on_signup on public.event_signups;
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

drop trigger if exists notify_on_opportunity_review on public.opportunities;
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

drop trigger if exists notify_on_hour_log_review on public.hour_logs;
create trigger notify_on_hour_log_review
  after update on public.hour_logs
  for each row
  execute function public.notify_on_hour_log_review();

grant execute on function public.review_hour_logs(uuid[], public.hour_log_status, text) to authenticated;
grant usage on type public.notification_category to authenticated;
