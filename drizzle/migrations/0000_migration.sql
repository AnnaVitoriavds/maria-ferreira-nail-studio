
create type public.app_role as enum ('admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.bootstrap_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
  for each row execute function public.bootstrap_first_admin();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '' check (char_length(description) <= 400),
  price numeric(10,2) check (price is null or price >= 0),
  duration_minutes int check (duration_minutes is null or duration_minutes between 10 and 600),
  image_url text,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.services to anon, authenticated;
grant insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "Public reads active services" on public.services for select to anon, authenticated
  using (is_active or public.has_role(auth.uid(),'admin'));
create policy "Admins manage services" on public.services for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger services_touch before update on public.services for each row execute function public.touch_updated_at();

create type public.booking_status as enum ('pending','confirmed','cancelled','completed');
create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  protocol text not null unique,
  idempotency_key uuid not null unique,
  client_name text not null check (char_length(client_name) between 3 and 100),
  client_phone text not null check (client_phone ~ '^[0-9]{10,11}$'),
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  duration_minutes int not null default 60,
  appointment_date date not null,
  appointment_time time not null,
  notes text check (notes is null or char_length(notes) <= 500),
  reference_image_url text,
  status booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index booking_requests_date_idx on public.booking_requests(appointment_date, status);
create index booking_requests_phone_idx on public.booking_requests(client_phone, created_at);
grant select, update, delete on public.booking_requests to authenticated;
grant all on public.booking_requests to service_role;
alter table public.booking_requests enable row level security;
create policy "Admins read bookings" on public.booking_requests for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins update bookings" on public.booking_requests for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Admins delete bookings" on public.booking_requests for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create trigger booking_touch before update on public.booking_requests for each row execute function public.touch_updated_at();

create table public.booking_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.booking_requests(id) on delete cascade,
  changed_by uuid,
  old_status booking_status,
  new_status booking_status,
  old_date date, new_date date,
  old_time time, new_time time,
  created_at timestamptz not null default now()
);
create index booking_history_booking_idx on public.booking_history(booking_id);
grant select on public.booking_history to authenticated;
grant all on public.booking_history to service_role;
alter table public.booking_history enable row level security;
create policy "Admins read history" on public.booking_history for select to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.log_booking_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_history(booking_id, changed_by, new_status, new_date, new_time)
    values (new.id, auth.uid(), new.status, new.appointment_date, new.appointment_time);
  elsif new.status is distinct from old.status or new.appointment_date is distinct from old.appointment_date or new.appointment_time is distinct from old.appointment_time then
    insert into public.booking_history(booking_id, changed_by, old_status, new_status, old_date, new_date, old_time, new_time)
    values (new.id, auth.uid(), old.status, new.status, old.appointment_date, new.appointment_date, old.appointment_time, new.appointment_time);
  end if;
  return new;
end $$;
create trigger booking_history_trg after insert or update on public.booking_requests for each row execute function public.log_booking_change();

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday int not null unique check (weekday between 0 and 6),
  opening_time time not null,
  closing_time time not null,
  interval_minutes int not null default 0 check (interval_minutes between 0 and 240),
  slot_step_minutes int not null default 30 check (slot_step_minutes between 10 and 240),
  is_active boolean not null default true,
  check (closing_time > opening_time)
);
grant select on public.availability_rules to anon, authenticated;
grant insert, update, delete on public.availability_rules to authenticated;
grant all on public.availability_rules to service_role;
alter table public.availability_rules enable row level security;
create policy "Public reads rules" on public.availability_rules for select to anon, authenticated using (true);
create policy "Admins manage rules" on public.availability_rules for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null,
  end_date date,
  start_time time,
  end_time time,
  reason text check (reason is null or char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= blocked_date),
  check ((start_time is null and end_time is null) or (start_time is not null and end_time is not null and end_time > start_time))
);
create index blocked_dates_idx on public.blocked_dates(blocked_date);
grant select, insert, update, delete on public.blocked_dates to authenticated;
grant all on public.blocked_dates to service_role;
alter table public.blocked_dates enable row level security;
create policy "Admins manage blocks" on public.blocked_dates for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.special_hours (
  id uuid primary key default gen_random_uuid(),
  special_date date not null unique,
  opening_time time not null,
  closing_time time not null,
  note text,
  check (closing_time > opening_time)
);
grant select, insert, update, delete on public.special_hours to authenticated;
grant all on public.special_hours to service_role;
alter table public.special_hours enable row level security;
create policy "Admins manage special hours" on public.special_hours for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.date_selection_events (
  id uuid primary key default gen_random_uuid(),
  anonymous_session_id uuid not null,
  selected_date date not null,
  selected_time time,
  service_id uuid references public.services(id) on delete set null,
  created_at timestamptz not null default now()
);
create index dse_created_idx on public.date_selection_events(created_at);
create index dse_session_idx on public.date_selection_events(anonymous_session_id, created_at);
grant select, delete on public.date_selection_events to authenticated;
grant all on public.date_selection_events to service_role;
alter table public.date_selection_events enable row level security;
create policy "Admins read selections" on public.date_selection_events for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins delete selections" on public.date_selection_events for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  category text not null check (category in ('Alongamentos','Francesinhas','Unhas de Gel','Nail Art','Delicadas','Trabalhos Recentes')),
  caption text check (caption is null or char_length(caption) <= 160),
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.gallery to anon, authenticated;
grant insert, update, delete on public.gallery to authenticated;
grant all on public.gallery to service_role;
alter table public.gallery enable row level security;
create policy "Public reads gallery" on public.gallery for select to anon, authenticated using (true);
create policy "Admins manage gallery" on public.gallery for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(author_name) between 2 and 80),
  content text not null check (char_length(content) between 5 and 600),
  rating int not null default 5 check (rating between 1 and 5),
  authorized boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.testimonials to anon, authenticated;
grant insert, update, delete on public.testimonials to authenticated;
grant all on public.testimonials to service_role;
alter table public.testimonials enable row level security;
create policy "Public reads published testimonials" on public.testimonials for select to anon, authenticated
  using ((is_published and authorized) or public.has_role(auth.uid(),'admin'));
create policy "Admins manage testimonials" on public.testimonials for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.studio_settings (
  id int primary key default 1 check (id = 1),
  studio_name text not null default 'Maria Ferreira Nail Designer',
  whatsapp_number text not null default '5561998378967',
  instagram_url text not null default 'https://www.instagram.com/mariaf.naildesigner19/',
  address text,
  city text not null default 'Valparaíso de Goiás – GO',
  maps_url text,
  business_hours text,
  booking_notice text not null default 'Atenção: o horário solicitado está sujeito à disponibilidade e à confirmação da profissional. Seu agendamento só estará confirmado após o retorno da Maria pelo WhatsApp.',
  google_reviews_url text,
  google_rating numeric(2,1) not null default 5.0,
  google_review_count int not null default 1,
  about_title text not null default 'A beleza está nos detalhes.',
  about_text text not null default 'Cada atendimento é uma oportunidade de valorizar sua beleza, respeitar seu estilo e realçar sua confiança. Na Maria Ferreira Nail Designer, cada detalhe é pensado para oferecer cuidado, delicadeza e unhas que traduzem sua personalidade.',
  profile_image_url text,
  hero_image_url text,
  pending_hold_enabled boolean not null default true,
  pending_hold_minutes int not null default 120 check (pending_hold_minutes between 0 and 10080),
  updated_at timestamptz not null default now()
);
grant select on public.studio_settings to anon, authenticated;
grant update on public.studio_settings to authenticated;
grant all on public.studio_settings to service_role;
alter table public.studio_settings enable row level security;
create policy "Public reads settings" on public.studio_settings for select to anon, authenticated using (true);
create policy "Admins update settings" on public.studio_settings for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.get_available_slots(p_date date, p_service_id uuid)
returns table(slot_time time) language plpgsql stable security definer set search_path = public as $$
declare
  v_open time; v_close time; v_gap int; v_step int;
  v_dur int; v_now_sp timestamp := (now() at time zone 'America/Sao_Paulo');
  v_hold boolean; v_hold_min int;
  v_t time; v_sp_open time; v_sp_close time;
begin
  if p_date is null or p_date < v_now_sp::date or p_date > v_now_sp::date + 120 then return; end if;
  select coalesce(duration_minutes, 60) into v_dur from services where id = p_service_id and is_active;
  if v_dur is null then return; end if;

  select r.interval_minutes, r.slot_step_minutes, r.opening_time, r.closing_time into v_gap, v_step, v_open, v_close
    from availability_rules r where r.weekday = extract(dow from p_date)::int and r.is_active;
  select s.opening_time, s.closing_time into v_sp_open, v_sp_close from special_hours s where s.special_date = p_date;
  if v_sp_open is not null then v_open := v_sp_open; v_close := v_sp_close; end if;
  if v_open is null then return; end if;
  v_gap := coalesce(v_gap, 0); v_step := coalesce(v_step, 30);

  if exists (select 1 from blocked_dates b where b.start_time is null
             and p_date between b.blocked_date and coalesce(b.end_date, b.blocked_date)) then return; end if;

  select pending_hold_enabled, pending_hold_minutes into v_hold, v_hold_min from studio_settings where id = 1;

  v_t := v_open;
  while (p_date + v_t) + make_interval(mins => v_dur) <= (p_date + v_close) loop
    if (p_date > v_now_sp::date or (p_date + v_t) > v_now_sp + interval '60 minutes')
      and not exists (
        select 1 from blocked_dates b
        where b.start_time is not null and p_date between b.blocked_date and coalesce(b.end_date, b.blocked_date)
          and v_t < b.end_time and (v_t + make_interval(mins => v_dur)) > b.start_time)
      and not exists (
        select 1 from booking_requests br
        where br.appointment_date = p_date
          and (br.status = 'confirmed'
               or (br.status = 'pending' and coalesce(v_hold,false) and br.created_at > now() - make_interval(mins => coalesce(v_hold_min,0))))
          and (p_date + v_t) < (p_date + br.appointment_time + make_interval(mins => br.duration_minutes + v_gap))
          and (p_date + v_t + make_interval(mins => v_dur + v_gap)) > (p_date + br.appointment_time))
    then
      slot_time := v_t; return next;
    end if;
    exit when (p_date + v_t + make_interval(mins => v_step))::date <> p_date;
    v_t := v_t + make_interval(mins => v_step);
  end loop;
end $$;

create or replace function public.get_month_availability(p_start date, p_end date, p_service_id uuid)
returns table(day date, slots int) language sql stable security definer set search_path = public as $$
  select d::date, (select count(*)::int from public.get_available_slots(d::date, p_service_id))
  from generate_series(p_start, least(p_end, p_start + 45), interval '1 day') d
$$;

grant execute on function public.get_available_slots(date, uuid) to anon, authenticated;
grant execute on function public.get_month_availability(date, date, uuid) to anon, authenticated;

create or replace function public.create_booking_request(
  p_idempotency_key uuid, p_client_name text, p_client_phone text, p_service_id uuid,
  p_date date, p_time time, p_notes text, p_reference_image_url text default null)
returns table(protocol text, booking_id uuid, status booking_status)
language plpgsql security definer set search_path = public as $$
declare
  v_existing booking_requests%rowtype; v_service services%rowtype;
  v_name text := btrim(p_client_name); v_phone text := regexp_replace(coalesce(p_client_phone,''), '\D', '', 'g');
  v_notes text := nullif(btrim(coalesce(p_notes,'')), ''); v_protocol text; v_id uuid;
begin
  if p_idempotency_key is null then raise exception 'INVALID_REQUEST'; end if;
  select * into v_existing from booking_requests b where b.idempotency_key = p_idempotency_key;
  if found then
    return query select v_existing.protocol, v_existing.id, v_existing.status; return;
  end if;
  if v_phone like '55%' and char_length(v_phone) in (12,13) then v_phone := substr(v_phone, 3); end if;
  if v_name is null or char_length(v_name) < 3 or char_length(v_name) > 100 then raise exception 'INVALID_NAME'; end if;
  if v_phone !~ '^[1-9][0-9]{9,10}$' then raise exception 'INVALID_PHONE'; end if;
  if v_notes is not null and char_length(v_notes) > 500 then raise exception 'INVALID_NOTES'; end if;
  if p_reference_image_url is not null and p_reference_image_url !~ '^(https://|/)' then raise exception 'INVALID_REFERENCE'; end if;
  select * into v_service from services where id = p_service_id and is_active;
  if not found then raise exception 'INVALID_SERVICE'; end if;

  if (select count(*) from booking_requests b where b.client_phone = v_phone and b.created_at > now() - interval '24 hours') >= 3 then
    raise exception 'RATE_LIMIT';
  end if;
  if (select count(*) from booking_requests b where b.created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'RATE_LIMIT';
  end if;
  if exists (select 1 from booking_requests b where b.client_phone = v_phone and b.appointment_date = p_date
             and b.appointment_time = p_time and b.status in ('pending','confirmed')) then
    raise exception 'DUPLICATE';
  end if;

  perform pg_advisory_xact_lock(hashtext('booking:' || p_date::text));
  if not exists (select 1 from get_available_slots(p_date, p_service_id) s where s.slot_time = p_time) then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  loop
    v_protocol := 'MF-' || to_char(now() at time zone 'America/Sao_Paulo', 'YYMMDD') || '-' ||
      upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
    exit when not exists (select 1 from booking_requests b where b.protocol = v_protocol);
  end loop;

  insert into booking_requests(protocol, idempotency_key, client_name, client_phone, service_id, service_name,
    duration_minutes, appointment_date, appointment_time, notes, reference_image_url)
  values (v_protocol, p_idempotency_key, v_name, v_phone, v_service.id, v_service.name,
    coalesce(v_service.duration_minutes, 60), p_date, p_time, v_notes, p_reference_image_url)
  returning id into v_id;
  return query select v_protocol, v_id, 'pending'::booking_status;
end $$;
grant execute on function public.create_booking_request(uuid, text, text, uuid, date, time, text, text) to anon, authenticated;

create or replace function public.record_date_selection(p_session uuid, p_date date, p_time time, p_service_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_session is null or p_date is null then return; end if;
  if p_date < (now() at time zone 'America/Sao_Paulo')::date - 1 or p_date > current_date + 180 then return; end if;
  if (select count(*) from date_selection_events e where e.anonymous_session_id = p_session and e.created_at > now() - interval '1 day') >= 60 then return; end if;
  insert into date_selection_events(anonymous_session_id, selected_date, selected_time, service_id)
  values (p_session, p_date, p_time, (select s.id from services s where s.id = p_service_id));
  if random() < 0.05 then
    delete from date_selection_events where created_at < now() - interval '90 days';
  end if;
end $$;
grant execute on function public.record_date_selection(uuid, date, time, uuid) to anon, authenticated;

create policy "Public reads media" on storage.objects for select using (bucket_id = 'media');
create policy "Admins upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
create policy "Admins update media" on storage.objects for update to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
create policy "Admins delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));

insert into public.studio_settings(id) values (1);
insert into public.services(name, description, image_url, display_order) values
('Alongamento de Unhas','Unhas longas, elegantes e resistentes, moldadas com precisão para valorizar suas mãos.','/images/alongamento.jpg',1),
('Unhas de Gel','Brilho intenso e acabamento impecável que acompanham sua rotina com sofisticação.','/images/gel.jpg',2),
('Manicure','Cuidado delicado com cutículas e formato, para mãos bem cuidadas em cada detalhe.','/images/manicure.jpg',3),
('Francesinha','O clássico atemporal, com linhas finas e acabamento delicado.','/images/francesinha.jpg',4),
('Esmaltação','Cores escolhidas para você, aplicadas com acabamento uniforme e duradouro.','/images/esmaltacao.jpg',5),
('Design de Unhas','Composições exclusivas que traduzem seu estilo e sua personalidade.','/images/design.jpg',6),
('Unhas Stiletto','Formato marcante e sofisticado para quem ama atitude e elegância.','/images/stiletto.jpg',7);
insert into public.availability_rules(weekday, opening_time, closing_time, interval_minutes, slot_step_minutes, is_active)
select d, '09:00', '19:00', 15, 30, d between 1 and 6 from generate_series(0,6) d;
insert into public.gallery(image_url, category, caption, display_order) values
('/images/alongamento.jpg','Alongamentos','Alongamento amendoado com efeito perolado',1),
('/images/francesinha.jpg','Francesinhas','Francesinha clássica',2),
('/images/gel.jpg','Unhas de Gel','Gel marsala de alto brilho',3),
('/images/nailart.jpg','Nail Art','Florzinhas e pérolas delicadas',4),
('/images/manicure.jpg','Delicadas','Manicure natural rosada',5),
('/images/design.jpg','Trabalhos Recentes','Mármore nude com fios dourados',6),
('/images/stiletto.jpg','Nail Art','Stiletto rosé com traços dourados',7),
('/images/esmaltacao.jpg','Delicadas','Esmaltação nude rosé',8);
