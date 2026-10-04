-- Egido: veritabanı şeması
-- Supabase panelinde SQL Editor → New query → bu dosyanın tamamını yapıştırıp Run.
-- Dosya tekrar çalıştırılabilir (idempotent).

create extension if not exists pgcrypto;

-- ============================================================
-- 1) Kayıtlı oyunlar (öğretmene ait soru setleri)
-- ============================================================
create table if not exists public.sets (
  id          uuid        primary key default gen_random_uuid(),
  owner       uuid        not null references auth.users (id) on delete cascade,
  code        text        not null unique check (code ~ '^[A-Z2-9]{5}$'),   -- öğrencinin yazdığı 5 harfli kod
  game        text        not null check (char_length(game) between 1 and 32), -- 'balon', 'puzzle', ...
  title       text        not null default '' check (char_length(title) <= 120),
  config      jsonb       not null check (pg_column_size(config) < 3000000), -- puzzle resimleri de burada (küçültülmüş)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists sets_owner_idx on public.sets (owner, updated_at desc);

alter table public.sets enable row level security;

-- Yalnızca sahibi görür / ekler / değiştirir / siler
drop policy if exists "sahibi okur"      on public.sets;
drop policy if exists "sahibi ekler"     on public.sets;
drop policy if exists "sahibi günceller" on public.sets;
drop policy if exists "sahibi siler"     on public.sets;
create policy "sahibi okur"      on public.sets for select to authenticated using (owner = auth.uid());
create policy "sahibi ekler"     on public.sets for insert to authenticated with check (owner = auth.uid());
create policy "sahibi günceller" on public.sets for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
create policy "sahibi siler"     on public.sets for delete to authenticated using (owner = auth.uid());

-- Öğrenci giriş yapmadan kodla oyuna katılır: yalnızca o kodun oyununu döndüren fonksiyon.
-- security definer olduğu için RLS'yi aşar ama sadece kod eşleşen tek satırı verir; liste alınamaz.
create or replace function public.join_set(p_code text)
returns table (game text, config jsonb)
language sql
security definer
stable
set search_path = public
as $$
  select s.game, s.config from public.sets s where s.code = upper(trim(p_code)) limit 1;
$$;
revoke all on function public.join_set(text) from public;
grant execute on function public.join_set(text) to anon, authenticated;

-- ============================================================
-- 2) Skorlar (öğrenci giriş yapmaz; ad + sınıf ile yazar)
-- ============================================================
create table if not exists public.scores (
  id          bigint generated always as identity primary key,
  game        text        not null check (char_length(game) between 1 and 32),
  set_key     text        not null check (char_length(set_key) between 1 and 80), -- oyun + soru seti özeti + oturum
  name        text        not null check (char_length(name) between 2 and 40),
  cls         text        not null check (char_length(cls) between 1 and 12),
  score       integer     not null check (score between 0 and 100000),
  correct     integer     not null check (correct between 0 and 1000),
  total       integer     not null check (total between 1 and 1000),
  wrong       integer     not null check (wrong between 0 and 10000),
  time_sec    real        not null check (time_sec >= 0 and time_sec <= 86400),
  result      text        not null check (result in ('win', 'lose', 'timeout')),
  created_at  timestamptz not null default now()
);
create index if not exists scores_set_key_idx on public.scores (set_key, score desc);
create index if not exists scores_created_idx on public.scores (created_at);

alter table public.scores enable row level security;

-- Herkes (öğrenci = anon, öğretmen = authenticated) skor ekler ve okur; kimse değiştiremez/silemez.
drop policy if exists "anon skor ekler" on public.scores;
drop policy if exists "anon skor okur"  on public.scores;
drop policy if exists "skor ekle"       on public.scores;
drop policy if exists "skor oku"        on public.scores;
create policy "skor ekle" on public.scores for insert to anon, authenticated with check (true);
create policy "skor oku"  on public.scores for select to anon, authenticated using (true);

-- ============================================================
-- Notlar
-- ============================================================
-- Öğretmen hesapları: Authentication → Providers → Email açık olmalı.
-- Kayıt sonrası e-posta onayı istemiyorsanız aynı sayfada "Confirm email" seçeneğini kapatın.
--
-- Eski skorları temizlemek için (ders bitince önemi kalmıyor):
--   delete from public.scores where created_at < now() - interval '90 days';
