-- Add category and color_override to routine_blocks

alter table public.routine_blocks 
  add column category text,
  add column color_override text;
