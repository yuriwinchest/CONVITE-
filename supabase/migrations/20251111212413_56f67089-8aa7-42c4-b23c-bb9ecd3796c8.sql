-- Add columns to events table for reminder scheduling
ALTER TABLE events 
ADD COLUMN reminder_days_before integer DEFAULT 1,
ADD COLUMN last_reminder_sent_at timestamp with time zone;

-- Add comment to explain the columns
COMMENT ON COLUMN events.reminder_days_before IS 'Number of days before the event to send automatic reminders (null = disabled)';
COMMENT ON COLUMN events.last_reminder_sent_at IS 'Timestamp of when the last automatic reminder was sent';