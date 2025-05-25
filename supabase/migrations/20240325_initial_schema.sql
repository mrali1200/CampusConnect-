-- Create profiles table
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    full_name text,
    avatar_url text,
    role text default 'user' check (role in ('user', 'admin')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create events table
create table if not exists public.events (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    date timestamp with time zone not null,
    time text,
    venue text,
    category text,
    image_url text,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create registrations table
create table if not exists public.registrations (
    id uuid default gen_random_uuid() primary key,
    event_id uuid references public.events(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    status text default 'registered' check (status in ('registered', 'attended', 'cancelled')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(event_id, user_id)
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone"
    on profiles for select
    using (true);

create policy "Users can insert their own profile"
    on profiles for insert
    with check (auth.uid() = id);

create policy "Users can update own profile"
    on profiles for update
    using (auth.uid() = id);

-- Events policies
create policy "Events are viewable by everyone"
    on events for select
    using (true);

create policy "Authenticated users can create events"
    on events for insert
    with check (auth.role() = 'authenticated');

create policy "Users can update their own events"
    on events for update
    using (auth.uid() = created_by);

-- Registrations policies
create policy "Users can view their own registrations"
    on registrations for select
    using (auth.uid() = user_id);

create policy "Users can register for events"
    on registrations for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own registrations"
    on registrations for update
    using (auth.uid() = user_id);

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name');
    return new;
end;
$$;

-- Create trigger for new user creation
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user(); 