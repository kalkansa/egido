-- Eğitim Oyunları: skor tablosu şeması
-- Supabase panelinde SQL Editor → New query → bu dosyanın tamamını yapıştırıp Run.

create table if not exists public.scores (
  id          bigint generated always as identity primary key,
  game        text        not null check (char_length(game) between 1 and 32),   -- oyun tipi: 'balon', ...
  set_key     text        not null check (char_length(set_key) between 1 and 80), -- soru seti + oturum kimliği
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

-- Row Level Security: tarayıcıdaki anon anahtar yalnızca ekleyebilir ve okuyabilir.
-- Güncelleme ve silme için kural yok, dolayısıyla öğrenciler skor bozamaz.
alter table public.scores enable row level security;

drop policy if exists "anon skor ekler" on public.scores;
create policy "anon skor ekler"
  on public.scores for insert
  to anon
  with check (true);

drop policy if exists "anon skor okur" on public.scores;
create policy "anon skor okur"
  on public.scores for select
  to anon
  using (true);

-- Oyun kodları: öğretmenin soru seti 5 harflik bir kodla (örn. KALE7) saklanır.
-- Öğrenci ana sayfada kodu yazar ya da QR okutur; uzun bağlantı gerekmez.
create table if not exists public.sets (
  code        text        primary key check (code ~ '^[A-Z2-9]{5}$'),
  game        text        not null check (char_length(game) between 1 and 32),
  config      jsonb       not null check (pg_column_size(config) < 20000),
  created_at  timestamptz not null default now()
);

alter table public.sets enable row level security;

drop policy if exists "anon kod ekler" on public.sets;
create policy "anon kod ekler"
  on public.sets for insert
  to anon
  with check (true);

drop policy if exists "anon kod okur" on public.sets;
create policy "anon kod okur"
  on public.sets for select
  to anon
  using (true);

-- Not: Ders bitince skorların önemi kalmıyor. Eski kayıtları temizlemek için
-- SQL Editor'da şunu çalıştırabilirsiniz:
--   delete from public.scores where created_at < now() - interval '90 days';
