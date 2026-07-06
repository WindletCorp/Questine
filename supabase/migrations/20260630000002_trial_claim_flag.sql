-- Add has_claimed_trial boolean to profiles to prevent trial abuse

alter table public.profiles 
  add column has_claimed_trial boolean not null default false;
