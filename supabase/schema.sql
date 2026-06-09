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
set search_path = public
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
