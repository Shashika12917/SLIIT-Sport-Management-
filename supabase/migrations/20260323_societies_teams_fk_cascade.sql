alter table public.teams
  drop constraint if exists teams_society_id_fkey;

alter table public.teams
  add constraint teams_society_id_fkey
  foreign key (society_id)
  references public.societies (id)
  on delete cascade;
