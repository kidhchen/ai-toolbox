create extension if not exists pgcrypto;

create table if not exists public.tool_comments (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null,
  nickname text not null check (char_length(nickname) between 1 and 24),
  issue_type text not null default 'none',
  content text not null check (char_length(content) between 1 and 500),
  likes integer not null default 0 check (likes >= 0),
  status text not null default 'visible',
  created_at timestamptz not null default now()
);

create index if not exists tool_comments_tool_created_idx
  on public.tool_comments (tool_id, created_at desc);

alter table public.tool_comments enable row level security;

drop policy if exists "tool comments are publicly readable" on public.tool_comments;
create policy "tool comments are publicly readable"
  on public.tool_comments
  for select
  to anon, authenticated
  using (status = 'visible');

drop policy if exists "tool comments can be created publicly" on public.tool_comments;
create policy "tool comments can be created publicly"
  on public.tool_comments
  for insert
  to anon, authenticated
  with check (
    status = 'visible'
    and likes = 0
    and char_length(nickname) between 1 and 24
    and char_length(content) between 1 and 500
  );

revoke all on public.tool_comments from anon, authenticated;
grant select (id, tool_id, nickname, issue_type, content, likes, status, created_at)
  on public.tool_comments to anon, authenticated;
grant insert (tool_id, nickname, issue_type, content, likes, status)
  on public.tool_comments to anon, authenticated;

create or replace function public.increment_comment_likes(comment_id uuid)
returns table (
  id uuid,
  tool_id text,
  nickname text,
  issue_type text,
  content text,
  likes integer,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  update public.tool_comments as c
     set likes = c.likes + 1
   where c.id = comment_id
     and c.status = 'visible'
  returning c.id, c.tool_id, c.nickname, c.issue_type, c.content, c.likes, c.status, c.created_at;
end;
$$;

grant execute on function public.increment_comment_likes(uuid) to anon, authenticated;

create table if not exists public.wishbox_requests (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(nickname) between 1 and 24),
  pain_point text not null check (char_length(pain_point) between 1 and 800),
  preferred_format text not null default 'unsure',
  current_workaround text,
  priority text not null default 'normal',
  contact text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists wishbox_requests_created_idx
  on public.wishbox_requests (created_at desc);

alter table public.wishbox_requests enable row level security;

drop policy if exists "wishbox requests are publicly readable" on public.wishbox_requests;
create policy "wishbox requests are publicly readable"
  on public.wishbox_requests
  for select
  to anon, authenticated
  using (status = 'new');

drop policy if exists "wishbox requests can be created publicly" on public.wishbox_requests;
create policy "wishbox requests can be created publicly"
  on public.wishbox_requests
  for insert
  to anon, authenticated
  with check (
    status = 'new'
    and char_length(nickname) between 1 and 24
    and char_length(pain_point) between 1 and 800
  );

revoke all on public.wishbox_requests from anon, authenticated;
grant select (id, nickname, pain_point, preferred_format, current_workaround, priority, status, created_at)
  on public.wishbox_requests to anon, authenticated;
grant insert (nickname, pain_point, preferred_format, current_workaround, priority, contact, status)
  on public.wishbox_requests to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('tool-images', 'tool-images', true, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('tool-videos', 'tool-videos', true, 524288000, array['video/mp4', 'video/webm', 'video/quicktime']),
  ('tool-packages', 'tool-packages', true, 524288000, null)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "tool assets are publicly readable" on storage.objects;
create policy "tool assets are publicly readable"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id in ('tool-images', 'tool-videos', 'tool-packages'));

create table if not exists public.tool_submissions (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(nickname) between 1 and 24),
  contact text,
  tool_name text not null check (char_length(tool_name) between 2 and 80),
  category_id text not null default 'workflow-automation',
  tool_type text not null default 'web_tool',
  summary text not null check (char_length(summary) between 1 and 300),
  pain_point text not null check (char_length(pain_point) between 1 and 800),
  usage_steps text,
  tool_url text,
  doc_url text,
  package_url text,
  image_urls jsonb not null default '[]'::jsonb check (jsonb_typeof(image_urls) = 'array'),
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists tool_submissions_status_created_idx
  on public.tool_submissions (status, created_at desc);

alter table public.tool_submissions enable row level security;

drop policy if exists "tool submissions can be created publicly" on public.tool_submissions;
create policy "tool submissions can be created publicly"
  on public.tool_submissions
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and char_length(nickname) between 1 and 24
    and char_length(tool_name) between 2 and 80
    and char_length(summary) between 1 and 300
    and char_length(pain_point) between 1 and 800
    and jsonb_typeof(image_urls) = 'array'
  );

revoke all on public.tool_submissions from anon, authenticated;
grant insert (
  nickname,
  contact,
  tool_name,
  category_id,
  tool_type,
  summary,
  pain_point,
  usage_steps,
  tool_url,
  doc_url,
  package_url,
  image_urls,
  notes,
  status
) on public.tool_submissions to anon, authenticated;

create table if not exists public.toolbox_admin_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

revoke all on public.toolbox_admin_settings from anon, authenticated;

-- Run this once in Supabase SQL Editor, replacing the text inside crypt(...)
-- with your private review passcode. Do not put the passcode in website code.
-- insert into public.toolbox_admin_settings (key, value, updated_at)
-- values ('review_passcode_hash', crypt('replace-with-your-review-passcode', gen_salt('bf')), now())
-- on conflict (key) do update
--   set value = excluded.value,
--       updated_at = now();

create or replace function public.ensure_review_passcode(review_passcode text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  stored_hash text;
begin
  select value
    into stored_hash
    from public.toolbox_admin_settings
   where key = 'review_passcode_hash';

  if stored_hash is null then
    raise exception 'review_passcode_not_configured';
  end if;

  if review_passcode is null
     or char_length(review_passcode) < 1
     or stored_hash <> crypt(review_passcode, stored_hash) then
    raise exception 'invalid_review_passcode';
  end if;
end;
$$;

revoke all on function public.ensure_review_passcode(text) from anon, authenticated;

create or replace function public.review_tool_submissions(
  review_passcode text,
  status_filter text default 'pending'
)
returns table (
  id uuid,
  nickname text,
  contact text,
  tool_name text,
  category_id text,
  tool_type text,
  summary text,
  pain_point text,
  usage_steps text,
  tool_url text,
  doc_url text,
  package_url text,
  image_urls jsonb,
  notes text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.ensure_review_passcode(review_passcode);

  return query
  select
    s.id,
    s.nickname,
    s.contact,
    s.tool_name,
    s.category_id,
    s.tool_type,
    s.summary,
    s.pain_point,
    s.usage_steps,
    s.tool_url,
    s.doc_url,
    s.package_url,
    s.image_urls,
    s.notes,
    s.status,
    s.created_at
  from public.tool_submissions as s
  where status_filter = 'all'
     or s.status = status_filter
  order by s.created_at desc;
end;
$$;

grant execute on function public.review_tool_submissions(text, text) to anon, authenticated;

create or replace function public.update_tool_submission_status(
  review_passcode text,
  submission_ids uuid[],
  next_status text
)
returns table (
  id uuid,
  nickname text,
  contact text,
  tool_name text,
  category_id text,
  tool_type text,
  summary text,
  pain_point text,
  usage_steps text,
  tool_url text,
  doc_url text,
  package_url text,
  image_urls jsonb,
  notes text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ensure_review_passcode(review_passcode);

  if next_status not in ('pending', 'approved', 'rejected', 'archived') then
    raise exception 'invalid_submission_status';
  end if;

  return query
  update public.tool_submissions as s
     set status = next_status
   where s.id = any(submission_ids)
  returning
    s.id,
    s.nickname,
    s.contact,
    s.tool_name,
    s.category_id,
    s.tool_type,
    s.summary,
    s.pain_point,
    s.usage_steps,
    s.tool_url,
    s.doc_url,
    s.package_url,
    s.image_urls,
    s.notes,
    s.status,
    s.created_at;
end;
$$;

grant execute on function public.update_tool_submission_status(text, uuid[], text) to anon, authenticated;
