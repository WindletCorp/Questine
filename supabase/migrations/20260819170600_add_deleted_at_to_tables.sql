ALTER TABLE tasks ADD COLUMN deleted_at timestamp with time zone;
ALTER TABLE routine_blocks ADD COLUMN deleted_at timestamp with time zone;
ALTER TABLE journals ADD COLUMN deleted_at timestamp with time zone;
