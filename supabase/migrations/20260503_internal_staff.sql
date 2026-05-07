-- Internal staff flag — lets us bypass the AI audit on signup/login.

alter table public.profiles
    add column if not exists is_staff boolean default false,
    add column if not exists staff_role text check (staff_role in ('admin','expert','staff','sales')) default null;

create index if not exists profiles_is_staff_idx on public.profiles(is_staff) where is_staff = true;
