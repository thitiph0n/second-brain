-- Add composite index for efficient user-scoped trip queries
CREATE INDEX `trips_user_dates_idx` ON `trips` (`user_id`, `start_date`, `end_date`);