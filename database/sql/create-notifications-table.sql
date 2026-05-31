-- Create notifications table for WinGuard
-- This table stores all notifications sent to users about their reports

CREATE TABLE IF NOT EXISTS notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  report_id INTEGER REFERENCES reports(report_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'danger')),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_report_id ON notifications(report_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at) WHERE read_at IS NULL;

-- Add some sample notifications for testing
-- Note: Replace user_id and report_id with actual values from your database

COMMENT ON TABLE notifications IS 'Stores notifications sent to users about report status changes';
COMMENT ON COLUMN notifications.notification_id IS 'Unique identifier for each notification';
COMMENT ON COLUMN notifications.user_id IS 'ID of the user who should receive this notification';
COMMENT ON COLUMN notifications.report_id IS 'ID of the report this notification is about';
COMMENT ON COLUMN notifications.message IS 'The notification message text';
COMMENT ON COLUMN notifications.type IS 'Type of notification: info, warning, success, or danger';
COMMENT ON COLUMN notifications.sent_at IS 'When the notification was sent';
COMMENT ON COLUMN notifications.read_at IS 'When the user read the notification (NULL if unread)';
