alter table public.events
  add column if not exists event_time time;

-- Keep schedule uniqueness practical once time is tracked.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'events_unique_schedule'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events drop constraint events_unique_schedule;
  end if;
end
$$;

alter table public.events
  add constraint events_unique_schedule unique (event_date, event_time, venue, sport_type);
